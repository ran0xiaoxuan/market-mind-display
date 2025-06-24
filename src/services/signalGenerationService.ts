
import { supabase } from "@/integrations/supabase/client";
import { getStockPrice } from "./marketDataService";
import { getTradingRulesForStrategy } from "./strategyService";
import { evaluateTradingRules } from "./tradingRuleEvaluationService";

export interface SignalData {
  strategyId: string;
  strategyName: string;
  asset: string;
  price: number;
  userId: string;
  timestamp: string;
  conditions?: string[];
  confidence?: number;
}

// Check if market is open (US market hours: 9:30 AM - 4:00 PM EST, Monday-Friday)
const isMarketOpen = (): boolean => {
  const now = new Date();
  const est = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  
  // Check if it's a weekday (Monday = 1, Friday = 5)
  const dayOfWeek = est.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday = 0, Saturday = 6
    return false;
  }
  
  const hour = est.getHours();
  const minute = est.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  
  // Market hours: 9:30 AM (570 minutes) to 4:00 PM (960 minutes) EST
  return timeInMinutes >= 570 && timeInMinutes < 960;
};

export const generateTradingSignal = async (
  strategyId: string, 
  signalType: 'entry' | 'exit' | 'stop_loss' | 'take_profit',
  signalData: Partial<SignalData>
) => {
  try {
    // First check if market is open
    if (!isMarketOpen()) {
      console.log('Market is closed - no signals will be generated');
      return null;
    }

    // Get strategy details
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', strategyId)
      .single();

    if (strategyError) throw strategyError;

    // Get trading rules for this strategy
    const tradingRules = await getTradingRulesForStrategy(strategyId);
    
    // Check if strategy has any trading conditions
    const hasEntryRules = tradingRules?.entryRules && tradingRules.entryRules.some(group => 
      group.inequalities && group.inequalities.length > 0
    );
    const hasExitRules = tradingRules?.exitRules && tradingRules.exitRules.some(group => 
      group.inequalities && group.inequalities.length > 0
    );

    if (!hasEntryRules && !hasExitRules) {
      console.log(`Strategy ${strategyId} has no trading conditions - cannot generate signals`);
      return null;
    }

    // Get current market data for the target asset
    if (!strategy.target_asset) {
      console.log(`Strategy ${strategyId} has no target asset defined`);
      return null;
    }

    const currentPrice = await getStockPrice(strategy.target_asset);
    if (!currentPrice) {
      console.log(`Could not fetch current price for ${strategy.target_asset}`);
      return null;
    }

    // Evaluate trading rules based on signal type
    let rulesMatched = false;
    let matchedConditions: string[] = [];

    if (signalType === 'entry' && hasEntryRules) {
      const evaluation = await evaluateTradingRules(
        tradingRules.entryRules,
        strategy.target_asset,
        currentPrice.price
      );
      rulesMatched = evaluation.signalGenerated;
      matchedConditions = evaluation.matchedConditions;
    } else if (signalType === 'exit' && hasExitRules) {
      const evaluation = await evaluateTradingRules(
        tradingRules.exitRules,
        strategy.target_asset,
        currentPrice.price
      );
      rulesMatched = evaluation.signalGenerated;
      matchedConditions = evaluation.matchedConditions;
    }

    // Only generate signal if trading conditions are met
    if (!rulesMatched) {
      console.log(`Trading conditions not met for ${signalType} signal on strategy ${strategyId}`);
      return null;
    }

    // Create the signal record with real data
    const { data: signal, error: signalError } = await supabase
      .from('trading_signals')
      .insert({
        strategy_id: strategyId,
        signal_type: signalType,
        signal_data: {
          ...signalData,
          strategyName: strategy.name,
          userId: strategy.user_id,
          timestamp: new Date().toISOString(),
          asset: strategy.target_asset,
          price: currentPrice.price,
          conditions: matchedConditions,
          confidence: calculateConfidence(matchedConditions.length, tradingRules)
        }
      })
      .select()
      .single();

    if (signalError) throw signalError;

    console.log('Valid signal generated:', signal);

    // Trigger notification processing with PRO member validation
    await processSignalNotifications(signal.id);

    return signal;
  } catch (error) {
    console.error('Error generating trading signal:', error);
    throw error;
  }
};

const calculateConfidence = (matchedConditionsCount: number, tradingRules: any): number => {
  // Calculate confidence based on how many conditions were matched
  const totalConditions = (tradingRules?.entryRules || []).reduce((sum: number, group: any) => 
    sum + (group.inequalities?.length || 0), 0
  ) + (tradingRules?.exitRules || []).reduce((sum: number, group: any) => 
    sum + (group.inequalities?.length || 0), 0
  );
  
  if (totalConditions === 0) return 0;
  return Math.min(100, Math.round((matchedConditionsCount / totalConditions) * 100));
};

export const processSignalNotifications = async (signalId: string) => {
  try {
    // Get signal details
    const { data: signal, error: signalError } = await supabase
      .from('trading_signals')
      .select(`
        *,
        strategies!inner(user_id, name)
      `)
      .eq('id', signalId)
      .single();

    if (signalError) throw signalError;

    const userId = signal.strategies.user_id;

    // CRITICAL: Check if user is PRO member before sending notifications
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return;
    }

    if (!profile || profile.subscription_tier !== 'pro') {
      console.log(`User ${userId} is not a PRO member - notifications will not be sent`);
      return;
    }

    console.log(`User ${userId} is PRO member - proceeding with notifications`);

    // Get user notification settings
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw settingsError;
    }

    if (!settings) {
      console.log('No notification settings found for user:', userId);
      return;
    }

    // Check if this signal type is enabled
    const signalTypeEnabled = checkSignalTypeEnabled(signal.signal_type, settings);
    if (!signalTypeEnabled) {
      console.log('Signal type not enabled for notifications:', signal.signal_type);
      return;
    }

    // Get user email for notifications
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const userEmail = user?.email;

    // Send notifications based on enabled channels
    const notifications = [];

    if (settings.email_enabled && userEmail) {
      notifications.push(sendEmailNotification(signalId, userEmail, signal.signal_data, signal.signal_type));
    }

    if (settings.discord_enabled && settings.discord_webhook_url) {
      notifications.push(sendDiscordNotification(signalId, settings.discord_webhook_url, signal.signal_data, signal.signal_type));
    }

    if (settings.telegram_enabled && settings.telegram_bot_token && settings.telegram_chat_id) {
      notifications.push(sendTelegramNotification(signalId, settings.telegram_bot_token, settings.telegram_chat_id, signal.signal_data, signal.signal_type));
    }

    // Execute all notifications
    await Promise.allSettled(notifications);

    // Mark signal as processed
    await supabase
      .from('trading_signals')
      .update({ processed: true })
      .eq('id', signalId);

  } catch (error) {
    console.error('Error processing signal notifications:', error);
    throw error;
  }
};

const checkSignalTypeEnabled = (signalType: string, settings: any): boolean => {
  switch (signalType) {
    case 'entry':
      return settings.entry_signals;
    case 'exit':
      return settings.exit_signals;
    case 'stop_loss':
      return settings.stop_loss_alerts;
    case 'take_profit':
      return settings.take_profit_alerts;
    default:
      return false;
  }
};

const sendEmailNotification = async (signalId: string, userEmail: string, signalData: any, signalType: string) => {
  const { data, error } = await supabase.functions.invoke('send-email-notification', {
    body: {
      signalId,
      userEmail,
      signalData,
      signalType
    }
  });

  if (error) throw error;
  return data;
};

const sendDiscordNotification = async (signalId: string, webhookUrl: string, signalData: any, signalType: string) => {
  const { data, error } = await supabase.functions.invoke('send-discord-notification', {
    body: {
      signalId,
      webhookUrl,
      signalData,
      signalType
    }
  });

  if (error) throw error;
  return data;
};

const sendTelegramNotification = async (signalId: string, botToken: string, chatId: string, signalData: any, signalType: string) => {
  const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
    body: {
      signalId,
      botToken,
      chatId,
      signalData,
      signalType
    }
  });

  if (error) throw error;
  return data;
};

// Function to clean up invalid signals (for one-time cleanup)
export const cleanupInvalidSignals = async () => {
  try {
    console.log('Starting cleanup of invalid signals...');
    
    // Delete signals from weekends
    const { error: weekendError } = await supabase
      .from('trading_signals')
      .delete()
      .or('and(extract(dow from created_at).eq.0,extract(dow from created_at).eq.6)'); // Sunday=0, Saturday=6
    
    if (weekendError) {
      console.error('Error cleaning weekend signals:', weekendError);
    }

    // Get all strategies and check if they have trading rules
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('id');

    if (strategiesError) {
      console.error('Error fetching strategies:', strategiesError);
      return;
    }

    for (const strategy of strategies || []) {
      const tradingRules = await getTradingRulesForStrategy(strategy.id);
      
      const hasRules = tradingRules?.entryRules?.some(group => 
        group.inequalities && group.inequalities.length > 0
      ) || tradingRules?.exitRules?.some(group => 
        group.inequalities && group.inequalities.length > 0
      );

      if (!hasRules) {
        // Delete signals for strategies without trading rules
        const { error: deleteError } = await supabase
          .from('trading_signals')
          .delete()
          .eq('strategy_id', strategy.id);

        if (deleteError) {
          console.error(`Error deleting signals for strategy ${strategy.id}:`, deleteError);
        } else {
          console.log(`Deleted signals for strategy ${strategy.id} (no trading rules)`);
        }
      }
    }

    console.log('Cleanup completed');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

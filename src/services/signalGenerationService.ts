
import { supabase } from "@/integrations/supabase/client";

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

export const generateTradingSignal = async (
  strategyId: string, 
  signalType: 'entry' | 'exit' | 'stop_loss' | 'take_profit',
  signalData: Partial<SignalData>
) => {
  try {
    // Get strategy details
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', strategyId)
      .single();

    if (strategyError) throw strategyError;

    // Create the signal record
    const { data: signal, error: signalError } = await supabase
      .from('trading_signals')
      .insert({
        strategy_id: strategyId,
        signal_type: signalType,
        signal_data: {
          ...signalData,
          strategyName: strategy.name,
          userId: strategy.user_id,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (signalError) throw signalError;

    console.log('Signal generated:', signal);

    // Trigger notification processing
    await processSignalNotifications(signal.id);

    return signal;
  } catch (error) {
    console.error('Error generating trading signal:', error);
    throw error;
  }
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
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const userEmail = userData.user?.email;

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

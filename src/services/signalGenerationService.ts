
import { supabase } from "@/integrations/supabase/client";

export interface TradingSignal {
  id: string;
  strategy_id: string;
  signal_type: 'entry' | 'exit';
  signal_data: {
    reason: string;
    price: number;
    timestamp: string;
    profit?: number;
    profitPercentage?: number;
    indicators?: Record<string, number>;
    marketData?: {
      change: number;
      changePercent: number;
      volume: number;
    };
  };
  created_at: string;
  processed: boolean;
}

// Get real technical indicators from FMP API with improved error handling
const getRealTechnicalIndicators = async (symbol: string): Promise<Record<string, number> | null> => {
  try {
    console.log(`Fetching real technical indicators for ${symbol}`);
    
    // Get FMP API key with retry logic
    let fmpApiKey;
    try {
      const { data, error } = await supabase.functions.invoke('get-fmp-key');
      if (error) {
        console.error('Error invoking get-fmp-key function:', error);
        throw new Error(`Failed to get FMP API key: ${error.message}`);
      }
      if (!data?.key) {
        console.error('No FMP API key returned from function');
        throw new Error('FMP API key not available');
      }
      fmpApiKey = data.key;
      console.log('Successfully retrieved FMP API key');
    } catch (error) {
      console.error('Failed to get FMP API key:', error);
      throw error;
    }

    // Fetch RSI (14-period) - Required for strategy evaluation
    const rsiResponse = await fetch(
      `https://financialmodelingprep.com/api/v3/technical_indicator/daily/${symbol}?period=14&type=rsi&apikey=${fmpApiKey}`
    );
    
    if (!rsiResponse.ok) {
      if (rsiResponse.status === 429) {
        throw new Error('FMP API rate limit reached');
      }
      throw new Error(`RSI API error: ${rsiResponse.status}`);
    }
    
    const rsiData = await rsiResponse.json();
    if (!Array.isArray(rsiData) || rsiData.length === 0) {
      throw new Error(`No RSI data found for ${symbol}`);
    }
    
    let indicators: Record<string, number> = {
      rsi: rsiData[0].rsi
    };
    
    // Fetch additional indicators (SMA, EMA) for comprehensive analysis
    try {
      const smaResponse = await fetch(
        `https://financialmodelingprep.com/api/v3/technical_indicator/daily/${symbol}?period=20&type=sma&apikey=${fmpApiKey}`
      );
      
      if (smaResponse.ok) {
        const smaData = await smaResponse.json();
        if (Array.isArray(smaData) && smaData.length > 0) {
          indicators.sma = smaData[0].sma;
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch SMA for ${symbol}:`, error);
    }
    
    try {
      const emaResponse = await fetch(
        `https://financialmodelingprep.com/api/v3/technical_indicator/daily/${symbol}?period=20&type=ema&apikey=${fmpApiKey}`
      );
      
      if (emaResponse.ok) {
        const emaData = await emaResponse.json();
        if (Array.isArray(emaData) && emaData.length > 0) {
          indicators.ema = emaData[0].ema;
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch EMA for ${symbol}:`, error);
    }
    
    console.log(`Real indicators for ${symbol}:`, indicators);
    return indicators;
    
  } catch (error) {
    console.error(`Error fetching real technical indicators for ${symbol}:`, error);
    throw error;
  }
};

// Get real market data with improved error handling
const getRealMarketData = async (symbol: string) => {
  try {
    console.log(`Fetching real market data for ${symbol}`);
    
    // Get FMP API key
    const { data, error } = await supabase.functions.invoke('get-fmp-key');
    if (error || !data?.key) {
      console.error('FMP API key not available for market data');
      throw new Error('FMP API key not available');
    }

    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${data.key}`
    );

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('FMP API rate limit reached');
      }
      throw new Error(`FMP API error: ${response.status}`);
    }

    const quotes = await response.json();
    
    if (!Array.isArray(quotes) || quotes.length === 0) {
      throw new Error(`No price data found for ${symbol}`);
    }

    const quote = quotes[0];
    
    if (!quote.price || quote.price === 0) {
      throw new Error(`Invalid price data for ${symbol}`);
    }

    console.log(`Real market data for ${symbol}:`, {
      price: quote.price,
      change: quote.change,
      changePercent: quote.changesPercentage
    });

    return {
      price: quote.price,
      change: quote.change || 0,
      changePercent: quote.changesPercentage || 0,
      timestamp: new Date().toISOString(),
      volume: quote.volume || 0
    };

  } catch (error) {
    console.error(`Error fetching real market data for ${symbol}:`, error);
    throw error;
  }
};

export const evaluateStrategy = async (strategyId: string) => {
  console.log(`Evaluating strategy ${strategyId} for signal generation`);
  
  try {
    // Get strategy details
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', strategyId)
      .single();

    if (strategyError || !strategy) {
      console.log(`Strategy ${strategyId} not found:`, strategyError);
      return;
    }

    console.log(`Strategy found: ${strategy.name} for ${strategy.target_asset}`);

    // Get trading rules for this strategy
    const { data: ruleGroups, error: rulesError } = await supabase
      .from('rule_groups')
      .select(`
        id,
        rule_type,
        logic,
        required_conditions,
        trading_rules (
          id,
          left_type,
          left_indicator,
          left_parameters,
          condition,
          right_type,
          right_value,
          right_value_type,
          explanation
        )
      `)
      .eq('strategy_id', strategyId)
      .order('group_order');

    if (rulesError || !ruleGroups || ruleGroups.length === 0) {
      console.log(`No trading rules found for strategy ${strategyId}`);
      return;
    }

    console.log(`Found ${ruleGroups.length} rule groups for strategy ${strategyId}`);

    // Get real market data - MUST use real data
    let priceData;
    let indicators: Record<string, number> = {};

    try {
      // Get real price data
      priceData = await getRealMarketData(strategy.target_asset);
      if (!priceData || priceData.price === 0) {
        console.error(`No real price data available for ${strategy.target_asset}, skipping signal generation`);
        return;
      }

      // Get real technical indicators
      indicators = await getRealTechnicalIndicators(strategy.target_asset);
      if (!indicators || Object.keys(indicators).length === 0) {
        console.error(`No real technical indicators available for ${strategy.target_asset}, skipping signal generation`);
        return;
      }

      console.log(`Using real market data for ${strategy.target_asset}:`, {
        price: priceData.price,
        change: priceData.change,
        changePercent: priceData.changePercent,
        indicators: indicators
      });

    } catch (error) {
      console.error(`Failed to get real market data for ${strategy.target_asset}:`, error);
      return;
    }

    const currentPrice = priceData.price;

    // Evaluate entry and exit rules
    const entryRules = ruleGroups.filter(group => group.rule_type === 'entry');
    const exitRules = ruleGroups.filter(group => group.rule_type === 'exit');

    console.log(`Entry rules: ${entryRules.length}, Exit rules: ${exitRules.length}`);

    // Check for entry signals
    if (await shouldGenerateEntrySignal(entryRules, indicators, currentPrice)) {
      const entryReason = `Entry signal (real market data) - RSI: ${indicators.rsi?.toFixed(2) || 'N/A'}, Price: $${currentPrice.toFixed(2)}`;
      
      console.log(`Generating entry signal: ${entryReason}`);
      
      await generateTradingSignal(strategyId, 'entry', {
        reason: entryReason,
        price: currentPrice,
        timestamp: new Date().toISOString(),
        indicators,
        marketData: {
          change: priceData.change,
          changePercent: priceData.changePercent,
          volume: priceData.volume
        }
      });
    }

    // Check for exit signals
    if (await shouldGenerateExitSignal(exitRules, indicators, currentPrice, strategyId)) {
      const exitReason = `Exit signal (real market data) - RSI: ${indicators.rsi?.toFixed(2) || 'N/A'}, Price: $${currentPrice.toFixed(2)}`;
      
      console.log(`Generating exit signal: ${exitReason}`);
      
      await generateTradingSignal(strategyId, 'exit', {
        reason: exitReason,
        price: currentPrice,
        timestamp: new Date().toISOString(),
        indicators,
        marketData: {
          change: priceData.change,
          changePercent: priceData.changePercent,
          volume: priceData.volume
        }
      });
    }

  } catch (error) {
    console.error(`Error evaluating strategy ${strategyId}:`, error);
  }
};

const shouldGenerateEntrySignal = async (
  entryRules: any[], 
  indicators: Record<string, number>, 
  currentPrice: number
): Promise<boolean> => {
  if (!entryRules.length) return false;

  for (const group of entryRules) {
    if (await evaluateRuleGroup(group, indicators, currentPrice)) {
      return true;
    }
  }
  return false;
};

const shouldGenerateExitSignal = async (
  exitRules: any[], 
  indicators: Record<string, number>, 
  currentPrice: number,
  strategyId: string
): Promise<boolean> => {
  if (!exitRules.length) return false;

  // Check if there are open positions first
  const { data: openPositions } = await supabase
    .from('trading_signals')
    .select('*')
    .eq('strategy_id', strategyId)
    .eq('signal_type', 'entry')
    .eq('processed', true)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!openPositions || openPositions.length === 0) {
    return false;
  }

  for (const group of exitRules) {
    if (await evaluateRuleGroup(group, indicators, currentPrice)) {
      return true;
    }
  }
  return false;
};

const evaluateRuleGroup = async (
  group: any, 
  indicators: Record<string, number>, 
  currentPrice: number
): Promise<boolean> => {
  const rules = group.trading_rules || [];
  if (!rules.length) return false;

  const results: boolean[] = [];

  for (const rule of rules) {
    const result = evaluateRule(rule, indicators, currentPrice);
    results.push(result);
    
    console.log(`Rule evaluation: ${rule.left_indicator || rule.left_type} ${rule.condition} ${rule.right_value} = ${result}`);
  }

  // Apply group logic
  if (group.logic === 'AND') {
    return results.every(result => result);
  } else if (group.logic === 'OR') {
    const requiredConditions = group.required_conditions || 1;
    const trueCount = results.filter(result => result).length;
    return trueCount >= requiredConditions;
  }

  return false;
};

const evaluateRule = (
  rule: any, 
  indicators: Record<string, number>, 
  currentPrice: number
): boolean => {
  try {
    let leftValue: number = 0;
    let rightValue: number = 0;

    // Get left side value
    if (rule.left_type === 'indicator' || rule.left_type === 'INDICATOR') {
      const indicatorKey = rule.left_indicator?.toLowerCase();
      leftValue = indicators[indicatorKey] || 0;
    } else if (rule.left_type === 'price' || rule.left_type === 'PRICE') {
      leftValue = currentPrice;
    }

    // Get right side value
    if (rule.right_type === 'value' || rule.right_type === 'VALUE') {
      rightValue = parseFloat(rule.right_value) || 0;
    } else if (rule.right_type === 'indicator' || rule.right_type === 'INDICATOR') {
      const indicatorKey = rule.right_indicator?.toLowerCase();
      rightValue = indicators[indicatorKey] || 0;
    }

    // Evaluate condition with improved mapping
    const condition = rule.condition?.toUpperCase();
    switch (condition) {
      case '>':
      case 'GREATER_THAN':
        return leftValue > rightValue;
      case '<':
      case 'LESS_THAN':
        return leftValue < rightValue;
      case '>=':
      case 'GREATER_THAN_OR_EQUAL':
        return leftValue >= rightValue;
      case '<=':
      case 'LESS_THAN_OR_EQUAL':
        return leftValue <= rightValue;
      case '==':
      case '=':
      case 'EQUAL':
        return Math.abs(leftValue - rightValue) < 0.01;
      default:
        console.warn(`Unknown condition: ${condition}`);
        return false;
    }
  } catch (error) {
    console.error('Error evaluating rule:', error);
    return false;
  }
};

const generateTradingSignal = async (
  strategyId: string,
  signalType: 'entry' | 'exit',
  signalData: any
) => {
  try {
    // Calculate profit for exit signals
    if (signalType === 'exit') {
      const profitData = await calculateExitProfit(strategyId, signalData.price);
      if (profitData) {
        signalData.profit = profitData.profit;
        signalData.profitPercentage = profitData.profitPercentage;
      }
    }

    // Generate and store the signal
    const { data: signal, error } = await supabase
      .from('trading_signals')
      .insert({
        strategy_id: strategyId,
        signal_type: signalType,
        signal_data: signalData,
        processed: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting trading signal:', error);
      return;
    }

    console.log(`Generated ${signalType} signal for strategy ${strategyId} at ${signalData.timestamp}`);

    // Send notifications
    await sendNotificationsForSignal(strategyId, signalType, signalData);

  } catch (error) {
    console.error('Error generating trading signal:', error);
  }
};

const sendNotificationsForSignal = async (strategyId: string, signalType: string, signalData: any) => {
  try {
    // Get strategy and user info
    const { data: strategy } = await supabase
      .from('strategies')
      .select('user_id, name, target_asset')
      .eq('id', strategyId)
      .single();

    if (!strategy) return;

    // Check if user is Pro
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isPro = user.user_metadata?.is_pro === true;
    
    if (!isPro) {
      console.log(`User ${strategy.user_id} is not Pro, skipping external notifications`);
      return;
    }

    // Get user notification settings
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', strategy.user_id)
      .single();

    if (!settings) return;

    const notificationData = {
      ...signalData,
      strategyName: strategy.name,
      targetAsset: strategy.target_asset,
      userId: strategy.user_id
    };

    // Send Discord notification if enabled
    if (settings.discord_enabled && settings.discord_webhook_url) {
      try {
        await supabase.functions.invoke('send-discord-notification', {
          body: {
            webhookUrl: settings.discord_webhook_url,
            signalData: notificationData,
            signalType: signalType
          }
        });
        console.log(`Discord notification sent for strategy ${strategyId}`);
      } catch (error) {
        console.error(`Failed to send Discord notification:`, error);
      }
    }

    // Send Telegram notification if enabled
    if (settings.telegram_enabled && settings.telegram_bot_token && settings.telegram_chat_id) {
      try {
        await supabase.functions.invoke('send-telegram-notification', {
          body: {
            botToken: settings.telegram_bot_token,
            chatId: settings.telegram_chat_id,
            signalData: notificationData,
            signalType: signalType
          }
        });
        console.log(`Telegram notification sent for strategy ${strategyId}`);
      } catch (error) {
        console.error(`Failed to send Telegram notification:`, error);
      }
    }

    // Send Email notification if enabled
    if (settings.email_enabled) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.email) {
          await supabase.functions.invoke('send-email-notification', {
            body: {
              userEmail: authUser.email,
              signalData: notificationData,
              signalType: signalType
            }
          });
          console.log(`Email notification sent for strategy ${strategyId}`);
        }
      } catch (error) {
        console.error(`Failed to send Email notification:`, error);
      }
    }

  } catch (error) {
    console.error(`Error sending notifications for strategy ${strategyId}:`, error);
  }
};

const calculateExitProfit = async (strategyId: string, exitPrice: number) => {
  try {
    // Get the most recent entry signal
    const { data: entrySignal } = await supabase
      .from('trading_signals')
      .select('*')
      .eq('strategy_id', strategyId)
      .eq('signal_type', 'entry')
      .eq('processed', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!entrySignal) return null;

    const entryData = entrySignal.signal_data as any;
    const entryPrice = entryData.price || 0;

    if (entryPrice > 0) {
      const profitPercentage = ((exitPrice - entryPrice) / entryPrice) * 100;
      const profit = exitPrice - entryPrice;

      return {
        profit: Math.round(profit * 100) / 100,
        profitPercentage: Math.round(profitPercentage * 100) / 100
      };
    }

    return null;
  } catch (error) {
    console.error('Error calculating exit profit:', error);
    return null;
  }
};

export const cleanupInvalidSignals = async () => {
  try {
    console.log('Starting cleanup of invalid signals...');

    // First get all valid strategy IDs
    const { data: validStrategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('id');

    if (strategiesError) {
      console.error('Error fetching valid strategies:', strategiesError);
      throw strategiesError;
    }

    if (!validStrategies || validStrategies.length === 0) {
      console.log('No valid strategies found, skipping cleanup');
      return;
    }

    const validStrategyIds = validStrategies.map(s => s.id);

    // Delete signals that don't have valid strategy references
    const { error: deleteError } = await supabase
      .from('trading_signals')
      .delete()
      .not('strategy_id', 'in', `(${validStrategyIds.join(',')})`);

    if (deleteError) {
      console.error('Error cleaning up invalid signals:', deleteError);
      throw deleteError;
    }

    console.log('Invalid signals cleanup completed');
  } catch (error) {
    console.error('Cleanup failed:', error);
    throw error;
  }
};


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

// Enhanced market hours validation
const isMarketHours = (timeframe: string): boolean => {
  const now = new Date();
  const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const dayOfWeek = easternTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = easternTime.getHours();
  const minute = easternTime.getMinutes();
  
  // Skip weekends
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    console.log(`[Market Hours] Weekend detected, market closed`);
    return false;
  }
  
  // Enhanced validation based on timeframe
  if (timeframe === 'Daily' || timeframe === '1d') {
    // Daily strategies: only between 4:00-4:05 PM ET
    const isCloseWindow = hour === 16 && minute >= 0 && minute <= 5;
    console.log(`[Market Hours] Daily strategy - Hour: ${hour}, Minute: ${minute}, Close window: ${isCloseWindow}`);
    return isCloseWindow;
  } else {
    // Intraday strategies: regular market hours 9:30 AM - 4:00 PM ET
    const isRegularHours = (hour === 9 && minute >= 30) || (hour >= 10 && hour < 16);
    console.log(`[Market Hours] Intraday strategy - Hour: ${hour}, Minute: ${minute}, Regular hours: ${isRegularHours}`);
    return isRegularHours;
  }
};

// Validate signal conditions before generation
const validateSignalConditions = (ruleGroups: any[], indicators: Record<string, number>, signalType: 'entry' | 'exit'): { isValid: boolean; reason: string } => {
  console.log(`[Signal Validation] Validating ${signalType} signal conditions`);
  
  for (const group of ruleGroups) {
    const rules = group.trading_rules || [];
    
    for (const rule of rules) {
      // Check for contradictory RSI conditions in the same strategy
      if (rule.left_indicator === 'RSI' && rule.condition && rule.right_value) {
        const condition = rule.condition.toUpperCase();
        const threshold = parseFloat(rule.right_value);
        
        // Flag potentially problematic RSI conditions
        if (signalType === 'entry') {
          if (condition === 'GREATER_THAN' && threshold > 60) {
            console.warn(`[Signal Validation] Suspicious RSI entry condition: RSI > ${threshold} (overbought entry)`);
          }
          if (condition === 'LESS_THAN' && threshold < 40) {
            console.log(`[Signal Validation] Valid RSI oversold entry: RSI < ${threshold}`);
          }
        }
      }
      
      // Validate that indicator values exist
      if (rule.left_type === 'indicator' || rule.left_type === 'INDICATOR') {
        const indicatorKey = rule.left_indicator?.toLowerCase();
        if (!indicators[indicatorKey]) {
          return { 
            isValid: false, 
            reason: `Missing indicator data for ${rule.left_indicator}` 
          };
        }
      }
    }
  }
  
  return { isValid: true, reason: 'All conditions validated' };
};

// Get real technical indicators from FMP API with improved error handling
const getRealTechnicalIndicators = async (symbol: string): Promise<Record<string, number> | null> => {
  try {
    console.log(`[SignalGen] Fetching real technical indicators for ${symbol}`);
    
    // Get FMP API key with improved error handling
    let fmpApiKey;
    try {
      console.log('[SignalGen] Requesting FMP API key from edge function...');
      const { data, error } = await supabase.functions.invoke('get-fmp-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (error) {
        console.error('[SignalGen] Error invoking get-fmp-key function:', error);
        throw new Error(`Failed to get FMP API key: ${error.message}`);
      }
      
      if (!data?.key) {
        console.error('[SignalGen] No FMP API key returned from function:', data);
        throw new Error('FMP API key not available');
      }
      
      fmpApiKey = data.key;
      console.log('[SignalGen] Successfully retrieved FMP API key');
      
    } catch (error) {
      console.error('[SignalGen] Failed to get FMP API key:', error);
      throw error;
    }

    // Initialize indicators object
    let indicators: Record<string, number> = {};

    // Fetch RSI (14-period) - Required for strategy evaluation with proper timeout
    console.log(`[SignalGen] Fetching RSI data for ${symbol}...`);
    
    const rsiController = new AbortController();
    const rsiTimeoutId = setTimeout(() => rsiController.abort(), 15000); // 15 second timeout
    
    try {
      const rsiResponse = await fetch(
        `https://financialmodelingprep.com/api/v3/technical_indicator/daily/${symbol}?period=14&type=rsi&apikey=${fmpApiKey}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'TradingApp/1.0'
          },
          signal: rsiController.signal
        }
      );
      
      clearTimeout(rsiTimeoutId);
      
      if (!rsiResponse.ok) {
        if (rsiResponse.status === 429) {
          console.error('[SignalGen] FMP API rate limit reached for RSI');
          throw new Error('FMP API rate limit reached');
        } else if (rsiResponse.status === 401 || rsiResponse.status === 403) {
          console.error('[SignalGen] FMP API authentication failed for RSI');
          throw new Error('FMP API authentication failed');
        }
        console.error(`[SignalGen] RSI API error: ${rsiResponse.status}`);
        throw new Error(`RSI API error: ${rsiResponse.status}`);
      }
      
      const rsiData = await rsiResponse.json();
      console.log(`[SignalGen] Raw RSI data for ${symbol}:`, rsiData);
      
      if (!Array.isArray(rsiData) || rsiData.length === 0) {
        console.error(`[SignalGen] No RSI data found for ${symbol}`);
        throw new Error(`No RSI data found for ${symbol}`);
      }
      
      indicators.rsi = rsiData[0].rsi;
      console.log(`[SignalGen] Successfully retrieved RSI for ${symbol}: ${indicators.rsi}`);
      
    } catch (error) {
      clearTimeout(rsiTimeoutId);
      if (error.name === 'AbortError') {
        throw new Error('RSI request timeout - FMP API took too long to respond');
      }
      throw error;
    }
    
    // Fetch additional indicators (SMA, EMA, CCI) for comprehensive analysis
    try {
      console.log(`[SignalGen] Fetching SMA data for ${symbol}...`);
      
      const smaController = new AbortController();
      const smaTimeoutId = setTimeout(() => smaController.abort(), 10000); // 10 second timeout
      
      try {
        const smaResponse = await fetch(
          `https://financialmodelingprep.com/api/v3/technical_indicator/daily/${symbol}?period=20&type=sma&apikey=${fmpApiKey}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'TradingApp/1.0'
            },
            signal: smaController.signal
          }
        );
        
        clearTimeout(smaTimeoutId);
        
        if (smaResponse.ok) {
          const smaData = await smaResponse.json();
          if (Array.isArray(smaData) && smaData.length > 0) {
            indicators.sma = smaData[0].sma;
            console.log(`[SignalGen] Retrieved SMA for ${symbol}: ${indicators.sma}`);
          }
        }
      } catch (error) {
        clearTimeout(smaTimeoutId);
        if (error.name !== 'AbortError') {
          console.warn(`[SignalGen] Failed to fetch SMA for ${symbol}:`, error);
        }
      }
    } catch (error) {
      console.warn(`[SignalGen] Failed to fetch SMA for ${symbol}:`, error);
    }
    
    try {
      console.log(`[SignalGen] Fetching EMA data for ${symbol}...`);
      
      const emaController = new AbortController();
      const emaTimeoutId = setTimeout(() => emaController.abort(), 10000); // 10 second timeout
      
      try {
        const emaResponse = await fetch(
          `https://financialmodelingprep.com/api/v3/technical_indicator/daily/${symbol}?period=20&type=ema&apikey=${fmpApiKey}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'TradingApp/1.0'
            },
            signal: emaController.signal
          }
        );
        
        clearTimeout(emaTimeoutId);
        
        if (emaResponse.ok) {
          const emaData = await emaResponse.json();
          if (Array.isArray(emaData) && emaData.length > 0) {
            indicators.ema = emaData[0].ema;
            console.log(`[SignalGen] Retrieved EMA for ${symbol}: ${indicators.ema}`);
          }
        }
      } catch (error) {
        clearTimeout(emaTimeoutId);
        if (error.name !== 'AbortError') {
          console.warn(`[SignalGen] Failed to fetch EMA for ${symbol}:`, error);
        }
      }
    } catch (error) {
      console.warn(`[SignalGen] Failed to fetch EMA for ${symbol}:`, error);
    }

    // Fetch CCI data for AMD strategy
    try {
      console.log(`[SignalGen] Fetching CCI data for ${symbol}...`);
      
      const cciController = new AbortController();
      const cciTimeoutId = setTimeout(() => cciController.abort(), 10000);
      
      try {
        const cciResponse = await fetch(
          `https://financialmodelingprep.com/api/v3/technical_indicator/daily/${symbol}?period=14&type=cci&apikey=${fmpApiKey}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'TradingApp/1.0'
            },
            signal: cciController.signal
          }
        );
        
        clearTimeout(cciTimeoutId);
        
        if (cciResponse.ok) {
          const cciData = await cciResponse.json();
          if (Array.isArray(cciData) && cciData.length > 0) {
            indicators.cci = cciData[0].cci;
            console.log(`[SignalGen] Retrieved CCI for ${symbol}: ${indicators.cci}`);
          }
        }
      } catch (error) {
        clearTimeout(cciTimeoutId);
        if (error.name !== 'AbortError') {
          console.warn(`[SignalGen] Failed to fetch CCI for ${symbol}:`, error);
        }
      }
    } catch (error) {
      console.warn(`[SignalGen] Failed to fetch CCI for ${symbol}:`, error);
    }
    
    console.log(`[SignalGen] Real indicators for ${symbol}:`, indicators);
    return indicators;
    
  } catch (error) {
    console.error(`[SignalGen] Error fetching real technical indicators for ${symbol}:`, error);
    throw error;
  }
};

// Get real market data with improved error handling
const getRealMarketData = async (symbol: string) => {
  try {
    console.log(`[SignalGen] Fetching real market data for ${symbol}`);
    
    // Get FMP API key
    const { data, error } = await supabase.functions.invoke('get-fmp-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (error || !data?.key) {
      console.error('[SignalGen] FMP API key not available for market data:', error);
      throw new Error('FMP API key not available');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${data.key}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'TradingApp/1.0'
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('FMP API rate limit reached');
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('FMP API authentication failed');
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

      console.log(`[SignalGen] Real market data for ${symbol}:`, {
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
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Market data request timeout - FMP API took too long to respond');
      }
      throw error;
    }

  } catch (error) {
    console.error(`[SignalGen] Error fetching real market data for ${symbol}:`, error);
    throw error;
  }
};

export const evaluateStrategy = async (strategyId: string) => {
  console.log(`[SignalGen] Evaluating strategy ${strategyId} for signal generation`);
  
  try {
    // Get strategy details
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', strategyId)
      .single();

    if (strategyError || !strategy) {
      console.log(`[SignalGen] Strategy ${strategyId} not found:`, strategyError);
      return;
    }

    console.log(`[SignalGen] Strategy found: ${strategy.name} for ${strategy.target_asset}, timeframe: ${strategy.timeframe}`);

    // Enhanced market hours validation
    if (!isMarketHours(strategy.timeframe)) {
      console.log(`[SignalGen] Market is closed for ${strategy.timeframe} timeframe, skipping evaluation`);
      return;
    }

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
      console.log(`[SignalGen] No trading rules found for strategy ${strategyId}`);
      return;
    }

    console.log(`[SignalGen] Found ${ruleGroups.length} rule groups for strategy ${strategyId}`);

    // Get real market data - MUST use real data
    let priceData;
    let indicators: Record<string, number> = {};

    try {
      // Get real price data
      priceData = await getRealMarketData(strategy.target_asset);
      if (!priceData || priceData.price === 0) {
        console.error(`[SignalGen] No real price data available for ${strategy.target_asset}, skipping signal generation`);
        return;
      }

      // Get real technical indicators
      indicators = await getRealTechnicalIndicators(strategy.target_asset);
      if (!indicators || Object.keys(indicators).length === 0) {
        console.error(`[SignalGen] No real technical indicators available for ${strategy.target_asset}, skipping signal generation`);
        return;
      }

      console.log(`[SignalGen] Using real market data for ${strategy.target_asset}:`, {
        price: priceData.price,
        change: priceData.change,
        changePercent: priceData.changePercent,
        indicators: indicators
      });

    } catch (error) {
      console.error(`[SignalGen] Failed to get real market data for ${strategy.target_asset}:`, error);
      return;
    }

    const currentPrice = priceData.price;

    // Evaluate entry and exit rules
    const entryRules = ruleGroups.filter(group => group.rule_type === 'entry');
    const exitRules = ruleGroups.filter(group => group.rule_type === 'exit');

    console.log(`[SignalGen] Entry rules: ${entryRules.length}, Exit rules: ${exitRules.length}`);

    // Check for entry signals with validation
    if (await shouldGenerateEntrySignal(entryRules, indicators, currentPrice)) {
      const validation = validateSignalConditions(entryRules, indicators, 'entry');
      
      if (!validation.isValid) {
        console.warn(`[SignalGen] Entry signal validation failed: ${validation.reason}`);
        return;
      }

      const entryReason = `Entry signal (real market data) - RSI: ${indicators.rsi?.toFixed(2) || 'N/A'}, CCI: ${indicators.cci?.toFixed(2) || 'N/A'}, Price: $${currentPrice.toFixed(2)}`;
      
      console.log(`[SignalGen] Generating validated entry signal: ${entryReason}`);
      
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

    // Check for exit signals with validation
    if (await shouldGenerateExitSignal(exitRules, indicators, currentPrice, strategyId)) {
      const validation = validateSignalConditions(exitRules, indicators, 'exit');
      
      if (!validation.isValid) {
        console.warn(`[SignalGen] Exit signal validation failed: ${validation.reason}`);
        return;
      }

      const exitReason = `Exit signal (real market data) - RSI: ${indicators.rsi?.toFixed(2) || 'N/A'}, CCI: ${indicators.cci?.toFixed(2) || 'N/A'}, Price: $${currentPrice.toFixed(2)}`;
      
      console.log(`[SignalGen] Generating validated exit signal: ${exitReason}`);
      
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
    console.error(`[SignalGen] Error evaluating strategy ${strategyId}:`, error);
  }
};

const shouldGenerateEntrySignal = async (
  entryRules: any[], 
  indicators: Record<string, number>, 
  currentPrice: number
): Promise<boolean> => {
  if (!entryRules.length) return false;

  console.log(`[SignalGen] Evaluating entry conditions with indicators:`, indicators);

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

  console.log(`[SignalGen] Evaluating exit conditions with indicators:`, indicators);

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

  console.log(`[SignalGen] Evaluating ${group.logic} group with ${rules.length} rules`);

  for (const rule of rules) {
    const result = evaluateRule(rule, indicators, currentPrice);
    results.push(result);
    
    console.log(`[SignalGen] Rule evaluation: ${rule.left_indicator || rule.left_type} ${rule.condition} ${rule.right_value} = ${result} (Indicator value: ${rule.left_indicator ? indicators[rule.left_indicator.toLowerCase()] : 'N/A'})`);
  }

  // Apply group logic
  if (group.logic === 'AND') {
    const allMet = results.every(result => result);
    console.log(`[SignalGen] AND group result: ${allMet} (${results.filter(r => r).length}/${results.length} conditions met)`);
    return allMet;
  } else if (group.logic === 'OR') {
    const requiredConditions = group.required_conditions || 1;
    const trueCount = results.filter(result => result).length;
    const orMet = trueCount >= requiredConditions;
    console.log(`[SignalGen] OR group result: ${orMet} (${trueCount}/${results.length} conditions met, required: ${requiredConditions})`);
    return orMet;
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
      console.log(`[SignalGen] Left indicator ${rule.left_indicator}: ${leftValue}`);
    } else if (rule.left_type === 'price' || rule.left_type === 'PRICE') {
      leftValue = currentPrice;
      console.log(`[SignalGen] Left price: ${leftValue}`);
    }

    // Get right side value
    if (rule.right_type === 'value' || rule.right_type === 'VALUE') {
      rightValue = parseFloat(rule.right_value) || 0;
      console.log(`[SignalGen] Right value: ${rightValue}`);
    } else if (rule.right_type === 'indicator' || rule.right_type === 'INDICATOR') {
      const indicatorKey = rule.right_indicator?.toLowerCase();
      rightValue = indicators[indicatorKey] || 0;
      console.log(`[SignalGen] Right indicator ${rule.right_indicator}: ${rightValue}`);
    }

    // Evaluate condition with improved mapping
    const condition = rule.condition?.toUpperCase();
    let conditionResult = false;

    switch (condition) {
      case '>':
      case 'GREATER_THAN':
        conditionResult = leftValue > rightValue;
        break;
      case '<':
      case 'LESS_THAN':
        conditionResult = leftValue < rightValue;
        break;
      case '>=':
      case 'GREATER_THAN_OR_EQUAL':
        conditionResult = leftValue >= rightValue;
        break;
      case '<=':
      case 'LESS_THAN_OR_EQUAL':
        conditionResult = leftValue <= rightValue;
        break;
      case '==':
      case '=':
      case 'EQUAL':
        conditionResult = Math.abs(leftValue - rightValue) < 0.01;
        break;
      default:
        console.warn(`[SignalGen] Unknown condition: ${condition}`);
        return false;
    }

    console.log(`[SignalGen] Detailed evaluation: ${leftValue} ${condition} ${rightValue} = ${conditionResult}`);
    return conditionResult;

  } catch (error) {
    console.error('[SignalGen] Error evaluating rule:', error);
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
      console.error('[SignalGen] Error inserting trading signal:', error);
      return;
    }

    console.log(`[SignalGen] Generated ${signalType} signal for strategy ${strategyId} at ${signalData.timestamp}`);

    // Send notifications
    await sendNotificationsForSignal(strategyId, signalType, signalData);

  } catch (error) {
    console.error('[SignalGen] Error generating trading signal:', error);
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

    // FIXED: Check Pro status using subscription_tier instead of is_pro
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', strategy.user_id)
      .single();

    const isPro = profile?.subscription_tier === 'pro';
    console.log(`[SignalGen] User ${strategy.user_id} Pro status: ${isPro} (subscription_tier: ${profile?.subscription_tier})`);
    
    if (!isPro) {
      console.log(`[SignalGen] User ${strategy.user_id} is not Pro, skipping external notifications`);
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
      strategyId: strategyId,
      strategyName: strategy.name,
      targetAsset: strategy.target_asset,
      userId: strategy.user_id
    };

    console.log(`[SignalGen] Sending notifications for Pro user ${strategy.user_id}:`, {
      discord_enabled: settings.discord_enabled,
      telegram_enabled: settings.telegram_enabled,
      email_enabled: settings.email_enabled
    });

    // Send Discord notification if enabled with retry logic
    if (settings.discord_enabled && settings.discord_webhook_url) {
      try {
        const { error: discordError } = await supabase.functions.invoke('send-discord-notification', {
          body: {
            webhookUrl: settings.discord_webhook_url,
            signalData: notificationData,
            signalType: signalType
          }
        });
        
        if (discordError) {
          console.error(`[SignalGen] Discord notification error, retrying:`, discordError);
          // Retry once
          setTimeout(async () => {
            const { error: retryError } = await supabase.functions.invoke('send-discord-notification', {
              body: {
                webhookUrl: settings.discord_webhook_url,
                signalData: notificationData,
                signalType: signalType
              }
            });
            if (retryError) {
              console.error(`[SignalGen] Discord notification retry failed:`, retryError);
            } else {
              console.log(`[SignalGen] Discord notification sent successfully on retry for strategy ${strategyId}`);
            }
          }, 2000);
        } else {
          console.log(`[SignalGen] Discord notification sent for strategy ${strategyId}`);
        }
      } catch (error) {
        console.error(`[SignalGen] Failed to send Discord notification:`, error);
      }
    }

    // Send Telegram notification if enabled with retry logic
    if (settings.telegram_enabled && settings.telegram_bot_token && settings.telegram_chat_id) {
      try {
        const { error: telegramError } = await supabase.functions.invoke('send-telegram-notification', {
          body: {
            botToken: settings.telegram_bot_token,
            chatId: settings.telegram_chat_id,
            signalData: notificationData,
            signalType: signalType
          }
        });
        
        if (telegramError) {
          console.error(`[SignalGen] Telegram notification error, retrying:`, telegramError);
          // Retry once
          setTimeout(async () => {
            const { error: retryError } = await supabase.functions.invoke('send-telegram-notification', {
              body: {
                botToken: settings.telegram_bot_token,
                chatId: settings.telegram_chat_id,
                signalData: notificationData,
                signalType: signalType
              }
            });
            if (retryError) {
              console.error(`[SignalGen] Telegram notification retry failed:`, retryError);
            } else {
              console.log(`[SignalGen] Telegram notification sent successfully on retry for strategy ${strategyId}`);
            }
          }, 2000);
        } else {
          console.log(`[SignalGen] Telegram notification sent for strategy ${strategyId}`);
        }
      } catch (error) {
        console.error(`[SignalGen] Failed to send Telegram notification:`, error);
      }
    }

    // Send Email notification if enabled
    if (settings.email_enabled) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const { error: emailError } = await supabase.functions.invoke('send-email-notification', {
            body: {
              userEmail: user.email,
              signalData: notificationData,
              signalType: signalType
            }
          });
          
          if (emailError) {
            console.error(`[SignalGen] Email notification error:`, emailError);
          } else {
            console.log(`[SignalGen] Email notification sent for strategy ${strategyId}`);
          }
        }
      } catch (error) {
        console.error(`[SignalGen] Failed to send Email notification:`, error);
      }
    }

  } catch (error) {
    console.error(`[SignalGen] Error sending notifications for strategy ${strategyId}:`, error);
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
    console.error('[SignalGen] Error calculating exit profit:', error);
    return null;
  }
};

export const cleanupInvalidSignals = async () => {
  try {
    console.log('[SignalGen] Starting cleanup of invalid signals...');

    // First get all valid strategy IDs
    const { data: validStrategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('id');

    if (strategiesError) {
      console.error('[SignalGen] Error fetching valid strategies:', strategiesError);
      throw strategiesError;
    }

    if (!validStrategies || validStrategies.length === 0) {
      console.log('[SignalGen] No valid strategies found, skipping cleanup');
      return;
    }

    const validStrategyIds = validStrategies.map(s => s.id);

    // Delete signals that don't have valid strategy references
    const { error: deleteError } = await supabase
      .from('trading_signals')
      .delete()
      .not('strategy_id', 'in', `(${validStrategyIds.join(',')})`);

    if (deleteError) {
      console.error('[SignalGen] Error cleaning up invalid signals:', deleteError);
      throw deleteError;
    }

    console.log('[SignalGen] Invalid signals cleanup completed');
  } catch (error) {
    console.error('[SignalGen] Cleanup failed:', error);
    throw error;
  }
};

// Clean up problematic signals from yesterday
export const cleanupYesterdaySignals = async () => {
  try {
    console.log('[SignalGen] Cleaning up problematic signals from yesterday...');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);

    // Delete AMD strategy signals that were generated incorrectly
    const { error: amdCleanupError } = await supabase
      .from('trading_signals')
      .delete()
      .gte('created_at', yesterdayStart.toISOString())
      .lt('created_at', yesterdayEnd.toISOString())
      .in('strategy_id', ['349b30bb-1cc0-4a89-9159-27a62ce5966a']); // AMD strategy ID

    if (amdCleanupError) {
      console.error('[SignalGen] Error cleaning up AMD signals:', amdCleanupError);
    } else {
      console.log('[SignalGen] Cleaned up AMD strategy signals from yesterday');
    }

    // Delete any signals generated outside market hours
    const { error: afterHoursError } = await supabase
      .from('trading_signals')
      .delete()
      .gte('created_at', yesterdayStart.toISOString())
      .lt('created_at', yesterdayEnd.toISOString())
      .like('signal_data->reason', '%after market close%');

    if (afterHoursError) {
      console.error('[SignalGen] Error cleaning up after-hours signals:', afterHoursError);
    } else {
      console.log('[SignalGen] Cleaned up after-hours signals from yesterday');
    }

  } catch (error) {
    console.error('[SignalGen] Error during yesterday cleanup:', error);
  }
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Timeframe configuration for evaluation intervals
const TIMEFRAME_CONFIG = {
  '1m': { intervalMinutes: 1, name: '1 minute' },
  '5m': { intervalMinutes: 5, name: '5 minutes' },
  '15m': { intervalMinutes: 15, name: '15 minutes' },
  '1h': { intervalMinutes: 60, name: '1 hour' },
  '4h': { intervalMinutes: 240, name: '4 hours' },
  'Daily': { intervalMinutes: 1440, name: 'Daily' }, // 24 hours
  'Weekly': { intervalMinutes: 10080, name: 'Weekly' }, // 7 days
  'Monthly': { intervalMinutes: 43200, name: 'Monthly' } // 30 days
};

// Check if market is open with proper timezone handling
function isMarketOpen(): boolean {
  const now = new Date();
  
  // Convert to Eastern Time (market timezone)
  const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const utcDay = easternTime.getUTCDay();
  const easternHour = easternTime.getHours();
  const easternMinutes = easternTime.getMinutes();
  
  console.log(`Market check - Eastern Time: ${easternTime.toLocaleString()}, Hour: ${easternHour}, Minutes: ${easternMinutes}`);
  
  // Market is open Monday-Friday, 9:30 AM - 4:00 PM Eastern Time
  const isWeekday = utcDay >= 1 && utcDay <= 5;
  const timeInMinutes = easternHour * 60 + easternMinutes;
  const marketOpenMinutes = 9 * 60 + 30; // 9:30 AM
  const marketCloseMinutes = 16 * 60; // 4:00 PM
  
  const isMarketHours = timeInMinutes >= marketOpenMinutes && timeInMinutes < marketCloseMinutes;
  
  console.log(`Market status - Weekday: ${isWeekday}, Market hours: ${isMarketHours}, Time in minutes: ${timeInMinutes}`);
  
  return isWeekday && isMarketHours;
}

// Check if it's market close time (for daily strategies)
function isMarketCloseTime(): boolean {
  const now = new Date();
  const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const easternHour = easternTime.getHours();
  const easternMinutes = easternTime.getMinutes();
  
  // Market closes at 4:00 PM ET (16:00)
  return easternHour === 16 && easternMinutes >= 0 && easternMinutes < 5; // 5-minute window
}

// Calculate next evaluation time based on timeframe
function calculateNextEvaluationTime(timeframe: string, currentTime: Date): Date {
  const easternTime = new Date(currentTime.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const nextEval = new Date(easternTime);
  
  switch (timeframe) {
    case '1m':
      nextEval.setMinutes(nextEval.getMinutes() + 1);
      break;
    case '5m':
      const next5Min = Math.ceil(nextEval.getMinutes() / 5) * 5;
      nextEval.setMinutes(next5Min);
      nextEval.setSeconds(0);
      break;
    case '15m':
      const next15Min = Math.ceil(nextEval.getMinutes() / 15) * 15;
      nextEval.setMinutes(next15Min);
      nextEval.setSeconds(0);
      break;
    case '1h':
      nextEval.setHours(nextEval.getHours() + 1);
      nextEval.setMinutes(0);
      nextEval.setSeconds(0);
      break;
    case '4h':
      const next4Hour = Math.ceil(nextEval.getHours() / 4) * 4;
      nextEval.setHours(next4Hour);
      nextEval.setMinutes(0);
      nextEval.setSeconds(0);
      break;
    case 'Daily':
      // Next trading day at 4:00 PM ET
      nextEval.setDate(nextEval.getDate() + 1);
      nextEval.setHours(16, 0, 0, 0);
      // Skip weekends
      while (nextEval.getDay() === 0 || nextEval.getDay() === 6) {
        nextEval.setDate(nextEval.getDate() + 1);
      }
      break;
    case 'Weekly':
      // Next Friday at 4:00 PM ET
      const daysUntilFriday = (5 - nextEval.getDay() + 7) % 7 || 7;
      nextEval.setDate(nextEval.getDate() + daysUntilFriday);
      nextEval.setHours(16, 0, 0, 0);
      break;
    default:
      nextEval.setHours(nextEval.getHours() + 1);
  }
  
  return nextEval;
}

// Check if strategy should be evaluated based on timeframe and timing
function shouldEvaluateStrategy(timeframe: string, lastEvaluated: Date | null, nextDue: Date | null): boolean {
  const now = new Date();
  
  console.log(`[Monitor] Checking if strategy should be evaluated - Timeframe: ${timeframe}, Last: ${lastEvaluated?.toISOString()}, Next Due: ${nextDue?.toISOString()}, Now: ${now.toISOString()}`);
  
  // If never evaluated, evaluate now only if it's the right time for this timeframe
  if (!lastEvaluated || !nextDue) {
    console.log(`[Monitor] Strategy never evaluated, checking if it's time for ${timeframe} evaluation`);
    
    // For daily strategies, only evaluate at market close
    if (timeframe === 'Daily') {
      const shouldEvaluate = isMarketCloseTime();
      console.log(`[Monitor] Daily strategy - Market close time: ${shouldEvaluate}`);
      return shouldEvaluate;
    }
    
    // For weekly strategies, only evaluate on Friday at market close
    if (timeframe === 'Weekly') {
      const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
      const shouldEvaluate = easternTime.getDay() === 5 && isMarketCloseTime();
      console.log(`[Monitor] Weekly strategy - Friday market close: ${shouldEvaluate}`);
      return shouldEvaluate;
    }
    
    // For intraday strategies, evaluate if market is open
    const shouldEvaluate = isMarketOpen();
    console.log(`[Monitor] Intraday strategy (${timeframe}) - Market open: ${shouldEvaluate}`);
    return shouldEvaluate;
  }
  
  // Check if it's time for next evaluation
  if (now >= nextDue) {
    console.log(`[Monitor] Strategy is due for evaluation (now >= nextDue)`);
    
    // For daily strategies, only evaluate at market close
    if (timeframe === 'Daily') {
      const shouldEvaluate = isMarketCloseTime();
      console.log(`[Monitor] Daily strategy due - Market close time: ${shouldEvaluate}`);
      return shouldEvaluate;
    }
    
    // For weekly strategies, only evaluate on Friday at market close
    if (timeframe === 'Weekly') {
      const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
      const shouldEvaluate = easternTime.getDay() === 5 && isMarketCloseTime();
      console.log(`[Monitor] Weekly strategy due - Friday market close: ${shouldEvaluate}`);
      return shouldEvaluate;
    }
    
    // For intraday strategies, evaluate if market is open
    const shouldEvaluate = isMarketOpen();
    console.log(`[Monitor] Intraday strategy (${timeframe}) due - Market open: ${shouldEvaluate}`);
    return shouldEvaluate;
  }
  
  console.log(`[Monitor] Strategy not due for evaluation yet`);
  return false;
}

// Get strategies that need evaluation based on timeframe - CRITICAL FIX
async function getStrategiesForEvaluation(supabase: any, requestedTimeframes?: string[]) {
  try {
    console.log(`[Monitor] Fetching strategies for evaluation, requested timeframes: ${requestedTimeframes?.join(', ') || 'all'}`);
    
    let query = supabase
      .from('strategies')
      .select(`
        id,
        name,
        target_asset,
        user_id,
        is_active,
        timeframe,
        strategy_evaluations!inner (
          last_evaluated_at,
          next_evaluation_due,
          evaluation_count
        )
      `)
      .eq('is_active', true);
    
    // Filter by specific timeframes if provided
    if (requestedTimeframes && requestedTimeframes.length > 0) {
      query = query.in('timeframe', requestedTimeframes);
    }
    
    const { data: strategies, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('[Monitor] Error fetching strategies:', error);
      return [];
    }
    
    console.log(`[Monitor] Found ${strategies?.length || 0} active strategies total`);
    
    // CRITICAL: Filter strategies that actually need evaluation based on their timeframe
    const strategiesForEvaluation = strategies?.filter(strategy => {
      const evaluation = strategy.strategy_evaluations?.[0];
      const lastEvaluated = evaluation?.last_evaluated_at ? new Date(evaluation.last_evaluated_at) : null;
      const nextDue = evaluation?.next_evaluation_due ? new Date(evaluation.next_evaluation_due) : null;
      
      const shouldEvaluate = shouldEvaluateStrategy(strategy.timeframe, lastEvaluated, nextDue);
      
      console.log(`[Monitor] Strategy ${strategy.id} (${strategy.name}) - Timeframe: ${strategy.timeframe}, Should evaluate: ${shouldEvaluate}`);
      
      return shouldEvaluate;
    }) || [];
    
    console.log(`[Monitor] Found ${strategiesForEvaluation.length} strategies needing evaluation out of ${strategies?.length || 0} total active strategies`);
    
    return strategiesForEvaluation;
  } catch (error) {
    console.error('[Monitor] Error in getStrategiesForEvaluation:', error);
    return [];
  }
}

// Update strategy evaluation record with proper next evaluation time
async function updateStrategyEvaluation(supabase: any, strategyId: string, timeframe: string) {
  try {
    const now = new Date();
    const nextEvaluation = calculateNextEvaluationTime(timeframe, now);
    
    console.log(`[Monitor] Updating evaluation record for strategy ${strategyId}, timeframe: ${timeframe}, next due: ${nextEvaluation.toISOString()}`);
    
    const { error } = await supabase
      .from('strategy_evaluations')
      .upsert({
        strategy_id: strategyId,
        timeframe: timeframe,
        last_evaluated_at: now.toISOString(),
        next_evaluation_due: nextEvaluation.toISOString(),
        evaluation_count: supabase.raw('COALESCE(evaluation_count, 0) + 1')
      }, {
        onConflict: 'strategy_id'
      });
    
    if (error) {
      console.error(`[Monitor] Error updating evaluation record for strategy ${strategyId}:`, error);
    } else {
      console.log(`[Monitor] Updated evaluation record for strategy ${strategyId}, next due: ${nextEvaluation.toISOString()}`);
    }
  } catch (error) {
    console.error(`[Monitor] Error in updateStrategyEvaluation for strategy ${strategyId}:`, error);
  }
}

// Get real market data from FMP API - ONLY REAL DATA
async function getRealMarketData(symbol: string, fmpApiKey: string) {
  try {
    console.log(`[Monitor] Fetching real market data for ${symbol}`);
    
    // Get current quote
    const quoteResponse = await fetch(
      `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${fmpApiKey}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TradingApp/1.0'
        }
      }
    );
    
    if (!quoteResponse.ok) {
      if (quoteResponse.status === 429) {
        throw new Error('FMP API rate limit reached');
      } else if (quoteResponse.status === 401 || quoteResponse.status === 403) {
        throw new Error('FMP API authentication failed');
      }
      throw new Error(`Quote API error: ${quoteResponse.status}`);
    }
    
    const quotes = await quoteResponse.json();
    if (!Array.isArray(quotes) || quotes.length === 0) {
      throw new Error(`No quote data found for ${symbol}`);
    }
    
    const quote = quotes[0];
    const currentPrice = quote.price || 0;
    
    if (currentPrice === 0) {
      throw new Error(`Invalid price data for ${symbol}`);
    }
    
    // Get technical indicators (RSI) from FMP - REQUIRED
    console.log(`[Monitor] Fetching RSI data for ${symbol}...`);
    const rsiResponse = await fetch(
      `https://financialmodelingprep.com/api/v3/technical_indicator/daily/${symbol}?period=14&type=rsi&apikey=${fmpApiKey}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TradingApp/1.0'
        }
      }
    );
    
    if (!rsiResponse.ok) {
      throw new Error(`RSI API error: ${rsiResponse.status}`);
    }
    
    const rsiData = await rsiResponse.json();
    if (!Array.isArray(rsiData) || rsiData.length === 0) {
      throw new Error(`No RSI data found for ${symbol}`);
    }
    
    const rsiValue = rsiData[0].rsi;
    if (rsiValue === null || rsiValue === undefined) {
      throw new Error(`Invalid RSI data for ${symbol}`);
    }
    
    console.log(`[Monitor] Real market data for ${symbol}:`, {
      price: currentPrice,
      rsi: rsiValue,
      change: quote.change,
      changePercent: quote.changesPercentage
    });
    
    return {
      price: currentPrice,
      change: quote.change || 0,
      changePercent: quote.changesPercentage || 0,
      rsi: rsiValue,
      timestamp: new Date().toISOString(),
      volume: quote.volume || 0
    };
    
  } catch (error) {
    console.error(`[Monitor] Error fetching real market data for ${symbol}:`, error);
    throw error;
  }
}

// Enhanced strategy evaluation - ONLY REAL DATA
async function evaluateStrategy(supabase: any, strategyId: string, strategy: any) {
  try {
    console.log(`[Monitor] Evaluating strategy ${strategyId}: ${strategy.name} for ${strategy.target_asset} (${strategy.timeframe})`);
    
    // Update evaluation record first
    await updateStrategyEvaluation(supabase, strategyId, strategy.timeframe);
    
    // Get FMP API key - REQUIRED
    const { data: keyData, error: keyError } = await supabase.functions.invoke('get-fmp-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (keyError) {
      console.error(`[Monitor] Error getting FMP API key for strategy ${strategyId}:`, keyError);
      return 0;
    }
    
    if (!keyData?.key) {
      console.error(`[Monitor] No FMP API key available for strategy ${strategyId}, cannot generate signals`);
      return 0;
    }
    
    const fmpApiKey = keyData.key;
    console.log(`[Monitor] Successfully retrieved FMP API key for strategy ${strategyId}`);
    
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
      console.log(`[Monitor] No trading rules found for strategy ${strategyId}`);
      return 0;
    }
    
    console.log(`[Monitor] Found ${ruleGroups.length} rule groups for strategy ${strategyId}`);
    
    // Get ONLY real market data - NO FALLBACK
    let marketData;
    try {
      marketData = await getRealMarketData(strategy.target_asset, fmpApiKey);
      console.log(`[Monitor] Successfully fetched real market data for ${strategy.target_asset}`);
    } catch (error) {
      console.error(`[Monitor] Failed to get real market data for ${strategy.target_asset}:`, error);
      console.error(`[Monitor] Cannot generate signals without real market data for strategy ${strategyId}`);
      return 0;
    }
    
    // Get user profile to check Pro status
    const { data: user } = await supabase
      .from('strategies')
      .select('user_id')
      .eq('id', strategyId)
      .single();

    if (!user) {
      console.error(`[Monitor] No user found for strategy ${strategyId}`);
      return 0;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.user_id)
      .single();

    const isPro = profile?.subscription_tier === 'pro';
    console.log(`[Monitor] User ${user.user_id} Pro status: ${isPro} (subscription_tier: ${profile?.subscription_tier})`);
    
    // Proceed with signal generation using real data
    const indicators = {
      rsi: marketData.rsi,
      price: marketData.price,
      volume: marketData.volume
    };
    
    let signalsGenerated = 0;
    const currentTime = new Date().toISOString();
    
    // Evaluate entry rules
    const entryRules = ruleGroups.filter(group => group.rule_type === 'entry');
    if (await shouldGenerateSignal(entryRules, indicators, marketData.price)) {
      const entryReason = `Entry signal (${strategy.timeframe}) - RSI: ${marketData.rsi.toFixed(2)}, Price: $${marketData.price.toFixed(2)}`;
      
      const { error } = await supabase
        .from('trading_signals')
        .insert({
          strategy_id: strategyId,
          signal_type: 'entry',
          signal_data: {
            reason: entryReason,
            price: marketData.price,
            timestamp: currentTime,
            timeframe: strategy.timeframe,
            indicators: indicators,
            marketData: {
              change: marketData.change,
              changePercent: marketData.changePercent,
              volume: marketData.volume
            }
          },
          processed: true,
          created_at: currentTime
        });

      if (!error) {
        signalsGenerated++;
        console.log(`[Monitor] Generated entry signal for strategy ${strategyId} (${strategy.timeframe}): ${entryReason}`);
        
        // Send notification only if strategy is active
        if (strategy.is_active) {
          await sendNotification(supabase, strategyId, 'entry', {
            reason: entryReason,
            price: marketData.price,
            timestamp: currentTime,
            timeframe: strategy.timeframe,
            strategyName: strategy.name,
            targetAsset: strategy.target_asset,
            userId: user.user_id,
            isPro: isPro
          });
        }
      } else {
        console.error(`[Monitor] Error inserting entry signal for strategy ${strategyId}:`, error);
      }
    }
    
    // Evaluate exit rules
    const exitRules = ruleGroups.filter(group => group.rule_type === 'exit');
    if (exitRules.length > 0) {
      // Check for open positions
      const { data: openPositions } = await supabase
        .from('trading_signals')
        .select('*')
        .eq('strategy_id', strategyId)
        .eq('signal_type', 'entry')
        .eq('processed', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (openPositions && openPositions.length > 0 && 
          await shouldGenerateSignal(exitRules, indicators, marketData.price)) {
        
        const entryData = openPositions[0].signal_data;
        const entryPrice = entryData?.price || marketData.price;
        const profit = marketData.price - entryPrice;
        const profitPercentage = entryPrice > 0 ? (profit / entryPrice) * 100 : 0;
        
        const exitReason = `Exit signal (${strategy.timeframe}) - RSI: ${marketData.rsi.toFixed(2)}, Price: $${marketData.price.toFixed(2)}, P&L: ${profitPercentage.toFixed(2)}%`;

        const { error } = await supabase
          .from('trading_signals')
          .insert({
            strategy_id: strategyId,
            signal_type: 'exit',
            signal_data: {
              reason: exitReason,
              price: marketData.price,
              timestamp: currentTime,
              timeframe: strategy.timeframe,
              profit: profit,
              profitPercentage: profitPercentage,
              indicators: indicators,
              marketData: {
                change: marketData.change,
                changePercent: marketData.changePercent,
                volume: marketData.volume
              }
            },
            processed: true,
            created_at: currentTime
          });

        if (!error) {
          signalsGenerated++;
          console.log(`[Monitor] Generated exit signal for strategy ${strategyId} (${strategy.timeframe}): ${exitReason}`);
          
          // Send notification only if strategy is active
          if (strategy.is_active) {
            await sendNotification(supabase, strategyId, 'exit', {
              reason: exitReason,
              price: marketData.price,
              timestamp: currentTime,
              timeframe: strategy.timeframe,
              profit: profit,
              profitPercentage: profitPercentage,
              strategyName: strategy.name,
              targetAsset: strategy.target_asset,
              userId: user.user_id,
              isPro: isPro
            });
          }
        } else {
          console.error(`[Monitor] Error inserting exit signal for strategy ${strategyId}:`, error);
        }
      }
    }
    
    return signalsGenerated;
  } catch (error) {
    console.error(`[Monitor] Error evaluating strategy ${strategyId}:`, error);
    return 0;
  }
}

// Improved signal generation logic with better rule evaluation
async function shouldGenerateSignal(ruleGroups: any[], indicators: any, currentPrice: number): Promise<boolean> {
  if (!ruleGroups || ruleGroups.length === 0) return false;

  for (const group of ruleGroups) {
    const rules = group.trading_rules || [];
    if (!rules.length) continue;

    const results: boolean[] = [];

    for (const rule of rules) {
      const result = evaluateRule(rule, indicators, currentPrice);
      results.push(result);
      
      console.log(`[Monitor] Rule evaluation: ${rule.left_indicator || rule.left_type} ${rule.condition} ${rule.right_value} = ${result}`);
    }

    // Apply group logic with improved handling
    let groupResult = false;
    if (group.logic === 'AND') {
      groupResult = results.every(result => result);
    } else if (group.logic === 'OR') {
      const requiredConditions = group.required_conditions || 1;
      const trueCount = results.filter(result => result).length;
      groupResult = trueCount >= requiredConditions;
    }
    
    console.log(`[Monitor] Group ${group.rule_type} result: ${groupResult} (logic: ${group.logic})`);
    
    if (groupResult) {
      return true;
    }
  }
  
  return false;
}

// Fixed rule evaluation with proper condition mapping
function evaluateRule(rule: any, indicators: any, currentPrice: number): boolean {
  try {
    let leftValue: number = 0;
    let rightValue: number = 0;

    // Get left side value
    if (rule.left_type === 'indicator' || rule.left_type === 'INDICATOR') {
      const indicatorName = rule.left_indicator?.toLowerCase();
      leftValue = indicators[indicatorName] || 0;
    } else if (rule.left_type === 'price' || rule.left_type === 'PRICE') {
      leftValue = currentPrice;
    }

    // Get right side value  
    if (rule.right_type === 'value' || rule.right_type === 'VALUE') {
      rightValue = parseFloat(rule.right_value) || 0;
    } else if (rule.right_type === 'indicator' || rule.right_type === 'INDICATOR') {
      const indicatorName = rule.right_indicator?.toLowerCase();
      rightValue = indicators[indicatorName] || 0;
    }

    // Map different condition formats and evaluate
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
        console.warn(`[Monitor] Unknown condition: ${condition}`);
        return false;
    }
  } catch (error) {
    console.error('[Monitor] Error evaluating rule:', error);
    return false;
  }
}

// Enhanced notification sending with retry logic and better error handling
async function sendNotification(supabase: any, strategyId: string, signalType: string, signalData: any) {
  try {
    console.log(`[Monitor] Processing notification for ${signalType} signal on strategy ${strategyId}`);
    
    const isPro = signalData.isPro;
    const userId = signalData.userId;
    
    if (!isPro) {
      console.log(`[Monitor] User ${userId} is not Pro, notifications will only appear in app`);
      return;
    }
    
    console.log(`[Monitor] Sending external notifications for Pro user ${userId}`);
    
    // Get user notification settings
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!settings) {
      console.log(`[Monitor] No notification settings found for user ${userId}`);
      return;
    }

    console.log(`[Monitor] Notification settings for user ${userId}:`, {
      discord_enabled: settings.discord_enabled,
      telegram_enabled: settings.telegram_enabled,
      email_enabled: settings.email_enabled,
      has_discord_webhook: !!settings.discord_webhook_url,
      has_telegram_token: !!settings.telegram_bot_token,
      has_telegram_chat: !!settings.telegram_chat_id
    });

    // Send Discord notification if enabled with retry logic
    if (settings.discord_enabled && settings.discord_webhook_url) {
      try {
        console.log(`[Monitor] Sending Discord notification for strategy ${strategyId}`);
        const { data: discordResult, error: discordError } = await supabase.functions.invoke('send-discord-notification', {
          body: {
            webhookUrl: settings.discord_webhook_url,
            signalData: signalData,
            signalType: signalType
          }
        });
        
        if (discordError) {
          console.error(`[Monitor] Discord notification error:`, discordError);
          // Retry once after a delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          const { error: retryError } = await supabase.functions.invoke('send-discord-notification', {
            body: {
              webhookUrl: settings.discord_webhook_url,
              signalData: signalData,
              signalType: signalType
            }
          });
          if (retryError) {
            console.error(`[Monitor] Discord notification retry failed:`, retryError);
          } else {
            console.log(`[Monitor] Discord notification sent successfully on retry for strategy ${strategyId}`);
          }
        } else {
          console.log(`[Monitor] Discord notification sent successfully for strategy ${strategyId}`);
        }
      } catch (error) {
        console.error(`[Monitor] Failed to send Discord notification:`, error);
      }
    }

    // Send Telegram notification if enabled with retry logic
    if (settings.telegram_enabled && settings.telegram_bot_token && settings.telegram_chat_id) {
      try {
        console.log(`[Monitor] Sending Telegram notification for strategy ${strategyId}`);
        const { data: telegramResult, error: telegramError } = await supabase.functions.invoke('send-telegram-notification', {
          body: {
            botToken: settings.telegram_bot_token,
            chatId: settings.telegram_chat_id,
            signalData: signalData,
            signalType: signalType
          }
        });
        
        if (telegramError) {
          console.error(`[Monitor] Telegram notification error:`, telegramError);
          // Retry once after a delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          const { error: retryError } = await supabase.functions.invoke('send-telegram-notification', {
            body: {
              botToken: settings.telegram_bot_token,
              chatId: settings.telegram_chat_id,
              signalData: signalData,
              signalType: signalType
            }
          });
          if (retryError) {
            console.error(`[Monitor] Telegram notification retry failed:`, retryError);
          } else {
            console.log(`[Monitor] Telegram notification sent successfully on retry for strategy ${strategyId}`);
          }
        } else {
          console.log(`[Monitor] Telegram notification sent successfully for strategy ${strategyId}`);
        }
      } catch (error) {
        console.error(`[Monitor] Failed to send Telegram notification:`, error);
      }
    }

    // Send Email notification if enabled  
    if (settings.email_enabled) {
      try {
        // Get user email
        const { data: authUser } = await supabase.auth.admin.getUserById(userId);
        if (authUser?.user?.email) {
          console.log(`[Monitor] Sending Email notification for strategy ${strategyId}`);
          const { error: emailError } = await supabase.functions.invoke('send-email-notification', {
            body: {
              userEmail: authUser.user.email,
              signalData: signalData,
              signalType: signalType
            }
          });
          
          if (emailError) {
            console.error(`[Monitor] Email notification error:`, emailError);
          } else {
            console.log(`[Monitor] Email notification sent successfully for strategy ${strategyId}`);
          }
        }
      } catch (error) {
        console.error(`[Monitor] Failed to send Email notification:`, error);
      }
    }
    
  } catch (error) {
    console.error(`[Monitor] Error sending notification for strategy ${strategyId}:`, error);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== Trading Signal Monitor Started ===');
  console.log('Request method:', req.method);
  console.log('Current time:', new Date().toISOString());

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Parse request body
    let isManual = false;
    let requestedTimeframes: string[] = [];
    
    try {
      if (req.body) {
        const body = await req.json();
        isManual = body.manual === true;
        requestedTimeframes = body.timeframes || [];
      }
    } catch (e) {
      // Body parsing failed, assume it's a cron job
    }

    console.log(`[Monitor] Signal monitoring triggered by: ${isManual ? 'manual' : 'cron_job'}, timeframes: ${requestedTimeframes.length > 0 ? requestedTimeframes.join(', ') : 'all'}`);

    // Check market status for regular cron jobs (allow manual triggers anytime for testing)
    if (!isManual) {
      console.log('[Monitor] Checking market status...');
      if (!isMarketOpen()) {
        // For daily strategies, still check at market close even if market is "closed"
        const isDailyCloseTime = isMarketCloseTime();
        if (!isDailyCloseTime) {
          console.log('[Monitor] Market is closed and not market close time - no signal monitoring needed');
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Market closed - no monitoring performed',
              timestamp: new Date().toISOString()
            }), 
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          );
        } else {
          console.log('[Monitor] Market close time detected - checking daily strategies');
          requestedTimeframes = ['Daily'];
        }
      }
    }

    console.log('[Monitor] Starting timeframe-based signal monitoring with REAL market data only...');
    
    // Get strategies that need evaluation based on timeframe - THIS IS THE KEY FIX
    const strategies = await getStrategiesForEvaluation(supabase, requestedTimeframes);

    if (!strategies || strategies.length === 0) {
      const message = requestedTimeframes.length > 0 
        ? `No strategies found for timeframes: ${requestedTimeframes.join(', ')}`
        : 'No strategies need evaluation at this time';
        
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: message,
          signalsGenerated: 0,
          timestamp: new Date().toISOString()
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Group strategies by timeframe for optimized processing
    const strategiesByTimeframe = strategies.reduce((acc, strategy) => {
      const timeframe = strategy.timeframe;
      if (!acc[timeframe]) acc[timeframe] = [];
      acc[timeframe].push(strategy);
      return acc;
    }, {} as Record<string, any[]>);

    console.log(`[Monitor] Processing strategies by timeframe:`, 
      Object.entries(strategiesByTimeframe).map(([tf, strats]) => `${tf}: ${strats.length}`).join(', ')
    );

    // Process strategies in smaller batches to respect API rate limits
    const BATCH_SIZE = 2; // Reduced batch size for better rate limit management
    let totalSignalsGenerated = 0;
    let strategiesProcessed = 0;
    let strategiesSkipped = 0;
    
    // Process each timeframe separately
    for (const [timeframe, timeframeStrategies] of Object.entries(strategiesByTimeframe)) {
      console.log(`[Monitor] Processing ${timeframeStrategies.length} strategies for timeframe: ${timeframe}`);
      
      for (let i = 0; i < timeframeStrategies.length; i += BATCH_SIZE) {
        const batch = timeframeStrategies.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(strategy => 
          evaluateStrategy(supabase, strategy.id, strategy)
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            if (result.value > 0) {
              totalSignalsGenerated += result.value;
              strategiesProcessed++;
            } else {
              strategiesSkipped++;
            }
          } else {
            console.error(`[Monitor] Error processing strategy ${batch[index].id}:`, result.reason);
            strategiesSkipped++;
          }
        });
        
        // Add delay between batches to respect API rate limits (increased delay)
        if (i + BATCH_SIZE < timeframeStrategies.length) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
        }
      }
      
      // Add delay between timeframes
      const timeframeKeys = Object.keys(strategiesByTimeframe);
      if (timeframe !== timeframeKeys[timeframeKeys.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between timeframes
      }
    }

    const message = `Timeframe-based monitoring completed. Generated ${totalSignalsGenerated} signals from ${strategiesProcessed} strategies (${strategiesSkipped} skipped).`;
    console.log(`[Monitor] ${message}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message,
        strategiesProcessed: strategiesProcessed,
        strategiesSkipped: strategiesSkipped,
        signalsGenerated: totalSignalsGenerated,
        timeframesProcessed: Object.keys(strategiesByTimeframe),
        timestamp: new Date().toISOString()
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[Monitor] Error in signal monitoring:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

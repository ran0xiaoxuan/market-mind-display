
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Local Technical Indicators Implementation
const calculateSMA = (data: number[], period: number): number[] => {
  const result: number[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }
  return result;
};

const calculateEMA = (data: number[], period: number): number[] => {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(ema);
  
  for (let i = period; i < data.length; i++) {
    ema = (data[i] * multiplier) + (ema * (1 - multiplier));
    result.push(ema);
  }
  return result;
};

const calculateRSI = (data: number[], period: number = 14): number[] => {
  const result: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period - 1; i < gains.length; i++) {
    if (i === period - 1) {
      const rs = avgGain / avgLoss;
      result.push(100 - (100 / (1 + rs)));
    } else {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
      const rs = avgGain / avgLoss;
      result.push(100 - (100 / (1 + rs)));
    }
  }
  return result;
};

const calculateMACD = (data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) => {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  
  const macd: number[] = [];
  const startIndex = slowPeriod - fastPeriod;
  
  for (let i = 0; i < fastEMA.length - startIndex; i++) {
    macd.push(fastEMA[i + startIndex] - slowEMA[i]);
  }
  
  const signal = calculateEMA(macd, signalPeriod);
  const histogram: number[] = [];
  const signalStartIndex = signalPeriod - 1;
  
  for (let i = 0; i < signal.length; i++) {
    histogram.push(macd[i + signalStartIndex] - signal[i]);
  }
  
  return { macd, signal, histogram };
};

// Market hours check (US Eastern Time)
const isMarketHours = () => {
  const now = new Date();
  const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const hour = easternTime.getHours();
  const day = easternTime.getDay();
  const minute = easternTime.getMinutes();
  
  const timeInMinutes = hour * 60 + minute;
  return day >= 1 && day <= 5 && timeInMinutes >= 570 && timeInMinutes < 960;
};

// Get current market price using FMP API
const getCurrentPrice = async (symbol: string): Promise<number | null> => {
  try {
    const fmpApiKey = Deno.env.get('FMP_API_KEY');
    if (!fmpApiKey) {
      console.error('[PriceService] FMP API key not configured');
      return null;
    }

    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${fmpApiKey}`
    );

    if (!response.ok) {
      console.error(`[PriceService] FMP API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error(`[PriceService] No price data for ${symbol}`);
      return null;
    }

    const price = data[0].price;
    console.log(`[PriceService] Current price for ${symbol}: $${price}`);
    return price;
  } catch (error) {
    console.error(`[PriceService] Error fetching price for ${symbol}:`, error);
    return null;
  }
};

// Fetch historical data from FMP API
const fetchMarketData = async (symbol: string, timeframe: string): Promise<any[]> => {
  try {
    const fmpApiKey = Deno.env.get('FMP_API_KEY');
    if (!fmpApiKey) {
      console.error('[MarketData] FMP API key not configured');
      return [];
    }

    const timeframeMap: { [key: string]: string } = {
      '1h': '1hour',
      '4h': '4hour', 
      'Daily': '1day',
      'Weekly': '1week',
      'Monthly': '1month'
    };
    
    const fmpInterval = timeframeMap[timeframe] || '1day';
    let endpoint: string;
    
    if (['1hour', '4hour'].includes(fmpInterval)) {
      endpoint = `https://financialmodelingprep.com/api/v3/historical-chart/${fmpInterval}/${symbol}?apikey=${fmpApiKey}`;
    } else {
      endpoint = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${fmpApiKey}`;
    }

    console.log(`[MarketData] Fetching data for ${symbol} with timeframe ${timeframe}`);
    
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      console.error(`[MarketData] FMP API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    let marketData: any[] = [];
    
    if (fmpInterval === '1day' || fmpInterval === '1week' || fmpInterval === '1month') {
      if (data.historical && Array.isArray(data.historical)) {
        marketData = data.historical.slice(0, 200).reverse();
      }
    } else {
      if (Array.isArray(data)) {
        marketData = data.slice(0, 200).reverse();
      }
    }

    console.log(`[MarketData] Successfully fetched ${marketData.length} data points for ${symbol}`);
    return marketData;

  } catch (error) {
    console.error(`[MarketData] Error fetching data for ${symbol}:`, error);
    return [];
  }
};

// Calculate indicator locally instead of using TAAPI
const getLocalIndicator = async (indicator: string, symbol: string, timeframe: string, parameters: any = {}): Promise<any> => {
  try {
    console.log(`[LocalIndicator] Calculating ${indicator} for ${symbol} with timeframe ${timeframe}`);
    
    const marketData = await fetchMarketData(symbol, timeframe);
    if (marketData.length === 0) {
      console.error(`[LocalIndicator] No market data available for ${symbol}`);
      return null;
    }

    const closes = marketData.map(d => parseFloat(d.close));
    const highs = marketData.map(d => parseFloat(d.high));
    const lows = marketData.map(d => parseFloat(d.low));
    
    switch (indicator.toLowerCase()) {
      case 'rsi':
        const rsiPeriod = parseInt(parameters.period) || 14;
        const rsiResult = calculateRSI(closes, rsiPeriod);
        return { value: rsiResult[rsiResult.length - 1] };
        
      case 'sma':
        const smaPeriod = parseInt(parameters.period) || 14;
        const smaResult = calculateSMA(closes, smaPeriod);
        return { value: smaResult[smaResult.length - 1] };
        
      case 'ema':
        const emaPeriod = parseInt(parameters.period) || 14;
        const emaResult = calculateEMA(closes, emaPeriod);
        return { value: emaResult[emaResult.length - 1] };
        
      case 'macd':
        const fastPeriod = parseInt(parameters.fastPeriod) || 12;
        const slowPeriod = parseInt(parameters.slowPeriod) || 26;
        const signalPeriod = parseInt(parameters.signalPeriod) || 9;
        const macdResult = calculateMACD(closes, fastPeriod, slowPeriod, signalPeriod);
        return {
          valueMACD: macdResult.macd[macdResult.macd.length - 1],
          valueSignal: macdResult.signal[macdResult.signal.length - 1],
          valueHistogram: macdResult.histogram[macdResult.histogram.length - 1]
        };
        
      default:
        console.error(`[LocalIndicator] Unsupported indicator: ${indicator}`);
        return null;
    }
  } catch (error) {
    console.error(`[LocalIndicator] Error calculating ${indicator} for ${symbol}:`, error);
    return null;
  }
};

// Extract value from indicator response (updated for local calculations)
const getIndicatorValue = (indicator: string, data: any, valueType?: string): number | null => {
  if (!data) return null;

  try {
    switch (indicator.toLowerCase()) {
      case 'rsi':
      case 'sma':
      case 'ema':
        return data.value || null;
      case 'macd':
        if (valueType === 'signal') return data.valueSignal || null;
        if (valueType === 'histogram') return data.valueHistogram || null;
        return data.valueMACD || null;
      default:
        return data.value || null;
    }
  } catch (error) {
    console.error(`[IndicatorValue] Error extracting value from ${indicator}:`, error);
    return null;
  }
};

// Evaluate a single trading rule condition using local indicators
const evaluateCondition = async (
  rule: any,
  asset: string,
  currentPrice: number,
  timeframe: string
): Promise<boolean> => {
  try {
    console.log(`[ConditionEval] Evaluating rule:`, JSON.stringify(rule, null, 2));

    // Get left side value
    let leftValue: number | null = null;
    if (rule.left_type === 'PRICE') {
      leftValue = currentPrice;
    } else if (rule.left_type === 'VALUE') {
      leftValue = parseFloat(rule.left_value);
    } else if (rule.left_type === 'INDICATOR') {
      if (!rule.left_indicator) {
        console.error('[ConditionEval] Left indicator not specified');
        return false;
      }
      
      let cleanParameters = {};
      if (rule.left_parameters && typeof rule.left_parameters === 'object') {
        Object.keys(rule.left_parameters).forEach(key => {
          const value = rule.left_parameters[key];
          if (typeof value === 'string' || typeof value === 'number') {
            cleanParameters[key] = value;
          }
        });
      }
      
      const indicatorData = await getLocalIndicator(
        rule.left_indicator.toLowerCase(),
        asset,
        timeframe,
        cleanParameters
      );
      
      leftValue = getIndicatorValue(
        rule.left_indicator,
        indicatorData,
        rule.left_value_type
      );
    }

    // Get right side value
    let rightValue: number | null = null;
    if (rule.right_type === 'PRICE') {
      rightValue = currentPrice;
    } else if (rule.right_type === 'VALUE') {
      rightValue = parseFloat(rule.right_value);
    } else if (rule.right_type === 'INDICATOR') {
      if (!rule.right_indicator) {
        console.error('[ConditionEval] Right indicator not specified');
        return false;
      }
      
      let cleanParameters = {};
      if (rule.right_parameters && typeof rule.right_parameters === 'object') {
        Object.keys(rule.right_parameters).forEach(key => {
          const value = rule.right_parameters[key];
          if (typeof value === 'string' || typeof value === 'number') {
            cleanParameters[key] = value;
          }
        });
      }
      
      const indicatorData = await getLocalIndicator(
        rule.right_indicator.toLowerCase(),
        asset,
        timeframe,
        cleanParameters
      );
      
      rightValue = getIndicatorValue(
        rule.right_indicator,
        indicatorData,
        rule.right_value_type
      );
    }

    if (leftValue === null || rightValue === null) {
      console.log(`[ConditionEval] Null values - Left: ${leftValue}, Right: ${rightValue}`);
      return false;
    }

    console.log(`[ConditionEval] Comparing: ${leftValue} ${rule.condition} ${rightValue}`);

    // Evaluate condition
    switch (rule.condition) {
      case 'GREATER_THAN':
      case '>':
        return leftValue > rightValue;
      case 'LESS_THAN':
      case '<':
        return leftValue < rightValue;
      case 'GREATER_THAN_OR_EQUAL':
      case '>=':
        return leftValue >= rightValue;
      case 'LESS_THAN_OR_EQUAL':
      case '<=':
        return leftValue <= rightValue;
      case 'EQUAL':
      case '==':
        return Math.abs(leftValue - rightValue) < 0.0001;
      case 'NOT_EQUAL':
      case '!=':
        return Math.abs(leftValue - rightValue) >= 0.0001;
      default:
        console.error(`[ConditionEval] Unknown condition: ${rule.condition}`);
        return false;
    }
  } catch (error) {
    console.error('[ConditionEval] Error evaluating condition:', error);
    return false;
  }
};

// Evaluate rule groups for signal generation with improved error handling
const evaluateRuleGroups = async (
  ruleGroups: any[],
  asset: string,
  currentPrice: number,
  timeframe: string
): Promise<{ signalGenerated: boolean; details: string[] }> => {
  try {
    console.log(`[RuleGroupEval] Evaluating ${ruleGroups.length} rule groups`);
    
    const details: string[] = [];
    
    // Separate AND and OR groups
    const andGroups = ruleGroups.filter(group => group.logic === 'AND');
    const orGroups = ruleGroups.filter(group => group.logic === 'OR');

    console.log(`[RuleGroupEval] Found ${andGroups.length} AND groups and ${orGroups.length} OR groups`);

    let allAndGroupsSatisfied = true;
    let allOrGroupsSatisfied = true;

    // Evaluate AND groups - all must be satisfied
    for (const andGroup of andGroups) {
      if (!andGroup.trading_rules || andGroup.trading_rules.length === 0) {
        details.push(`AND Group ${andGroup.id}: No rules defined`);
        continue;
      }
      
      let allConditionsMet = true;
      let conditionsMetCount = 0;
      
      for (const rule of andGroup.trading_rules) {
        const conditionMet = await evaluateCondition(rule, asset, currentPrice, timeframe);
        if (conditionMet) {
          conditionsMetCount++;
        } else {
          allConditionsMet = false;
        }
      }
      
      details.push(`AND Group ${andGroup.id}: ${conditionsMetCount}/${andGroup.trading_rules.length} conditions met`);
      
      if (!allConditionsMet) {
        allAndGroupsSatisfied = false;
        console.log(`[RuleGroupEval] AND group ${andGroup.id} failed`);
      }
    }

    // Evaluate OR groups - each must meet required conditions
    for (const orGroup of orGroups) {
      if (!orGroup.trading_rules || orGroup.trading_rules.length === 0) {
        details.push(`OR Group ${orGroup.id}: No rules defined`);
        continue;
      }
      
      let conditionsMetCount = 0;
      
      for (const rule of orGroup.trading_rules) {
        const conditionMet = await evaluateCondition(rule, asset, currentPrice, timeframe);
        if (conditionMet) {
          conditionsMetCount++;
        }
      }
      
      const requiredConditions = orGroup.required_conditions || 1;
      details.push(`OR Group ${orGroup.id}: ${conditionsMetCount}/${orGroup.trading_rules.length} conditions met (required: ${requiredConditions})`);
      
      if (conditionsMetCount < requiredConditions) {
        allOrGroupsSatisfied = false;
        console.log(`[RuleGroupEval] OR group ${orGroup.id} failed`);
      }
    }

    const signalGenerated = allAndGroupsSatisfied && allOrGroupsSatisfied;
    console.log(`[RuleGroupEval] Final result: AND=${allAndGroupsSatisfied}, OR=${allOrGroupsSatisfied}, Signal=${signalGenerated}`);

    return { signalGenerated, details };
  } catch (error) {
    console.error('[RuleGroupEval] Error evaluating rule groups:', error);
    return { signalGenerated: false, details: [`Error: ${error.message}`] };
  }
};

// Generate signal for a specific strategy with improved rate limiting
const generateSignalForStrategy = async (
  strategyId: string,
  userId: string,
  supabaseClient: any
) => {
  try {
    console.log(`[SignalGen] Starting signal generation for strategy: ${strategyId}`);

    // Get strategy with complete rule structure
    const { data: strategy, error: strategyError } = await supabaseClient
      .from('strategies')
      .select(`
        *,
        rule_groups(
          id,
          rule_type,
          logic,
          group_order,
          required_conditions,
          trading_rules(
            id,
            inequality_order,
            left_type,
            left_indicator,
            left_parameters,
            left_value,
            left_value_type,
            condition,
            right_type,
            right_indicator,
            right_parameters,
            right_value,
            right_value_type
          )
        )
      `)
      .eq('id', strategyId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (strategyError || !strategy) {
      console.log(`[SignalGen] Strategy not found: ${strategyError?.message}`);
      return {
        signalGenerated: false,
        reason: 'Strategy not found or inactive'
      };
    }

    console.log(`[SignalGen] Found strategy: ${strategy.name} for ${strategy.target_asset}`);

    // Check daily signal limit
    const today = new Date().toISOString().split('T')[0];
    const { data: signalCount } = await supabaseClient
      .from('trading_signals')
      .select('id', { count: 'exact' })
      .eq('strategy_id', strategyId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    const dailyLimit = strategy.daily_signal_limit || 5;
    if (signalCount && signalCount.length >= dailyLimit) {
      console.log(`[SignalGen] Daily limit reached: ${signalCount.length}/${dailyLimit}`);
      return {
        signalGenerated: false,
        reason: `Daily limit reached (${signalCount.length}/${dailyLimit})`
      };
    }

    // Get current market price
    const currentPrice = await getCurrentPrice(strategy.target_asset);
    if (!currentPrice) {
      console.log(`[SignalGen] Failed to get price for ${strategy.target_asset}`);
      return {
        signalGenerated: false,
        reason: `Failed to get current price for ${strategy.target_asset}`
      };
    }

    console.log(`[SignalGen] Current price for ${strategy.target_asset}: $${currentPrice}`);

    // Organize rules by type
    const entryRules = strategy.rule_groups?.filter((rg: any) => rg.rule_type === 'entry') || [];
    const exitRules = strategy.rule_groups?.filter((rg: any) => rg.rule_type === 'exit') || [];

    console.log(`[SignalGen] Found ${entryRules.length} entry rule groups and ${exitRules.length} exit rule groups`);

    if (entryRules.length === 0 && exitRules.length === 0) {
      return {
        signalGenerated: false,
        reason: 'No trading rules defined'
      };
    }

    // Map timeframe to TAAPI interval
    const timeframeMap = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '30m': '30m',
      '1h': '1h',
      '4h': '4h',
      'Daily': '1d',
      'Weekly': '1w',
      'Monthly': '1M'
    };
    const taapiInterval = timeframeMap[strategy.timeframe] || '1d';

    // Evaluate entry rules first with rate limiting consideration
    let signalType: 'entry' | 'exit' | null = null;
    let evaluationDetails: string[] = [];
    
    if (entryRules.length > 0) {
      console.log(`[SignalGen] Evaluating entry rules with rate limiting...`);
      const entryEvaluation = await evaluateRuleGroups(
        entryRules,
        strategy.target_asset,
        currentPrice,
        taapiInterval
      );
      
      evaluationDetails.push('Entry Rules:', ...entryEvaluation.details);
      
      if (entryEvaluation.signalGenerated) {
        signalType = 'entry';
        console.log(`[SignalGen] ✓ Entry signal generated`);
      } else {
        console.log(`[SignalGen] ✗ Entry signal conditions not met`);
      }
    }

    // If no entry signal, check exit rules
    if (!signalType && exitRules.length > 0) {
      console.log(`[SignalGen] Evaluating exit rules...`);
      const exitEvaluation = await evaluateRuleGroups(
        exitRules,
        strategy.target_asset,
        currentPrice,
        taapiInterval
      );
      
      evaluationDetails.push('Exit Rules:', ...exitEvaluation.details);
      
      if (exitEvaluation.signalGenerated) {
        signalType = 'exit';
        console.log(`[SignalGen] ✓ Exit signal generated`);
      } else {
        console.log(`[SignalGen] ✗ Exit signal conditions not met`);
      }
    }

    if (!signalType) {
      console.log(`[SignalGen] No signal conditions met`);
      return {
        signalGenerated: false,
        reason: 'Market conditions do not meet rule criteria',
        evaluationDetails
      };
    }

    // Create signal
    const signalData = {
      strategyId: strategyId,
      strategyName: strategy.name,
      targetAsset: strategy.target_asset,
      price: currentPrice,
      userId: userId,
      timestamp: new Date().toISOString(),
      timeframe: strategy.timeframe,
      reason: `${signalType} signal generated - conditions met`,
      evaluationDetails
    };

    const { data: signal, error: signalError } = await supabaseClient
      .from('trading_signals')
      .insert({
        strategy_id: strategyId,
        signal_type: signalType,
        signal_data: signalData,
        processed: false
      })
      .select()
      .single();

    if (signalError) {
      console.error(`[SignalGen] Error creating signal:`, signalError);
      return {
        signalGenerated: false,
        reason: `Failed to create signal: ${signalError.message}`
      };
    }

    console.log(`[SignalGen] ✓ Signal created successfully: ${signal.id}`);
    return {
      signalGenerated: true,
      signalId: signal.id,
      signalType: signalType,
      reason: `${signalType} signal generated`,
      evaluationDetails
    };

  } catch (error) {
    console.error(`[SignalGen] Error:`, error);
    return {
      signalGenerated: false,
      reason: `Error: ${error.message}`
    };
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('[Monitor] Starting trading signal monitoring with local indicators...');

    // Check if market is open (allow manual override for testing)
    const body = await req.json().catch(() => ({}));
    const isManualTrigger = body?.manual === true;
    
    if (!isMarketHours() && !isManualTrigger) {
      console.log('[Monitor] Market is closed, skipping signal generation');
      return new Response(
        JSON.stringify({ message: 'Market is closed, no signals generated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all active strategies that have trading rules and notifications enabled
    const { data: strategies, error: strategiesError } = await supabaseClient
      .from('strategies')
      .select(`
        id,
        name,
        user_id,
        target_asset,
        timeframe,
        daily_signal_limit,
        is_active,
        signal_notifications_enabled,
        rule_groups!inner(
          id,
          rule_type,
          logic,
          required_conditions,
          trading_rules!inner(id)
        )
      `)
      .eq('is_active', true)
      .eq('signal_notifications_enabled', true);

    if (strategiesError) {
      console.error('[Monitor] Error fetching strategies:', strategiesError);
      throw strategiesError;
    }

    if (!strategies || strategies.length === 0) {
      console.log('[Monitor] No active strategies with notifications enabled found');
      return new Response(
        JSON.stringify({ message: 'No active strategies found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Monitor] Found ${strategies.length} active strategies to monitor`);

    const results = [];

    // Process each strategy with rate limiting
    for (const strategy of strategies) {
      try {
        console.log(`[Monitor] Processing strategy: ${strategy.name} (${strategy.id}) with rate limits`);

        // Check if strategy has valid trading rules
        const hasRules = strategy.rule_groups?.some((rg: any) => 
          rg.trading_rules && rg.trading_rules.length > 0
        );

        if (!hasRules) {
          console.log(`[Monitor] Skipping strategy ${strategy.name}: No trading rules defined`);
          results.push({
            strategyId: strategy.id,
            strategyName: strategy.name,
            status: 'skipped',
            reason: 'No trading rules defined'
          });
          continue;
        }

        // Generate signal using the enhanced service with rate limiting
        const signalResult = await generateSignalForStrategy(strategy.id, strategy.user_id, supabaseClient);
        
        results.push({
          strategyId: strategy.id,
          strategyName: strategy.name,
          targetAsset: strategy.target_asset,
          timeframe: strategy.timeframe,
          status: signalResult.signalGenerated ? 'signal_generated' : 'no_signal',
          reason: signalResult.reason,
          signalId: signalResult.signalId,
          signalType: signalResult.signalType,
          evaluationDetails: signalResult.evaluationDetails || []
        });

        // If signal was generated, send notifications
        if (signalResult.signalGenerated && signalResult.signalId) {
          console.log(`[Monitor] Signal generated for ${strategy.name}, sending notifications...`);
          
          try {
            const notificationResponse = await supabaseClient.functions.invoke('send-notifications', {
              body: {
                signalId: signalResult.signalId,
                userId: strategy.user_id,
                signalType: signalResult.signalType
              }
            });

            if (notificationResponse.error) {
              console.error('[Monitor] Notification error:', notificationResponse.error);
            } else {
              console.log('[Monitor] Notifications sent successfully');
            }
          } catch (notificationError) {
            console.error('[Monitor] Error sending notifications:', notificationError);
          }
        }

      } catch (error) {
        console.error(`[Monitor] Error processing strategy ${strategy.id}:`, error);
        results.push({
          strategyId: strategy.id,
          strategyName: strategy.name,
          status: 'error',
          reason: error.message
        });
      }
    }

    const signalsGenerated = results.filter(r => r.status === 'signal_generated').length;
    console.log(`[Monitor] Signal monitoring completed. Generated ${signalsGenerated} signals from ${results.length} strategies`);

    return new Response(
      JSON.stringify({
        message: 'Signal monitoring completed with local indicators',
        processedStrategies: 0,
        signalsGenerated: 0,
        results: [],
        timestamp: new Date().toISOString(),
        marketOpen: isMarketHours(),
        manualTrigger: isManualTrigger,
        useLocalIndicators: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[Monitor] Error in monitor-trading-signals:', error);
    return new Response(
      JSON.stringify({ 
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

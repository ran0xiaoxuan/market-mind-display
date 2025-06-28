
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== Trading Signal Monitor Started ===');
  console.log('Request method:', req.method);
  console.log('Current time:', new Date().toISOString());

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json().catch(() => ({}));
    const { manual = false, timeframes = [], source = 'cron_job' } = body;

    console.log(`[Monitor] Signal monitoring triggered by: ${source}, timeframes: ${timeframes.length > 0 ? timeframes.join(',') : 'all'}`);

    // Check market status
    console.log('[Monitor] Checking market status...');
    const now = new Date();
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    console.log(`Market check - Eastern Time: ${easternTime.toLocaleString()}, Hour: ${easternTime.getHours()}, Minutes: ${easternTime.getMinutes()}`);
    
    const dayOfWeek = easternTime.getDay();
    const hour = easternTime.getHours();
    const minute = easternTime.getMinutes();
    const timeInMinutes = hour * 60 + minute;
    
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const isMarketHours = timeInMinutes >= 570 && timeInMinutes < 960; // 9:30 AM to 4:00 PM EST
    
    console.log(`Market status - Weekday: ${isWeekday}, Market hours: ${isMarketHours}, Time in minutes: ${timeInMinutes}`);

    // Get ALL active strategies regardless of market hours for debugging
    console.log('[Monitor] Fetching ALL active strategies for analysis...');
    const { data: allStrategies, error: strategiesError } = await supabase
      .from('strategies')
      .select(`
        id,
        name,
        user_id,
        target_asset,
        timeframe,
        is_active,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (strategiesError) {
      console.error('[Monitor] Error fetching strategies:', strategiesError);
      throw strategiesError;
    }

    console.log(`[Monitor] Found ${allStrategies?.length || 0} active strategies total`);
    
    // Log each strategy for debugging
    if (allStrategies) {
      for (const strategy of allStrategies) {
        console.log(`[Strategy Debug] ID: ${strategy.id}, Name: "${strategy.name}", Asset: ${strategy.target_asset}, Timeframe: ${strategy.timeframe}, User: ${strategy.user_id}`);
        
        // Check if this strategy has evaluation records
        const { data: evalData } = await supabase
          .from('strategy_evaluations')
          .select('*')
          .eq('strategy_id', strategy.id)
          .single();
        
        console.log(`[Strategy Debug] Evaluation record exists: ${!!evalData}, Last evaluated: ${evalData?.last_evaluated_at || 'Never'}, Next due: ${evalData?.next_evaluation_due || 'Not set'}`);
        
        // Check if this strategy has rule groups
        const { data: ruleGroups } = await supabase
          .from('rule_groups')
          .select('id, rule_type, logic')
          .eq('strategy_id', strategy.id);
        
        console.log(`[Strategy Debug] Rule groups: ${ruleGroups?.length || 0}`);
        
        if (ruleGroups) {
          for (const group of ruleGroups) {
            const { data: rules } = await supabase
              .from('trading_rules')
              .select('id, left_type, left_indicator, condition, right_type, right_value')
              .eq('rule_group_id', group.id);
            
            console.log(`[Strategy Debug] Group ${group.id} (${group.rule_type}): ${rules?.length || 0} rules`);
          }
        }
      }
    }

    if (!manual && (!isWeekday || !isMarketHours)) {
      // Special handling for daily/weekly/monthly strategies during market close
      const isMarketCloseWindow = hour === 16 && minute >= 0 && minute < 5; // 4:00-4:05 PM ET
      const isFridayClose = dayOfWeek === 5 && isMarketCloseWindow;
      
      if (!isMarketCloseWindow && !isFridayClose) {
        console.log('[Monitor] Market is closed and not a special evaluation time - no signal monitoring needed');
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Market closed - no monitoring needed',
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get strategies that need evaluation
    const strategiesForEvaluation = await getStrategiesForEvaluation(supabase, timeframes, manual);
    console.log(`[Monitor] Strategies selected for evaluation: ${strategiesForEvaluation.length}`);

    if (strategiesForEvaluation.length === 0) {
      console.log('[Monitor] No strategies need evaluation at this time');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No strategies due for evaluation',
          timestamp: new Date().toISOString(),
          totalStrategies: allStrategies?.length || 0,
          strategiesEvaluated: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process each strategy
    let evaluatedCount = 0;
    let signalsGenerated = 0;
    const results = [];

    for (const strategy of strategiesForEvaluation) {
      try {
        console.log(`[Monitor] Processing strategy: ${strategy.name} (${strategy.id})`);
        
        const result = await evaluateStrategy(supabase, strategy);
        results.push(result);
        evaluatedCount++;
        
        if (result.signalGenerated) {
          signalsGenerated++;
          console.log(`[Monitor] ✅ Signal generated for strategy: ${strategy.name}`);
        } else {
          console.log(`[Monitor] ❌ No signal for strategy: ${strategy.name} - ${result.reason}`);
        }

        // Update strategy evaluation record
        await updateStrategyEvaluation(supabase, strategy);
        
        // Small delay between API calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`[Monitor] Error processing strategy ${strategy.name}:`, error);
        results.push({
          strategyId: strategy.id,
          strategyName: strategy.name,
          signalGenerated: false,
          error: error.message,
          reason: 'Processing error'
        });
      }
    }

    console.log(`[Monitor] Evaluation complete - Processed: ${evaluatedCount}, Signals: ${signalsGenerated}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Evaluated ${evaluatedCount} strategies, generated ${signalsGenerated} signals`,
        timestamp: new Date().toISOString(),
        totalStrategies: allStrategies?.length || 0,
        strategiesEvaluated: evaluatedCount,
        signalsGenerated,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function getStrategiesForEvaluation(supabase: any, specificTimeframes: string[] = [], manual: boolean = false) {
  try {
    console.log('[Monitor] Getting strategies for evaluation...');
    
    // Get all active strategies with their evaluation data
    let query = supabase
      .from('strategies')
      .select(`
        id,
        name,
        user_id,
        target_asset,
        timeframe,
        is_active,
        strategy_evaluations!left (
          last_evaluated_at,
          next_evaluation_due,
          evaluation_count
        )
      `)
      .eq('is_active', true);

    if (specificTimeframes.length > 0) {
      query = query.in('timeframe', specificTimeframes);
    }

    const { data: strategies, error } = await query;

    if (error) {
      console.error('[Monitor] Error fetching strategies:', error);
      throw error;
    }

    if (!strategies || strategies.length === 0) {
      console.log('[Monitor] No active strategies found');
      return [];
    }

    console.log(`[Monitor] Found ${strategies.length} active strategies, filtering for evaluation...`);

    const strategiesForEvaluation = [];
    const now = new Date();

    for (const strategy of strategies) {
      const evaluation = strategy.strategy_evaluations?.[0];
      
      console.log(`[Monitor] Checking strategy "${strategy.name}" (${strategy.timeframe})`);
      console.log(`[Monitor] Last evaluated: ${evaluation?.last_evaluated_at || 'Never'}`);
      console.log(`[Monitor] Next due: ${evaluation?.next_evaluation_due || 'Not set'}`);
      console.log(`[Monitor] Manual trigger: ${manual}`);

      if (manual) {
        console.log(`[Monitor] ✅ Including strategy "${strategy.name}" - manual trigger`);
        strategiesForEvaluation.push(strategy);
        continue;
      }

      // Check if strategy should be evaluated based on timeframe
      const shouldEvaluate = shouldEvaluateStrategy(
        strategy.timeframe,
        evaluation?.last_evaluated_at ? new Date(evaluation.last_evaluated_at) : null,
        evaluation?.next_evaluation_due ? new Date(evaluation.next_evaluation_due) : null
      );

      if (shouldEvaluate) {
        console.log(`[Monitor] ✅ Including strategy "${strategy.name}" - due for evaluation`);
        strategiesForEvaluation.push(strategy);
      } else {
        console.log(`[Monitor] ⏭️ Skipping strategy "${strategy.name}" - not due yet`);
      }
    }

    console.log(`[Monitor] Selected ${strategiesForEvaluation.length} strategies for evaluation`);
    return strategiesForEvaluation;

  } catch (error) {
    console.error('[Monitor] Error in getStrategiesForEvaluation:', error);
    throw error;
  }
}

function shouldEvaluateStrategy(
  timeframe: string,
  lastEvaluated: Date | null,
  nextDue: Date | null
): boolean {
  const now = new Date();
  const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  
  console.log(`[Evaluation Check] Timeframe: ${timeframe}, Now: ${easternTime.toISOString()}`);
  
  // If never evaluated, evaluate now
  if (!lastEvaluated) {
    console.log('[Evaluation Check] Never evaluated - should evaluate');
    return true;
  }
  
  // If we have a next due date and it's past due, evaluate
  if (nextDue && now >= nextDue) {
    console.log('[Evaluation Check] Past due date - should evaluate');
    return true;
  }
  
  // If no next due date, calculate based on timeframe and last evaluation
  if (!nextDue) {
    const nextEvalTime = getNextEvaluationTime(timeframe, lastEvaluated);
    console.log(`[Evaluation Check] Calculated next eval time: ${nextEvalTime.toISOString()}`);
    
    if (now >= nextEvalTime) {
      console.log('[Evaluation Check] Past calculated time - should evaluate');
      return true;
    }
  }
  
  console.log('[Evaluation Check] Not due for evaluation');
  return false;
}

function getNextEvaluationTime(timeframe: string, currentTime: Date = new Date()): Date {
  const easternTime = new Date(currentTime.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const nextEval = new Date(easternTime);
  
  switch (timeframe) {
    case '1m':
      nextEval.setMinutes(nextEval.getMinutes() + 1);
      break;
    case '5m':
      const next5Min = Math.ceil(nextEval.getMinutes() / 5) * 5;
      nextEval.setMinutes(next5Min);
      nextEval.setSeconds(0, 0);
      break;
    case '15m':
      const next15Min = Math.ceil(nextEval.getMinutes() / 15) * 15;
      nextEval.setMinutes(next15Min);
      nextEval.setSeconds(0, 0);
      break;
    case '30m':
      const next30Min = Math.ceil(nextEval.getMinutes() / 30) * 30;
      nextEval.setMinutes(next30Min);
      nextEval.setSeconds(0, 0);
      break;
    case '1h':
      nextEval.setHours(nextEval.getHours() + 1);
      nextEval.setMinutes(0, 0, 0);
      break;
    case '4h':
      const next4Hour = Math.ceil(nextEval.getHours() / 4) * 4;
      nextEval.setHours(next4Hour);
      nextEval.setMinutes(0, 0, 0);
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
    case 'Monthly':
      // Last trading day of next month at 4:00 PM ET
      nextEval.setMonth(nextEval.getMonth() + 1);
      nextEval.setDate(1); // First day of next month
      nextEval.setDate(0); // Last day of current month (which is now next month)
      // Find last weekday
      while (nextEval.getDay() === 0 || nextEval.getDay() === 6) {
        nextEval.setDate(nextEval.getDate() - 1);
      }
      nextEval.setHours(16, 0, 0, 0);
      break;
    default:
      nextEval.setHours(nextEval.getHours() + 1);
  }
  
  return nextEval;
}

async function evaluateStrategy(supabase: any, strategy: any) {
  console.log(`[Evaluation] Starting evaluation for strategy: ${strategy.name}`);
  
  try {
    // Get rule groups for this strategy
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
      .eq('strategy_id', strategy.id)
      .order('group_order');

    if (rulesError || !ruleGroups || ruleGroups.length === 0) {
      console.log(`[Evaluation] No trading rules found for strategy ${strategy.name}`);
      return {
        strategyId: strategy.id,
        strategyName: strategy.name,
        signalGenerated: false,
        reason: 'No trading rules configured'
      };
    }

    console.log(`[Evaluation] Found ${ruleGroups.length} rule groups for strategy ${strategy.name}`);

    // Get real market data
    let priceData;
    let indicators = {};

    try {
      priceData = await getRealMarketData(supabase, strategy.target_asset);
      if (!priceData || priceData.price === 0) {
        console.error(`[Evaluation] No price data available for ${strategy.target_asset}`);
        return {
          strategyId: strategy.id,
          strategyName: strategy.name,
          signalGenerated: false,
          reason: 'No price data available'
        };
      }

      indicators = await getRealTechnicalIndicators(supabase, strategy.target_asset);
      if (!indicators || Object.keys(indicators).length === 0) {
        console.error(`[Evaluation] No technical indicators available for ${strategy.target_asset}`);
        return {
          strategyId: strategy.id,
          strategyName: strategy.name,
          signalGenerated: false,
          reason: 'No technical indicators available'
        };
      }

      console.log(`[Evaluation] Market data for ${strategy.target_asset}: Price $${priceData.price}, RSI: ${indicators.rsi}`);

    } catch (error) {
      console.error(`[Evaluation] Failed to get market data for ${strategy.target_asset}:`, error);
      return {
        strategyId: strategy.id,
        strategyName: strategy.name,
        signalGenerated: false,
        reason: `Market data error: ${error.message}`
      };
    }

    const currentPrice = priceData.price;

    // Evaluate entry and exit rules
    const entryRules = ruleGroups.filter(group => group.rule_type === 'entry');
    const exitRules = ruleGroups.filter(group => group.rule_type === 'exit');

    console.log(`[Evaluation] Entry rules: ${entryRules.length}, Exit rules: ${exitRules.length}`);

    // Check for entry signals
    const entrySignal = await shouldGenerateEntrySignal(entryRules, indicators, currentPrice);
    if (entrySignal.shouldGenerate) {
      const entryReason = `Entry signal - ${entrySignal.reason}`;
      console.log(`[Evaluation] Generating entry signal: ${entryReason}`);
      
      await generateTradingSignal(supabase, strategy.id, 'entry', {
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

      return {
        strategyId: strategy.id,
        strategyName: strategy.name,
        signalGenerated: true,
        signalType: 'entry',
        reason: entryReason
      };
    }

    // Check for exit signals
    const exitSignal = await shouldGenerateExitSignal(exitRules, indicators, currentPrice, strategy.id, supabase);
    if (exitSignal.shouldGenerate) {
      const exitReason = `Exit signal - ${exitSignal.reason}`;
      console.log(`[Evaluation] Generating exit signal: ${exitReason}`);
      
      await generateTradingSignal(supabase, strategy.id, 'exit', {
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

      return {
        strategyId: strategy.id,
        strategyName: strategy.name,
        signalGenerated: true,
        signalType: 'exit',
        reason: exitReason
      };
    }

    return {
      strategyId: strategy.id,
      strategyName: strategy.name,
      signalGenerated: false,
      reason: 'No entry or exit conditions met'
    };

  } catch (error) {
    console.error(`[Evaluation] Error evaluating strategy ${strategy.name}:`, error);
    return {
      strategyId: strategy.id,
      strategyName: strategy.name,
      signalGenerated: false,
      reason: `Evaluation error: ${error.message}`
    };
  }
}

async function shouldGenerateEntrySignal(entryRules: any[], indicators: any, currentPrice: number) {
  if (!entryRules.length) {
    return { shouldGenerate: false, reason: 'No entry rules configured' };
  }

  for (const group of entryRules) {
    const result = await evaluateRuleGroup(group, indicators, currentPrice);
    if (result.conditionsMet) {
      return { 
        shouldGenerate: true, 
        reason: `${result.description} (${result.metConditions}/${result.totalConditions} conditions met)`
      };
    }
  }
  
  return { shouldGenerate: false, reason: 'Entry conditions not met' };
}

async function shouldGenerateExitSignal(exitRules: any[], indicators: any, currentPrice: number, strategyId: string, supabase: any) {
  if (!exitRules.length) {
    return { shouldGenerate: false, reason: 'No exit rules configured' };
  }

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
    return { shouldGenerate: false, reason: 'No open positions to exit' };
  }

  for (const group of exitRules) {
    const result = await evaluateRuleGroup(group, indicators, currentPrice);
    if (result.conditionsMet) {
      return { 
        shouldGenerate: true, 
        reason: `${result.description} (${result.metConditions}/${result.totalConditions} conditions met)`
      };
    }
  }
  
  return { shouldGenerate: false, reason: 'Exit conditions not met' };
}

async function evaluateRuleGroup(group: any, indicators: any, currentPrice: number) {
  const rules = group.trading_rules || [];
  if (!rules.length) {
    return { conditionsMet: false, description: 'No rules in group', metConditions: 0, totalConditions: 0 };
  }

  const results = [];
  let metConditions = 0;

  for (const rule of rules) {
    const result = evaluateRule(rule, indicators, currentPrice);
    results.push(result);
    if (result) metConditions++;
    
    console.log(`[Rule Evaluation] ${rule.left_indicator || rule.left_type} ${rule.condition} ${rule.right_value} = ${result}`);
  }

  let conditionsMet = false;
  let description = '';

  // Apply group logic
  if (group.logic === 'AND') {
    conditionsMet = metConditions === rules.length;
    description = `AND group - all conditions must be met`;
  } else if (group.logic === 'OR') {
    const requiredConditions = group.required_conditions || 1;
    conditionsMet = metConditions >= requiredConditions;
    description = `OR group - ${requiredConditions} conditions required`;
  }

  return { 
    conditionsMet, 
    description, 
    metConditions, 
    totalConditions: rules.length 
  };
}

function evaluateRule(rule: any, indicators: any, currentPrice: number): boolean {
  try {
    let leftValue = 0;
    let rightValue = 0;

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

    // Evaluate condition
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
}

async function getRealMarketData(supabase: any, symbol: string) {
  console.log(`[Market Data] Fetching real market data for ${symbol}`);
  
  try {
    const { data, error } = await supabase.functions.invoke('get-fmp-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (error || !data?.key) {
      throw new Error('FMP API key not available');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
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
        throw new Error('Market data request timeout');
      }
      throw error;
    }

  } catch (error) {
    console.error(`[Market Data] Error fetching market data for ${symbol}:`, error);
    throw error;
  }
}

async function getRealTechnicalIndicators(supabase: any, symbol: string) {
  console.log(`[Indicators] Fetching technical indicators for ${symbol}`);
  
  try {
    const { data, error } = await supabase.functions.invoke('get-fmp-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (error || !data?.key) {
      throw new Error('FMP API key not available');
    }

    const indicators = {};

    // Fetch RSI
    try {
      const rsiController = new AbortController();
      const rsiTimeoutId = setTimeout(() => rsiController.abort(), 15000);
      
      const rsiResponse = await fetch(
        `https://financialmodelingprep.com/api/v3/technical_indicator/daily/${symbol}?period=14&type=rsi&apikey=${data.key}`,
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
      
      if (rsiResponse.ok) {
        const rsiData = await rsiResponse.json();
        if (Array.isArray(rsiData) && rsiData.length > 0) {
          indicators.rsi = rsiData[0].rsi;
          console.log(`[Indicators] RSI for ${symbol}: ${indicators.rsi}`);
        }
      }
    } catch (error) {
      console.warn(`[Indicators] Failed to fetch RSI for ${symbol}:`, error);
    }

    return indicators;
    
  } catch (error) {
    console.error(`[Indicators] Error fetching indicators for ${symbol}:`, error);
    throw error;
  }
}

async function generateTradingSignal(supabase: any, strategyId: string, signalType: string, signalData: any) {
  try {
    console.log(`[Signal Generation] Creating ${signalType} signal for strategy ${strategyId}`);
    
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
      console.error('[Signal Generation] Error inserting trading signal:', error);
      return;
    }

    console.log(`[Signal Generation] Generated ${signalType} signal for strategy ${strategyId}`);

    // Send notifications
    await sendNotificationsForSignal(supabase, strategyId, signalType, signalData);

  } catch (error) {
    console.error('[Signal Generation] Error generating signal:', error);
  }
}

async function sendNotificationsForSignal(supabase: any, strategyId: string, signalType: string, signalData: any) {
  try {
    console.log(`[Notifications] Sending notifications for strategy ${strategyId}`);
    
    // Get strategy and user info
    const { data: strategy } = await supabase
      .from('strategies')
      .select('user_id, name, target_asset')
      .eq('id', strategyId)
      .single();

    if (!strategy) {
      console.error('[Notifications] Strategy not found');
      return;
    }

    // Check Pro status
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', strategy.user_id)
      .single();

    const isPro = profile?.subscription_tier === 'pro';
    console.log(`[Notifications] User ${strategy.user_id} Pro status: ${isPro}`);
    
    if (!isPro) {
      console.log(`[Notifications] User is not Pro, skipping external notifications`);
      return;
    }

    // Get notification settings
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', strategy.user_id)
      .single();

    if (!settings) {
      console.log('[Notifications] No notification settings found');
      return;
    }

    const notificationData = {
      ...signalData,
      strategyId: strategyId,
      strategyName: strategy.name,
      targetAsset: strategy.target_asset,
      userId: strategy.user_id
    };

    console.log(`[Notifications] Sending notifications for Pro user ${strategy.user_id}:`, {
      discord_enabled: settings.discord_enabled,
      telegram_enabled: settings.telegram_enabled,
      email_enabled: settings.email_enabled
    });

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
        console.log(`[Notifications] Discord notification sent`);
      } catch (error) {
        console.error(`[Notifications] Discord notification failed:`, error);
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
        console.log(`[Notifications] Telegram notification sent`);
      } catch (error) {
        console.error(`[Notifications] Telegram notification failed:`, error);
      }
    }

    // Send Email notification if enabled
    if (settings.email_enabled) {
      try {
        // Get user email
        const { data: { user } } = await supabase.auth.admin.getUserById(strategy.user_id);
        if (user?.email) {
          await supabase.functions.invoke('send-email-notification', {
            body: {
              userEmail: user.email,
              signalData: notificationData,
              signalType: signalType
            }
          });
          console.log(`[Notifications] Email notification sent`);
        } else {
          console.error(`[Notifications] No email found for user ${strategy.user_id}`);
        }
      } catch (error) {
        console.error(`[Notifications] Email notification failed:`, error);
      }
    }

  } catch (error) {
    console.error(`[Notifications] Error sending notifications:`, error);
  }
}

async function updateStrategyEvaluation(supabase: any, strategy: any) {
  try {
    const now = new Date();
    const nextEvaluationTime = getNextEvaluationTime(strategy.timeframe, now);

    const { error } = await supabase
      .from('strategy_evaluations')
      .upsert({
        strategy_id: strategy.id,
        timeframe: strategy.timeframe,
        last_evaluated_at: now.toISOString(),
        next_evaluation_due: nextEvaluationTime.toISOString(),
        evaluation_count: (strategy.strategy_evaluations?.[0]?.evaluation_count || 0) + 1,
        updated_at: now.toISOString()
      }, {
        onConflict: 'strategy_id'
      });

    if (error) {
      console.error('[Update Evaluation] Error updating strategy evaluation:', error);
    } else {
      console.log(`[Update Evaluation] Updated evaluation record for strategy ${strategy.id}`);
    }
  } catch (error) {
    console.error('[Update Evaluation] Error in updateStrategyEvaluation:', error);
  }
}

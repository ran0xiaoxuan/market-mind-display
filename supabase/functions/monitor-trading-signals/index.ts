
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Market hours check (US Eastern Time)
const isMarketHours = () => {
  const now = new Date();
  const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const hour = easternTime.getHours();
  const day = easternTime.getDay();
  
  // Monday = 1, Friday = 5
  // Market hours: 9:30 AM - 4:00 PM ET
  return day >= 1 && day <= 5 && hour >= 9 && hour < 16;
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

    console.log('[Monitor] Starting trading signal monitoring...');

    // Check if market is open
    if (!isMarketHours()) {
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

    // Process each strategy
    for (const strategy of strategies) {
      try {
        console.log(`[Monitor] Processing strategy: ${strategy.name} (${strategy.id})`);

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

        // Generate signal using the enhanced service
        const signalResult = await generateSignalForStrategy(strategy.id, strategy.user_id, supabaseClient);
        
        results.push({
          strategyId: strategy.id,
          strategyName: strategy.name,
          targetAsset: strategy.target_asset,
          timeframe: strategy.timeframe,
          status: signalResult.signalGenerated ? 'signal_generated' : 'no_signal',
          reason: signalResult.reason,
          signalId: signalResult.signalId,
          matchedConditions: signalResult.matchedConditions?.length || 0,
          evaluationDetails: signalResult.evaluationDetails?.length || 0,
          signalType: signalResult.signalType
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
        message: 'Signal monitoring completed',
        processedStrategies: results.length,
        signalsGenerated: signalsGenerated,
        results: results,
        timestamp: new Date().toISOString()
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

// Enhanced signal generation function for Edge Function context
async function generateSignalForStrategy(strategyId: string, userId: string, supabaseClient: any) {
  try {
    console.log(`[EdgeSignalGen] Starting signal generation for strategy: ${strategyId}`);

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
      .single();

    if (strategyError || !strategy) {
      console.log(`[EdgeSignalGen] Strategy not found: ${strategyError?.message}`);
      return {
        signalGenerated: false,
        reason: 'Strategy not found or inactive'
      };
    }

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
      console.log(`[EdgeSignalGen] Daily limit reached: ${signalCount.length}/${dailyLimit}`);
      return {
        signalGenerated: false,
        reason: `Daily limit reached (${signalCount.length}/${dailyLimit})`
      };
    }

    // Get current market price
    const currentPrice = await getCurrentPrice(strategy.target_asset);
    if (!currentPrice) {
      console.log(`[EdgeSignalGen] Failed to get price for ${strategy.target_asset}`);
      return {
        signalGenerated: false,
        reason: `Failed to get current price for ${strategy.target_asset}`
      };
    }

    console.log(`[EdgeSignalGen] Current price for ${strategy.target_asset}: $${currentPrice}`);

    // Organize rules by type
    const entryRules = strategy.rule_groups?.filter((rg: any) => rg.rule_type === 'entry') || [];
    const exitRules = strategy.rule_groups?.filter((rg: any) => rg.rule_type === 'exit') || [];

    console.log(`[EdgeSignalGen] Found ${entryRules.length} entry rule groups and ${exitRules.length} exit rule groups`);

    if (entryRules.length === 0 && exitRules.length === 0) {
      return {
        signalGenerated: false,
        reason: 'No trading rules defined'
      };
    }

    // Evaluate entry rules first
    let signalType: 'entry' | 'exit' | null = null;
    
    if (entryRules.length > 0) {
      const entryEvaluation = await evaluateRuleGroups(entryRules, strategy.target_asset, currentPrice, strategy.timeframe);
      if (entryEvaluation.signalGenerated) {
        signalType = 'entry';
        console.log(`[EdgeSignalGen] ✓ Entry signal generated`);
      }
    }

    // If no entry signal, check exit rules
    if (!signalType && exitRules.length > 0) {
      const exitEvaluation = await evaluateRuleGroups(exitRules, strategy.target_asset, currentPrice, strategy.timeframe);
      if (exitEvaluation.signalGenerated) {
        signalType = 'exit';
        console.log(`[EdgeSignalGen] ✓ Exit signal generated`);
      }
    }

    if (!signalType) {
      console.log(`[EdgeSignalGen] No signal conditions met`);
      return {
        signalGenerated: false,
        reason: 'Market conditions do not meet rule criteria'
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
      reason: `${signalType} signal generated - conditions met`
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
      console.error(`[EdgeSignalGen] Error creating signal:`, signalError);
      return {
        signalGenerated: false,
        reason: `Failed to create signal: ${signalError.message}`
      };
    }

    console.log(`[EdgeSignalGen] ✓ Signal created successfully: ${signal.id}`);
    return {
      signalGenerated: true,
      signalId: signal.id,
      signalType: signalType,
      reason: `${signalType} signal generated`
    };

  } catch (error) {
    console.error(`[EdgeSignalGen] Error:`, error);
    return {
      signalGenerated: false,
      reason: `Error: ${error.message}`
    };
  }
}

// Simplified rule evaluation for Edge Function context
async function evaluateRuleGroups(ruleGroups: any[], asset: string, currentPrice: number, timeframe: string) {
  try {
    // Separate AND and OR groups
    const andGroups = ruleGroups.filter(group => group.logic === 'AND');
    const orGroups = ruleGroups.filter(group => group.logic === 'OR');

    let allAndGroupsSatisfied = true;
    let allOrGroupsSatisfied = true;

    // Evaluate AND groups - all must be satisfied
    for (const andGroup of andGroups) {
      if (!andGroup.trading_rules || andGroup.trading_rules.length === 0) continue;
      
      let allConditionsMet = true;
      for (const rule of andGroup.trading_rules) {
        const conditionMet = await evaluateCondition(rule, asset, currentPrice);
        if (!conditionMet) {
          allConditionsMet = false;
          break;
        }
      }
      
      if (!allConditionsMet) {
        allAndGroupsSatisfied = false;
        break;
      }
    }

    // Evaluate OR groups - each must meet required conditions
    for (const orGroup of orGroups) {
      if (!orGroup.trading_rules || orGroup.trading_rules.length === 0) continue;
      
      let conditionsMetCount = 0;
      for (const rule of orGroup.trading_rules) {
        const conditionMet = await evaluateCondition(rule, asset, currentPrice);
        if (conditionMet) {
          conditionsMetCount++;
        }
      }
      
      const requiredConditions = orGroup.required_conditions || 1;
      if (conditionsMetCount < requiredConditions) {
        allOrGroupsSatisfied = false;
        break;
      }
    }

    const signalGenerated = allAndGroupsSatisfied && allOrGroupsSatisfied;
    console.log(`[RuleEval] Final result: AND=${allAndGroupsSatisfied}, OR=${allOrGroupsSatisfied}, Signal=${signalGenerated}`);

    return { signalGenerated };
  } catch (error) {
    console.error('[RuleEval] Error evaluating rule groups:', error);
    return { signalGenerated: false };
  }
}

// Basic condition evaluation for Edge Function
async function evaluateCondition(rule: any, asset: string, currentPrice: number): Promise<boolean> {
  try {
    // Get left side value
    let leftValue: number | null = null;
    if (rule.left_type === 'PRICE') {
      leftValue = currentPrice;
    } else if (rule.left_type === 'VALUE') {
      leftValue = parseFloat(rule.left_value);
    } else if (rule.left_type === 'INDICATOR') {
      // For now, return a mock evaluation since we need full indicator integration
      // This would need the full TAAPI integration in production
      leftValue = Math.random() * 100; // Mock value for testing
    }

    // Get right side value
    let rightValue: number | null = null;
    if (rule.right_type === 'PRICE') {
      rightValue = currentPrice;
    } else if (rule.right_type === 'VALUE') {
      rightValue = parseFloat(rule.right_value);
    } else if (rule.right_type === 'INDICATOR') {
      // Mock value for testing
      rightValue = Math.random() * 100;
    }

    if (leftValue === null || rightValue === null) {
      return false;
    }

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
      default:
        return false;
    }
  } catch (error) {
    console.error('[ConditionEval] Error evaluating condition:', error);
    return false;
  }
}

// Get current price function
async function getCurrentPrice(symbol: string): Promise<number | null> {
  try {
    // For now, return a mock price since we need FMP API integration
    // In production, this would call the actual market data API
    const mockPrices: { [key: string]: number } = {
      'AMD': 150 + Math.random() * 10,
      'TQQQ': 45 + Math.random() * 5,
      'AAPL': 175 + Math.random() * 10
    };
    
    return mockPrices[symbol] || (100 + Math.random() * 50);
  } catch (error) {
    console.error('[PriceService] Error getting current price:', error);
    return null;
  }
}

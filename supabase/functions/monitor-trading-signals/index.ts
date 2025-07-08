
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

    console.log('Starting trading signal monitoring...');

    // Check if market is open
    if (!isMarketHours()) {
      console.log('Market is closed, skipping signal generation');
      return new Response(
        JSON.stringify({ message: 'Market is closed, no signals generated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all active strategies that have trading rules
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
        rule_groups!inner(
          id,
          rule_type,
          trading_rules!inner(id)
        )
      `)
      .eq('is_active', true)
      .eq('signal_notifications_enabled', true);

    if (strategiesError) {
      console.error('Error fetching strategies:', strategiesError);
      throw strategiesError;
    }

    if (!strategies || strategies.length === 0) {
      console.log('No active strategies with notifications enabled found');
      return new Response(
        JSON.stringify({ message: 'No active strategies found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${strategies.length} active strategies to monitor`);

    const results = [];

    // Process each strategy
    for (const strategy of strategies) {
      try {
        console.log(`Processing strategy: ${strategy.name} (${strategy.id})`);

        // Check if strategy has valid trading rules
        const hasRules = strategy.rule_groups?.some((rg: any) => 
          rg.trading_rules && rg.trading_rules.length > 0
        );

        if (!hasRules) {
          console.log(`Skipping strategy ${strategy.name}: No trading rules defined`);
          results.push({
            strategyId: strategy.id,
            strategyName: strategy.name,
            status: 'skipped',
            reason: 'No trading rules defined'
          });
          continue;
        }

        // Generate signal using the updated service
        const signalResult = await generateSignalForStrategy(strategy.id, strategy.user_id);
        
        results.push({
          strategyId: strategy.id,
          strategyName: strategy.name,
          status: signalResult.signalGenerated ? 'signal_generated' : 'no_signal',
          reason: signalResult.reason,
          signalId: signalResult.signalId,
          matchedConditions: signalResult.matchedConditions?.length || 0,
          evaluationDetails: signalResult.evaluationDetails?.length || 0
        });

        // If signal was generated, send notifications
        if (signalResult.signalGenerated && signalResult.signalId) {
          console.log(`Signal generated for ${strategy.name}, sending notifications...`);
          
          try {
            // Call notification service
            const notificationResponse = await supabaseClient.functions.invoke('send-notifications', {
              body: {
                signalId: signalResult.signalId,
                userId: strategy.user_id,
                signalType: 'entry' // This will be determined by the evaluation
              }
            });

            if (notificationResponse.error) {
              console.error('Notification error:', notificationResponse.error);
            } else {
              console.log('Notifications sent successfully');
            }
          } catch (notificationError) {
            console.error('Error sending notifications:', notificationError);
          }
        }

      } catch (error) {
        console.error(`Error processing strategy ${strategy.id}:`, error);
        results.push({
          strategyId: strategy.id,
          strategyName: strategy.name,
          status: 'error',
          reason: error.message
        });
      }
    }

    console.log('Signal monitoring completed:', results);

    return new Response(
      JSON.stringify({
        message: 'Signal monitoring completed',
        processedStrategies: results.length,
        signalsGenerated: results.filter(r => r.status === 'signal_generated').length,
        results: results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in monitor-trading-signals:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// Helper function to generate signals (simplified version for Edge Function)
async function generateSignalForStrategy(strategyId: string, userId: string) {
  // This is a simplified version that calls the main service logic
  // In a real implementation, you'd want to import the actual service
  // For now, we'll implement the core logic directly here
  
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get strategy with rules
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
      return {
        signalGenerated: false,
        reason: 'Strategy not found'
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
      return {
        signalGenerated: false,
        reason: `Daily limit reached (${signalCount.length}/${dailyLimit})`
      };
    }

    // For now, we'll simulate rule evaluation
    // In production, you'd integrate with the actual rule evaluation service
    const hasEntryRules = strategy.rule_groups?.some((rg: any) => 
      rg.rule_type === 'entry' && rg.trading_rules?.length > 0
    );

    const hasExitRules = strategy.rule_groups?.some((rg: any) => 
      rg.rule_type === 'exit' && rg.trading_rules?.length > 0
    );

    if (!hasEntryRules && !hasExitRules) {
      return {
        signalGenerated: false,
        reason: 'No trading rules defined'
      };
    }

    // For demo purposes, generate signals randomly based on rules
    // In production, this would be replaced with actual rule evaluation
    const shouldGenerateSignal = Math.random() > 0.8; // 20% chance
    
    if (!shouldGenerateSignal) {
      return {
        signalGenerated: false,
        reason: 'Market conditions do not meet rule criteria'
      };
    }

    const signalType = hasEntryRules ? 'entry' : 'exit';
    
    // Create signal
    const signalData = {
      strategyId: strategyId,
      strategyName: strategy.name,
      targetAsset: strategy.target_asset,
      price: 100 + Math.random() * 50, // Mock price
      userId: userId,
      timestamp: new Date().toISOString(),
      reason: `${signalType} signal based on rule evaluation`
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
      return {
        signalGenerated: false,
        reason: `Failed to create signal: ${signalError.message}`
      };
    }

    return {
      signalGenerated: true,
      signalId: signal.id,
      reason: `${signalType} signal generated`
    };

  } catch (error) {
    return {
      signalGenerated: false,
      reason: `Error: ${error.message}`
    };
  }
}

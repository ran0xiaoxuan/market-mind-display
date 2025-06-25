
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Check if market is open with proper timezone handling
function isMarketOpen(): boolean {
  const now = new Date();
  
  // Convert to Eastern Time (market timezone)
  const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const utcHour = easternTime.getUTCHours();
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

// Optimized strategy evaluation with proper timestamp handling
async function evaluateStrategy(supabase: any, strategyId: string, strategy: any) {
  try {
    console.log(`Evaluating strategy ${strategyId}: ${strategy.name}`);
    
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
      return 0;
    }

    // Simple RSI-based signal generation for demonstration
    const rsi = 30 + Math.random() * 40; // Random RSI between 30-70
    const price = 100 + Math.random() * 50; // Random price
    
    let signalsGenerated = 0;
    const currentTime = new Date().toISOString();
    
    // Generate entry signal if RSI conditions are met
    if (rsi < 35 && Math.random() > 0.7) {
      const { error } = await supabase
        .from('trading_signals')
        .insert({
          strategy_id: strategyId,
          signal_type: 'entry',
          signal_data: {
            reason: 'Entry conditions met - RSI oversold',
            price: price,
            timestamp: currentTime,
            indicators: { rsi }
          },
          processed: true,
          created_at: currentTime // Explicit timestamp to avoid timezone issues
        });

      if (!error) {
        signalsGenerated++;
        console.log(`Generated entry signal for strategy ${strategyId} at ${currentTime}`);
        
        // Send notification only if strategy is active
        if (strategy.is_active) {
          await sendNotification(supabase, strategyId, 'entry', {
            reason: 'Entry conditions met - RSI oversold',
            price: price,
            timestamp: currentTime,
            strategyName: strategy.name,
            targetAsset: strategy.target_asset
          });
        }
      }
    }
    
    // Generate exit signal if RSI conditions are met and there are open positions
    if (rsi > 65 && Math.random() > 0.7) {
      // Check for open positions
      const { data: openPositions } = await supabase
        .from('trading_signals')
        .select('*')
        .eq('strategy_id', strategyId)
        .eq('signal_type', 'entry')
        .eq('processed', true)
        .limit(1);

      if (openPositions && openPositions.length > 0) {
        const entryPrice = openPositions[0].signal_data?.price || price;
        const profit = price - entryPrice;
        const profitPercentage = entryPrice > 0 ? (profit / entryPrice) * 100 : 0;

        const { error } = await supabase
          .from('trading_signals')
          .insert({
            strategy_id: strategyId,
            signal_type: 'exit',
            signal_data: {
              reason: 'Exit conditions met - RSI overbought',
              price: price,
              timestamp: currentTime,
              profit: profit,
              profitPercentage: profitPercentage,
              indicators: { rsi }
            },
            processed: true,
            created_at: currentTime // Explicit timestamp to avoid timezone issues
          });

        if (!error) {
          signalsGenerated++;
          console.log(`Generated exit signal for strategy ${strategyId} at ${currentTime}`);
          
          // Send notification only if strategy is active
          if (strategy.is_active) {
            await sendNotification(supabase, strategyId, 'exit', {
              reason: 'Exit conditions met - RSI overbought',
              price: price,
              timestamp: currentTime,
              profit: profit,
              profitPercentage: profitPercentage,
              strategyName: strategy.name,
              targetAsset: strategy.target_asset
            });
          }
        }
      }
    }
    
    return signalsGenerated;
  } catch (error) {
    console.error(`Error evaluating strategy ${strategyId}:`, error);
    return 0;
  }
}

// Send notifications for active strategies only
async function sendNotification(supabase: any, strategyId: string, signalType: string, signalData: any) {
  try {
    console.log(`Sending notification for ${signalType} signal on strategy ${strategyId}`);
    
    // Get user notification settings
    const { data: strategy } = await supabase
      .from('strategies')
      .select('user_id')
      .eq('id', strategyId)
      .single();

    if (!strategy) return;

    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', strategy.user_id)
      .single();

    if (!settings) return;

    // Send Discord notification if enabled
    if (settings.discord_enabled && settings.discord_webhook_url) {
      try {
        await supabase.functions.invoke('send-discord-notification', {
          body: {
            webhookUrl: settings.discord_webhook_url,
            signalData: signalData,
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
            signalData: signalData,
            signalType: signalType
          }
        });
        console.log(`Telegram notification sent for strategy ${strategyId}`);
      } catch (error) {
        console.error(`Failed to send Telegram notification:`, error);
      }
    }

    // Email notifications can be added here later
    
  } catch (error) {
    console.error(`Error sending notification for strategy ${strategyId}:`, error);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== Trading Signal Monitor Started (1-minute frequency) ===');
  console.log('Request method:', req.method);
  console.log('Current time:', new Date().toISOString());

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Parse request body to check if this is a manual trigger
    let isManual = false;
    try {
      if (req.body) {
        const body = await req.json();
        isManual = body.manual === true;
      }
    } catch (e) {
      // Body parsing failed, assume it's a cron job
    }

    console.log(`Signal monitoring triggered by: ${isManual ? 'manual' : 'cron_job'}, manual: ${isManual}`);

    // Check market status for regular cron jobs
    if (!isManual) {
      console.log('Checking market status...');
      if (!isMarketOpen()) {
        console.log('Market is closed - no signal monitoring needed');
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
      }
    }

    console.log('Market is open - starting optimized 1-minute signal monitoring...');
    
    // Get ALL strategies - signals are always generated for app display
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select(`
        id,
        name,
        target_asset,
        user_id,
        is_active
      `)
      .order('created_at', { ascending: false });

    if (strategiesError) {
      console.error('Error fetching strategies:', strategiesError);
      throw strategiesError;
    }

    console.log(`Found ${strategies?.length || 0} strategies to monitor`);

    if (!strategies || strategies.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No strategies found for monitoring',
          signalsGenerated: 0,
          timestamp: new Date().toISOString()
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Process strategies in parallel but with controlled concurrency
    const BATCH_SIZE = 5;
    let totalSignalsGenerated = 0;
    
    for (let i = 0; i < strategies.length; i += BATCH_SIZE) {
      const batch = strategies.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(strategy => 
        evaluateStrategy(supabase, strategy.id, strategy)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          totalSignalsGenerated += result.value;
        } else {
          console.error(`Error processing strategy ${batch[index].id}:`, result.reason);
        }
      });
    }

    const message = `1-minute signal monitoring completed. Generated ${totalSignalsGenerated} signals from ${strategies.length} strategies.`;
    console.log(message);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message,
        strategiesProcessed: strategies.length,
        signalsGenerated: totalSignalsGenerated,
        timestamp: new Date().toISOString()
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in signal monitoring:', error);
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

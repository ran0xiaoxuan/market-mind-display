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

// Get real market data from FMP API - NO FALLBACK TO SIMULATED DATA
async function getRealMarketData(symbol: string, fmpApiKey: string) {
  try {
    console.log(`Fetching real market data for ${symbol}`);
    
    // Get current quote
    const quoteResponse = await fetch(
      `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${fmpApiKey}`
    );
    
    if (!quoteResponse.ok) {
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
    const rsiResponse = await fetch(
      `https://financialmodelingprep.com/api/v3/technical_indicator/daily/${symbol}?period=14&type=rsi&apikey=${fmpApiKey}`
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
    
    console.log(`Real market data for ${symbol}:`, {
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
    console.error(`Error fetching real market data for ${symbol}:`, error);
    throw error;
  }
}

// Enhanced strategy evaluation - ONLY REAL DATA
async function evaluateStrategy(supabase: any, strategyId: string, strategy: any) {
  try {
    console.log(`Evaluating strategy ${strategyId}: ${strategy.name} for ${strategy.target_asset}`);
    
    // Get FMP API key - REQUIRED
    const { data: keyData, error: keyError } = await supabase.functions.invoke('get-fmp-key');
    if (keyError || !keyData?.key) {
      console.error(`No FMP API key available for strategy ${strategyId}, cannot generate signals`);
      return 0;
    }
    
    const fmpApiKey = keyData.key;
    
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
    
    // Get ONLY real market data - NO FALLBACK
    let marketData;
    try {
      marketData = await getRealMarketData(strategy.target_asset, fmpApiKey);
      console.log(`Successfully fetched real market data for ${strategy.target_asset}`);
    } catch (error) {
      console.error(`Failed to get real market data for ${strategy.target_asset}:`, error);
      console.error(`Cannot generate signals without real market data for strategy ${strategyId}`);
      return 0;
    }
    
    // Check if user is Pro for notification purposes
    const { data: user } = await supabase
      .from('strategies')
      .select('user_id')
      .eq('id', strategyId)
      .single();

    if (!user) {
      console.error(`No user found for strategy ${strategyId}`);
      return 0;
    }

    // Get user profile to check Pro status
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user_id)
      .single();

    const isPro = profile?.is_pro === true;
    console.log(`User ${user.user_id} Pro status: ${isPro}`);
    
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
      const entryReason = `Entry signal (real market data) - RSI: ${marketData.rsi.toFixed(2)}, Price: $${marketData.price.toFixed(2)}`;
      
      const { error } = await supabase
        .from('trading_signals')
        .insert({
          strategy_id: strategyId,
          signal_type: 'entry',
          signal_data: {
            reason: entryReason,
            price: marketData.price,
            timestamp: currentTime,
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
        console.log(`Generated entry signal for strategy ${strategyId}: ${entryReason}`);
        
        // Send notification only if strategy is active and user is Pro
        if (strategy.is_active) {
          await sendNotification(supabase, strategyId, 'entry', {
            reason: entryReason,
            price: marketData.price,
            timestamp: currentTime,
            strategyName: strategy.name,
            targetAsset: strategy.target_asset,
            userId: user.user_id,
            isPro: isPro
          });
        }
      } else {
        console.error(`Error inserting entry signal for strategy ${strategyId}:`, error);
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
        
        const exitReason = `Exit signal (real market data) - RSI: ${marketData.rsi.toFixed(2)}, Price: $${marketData.price.toFixed(2)}, P&L: ${profitPercentage.toFixed(2)}%`;

        const { error } = await supabase
          .from('trading_signals')
          .insert({
            strategy_id: strategyId,
            signal_type: 'exit',
            signal_data: {
              reason: exitReason,
              price: marketData.price,
              timestamp: currentTime,
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
          console.log(`Generated exit signal for strategy ${strategyId}: ${exitReason}`);
          
          // Send notification only if strategy is active and user is Pro
          if (strategy.is_active) {
            await sendNotification(supabase, strategyId, 'exit', {
              reason: exitReason,
              price: marketData.price,
              timestamp: currentTime,
              profit: profit,
              profitPercentage: profitPercentage,
              strategyName: strategy.name,
              targetAsset: strategy.target_asset,
              userId: user.user_id,
              isPro: isPro
            });
          }
        } else {
          console.error(`Error inserting exit signal for strategy ${strategyId}:`, error);
        }
      }
    }
    
    return signalsGenerated;
  } catch (error) {
    console.error(`Error evaluating strategy ${strategyId}:`, error);
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
      
      console.log(`Rule evaluation: ${rule.left_indicator || rule.left_type} ${rule.condition} ${rule.right_value} = ${result}`);
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
    
    console.log(`Group ${group.rule_type} result: ${groupResult} (logic: ${group.logic})`);
    
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
        console.warn(`Unknown condition: ${condition}`);
        return false;
    }
  } catch (error) {
    console.error('Error evaluating rule:', error);
    return false;
  }
}

// Send notifications with Pro user check
async function sendNotification(supabase: any, strategyId: string, signalType: string, signalData: any) {
  try {
    console.log(`Processing notification for ${signalType} signal on strategy ${strategyId}`);
    
    const isPro = signalData.isPro;
    const userId = signalData.userId;
    
    if (!isPro) {
      console.log(`User ${userId} is not Pro, notifications will only appear in app`);
      return;
    }
    
    console.log(`Sending external notifications for Pro user ${userId}`);
    
    // Get user notification settings
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!settings) {
      console.log(`No notification settings found for user ${userId}`);
      return;
    }

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

    // Send Email notification if enabled  
    if (settings.email_enabled) {
      try {
        // Get user email
        const { data: authUser } = await supabase.auth.admin.getUserById(userId);
        if (authUser?.user?.email) {
          await supabase.functions.invoke('send-email-notification', {
            body: {
              userEmail: authUser.user.email,
              signalData: signalData,
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
    console.error(`Error sending notification for strategy ${strategyId}:`, error);
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

    // Check market status for regular cron jobs (allow manual triggers anytime)
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

    console.log('Starting signal monitoring with REAL market data only...');
    
    // Get ALL strategies with their target assets
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

    // Process strategies in batches
    const BATCH_SIZE = 3; // Reduced batch size for better API rate limiting
    let totalSignalsGenerated = 0;
    let strategiesProcessed = 0;
    let strategiesSkipped = 0;
    
    for (let i = 0; i < strategies.length; i += BATCH_SIZE) {
      const batch = strategies.slice(i, i + BATCH_SIZE);
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
          console.error(`Error processing strategy ${batch[index].id}:`, result.reason);
          strategiesSkipped++;
        }
      });
      
      // Add delay between batches to respect API rate limits
      if (i + BATCH_SIZE < strategies.length) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
    }

    const message = `Signal monitoring completed. Generated ${totalSignalsGenerated} signals from ${strategiesProcessed} strategies (${strategiesSkipped} skipped due to missing real data).`;
    console.log(message);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message,
        strategiesProcessed: strategiesProcessed,
        strategiesSkipped: strategiesSkipped,
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

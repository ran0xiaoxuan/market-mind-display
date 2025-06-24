import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Enhanced cache for 1-minute execution
const priceCache = new Map<string, { price: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds cache for API calls
const MAX_STRATEGIES_PER_BATCH = 10; // Process strategies in batches to avoid timeouts

// Check if market is open (US market hours: 9:30 AM - 4:00 PM EST, Monday-Friday)
const isMarketOpen = (): boolean => {
  const now = new Date();
  const est = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  
  // Check if it's a weekday (Monday = 1, Friday = 5)
  const dayOfWeek = est.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday = 0, Saturday = 6
    return false;
  }
  
  const hour = est.getHours();
  const minute = est.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  
  // Market hours: 9:30 AM (570 minutes) to 4:00 PM (960 minutes) EST
  return timeInMinutes >= 570 && timeInMinutes < 960;
};

const handler = async (req: Request): Promise<Response> => {
  console.log('=== Trading Signal Monitor Started (1-minute frequency) ===');
  console.log('Request method:', req.method);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { source = 'unknown', manual = false } = body;
    
    console.log(`Signal monitoring triggered by: ${source}, manual: ${manual}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Checking market status...');
    if (!isMarketOpen() && !manual) {
      console.log('Market is closed - no signal monitoring needed');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Market is closed - no monitoring performed',
          timestamp: new Date().toISOString(),
          source
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Market is open - starting optimized 1-minute signal monitoring...');

    // Get active strategies with optimized query
    const { data: strategies, error: strategiesError } = await supabaseClient
      .from('strategies')
      .select(`
        id,
        name,
        user_id,
        target_asset,
        is_active,
        rule_groups!inner(
          id,
          rule_type,
          logic,
          trading_rules(*)
        )
      `)
      .eq('is_active', true)
      .limit(MAX_STRATEGIES_PER_BATCH); // Limit for performance

    if (strategiesError) {
      console.error('Error fetching strategies:', strategiesError);
      throw strategiesError;
    }

    console.log(`Found ${strategies?.length || 0} active strategies to monitor`);

    let signalsGenerated = 0;
    const processedStrategies = [];
    const errors = [];

    // Process strategies with performance optimization
    for (const strategy of strategies || []) {
      try {
        console.log(`Processing strategy: ${strategy.name} (${strategy.id})`);
        
        // Check if strategy has valid trading rules
        const hasValidRules = strategy.rule_groups?.some((group: any) => 
          group.trading_rules && group.trading_rules.length > 0
        );

        if (!hasValidRules) {
          console.log(`Strategy ${strategy.id} has no valid trading rules - skipping`);
          continue;
        }

        // Get current market price for the target asset with caching
        if (!strategy.target_asset) {
          console.log(`Strategy ${strategy.id} has no target asset - skipping`);
          continue;
        }

        const priceData = await fetchCurrentPriceWithCache(strategy.target_asset);
        if (!priceData) {
          console.log(`Could not fetch price for ${strategy.target_asset} - skipping strategy ${strategy.id}`);
          continue;
        }

        console.log(`Current price for ${strategy.target_asset}: $${priceData.price} (cached: ${priceData.cached || false})`);

        // Evaluate trading rules for entry signals
        const entryRules = strategy.rule_groups.filter((group: any) => group.rule_type === 'entry');
        const exitRules = strategy.rule_groups.filter((group: any) => group.rule_type === 'exit');

        // Check for entry signals with optimized evaluation
        if (entryRules.length > 0) {
          const entrySignal = await evaluateRulesForSignalOptimized(entryRules, strategy.target_asset, priceData.price);
          if (entrySignal.shouldGenerate) {
            await generateAndRecordSignal(supabaseClient, strategy, 'entry', priceData, entrySignal.conditions);
            signalsGenerated++;
          }
        }

        // Check for exit signals (only if we have open positions)
        if (exitRules.length > 0) {
          const hasOpenPosition = await checkOpenPositionOptimized(supabaseClient, strategy.id);
          if (hasOpenPosition) {
            const exitSignal = await evaluateRulesForSignalOptimized(exitRules, strategy.target_asset, priceData.price);
            if (exitSignal.shouldGenerate) {
              await generateAndRecordSignal(supabaseClient, strategy, 'exit', priceData, exitSignal.conditions);
              signalsGenerated++;
            }
          }
        }

        processedStrategies.push({
          id: strategy.id,
          name: strategy.name,
          asset: strategy.target_asset,
          price: priceData.price,
          cached: priceData.cached || false
        });

      } catch (error) {
        console.error(`Error processing strategy ${strategy.id}:`, error);
        errors.push({
          strategyId: strategy.id,
          error: error.message
        });
      }
    }

    // Clean up old cache entries
    cleanupPriceCache();

    console.log(`1-minute signal monitoring completed. Generated ${signalsGenerated} signals from ${processedStrategies.length} strategies.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: '1-minute signal monitoring completed',
        signalsGenerated,
        strategiesProcessed: processedStrategies.length,
        strategies: processedStrategies,
        errors: errors.length > 0 ? errors : undefined,
        cacheStats: {
          cacheSize: priceCache.size,
          cachedSymbols: Array.from(priceCache.keys())
        },
        timestamp: new Date().toISOString(),
        source,
        frequency: '1-minute'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in 1-minute signal monitoring:', error);
    return new Response(
      JSON.stringify({
        error: '1-minute signal monitoring failed',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

// Enhanced price fetching with caching for 1-minute execution
const fetchCurrentPriceWithCache = async (symbol: string) => {
  try {
    // Check cache first
    const cached = priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`Using cached price for ${symbol}`);
      return { ...cached.price, cached: true };
    }

    const fmpApiKey = Deno.env.get('FMP_API_KEY');
    if (!fmpApiKey) {
      console.error('FMP_API_KEY not found');
      return null;
    }

    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${fmpApiKey}`,
      { signal: AbortSignal.timeout(5000) } // 5 second timeout
    );

    if (!response.ok) {
      console.error(`FMP API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      console.error(`No price data found for ${symbol}`);
      return null;
    }

    const priceData = {
      price: data[0].price,
      change: data[0].change,
      changePercent: data[0].changesPercentage,
      volume: data[0].volume,
      timestamp: new Date().toISOString()
    };

    // Cache the result
    priceCache.set(symbol, {
      price: priceData,
      timestamp: Date.now()
    });

    return { ...priceData, cached: false };
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
};

// Optimized rule evaluation for 1-minute execution
const evaluateRulesForSignalOptimized = async (ruleGroups: any[], asset: string, currentPrice: number) => {
  const matchedConditions: string[] = [];
  let shouldGenerate = false;

  for (const group of ruleGroups) {
    const rules = group.trading_rules || [];
    let groupMatched = false;
    let groupConditions: string[] = [];

    for (const rule of rules) {
      // Optimized evaluation logic - focus on basic price conditions for 1-minute execution
      if (rule.left_type === 'price' && rule.right_type === 'value') {
        const rightValue = parseFloat(rule.right_value);
        
        switch (rule.condition) {
          case '>':
            if (currentPrice > rightValue) {
              groupConditions.push(`Price ($${currentPrice.toFixed(2)}) > $${rightValue}`);
              groupMatched = true;
            }
            break;
          case '<':
            if (currentPrice < rightValue) {
              groupConditions.push(`Price ($${currentPrice.toFixed(2)}) < $${rightValue}`);
              groupMatched = true;
            }
            break;
          case '>=':
            if (currentPrice >= rightValue) {
              groupConditions.push(`Price ($${currentPrice.toFixed(2)}) >= $${rightValue}`);
              groupMatched = true;
            }
            break;
          case '<=':
            if (currentPrice <= rightValue) {
              groupConditions.push(`Price ($${currentPrice.toFixed(2)}) <= $${rightValue}`);
              groupMatched = true;
            }
            break;
        }
      }
    }

    // For 1-minute execution, use simplified logic evaluation
    if (groupMatched) {
      matchedConditions.push(...groupConditions);
      if (group.logic === 'or' || groupConditions.length === rules.length) {
        shouldGenerate = true;
      }
    }
  }

  return { shouldGenerate, conditions: matchedConditions };
};

// Optimized position checking with caching
const positionCache = new Map<string, { hasPosition: boolean; timestamp: number }>();
const POSITION_CACHE_DURATION = 60000; // 1 minute cache for position checks

const checkOpenPositionOptimized = async (supabaseClient: any, strategyId: string): Promise<boolean> => {
  try {
    // Check cache first
    const cached = positionCache.get(strategyId);
    if (cached && Date.now() - cached.timestamp < POSITION_CACHE_DURATION) {
      return cached.hasPosition;
    }

    const { data: entrySignals, error } = await supabaseClient
      .from('trading_signals')
      .select('id')
      .eq('strategy_id', strategyId)
      .eq('signal_type', 'entry')
      .eq('processed', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error checking open positions:', error);
      return false;
    }

    const hasPosition = entrySignals && entrySignals.length > 0;
    
    // Cache the result
    positionCache.set(strategyId, {
      hasPosition,
      timestamp: Date.now()
    });

    return hasPosition;
  } catch (error) {
    console.error('Error in optimized position check:', error);
    return false;
  }
};

const generateAndRecordSignal = async (
  supabaseClient: any, 
  strategy: any, 
  signalType: string, 
  priceData: any, 
  conditions: string[]
) => {
  try {
    console.log(`Generating ${signalType} signal for strategy ${strategy.name}`);

    const signalData = {
      strategyId: strategy.id,
      strategyName: strategy.name,
      asset: strategy.target_asset,
      price: priceData.price,
      userId: strategy.user_id,
      timestamp: new Date().toISOString(),
      conditions: conditions,
      confidence: Math.min(100, Math.round((conditions.length / 5) * 100)),
      volume: 100,
      change: priceData.change,
      changePercent: priceData.changePercent,
      frequency: '1-minute'
    };

    const { data: signal, error: signalError } = await supabaseClient
      .from('trading_signals')
      .insert({
        strategy_id: strategy.id,
        signal_type: signalType,
        signal_data: signalData,
        processed: false
      })
      .select()
      .single();

    if (signalError) {
      console.error('Error creating signal:', signalError);
      throw signalError;
    }

    console.log(`1-minute signal ${signal.id} created successfully`);

    // Process notifications for PRO members
    await processSignalNotifications(supabaseClient, signal.id, strategy.user_id);

    // Mark signal as processed
    await supabaseClient
      .from('trading_signals')
      .update({ processed: true })
      .eq('id', signal.id);

    return signal;
  } catch (error) {
    console.error('Error generating 1-minute signal:', error);
    throw error;
  }
};

const processSignalNotifications = async (supabaseClient: any, signalId: string, userId: string) => {
  try {
    console.log(`Processing notifications for signal ${signalId}, user ${userId}`);

    // Check if user is PRO member
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.log('No profile found or error fetching profile:', profileError);
      return;
    }

    if (profile.subscription_tier !== 'pro') {
      console.log(`User ${userId} is not a PRO member - skipping notifications`);
      return;
    }

    console.log(`User ${userId} is PRO member - processing notifications`);

    // Get notification settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError || !settings) {
      console.log('No notification settings found for user:', userId);
      return;
    }

    // Get signal details
    const { data: signal, error: signalError } = await supabaseClient
      .from('trading_signals')
      .select('*')
      .eq('id', signalId)
      .single();

    if (signalError || !signal) {
      console.error('Error fetching signal details:', signalError);
      return;
    }

    // Check if this signal type is enabled
    const signalTypeEnabled = checkSignalTypeEnabled(signal.signal_type, settings);
    if (!signalTypeEnabled) {
      console.log(`Signal type ${signal.signal_type} not enabled for notifications`);
      return;
    }

    // Send notifications based on enabled channels
    const notifications = [];

    if (settings.email_enabled) {
      notifications.push(sendEmailNotification(supabaseClient, signalId, signal.signal_data, signal.signal_type));
    }

    if (settings.discord_enabled && settings.discord_webhook_url) {
      notifications.push(sendDiscordNotification(supabaseClient, signalId, settings.discord_webhook_url, signal.signal_data, signal.signal_type));
    }

    if (settings.telegram_enabled && settings.telegram_bot_token && settings.telegram_chat_id) {
      notifications.push(sendTelegramNotification(supabaseClient, signalId, settings.telegram_bot_token, settings.telegram_chat_id, signal.signal_data, signal.signal_type));
    }

    // Execute all notifications
    await Promise.allSettled(notifications);

  } catch (error) {
    console.error('Error processing notifications:', error);
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

const sendEmailNotification = async (supabaseClient: any, signalId: string, signalData: any, signalType: string) => {
  try {
    const { data, error } = await supabaseClient.functions.invoke('send-email-notification', {
      body: {
        signalId,
        userEmail: signalData.userId, // This should be the actual email
        signalData,
        signalType
      }
    });

    if (error) throw error;
    console.log('Email notification sent successfully');
    return data;
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
};

const sendDiscordNotification = async (supabaseClient: any, signalId: string, webhookUrl: string, signalData: any, signalType: string) => {
  try {
    const { data, error } = await supabaseClient.functions.invoke('send-discord-notification', {
      body: {
        signalId,
        webhookUrl,
        signalData,
        signalType
      }
    });

    if (error) throw error;
    console.log('Discord notification sent successfully');
    return data;
  } catch (error) {
    console.error('Error sending Discord notification:', error);
  }
};

const sendTelegramNotification = async (supabaseClient: any, signalId: string, botToken: string, chatId: string, signalData: any, signalType: string) => {
  try {
    const { data, error } = await supabaseClient.functions.invoke('send-telegram-notification', {
      body: {
        signalId,
        botToken,
        chatId,
        signalData,
        signalType
      }
    });

    if (error) throw error;
    console.log('Telegram notification sent successfully');
    return data;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
};

// Cache cleanup function
const cleanupPriceCache = () => {
  const now = Date.now();
  for (const [key, value] of priceCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      priceCache.delete(key);
    }
  }
  
  // Also cleanup position cache
  for (const [key, value] of positionCache.entries()) {
    if (now - value.timestamp > POSITION_CACHE_DURATION) {
      positionCache.delete(key);
    }
  }
};

console.log('=== Starting optimized 1-minute monitor-trading-signals function ===');
serve(handler);

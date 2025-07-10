import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IndicatorParameters {
  period?: string;
  source?: string;
  fast?: string;
  slow?: string;
  signal?: string;
  deviation?: string;
  k?: string;
  d?: string;
  slowing?: string;
  multiplier?: string;
  [key: string]: string | undefined;
}

interface TradingRule {
  id: string;
  left_type: string;
  left_indicator?: string;
  left_parameters?: IndicatorParameters;
  left_value?: string;
  left_value_type?: string;
  condition: string;
  right_type: string;
  right_indicator?: string;
  right_parameters?: IndicatorParameters;
  right_value?: string;
  right_value_type?: string;
}

interface RuleGroup {
  id: string;
  logic: string;
  required_conditions?: number;
  trading_rules: TradingRule[];
}

interface Strategy {
  id: string;
  name: string;
  target_asset: string;
  timeframe: string;
  user_id: string;
  daily_signal_limit?: number;
  rule_groups: RuleGroup[];
}

// Helper function to extract unique indicator configurations from strategy rules
function extractIndicatorConfigs(strategy: Strategy): Map<string, IndicatorParameters> {
  const indicatorConfigs = new Map<string, IndicatorParameters>();
  
  strategy.rule_groups.forEach(group => {
    group.trading_rules.forEach(rule => {
      // Process left side
      if (rule.left_type === 'INDICATOR' && rule.left_indicator && rule.left_parameters) {
        const key = `${rule.left_indicator}_${JSON.stringify(rule.left_parameters)}`;
        indicatorConfigs.set(key, rule.left_parameters);
      }
      
      // Process right side
      if (rule.right_type === 'INDICATOR' && rule.right_indicator && rule.right_parameters) {
        const key = `${rule.right_indicator}_${JSON.stringify(rule.right_parameters)}`;
        indicatorConfigs.set(key, rule.right_parameters);
      }
    });
  });
  
  return indicatorConfigs;
}

// Helper function to get FMP timeframe
function getFmpTimeframe(timeframe: string): string {
  const timeframeMap: { [key: string]: string } = {
    '1m': '1min',
    '5m': '5min',
    '15m': '15min',
    '30m': '30min',
    '1h': '1hour',
    '4h': '4hour',
    'Daily': '1day',
    'Weekly': '1week',
    'Monthly': '1month'
  };
  
  return timeframeMap[timeframe] || '1day';
}

// Enhanced indicator calculation functions with dynamic parameters
async function calculateRSI(prices: number[], params: IndicatorParameters): Promise<number> {
  const period = parseInt(params.period || '14');
  if (prices.length < period + 1) return 0;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

async function calculateSMA(prices: number[], params: IndicatorParameters): Promise<number> {
  const period = parseInt(params.period || '20');
  if (prices.length < period) return 0;
  
  const sum = prices.slice(0, period).reduce((a, b) => a + b, 0);
  return sum / period;
}

async function calculateEMA(prices: number[], params: IndicatorParameters): Promise<number> {
  const period = parseInt(params.period || '20');
  if (prices.length < period) return 0;
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < Math.min(prices.length, period * 2); i++) {
    ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
  }
  
  return ema;
}

async function calculateMACD(prices: number[], params: IndicatorParameters): Promise<{line: number, signal: number, histogram: number}> {
  const fastPeriod = parseInt(params.fast || params.fastPeriod || '12');
  const slowPeriod = parseInt(params.slow || params.slowPeriod || '26');
  const signalPeriod = parseInt(params.signal || params.signalPeriod || '9');
  
  if (prices.length < slowPeriod) {
    return { line: 0, signal: 0, histogram: 0 };
  }
  
  const fastEMA = await calculateEMA(prices, { period: fastPeriod.toString() });
  const slowEMA = await calculateEMA(prices, { period: slowPeriod.toString() });
  const macdLine = fastEMA - slowEMA;
  
  // For signal line calculation, we'd need historical MACD values
  // Simplified approach for this implementation
  const signalLine = macdLine * 0.9; // Approximation
  const histogram = macdLine - signalLine;
  
  return { line: macdLine, signal: signalLine, histogram };
}

async function calculateCCI(highs: number[], lows: number[], closes: number[], params: IndicatorParameters): Promise<number> {
  const period = parseInt(params.period || '20');
  if (closes.length < period) return 0;
  
  const typicalPrices = closes.slice(0, period).map((close, i) => 
    (highs[i] + lows[i] + close) / 3
  );
  
  const sma = typicalPrices.reduce((a, b) => a + b, 0) / period;
  const meanDeviation = typicalPrices.reduce((sum, price) => 
    sum + Math.abs(price - sma), 0
  ) / period;
  
  if (meanDeviation === 0) return 0;
  
  const currentTypicalPrice = (highs[0] + lows[0] + closes[0]) / 3;
  return (currentTypicalPrice - sma) / (0.015 * meanDeviation);
}

async function calculateBollingerBands(prices: number[], params: IndicatorParameters): Promise<{upper: number, middle: number, lower: number}> {
  const period = parseInt(params.period || '20');
  const deviation = parseFloat(params.deviation || params.nbDevUp || params.nbDevDn || '2');
  
  if (prices.length < period) {
    return { upper: 0, middle: 0, lower: 0 };
  }
  
  const sma = await calculateSMA(prices, { period: period.toString() });
  const variance = prices.slice(0, period).reduce((sum, price) => 
    sum + Math.pow(price - sma, 2), 0
  ) / period;
  const stdDev = Math.sqrt(variance);
  
  return {
    upper: sma + (deviation * stdDev),
    middle: sma,
    lower: sma - (deviation * stdDev)
  };
}

async function calculateStochastic(highs: number[], lows: number[], closes: number[], params: IndicatorParameters): Promise<{k: number, d: number}> {
  const kPeriod = parseInt(params.k || params.kPeriod || params.fastK || '14');
  const dPeriod = parseInt(params.d || params.dPeriod || params.fastD || '3');
  
  if (closes.length < kPeriod) return { k: 0, d: 0 };
  
  const highestHigh = Math.max(...highs.slice(0, kPeriod));
  const lowestLow = Math.min(...lows.slice(0, kPeriod));
  
  const k = ((closes[0] - lowestLow) / (highestHigh - lowestLow)) * 100;
  
  // Simplified D calculation (would need historical %K values for accurate calculation)
  const d = k * 0.9; // Approximation
  
  return { k, d };
}

async function calculateATR(highs: number[], lows: number[], closes: number[], params: IndicatorParameters): Promise<number> {
  const period = parseInt(params.period || params.atrPeriod || '14');
  if (closes.length < period + 1) return 0;
  
  let trSum = 0;
  for (let i = 0; i < period; i++) {
    const high = highs[i];
    const low = lows[i];
    const prevClose = i < closes.length - 1 ? closes[i + 1] : closes[i];
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    
    trSum += tr;
  }
  
  return trSum / period;
}

async function calculateWilliamsR(highs: number[], lows: number[], closes: number[], params: IndicatorParameters): Promise<number> {
  const period = parseInt(params.period || '14');
  if (closes.length < period) return 0;
  
  const highestHigh = Math.max(...highs.slice(0, period));
  const lowestLow = Math.min(...lows.slice(0, period));
  
  return ((highestHigh - closes[0]) / (highestHigh - lowestLow)) * -100;
}

async function calculateMFI(highs: number[], lows: number[], closes: number[], volumes: number[], params: IndicatorParameters): Promise<number> {
  const period = parseInt(params.period || '14');
  if (closes.length < period + 1) return 0;
  
  let positiveFlow = 0;
  let negativeFlow = 0;
  
  for (let i = 0; i < period; i++) {
    const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
    const prevTypicalPrice = i < closes.length - 1 ? 
      (highs[i + 1] + lows[i + 1] + closes[i + 1]) / 3 : typicalPrice;
    
    const moneyFlow = typicalPrice * volumes[i];
    
    if (typicalPrice > prevTypicalPrice) {
      positiveFlow += moneyFlow;
    } else if (typicalPrice < prevTypicalPrice) {
      negativeFlow += moneyFlow;
    }
  }
  
  if (negativeFlow === 0) return 100;
  
  const moneyRatio = positiveFlow / negativeFlow;
  return 100 - (100 / (1 + moneyRatio));
}

// Helper function to get price data based on source parameter
function getPriceBySource(candle: any, source: string = 'close'): number {
  switch (source.toLowerCase()) {
    case 'open': return parseFloat(candle.open);
    case 'high': return parseFloat(candle.high);
    case 'low': return parseFloat(candle.low);
    case 'close':
    default: return parseFloat(candle.close);
  }
}

// Enhanced function to calculate all required indicators for a strategy
async function calculateIndicatorsForStrategy(strategy: Strategy, marketData: any[]): Promise<Map<string, any>> {
  const indicators = new Map<string, any>();
  const indicatorConfigs = extractIndicatorConfigs(strategy);
  
  console.log(`Calculating ${indicatorConfigs.size} unique indicator configurations for strategy ${strategy.name}`);
  
  // Extract price arrays
  const closes = marketData.map(candle => parseFloat(candle.close));
  const highs = marketData.map(candle => parseFloat(candle.high));
  const lows = marketData.map(candle => parseFloat(candle.low));
  const volumes = marketData.map(candle => parseFloat(candle.volume || 0));
  
  for (const [configKey, params] of indicatorConfigs) {
    const indicatorName = configKey.split('_')[0];
    
    try {
      let indicatorValue: any;
      
      // Get price data based on source parameter
      const source = params.source || 'close';
      const sourcePrices = marketData.map(candle => getPriceBySource(candle, source));
      
      switch (indicatorName.toLowerCase()) {
        case 'rsi':
          indicatorValue = await calculateRSI(sourcePrices, params);
          break;
          
        case 'sma':
          indicatorValue = await calculateSMA(sourcePrices, params);
          break;
          
        case 'ema':
          indicatorValue = await calculateEMA(sourcePrices, params);
          break;
          
        case 'macd':
          indicatorValue = await calculateMACD(sourcePrices, params);
          break;
          
        case 'cci':
          indicatorValue = await calculateCCI(highs, lows, closes, params);
          break;
          
        case 'bollingerbands':
        case 'bbands':
          indicatorValue = await calculateBollingerBands(sourcePrices, params);
          break;
          
        case 'stochastic':
          indicatorValue = await calculateStochastic(highs, lows, closes, params);
          break;
          
        case 'atr':
          indicatorValue = await calculateATR(highs, lows, closes, params);
          break;
          
        case 'williamsr':
        case 'willr':
          indicatorValue = await calculateWilliamsR(highs, lows, closes, params);
          break;
          
        case 'mfi':
          indicatorValue = await calculateMFI(highs, lows, closes, volumes, params);
          break;
          
        default:
          console.warn(`Unknown indicator: ${indicatorName}`);
          indicatorValue = 0;
      }
      
      indicators.set(configKey, indicatorValue);
      console.log(`Calculated ${indicatorName} with params ${JSON.stringify(params)}: ${JSON.stringify(indicatorValue)}`);
      
    } catch (error) {
      console.error(`Error calculating ${indicatorName}:`, error);
      indicators.set(configKey, 0);
    }
  }
  
  // Also store current prices for PRICE type comparisons
  indicators.set('PRICE_close', closes[0]);
  indicators.set('PRICE_open', parseFloat(marketData[0].open));
  indicators.set('PRICE_high', highs[0]);
  indicators.set('PRICE_low', lows[0]);
  
  return indicators;
}

// Function to get indicator value based on type and parameters
function getIndicatorValue(indicators: Map<string, any>, type: string, indicator?: string, params?: IndicatorParameters, valueType?: string): number {
  if (type === 'PRICE') {
    return indicators.get(`PRICE_${indicator}`) || 0;
  }
  
  if (type === 'INDICATOR' && indicator && params) {
    const configKey = `${indicator}_${JSON.stringify(params)}`;
    const indicatorResult = indicators.get(configKey);
    
    if (typeof indicatorResult === 'object' && indicatorResult !== null) {
      // Handle complex indicators like MACD, Bollinger Bands, Stochastic
      switch (valueType?.toLowerCase()) {
        case 'signal': return indicatorResult.signal || 0;
        case 'line': return indicatorResult.line || 0;
        case 'histogram': return indicatorResult.histogram || 0;
        case 'upper': return indicatorResult.upper || 0;
        case 'middle': return indicatorResult.middle || 0;
        case 'lower': return indicatorResult.lower || 0;
        case 'k': return indicatorResult.k || 0;
        case 'd': return indicatorResult.d || 0;
        default: 
          // Return the main value or first available value
          return indicatorResult.line || indicatorResult.value || indicatorResult.k || Object.values(indicatorResult)[0] || 0;
      }
    }
    
    return typeof indicatorResult === 'number' ? indicatorResult : 0;
  }
  
  return 0;
}

function evaluateCondition(condition: string, leftValue: number, rightValue: number): boolean {
  switch (condition) {
    case 'GREATER_THAN':
      return leftValue > rightValue;
    case 'LESS_THAN':
      return leftValue < rightValue;
    case 'EQUAL':
      return Math.abs(leftValue - rightValue) < 0.0001;
    case 'GREATER_THAN_OR_EQUAL':
      return leftValue >= rightValue;
    case 'LESS_THAN_OR_EQUAL':
      return leftValue <= rightValue;
    case 'CROSSES_ABOVE':
      return leftValue > rightValue;
    case 'CROSSES_BELOW':
      return leftValue < rightValue;
    default:
      return false;
  }
}

function evaluateRuleGroup(group: RuleGroup, indicators: Map<string, any>): boolean {
  if (!group.trading_rules || group.trading_rules.length === 0) {
    return false;
  }

  const results = group.trading_rules.map(rule => {
    const leftValue = rule.left_type === 'VALUE' ? 
      parseFloat(rule.left_value || '0') :
      getIndicatorValue(indicators, rule.left_type, rule.left_indicator, rule.left_parameters, rule.left_value_type);
    
    const rightValue = rule.right_type === 'VALUE' ?
      parseFloat(rule.right_value || '0') :
      getIndicatorValue(indicators, rule.right_type, rule.right_indicator, rule.right_parameters, rule.right_value_type);
    
    const result = evaluateCondition(rule.condition, leftValue, rightValue);
    
    console.log(`Rule evaluation: ${leftValue} ${rule.condition} ${rightValue} = ${result}`);
    return result;
  });

  if (group.logic === 'OR') {
    const requiredConditions = group.required_conditions || 1;
    const metConditions = results.filter(Boolean).length;
    return metConditions >= requiredConditions;
  } else {
    return results.every(Boolean);
  }
}

function evaluateStrategy(strategy: Strategy, indicators: Map<string, any>): { entrySignal: boolean, exitSignal: boolean } {
  const entryGroups = strategy.rule_groups.filter(group => 
    group.trading_rules?.some(rule => rule.id.includes('entry')) || 
    strategy.rule_groups.indexOf(group) % 2 === 0
  );
  
  const exitGroups = strategy.rule_groups.filter(group => 
    group.trading_rules?.some(rule => rule.id.includes('exit')) || 
    strategy.rule_groups.indexOf(group) % 2 === 1
  );

  const entrySignal = entryGroups.length > 0 ? entryGroups.some(group => evaluateRuleGroup(group, indicators)) : false;
  const exitSignal = exitGroups.length > 0 ? exitGroups.some(group => evaluateRuleGroup(group, indicators)) : false;

  return { entrySignal, exitSignal };
}

function checkMarketHours(): boolean {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const utcTimeInMinutes = utcHours * 60 + utcMinutes;
  
  const marketOpenUTC = 14 * 60 + 30;
  const marketCloseUTC = 21 * 60;
  
  return utcTimeInMinutes >= marketOpenUTC && utcTimeInMinutes <= marketCloseUTC;
}

async function sendNotifications(supabase: any, signal: any, strategy: Strategy): Promise<void> {
  console.log(`Sending notifications for signal ${signal.id}`);
  
  try {
    const { data: notificationSettings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', strategy.user_id)
      .single();

    if (!notificationSettings) {
      console.log('No notification settings found for user');
      return;
    }

    const notifications = [];

    if (notificationSettings.email_enabled) {
      notifications.push(
        supabase.functions.invoke('send-email-notification', {
          body: {
            userId: strategy.user_id,
            signalData: signal.signal_data,
            strategyName: strategy.name
          }
        })
      );
    }

    if (notificationSettings.discord_enabled && notificationSettings.discord_webhook_url) {
      notifications.push(
        supabase.functions.invoke('send-discord-notification', {
          body: {
            webhookUrl: notificationSettings.discord_webhook_url,
            signalData: signal.signal_data,
            strategyName: strategy.name
          }
        })
      );
    }

    if (notificationSettings.telegram_enabled && notificationSettings.telegram_bot_token && notificationSettings.telegram_chat_id) {
      notifications.push(
        supabase.functions.invoke('send-telegram-notification', {
          body: {
            botToken: notificationSettings.telegram_bot_token,
            chatId: notificationSettings.telegram_chat_id,
            signalData: signal.signal_data,
            strategyName: strategy.name
          }
        })
      );
    }

    await Promise.all(notifications);
    console.log('All notifications sent successfully');
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const fmpApiKey = Deno.env.get('FMP_API_KEY');
    if (!fmpApiKey) {
      throw new Error('FMP API key not found');
    }

    console.log('Starting signal monitoring process...');

    if (!checkMarketHours()) {
      console.log('Markets are closed, skipping signal generation');
      return new Response(
        JSON.stringify({ message: 'Markets are closed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select(`
        *,
        rule_groups (
          *,
          trading_rules (*)
        )
      `)
      .eq('is_active', true);

    if (strategiesError) {
      throw strategiesError;
    }

    console.log(`Found ${strategies?.length || 0} active strategies`);

    const processedStrategies = [];
    const errors = [];

    for (const strategy of strategies || []) {
      try {
        console.log(`Processing strategy: ${strategy.name} (${strategy.id})`);
        
        if (!strategy.target_asset) {
          console.log(`Skipping strategy ${strategy.name} - no target asset`);
          continue;
        }

        const fmpTimeframe = getFmpTimeframe(strategy.timeframe);
        console.log(`Fetching ${fmpTimeframe} data for ${strategy.target_asset}`);

        const marketDataUrl = `https://financialmodelingprep.com/api/v3/historical-chart/${fmpTimeframe}/${strategy.target_asset}?limit=100&apikey=${fmpApiKey}`;
        
        const marketResponse = await fetch(marketDataUrl);
        if (!marketResponse.ok) {
          throw new Error(`Failed to fetch market data: ${marketResponse.status} ${marketResponse.statusText}`);
        }
        
        const marketData = await marketResponse.json();
        
        if (!Array.isArray(marketData) || marketData.length === 0) {
          console.log(`No market data available for ${strategy.target_asset}`);
          continue;
        }

        console.log(`Retrieved ${marketData.length} data points for ${strategy.target_asset}`);

        const indicators = await calculateIndicatorsForStrategy(strategy, marketData);
        const evaluation = evaluateStrategy(strategy, indicators);

        console.log(`Strategy evaluation for ${strategy.name}:`, evaluation);

        if (evaluation.entrySignal || evaluation.exitSignal) {
          console.log(`Signal detected for strategy ${strategy.name}`);
          
          const signalType = evaluation.entrySignal ? 'entry' : 'exit';
          const signalData = {
            strategy_id: strategy.id,
            strategy_name: strategy.name,
            asset: strategy.target_asset,
            timeframe: strategy.timeframe,
            signal_type: signalType,
            timestamp: new Date().toISOString(),
            current_price: marketData[0].close,
            indicators: Object.fromEntries(indicators)
          };

          const { data: signal, error: signalError } = await supabase
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
            throw signalError;
          }

          await sendNotifications(supabase, signal, strategy);
          
          processedStrategies.push({
            strategy_id: strategy.id,
            strategy_name: strategy.name,
            signal_type: signalType,
            signal_id: signal.id
          });
        } else {
          console.log(`No signals generated for strategy ${strategy.name}`);
        }

      } catch (error) {
        console.error(`Error processing strategy ${strategy.name}:`, error);
        errors.push({
          strategy_id: strategy.id,
          strategy_name: strategy.name,
          error: error.message
        });
      }
    }

    const response = {
      success: true,
      message: `Processed ${strategies?.length || 0} strategies`,
      signals_generated: processedStrategies.length,
      processed_strategies: processedStrategies,
      errors: errors
    };

    console.log('Signal monitoring completed:', response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in monitor-trading-signals:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

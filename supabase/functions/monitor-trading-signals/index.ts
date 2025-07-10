import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Local Technical Indicators Implementation - ALWAYS RECALCULATE WITH FRESH DATA
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

// Add CCI calculation function
const calculateCCI = (high: number[], low: number[], close: number[], period: number = 20): number[] => {
  const result: number[] = [];
  const typicalPrices: number[] = [];
  
  // Calculate typical prices
  for (let i = 0; i < close.length; i++) {
    typicalPrices.push((high[i] + low[i] + close[i]) / 3);
  }
  
  for (let i = period - 1; i < typicalPrices.length; i++) {
    const slice = typicalPrices.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b, 0) / period;
    const meanDeviation = slice.reduce((a, b) => a + Math.abs(b - sma), 0) / period;
    
    const cci = (typicalPrices[i] - sma) / (0.015 * meanDeviation);
    result.push(cci);
  }
  
  return result;
};

// Add Bollinger Bands calculation
const calculateBollingerBands = (data: number[], period: number = 20, deviation: number = 2) => {
  const sma = calculateSMA(data, period);
  const upper: number[] = [];
  const lower: number[] = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    upper.push(mean + (deviation * stdDev));
    lower.push(mean - (deviation * stdDev));
  }
  
  return { upper, middle: sma, lower };
};

// Add Stochastic Oscillator calculation
const calculateStochastic = (high: number[], low: number[], close: number[], kPeriod: number = 14, dPeriod: number = 3) => {
  const k: number[] = [];
  
  for (let i = kPeriod - 1; i < close.length; i++) {
    const highestHigh = Math.max(...high.slice(i - kPeriod + 1, i + 1));
    const lowestLow = Math.min(...low.slice(i - kPeriod + 1, i + 1));
    const kValue = ((close[i] - lowestLow) / (highestHigh - lowestLow)) * 100;
    k.push(kValue);
  }
  
  const d = calculateSMA(k, dPeriod);
  return { k, d };
};

// Add Average True Range calculation
const calculateATR = (high: number[], low: number[], close: number[], period: number = 14): number[] => {
  const trueRanges: number[] = [];
  
  for (let i = 1; i < close.length; i++) {
    const tr1 = high[i] - low[i];
    const tr2 = Math.abs(high[i] - close[i - 1]);
    const tr3 = Math.abs(low[i] - close[i - 1]);
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }
  
  return calculateSMA(trueRanges, period);
};

// Add Williams %R calculation
const calculateWilliamsR = (high: number[], low: number[], close: number[], period: number = 14): number[] => {
  const result: number[] = [];
  
  for (let i = period - 1; i < close.length; i++) {
    const highestHigh = Math.max(...high.slice(i - period + 1, i + 1));
    const lowestLow = Math.min(...low.slice(i - period + 1, i + 1));
    const williamsR = ((highestHigh - close[i]) / (highestHigh - lowestLow)) * -100;
    result.push(williamsR);
  }
  
  return result;
};

// Add Money Flow Index calculation
const calculateMFI = (high: number[], low: number[], close: number[], volume: number[], period: number = 14): number[] => {
  const result: number[] = [];
  const typicalPrices: number[] = [];
  const rawMoneyFlow: number[] = [];
  
  // Calculate typical prices and raw money flow
  for (let i = 0; i < close.length; i++) {
    const typicalPrice = (high[i] + low[i] + close[i]) / 3;
    typicalPrices.push(typicalPrice);
    rawMoneyFlow.push(typicalPrice * volume[i]);
  }
  
  for (let i = period; i < close.length; i++) {
    let positiveFlow = 0;
    let negativeFlow = 0;
    
    for (let j = i - period + 1; j <= i; j++) {
      if (typicalPrices[j] > typicalPrices[j - 1]) {
        positiveFlow += rawMoneyFlow[j];
      } else if (typicalPrices[j] < typicalPrices[j - 1]) {
        negativeFlow += rawMoneyFlow[j];
      }
    }
    
    const moneyFlowRatio = positiveFlow / negativeFlow;
    const mfi = 100 - (100 / (1 + moneyFlowRatio));
    result.push(mfi);
  }
  
  return result;
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

// Get current market price using FMP API - ALWAYS FETCH FRESH PRICE
const getCurrentPrice = async (symbol: string): Promise<number | null> => {
  try {
    const fmpApiKey = Deno.env.get('FMP_API_KEY');
    if (!fmpApiKey) {
      console.error('[PriceService] FMP API key not configured');
      return null;
    }

    console.log(`[PriceService] Fetching FRESH price for ${symbol}...`);
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
    console.log(`[PriceService] FRESH current price for ${symbol}: $${price}`);
    return price;
  } catch (error) {
    console.error(`[PriceService] Error fetching price for ${symbol}:`, error);
    return null;
  }
};

// Fetch FRESH historical data from FMP API - NO CACHING FOR SIGNAL EVALUATION
const fetchFreshMarketData = async (symbol: string, timeframe: string): Promise<any[]> => {
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

    console.log(`[MarketData] Fetching FRESH market data for ${symbol} with timeframe ${timeframe}`);
    
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

    console.log(`[MarketData] Successfully fetched ${marketData.length} FRESH data points for ${symbol}`);
    return marketData;

  } catch (error) {
    console.error(`[MarketData] Error fetching FRESH data for ${symbol}:`, error);
    return [];
  }
};

// Calculate indicator with FRESH market data - SUPPORTS ALL 10 INDICATORS
const getFreshIndicatorValue = async (indicator: string, symbol: string, timeframe: string, parameters: any = {}): Promise<any> => {
  try {
    console.log(`[FreshIndicator] Calculating FRESH ${indicator} for ${symbol} with timeframe ${timeframe}`);
    
    // ALWAYS fetch fresh market data for each indicator calculation
    const marketData = await fetchFreshMarketData(symbol, timeframe);
    if (marketData.length === 0) {
      console.error(`[FreshIndicator] No FRESH market data available for ${symbol}`);
      return null;
    }

    const closes = marketData.map(d => parseFloat(d.close));
    const highs = marketData.map(d => parseFloat(d.high));
    const lows = marketData.map(d => parseFloat(d.low));
    const volumes = marketData.map(d => parseFloat(d.volume || 0));
    
    // Normalize indicator name for case-insensitive matching
    const normalizedIndicator = indicator.toLowerCase().replace(/\s+/g, '');
    
    console.log(`[FreshIndicator] Using ${closes.length} fresh data points for ${indicator} calculation`);
    
    switch (normalizedIndicator) {
      case 'rsi':
        const rsiPeriod = parseInt(parameters.period) || 14;
        const rsiResult = calculateRSI(closes, rsiPeriod);
        const rsiValue = rsiResult[rsiResult.length - 1];
        console.log(`[FreshIndicator] FRESH RSI(${rsiPeriod}) value: ${rsiValue}`);
        return { value: rsiValue };
        
      case 'sma':
        const smaPeriod = parseInt(parameters.period) || 14;
        const smaResult = calculateSMA(closes, smaPeriod);
        const smaValue = smaResult[smaResult.length - 1];
        console.log(`[FreshIndicator] FRESH SMA(${smaPeriod}) value: ${smaValue}`);
        return { value: smaValue };
        
      case 'ema':
        const emaPeriod = parseInt(parameters.period) || 14;
        const emaResult = calculateEMA(closes, emaPeriod);
        const emaValue = emaResult[emaResult.length - 1];
        console.log(`[FreshIndicator] FRESH EMA(${emaPeriod}) value: ${emaValue}`);
        return { value: emaValue };
        
      case 'macd':
        const fastPeriod = parseInt(parameters.fastPeriod) || 12;
        const slowPeriod = parseInt(parameters.slowPeriod) || 26;
        const signalPeriod = parseInt(parameters.signalPeriod) || 9;
        const macdResult = calculateMACD(closes, fastPeriod, slowPeriod, signalPeriod);
        const macdValues = {
          valueMACD: macdResult.macd[macdResult.macd.length - 1],
          valueSignal: macdResult.signal[macdResult.signal.length - 1],
          valueHistogram: macdResult.histogram[macdResult.histogram.length - 1]
        };
        console.log(`[FreshIndicator] FRESH MACD values:`, macdValues);
        return macdValues;
        
      case 'cci':
        const cciPeriod = parseInt(parameters.period) || 20;
        const cciResult = calculateCCI(highs, lows, closes, cciPeriod);
        const cciValue = cciResult[cciResult.length - 1];
        console.log(`[FreshIndicator] FRESH CCI(${cciPeriod}) value: ${cciValue}`);
        return { value: cciValue };
        
      case 'bollingerbands':
      case 'bbands':
        const bbPeriod = parseInt(parameters.period) || 20;
        const bbDeviation = parseFloat(parameters.deviation) || 2;
        const bbResult = calculateBollingerBands(closes, bbPeriod, bbDeviation);
        const bbValues = {
          upper: bbResult.upper[bbResult.upper.length - 1],
          middle: bbResult.middle[bbResult.middle.length - 1],
          lower: bbResult.lower[bbResult.lower.length - 1]
        };
        console.log(`[FreshIndicator] FRESH Bollinger Bands values:`, bbValues);
        return bbValues;
        
      case 'stochastic':
      case 'stoch':
        const kPeriod = parseInt(parameters.kPeriod) || 14;
        const dPeriod = parseInt(parameters.dPeriod) || 3;
        const stochResult = calculateStochastic(highs, lows, closes, kPeriod, dPeriod);
        const stochValues = {
          k: stochResult.k[stochResult.k.length - 1],
          d: stochResult.d[stochResult.d.length - 1]
        };
        console.log(`[FreshIndicator] FRESH Stochastic values:`, stochValues);
        return stochValues;
        
      case 'atr':
        const atrPeriod = parseInt(parameters.period) || 14;
        const atrResult = calculateATR(highs, lows, closes, atrPeriod);
        const atrValue = atrResult[atrResult.length - 1];
        console.log(`[FreshIndicator] FRESH ATR(${atrPeriod}) value: ${atrValue}`);
        return { value: atrValue };
        
      case 'williamsr':
      case 'willr':
        const wrPeriod = parseInt(parameters.period) || 14;
        const wrResult = calculateWilliamsR(highs, lows, closes, wrPeriod);
        const wrValue = wrResult[wrResult.length - 1];
        console.log(`[FreshIndicator] FRESH Williams %R(${wrPeriod}) value: ${wrValue}`);
        return { value: wrValue };
        
      case 'mfi':
        const mfiPeriod = parseInt(parameters.period) || 14;
        const mfiResult = calculateMFI(highs, lows, closes, volumes, mfiPeriod);
        const mfiValue = mfiResult[mfiResult.length - 1];
        console.log(`[FreshIndicator] FRESH MFI(${mfiPeriod}) value: ${mfiValue}`);
        return { value: mfiValue };
        
      default:
        console.error(`[FreshIndicator] Unsupported indicator: ${indicator}`);
        return null;
    }
  } catch (error) {
    console.error(`[FreshIndicator] Error calculating FRESH ${indicator} for ${symbol}:`, error);
    return null;
  }
};

// Extract value from indicator response (updated for all indicators)
const getIndicatorValue = (indicator: string, data: any, valueType?: string): number | null => {
  if (!data) return null;

  try {
    const normalizedIndicator = indicator.toLowerCase().replace(/\s+/g, '');
    
    switch (normalizedIndicator) {
      case 'rsi':
      case 'sma':
      case 'ema':
      case 'cci':
      case 'atr':
      case 'williamsr':
      case 'willr':
      case 'mfi':
        return data.value || null;
        
      case 'macd':
        if (valueType === 'MACD Signal') return data.valueSignal || null;
        if (valueType === 'MACD Histogram') return data.valueHistogram || null;
        return data.valueMACD || null;
        
      case 'bollingerbands':
      case 'bbands':
        if (valueType === 'Upper Band') return data.upper || null;
        if (valueType === 'Lower Band') return data.lower || null;
        return data.middle || null;
        
      case 'stochastic':
      case 'stoch':
        if (valueType === '%D') return data.d || null;
        return data.k || null;
        
      default:
        return data.value || null;
    }
  } catch (error) {
    console.error(`[IndicatorValue] Error extracting value from ${indicator}:`, error);
    return null;
  }
};

// Enhanced condition evaluation with FRESH indicator data for every evaluation
const evaluateCondition = async (
  rule: any,
  asset: string,
  currentPrice: number,
  timeframe: string
): Promise<{ conditionMet: boolean; reason: string; leftValue: number | null; rightValue: number | null }> => {
  try {
    console.log(`[ConditionEval] Evaluating rule condition with FRESH data:`, JSON.stringify(rule, null, 2));

    // Get left side value with FRESH data
    let leftValue: number | null = null;
    if (rule.left_type === 'PRICE') {
      leftValue = currentPrice;
      console.log(`[ConditionEval] Left side - using current price: ${leftValue}`);
    } else if (rule.left_type === 'VALUE') {
      leftValue = parseFloat(rule.left_value);
      if (isNaN(leftValue)) {
        return { conditionMet: false, reason: 'Invalid left value', leftValue: null, rightValue: null };
      }
      console.log(`[ConditionEval] Left side - using constant value: ${leftValue}`);
    } else if (rule.left_type === 'INDICATOR') {
      if (!rule.left_indicator) {
        return { conditionMet: false, reason: 'Left indicator not specified', leftValue: null, rightValue: null };
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
      
      console.log(`[ConditionEval] Left side - fetching FRESH ${rule.left_indicator} data...`);
      const indicatorData = await getFreshIndicatorValue(
        rule.left_indicator,
        asset,
        timeframe,
        cleanParameters
      );
      
      leftValue = getIndicatorValue(
        rule.left_indicator,
        indicatorData,
        rule.left_value_type
      );
      console.log(`[ConditionEval] Left side - FRESH ${rule.left_indicator} value: ${leftValue}`);
    }

    // Get right side value with FRESH data
    let rightValue: number | null = null;
    if (rule.right_type === 'PRICE') {
      rightValue = currentPrice;
      console.log(`[ConditionEval] Right side - using current price: ${rightValue}`);
    } else if (rule.right_type === 'VALUE') {
      rightValue = parseFloat(rule.right_value);
      if (isNaN(rightValue)) {
        return { conditionMet: false, reason: 'Invalid right value', leftValue, rightValue: null };
      }
      console.log(`[ConditionEval] Right side - using constant value: ${rightValue}`);
    } else if (rule.right_type === 'INDICATOR') {
      if (!rule.right_indicator) {
        return { conditionMet: false, reason: 'Right indicator not specified', leftValue, rightValue: null };
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
      
      console.log(`[ConditionEval] Right side - fetching FRESH ${rule.right_indicator} data...`);
      const indicatorData = await getFreshIndicatorValue(
        rule.right_indicator,
        asset,
        timeframe,
        cleanParameters
      );
      
      rightValue = getIndicatorValue(
        rule.right_indicator,
        indicatorData,
        rule.right_value_type
      );
      console.log(`[ConditionEval] Right side - FRESH ${rule.right_indicator} value: ${rightValue}`);
    }

    if (leftValue === null || rightValue === null) {
      const reason = `Invalid values after FRESH data fetch - Left: ${leftValue}, Right: ${rightValue}`;
      console.log(`[ConditionEval] ${reason}`);
      return { conditionMet: false, reason, leftValue, rightValue };
    }

    console.log(`[ConditionEval] Comparing FRESH values: ${leftValue} ${rule.condition} ${rightValue}`);

    // Evaluate condition with proper validation
    let conditionMet = false;
    switch (rule.condition) {
      case 'GREATER_THAN':
      case '>':
        conditionMet = leftValue > rightValue;
        break;
      case 'LESS_THAN':
      case '<':
        conditionMet = leftValue < rightValue;
        break;
      case 'GREATER_THAN_OR_EQUAL':
      case '>=':
        conditionMet = leftValue >= rightValue;
        break;
      case 'LESS_THAN_OR_EQUAL':
      case '<=':
        conditionMet = leftValue <= rightValue;
        break;
      case 'EQUAL':
      case '==':
        conditionMet = Math.abs(leftValue - rightValue) < 0.0001;
        break;
      case 'NOT_EQUAL':
      case '!=':
        conditionMet = Math.abs(leftValue - rightValue) >= 0.0001;
        break;
      default:
        return { conditionMet: false, reason: `Unknown condition: ${rule.condition}`, leftValue, rightValue };
    }

    const reason = conditionMet 
      ? `Condition met with FRESH data: ${leftValue} ${rule.condition} ${rightValue}` 
      : `Condition not met with FRESH data: ${leftValue} ${rule.condition} ${rightValue}`;
    
    console.log(`[ConditionEval] ${reason}`);
    return { conditionMet, reason, leftValue, rightValue };
  } catch (error) {
    console.error('[ConditionEval] Error evaluating condition with fresh data:', error);
    return { conditionMet: false, reason: `Error: ${error.message}`, leftValue: null, rightValue: null };
  }
};

// Enhanced rule group evaluation with strict condition checking using FRESH data
const evaluateRuleGroups = async (
  ruleGroups: any[],
  asset: string,
  currentPrice: number,
  timeframe: string
): Promise<{ signalGenerated: boolean; details: string[]; matchedConditions: string[] }> => {
  try {
    console.log(`[RuleGroupEval] Evaluating ${ruleGroups.length} rule groups with FRESH indicator data`);
    
    const details: string[] = [];
    const matchedConditions: string[] = [];
    
    // Separate AND and OR groups
    const andGroups = ruleGroups.filter(group => group.logic === 'AND');
    const orGroups = ruleGroups.filter(group => group.logic === 'OR');

    console.log(`[RuleGroupEval] Found ${andGroups.length} AND groups and ${orGroups.length} OR groups`);

    let allAndGroupsSatisfied = true;
    let allOrGroupsSatisfied = true;

    // Evaluate AND groups - ALL conditions must be satisfied
    for (const andGroup of andGroups) {
      if (!andGroup.trading_rules || andGroup.trading_rules.length === 0) {
        details.push(`AND Group ${andGroup.id}: No rules defined`);
        allAndGroupsSatisfied = false;
        continue;
      }
      
      let allConditionsMet = true;
      let conditionsMetCount = 0;
      
      for (const rule of andGroup.trading_rules) {
        // Each condition evaluation fetches FRESH indicator data
        const conditionResult = await evaluateCondition(rule, asset, currentPrice, timeframe);
        if (conditionResult.conditionMet) {
          conditionsMetCount++;
          matchedConditions.push(conditionResult.reason);
        } else {
          allConditionsMet = false;
          details.push(`AND Group ${andGroup.id}: ${conditionResult.reason}`);
        }
      }
      
      details.push(`AND Group ${andGroup.id}: ${conditionsMetCount}/${andGroup.trading_rules.length} conditions met with FRESH data`);
      
      if (!allConditionsMet) {
        allAndGroupsSatisfied = false;
        console.log(`[RuleGroupEval] AND group ${andGroup.id} failed - not all conditions met with FRESH data`);
      }
    }

    // Evaluate OR groups - required number of conditions must be met
    for (const orGroup of orGroups) {
      if (!orGroup.trading_rules || orGroup.trading_rules.length === 0) {
        details.push(`OR Group ${orGroup.id}: No rules defined`);
        allOrGroupsSatisfied = false;
        continue;
      }
      
      let conditionsMetCount = 0;
      
      for (const rule of orGroup.trading_rules) {
        // Each condition evaluation fetches FRESH indicator data
        const conditionResult = await evaluateCondition(rule, asset, currentPrice, timeframe);
        if (conditionResult.conditionMet) {
          conditionsMetCount++;
          matchedConditions.push(conditionResult.reason);
        } else {
          details.push(`OR Group ${orGroup.id}: ${conditionResult.reason}`);
        }
      }
      
      const requiredConditions = orGroup.required_conditions || 1;
      details.push(`OR Group ${orGroup.id}: ${conditionsMetCount}/${orGroup.trading_rules.length} conditions met with FRESH data (required: ${requiredConditions})`);
      
      if (conditionsMetCount < requiredConditions) {
        allOrGroupsSatisfied = false;
        console.log(`[RuleGroupEval] OR group ${orGroup.id} failed - insufficient conditions met with FRESH data`);
      }
    }

    const signalGenerated = allAndGroupsSatisfied && allOrGroupsSatisfied && matchedConditions.length > 0;
    console.log(`[RuleGroupEval] Final result with FRESH data: AND=${allAndGroupsSatisfied}, OR=${allOrGroupsSatisfied}, MatchedConditions=${matchedConditions.length}, Signal=${signalGenerated}`);

    return { signalGenerated, details, matchedConditions };
  } catch (error) {
    console.error('[RuleGroupEval] Error evaluating rule groups with fresh data:', error);
    return { signalGenerated: false, details: [`Error: ${error.message}`], matchedConditions: [] };
  }
};

// Check daily signal limit for notifications (not signal generation)
const checkDailyNotificationLimit = async (strategyId: string, supabaseClient: any): Promise<boolean> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get strategy's daily limit
    const { data: strategy, error: strategyError } = await supabaseClient
      .from('strategies')
      .select('daily_signal_limit')
      .eq('id', strategyId)
      .single();

    if (strategyError || !strategy) {
      console.error('[NotificationLimit] Error fetching strategy:', strategyError);
      return true; // Allow notifications if we can't fetch strategy
    }

    // Count today's signals for this strategy
    const { data: signalCount } = await supabaseClient
      .from('trading_signals')
      .select('id', { count: 'exact' })
      .eq('strategy_id', strategyId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    const dailyLimit = strategy.daily_signal_limit || 5;
    const currentCount = signalCount ? signalCount.length : 0;
    
    console.log(`[NotificationLimit] Strategy ${strategyId}: ${currentCount}/${dailyLimit} signals today`);
    
    return currentCount < dailyLimit;
  } catch (error) {
    console.error('[NotificationLimit] Error checking daily limit:', error);
    return true; // Allow notifications on error
  }
};

// Send notifications directly using individual edge functions
const sendNotificationsForSignal = async (
  signalId: string,
  userId: string,
  signalType: string,
  signalData: any,
  supabaseClient: any
) => {
  try {
    console.log(`[Notifications] Starting notification delivery for signal: ${signalId}`);

    // Get user's notification settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('[Notifications] Error fetching notification settings:', settingsError);
      return [];
    }

    if (!settings) {
      console.log('[Notifications] No notification settings found for user:', userId);
      return [];
    }

    console.log('[Notifications] User notification settings:', settings);

    // Check if this type of signal should be sent
    const shouldSendEntry = signalType === 'entry' && settings.entry_signals;
    const shouldSendExit = signalType === 'exit' && settings.exit_signals;
    
    if (!shouldSendEntry && !shouldSendExit) {
      console.log(`[Notifications] Signal type ${signalType} not enabled for notifications`);
      return [];
    }

    // Prepare enhanced signal data
    const enhancedSignalData = {
      ...signalData,
      signalId: signalId,
      userId: userId,
      timestamp: new Date().toISOString()
    };

    const notifications = [];

    // Send Discord notification
    if (settings.discord_enabled && settings.discord_webhook_url) {
      console.log('[Notifications] Sending Discord notification...');
      try {
        const discordResult = await supabaseClient.functions.invoke('send-discord-notification', {
          body: {
            webhookUrl: settings.discord_webhook_url,
            signalData: enhancedSignalData,
            signalType: signalType
          }
        });
        
        if (discordResult.error) {
          console.error('[Notifications] Discord notification failed:', discordResult.error);
        } else {
          console.log('[Notifications] Discord notification sent successfully');
          notifications.push('discord');
        }
      } catch (error) {
        console.error('[Notifications] Discord notification error:', error);
      }
    }

    // Send Telegram notification
    if (settings.telegram_enabled && settings.telegram_bot_token && settings.telegram_chat_id) {
      console.log('[Notifications] Sending Telegram notification...');
      try {
        const telegramResult = await supabaseClient.functions.invoke('send-telegram-notification', {
          body: {
            botToken: settings.telegram_bot_token,
            chatId: settings.telegram_chat_id,
            signalData: enhancedSignalData,
            signalType: signalType
          }
        });
        
        if (telegramResult.error) {
          console.error('[Notifications] Telegram notification failed:', telegramResult.error);
        } else {
          console.log('[Notifications] Telegram notification sent successfully');
          notifications.push('telegram');
        }
      } catch (error) {
        console.error('[Notifications] Telegram notification error:', error);
      }
    }

    // Send Email notification
    if (settings.email_enabled) {
      console.log('[Notifications] Sending Email notification...');
      try {
        // Get user email from auth
        const { data: user, error: userError } = await supabaseClient.auth.admin.getUserById(userId);
        if (user?.user?.email) {
          const emailResult = await supabaseClient.functions.invoke('send-email-notification', {
            body: {
              userEmail: user.user.email,
              signalData: enhancedSignalData,
              signalType: signalType
            }
          });
          
          if (emailResult.error) {
            console.error('[Notifications] Email notification failed:', emailResult.error);
          } else {
            console.log('[Notifications] Email notification sent successfully');
            notifications.push('email');
          }
        }
      } catch (error) {
        console.error('[Notifications] Email notification error:', error);
      }
    }

    console.log(`[Notifications] Notifications sent via: ${notifications.join(', ')}`);
    return notifications;

  } catch (error) {
    console.error('[Notifications] Error in sendNotificationsForSignal:', error);
    return [];
  }
};

// Enhanced signal generation with FRESH indicator data verification
const generateSignalForStrategy = async (
  strategyId: string,
  userId: string,
  supabaseClient: any
) => {
  try {
    console.log(`[SignalGen] Starting signal generation with FRESH indicator data for strategy: ${strategyId}`);

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

    // Check if strategy has valid trading rules
    const entryRules = strategy.rule_groups?.filter((rg: any) => rg.rule_type === 'entry') || [];
    const exitRules = strategy.rule_groups?.filter((rg: any) => rg.rule_type === 'exit') || [];

    console.log(`[SignalGen] Found ${entryRules.length} entry rule groups and ${exitRules.length} exit rule groups`);

    if (entryRules.length === 0 && exitRules.length === 0) {
      return {
        signalGenerated: false,
        reason: 'No trading rules defined'
      };
    }

    // Get FRESH current market price
    const currentPrice = await getCurrentPrice(strategy.target_asset);
    if (!currentPrice) {
      console.error(`[SignalGen] Failed to get current price for ${strategy.target_asset}`);
      return {
        signalGenerated: false,
        reason: `Failed to get current price for ${strategy.target_asset}`
      };
    }

    console.log(`[SignalGen] FRESH current price for ${strategy.target_asset}: $${currentPrice}`);

    // Map timeframe for indicator calculations
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

    // CRITICAL: Properly evaluate trading rules against CURRENT market conditions with FRESH data
    let signalType: 'entry' | 'exit' | null = null;
    let evaluationDetails: string[] = [];
    let matchedConditions: string[] = [];
    
    console.log(`[SignalGen] Starting rule evaluation with FRESH indicator data...`);
    
    // Evaluate entry rules first with strict condition checking using FRESH data
    if (entryRules.length > 0) {
      console.log(`[SignalGen] Evaluating entry rules against FRESH market conditions...`);
      const entryEvaluation = await evaluateRuleGroups(
        entryRules,
        strategy.target_asset,
        currentPrice,
        taapiInterval
      );
      
      evaluationDetails.push('Entry Rules (with FRESH data):', ...entryEvaluation.details);
      
      // ONLY generate signal if conditions are ACTUALLY met with FRESH data
      if (entryEvaluation.signalGenerated && entryEvaluation.matchedConditions.length > 0) {
        signalType = 'entry';
        matchedConditions = entryEvaluation.matchedConditions;
        console.log(`[SignalGen] ✓ Entry signal conditions VERIFIED and met with FRESH data - ${matchedConditions.length} matched conditions`);
      } else {
        console.log(`[SignalGen] ✗ Entry signal conditions NOT met with FRESH data - no signal generated`);
      }
    }

    // If no entry signal generated, check exit rules with strict validation using FRESH data
    if (!signalType && exitRules.length > 0) {
      console.log(`[SignalGen] Evaluating exit rules against FRESH market conditions...`);
      const exitEvaluation = await evaluateRuleGroups(
        exitRules,
        strategy.target_asset,
        currentPrice,
        taapiInterval
      );
      
      evaluationDetails.push('Exit Rules (with FRESH data):', ...exitEvaluation.details);
      
      // ONLY generate signal if conditions are ACTUALLY met with FRESH data
      if (exitEvaluation.signalGenerated && exitEvaluation.matchedConditions.length > 0) {
        signalType = 'exit';
        matchedConditions = exitEvaluation.matchedConditions;
        console.log(`[SignalGen] ✓ Exit signal conditions VERIFIED and met with FRESH data - ${matchedConditions.length} matched conditions`);
      } else {
        console.log(`[SignalGen] ✗ Exit signal conditions NOT met with FRESH data - no signal generated`);
      }
    }

    // If no signal conditions are verified and met with FRESH data, return early
    if (!signalType || matchedConditions.length === 0) {
      console.log(`[SignalGen] No signal conditions met with FRESH data for strategy: ${strategyId}`);
      return {
        signalGenerated: false,
        reason: 'Market conditions do not meet trading rule criteria (verified with FRESH data)',
        evaluationDetails,
        matchedConditions: []
      };
    }

    // Create signal data with FRESH data verification details
    const signalData = {
      strategyId: strategyId,
      strategyName: strategy.name,
      targetAsset: strategy.target_asset,
      price: currentPrice,
      userId: userId,
      timestamp: new Date().toISOString(),
      timeframe: strategy.timeframe,
      reason: `${signalType} signal - conditions verified and met with FRESH data`,
      evaluationDetails,
      matchedConditions,
      conditionsVerified: true,
      conditionsMetCount: matchedConditions.length,
      freshDataUsed: true,
      verificationTimestamp: new Date().toISOString()
    };

    // ONLY create signal if conditions are verified and met with FRESH data
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

    console.log(`[SignalGen] ✓ Signal created successfully with FRESH data verification: ${signal.id}`);
    
    // Check if external notifications should be sent
    const shouldSendNotifications = strategy.signal_notifications_enabled;
    let notificationStatus = 'disabled';
    
    if (shouldSendNotifications) {
      // Check daily notification limit
      const withinLimit = await checkDailyNotificationLimit(strategyId, supabaseClient);
      
      if (withinLimit) {
        notificationStatus = 'sent';
        console.log(`[SignalGen] Sending external notifications for FRESH data verified signal: ${signal.id}`);
      } else {
        notificationStatus = 'limit_exceeded';
        console.log(`[SignalGen] Daily notification limit exceeded, skipping external notifications`);
      }
    } else {
      console.log(`[SignalGen] External notifications disabled for strategy`);
    }

    return {
      signalGenerated: true,
      signalId: signal.id,
      signalType: signalType,
      reason: `${signalType} signal generated - conditions verified and met with FRESH data`,
      evaluationDetails,
      matchedConditions,
      notificationStatus,
      shouldSendNotifications: shouldSendNotifications && notificationStatus === 'sent',
      freshDataVerified: true
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

    console.log('[Monitor] Starting trading signal monitoring with FRESH indicator data verification for ALL 10 indicators...');

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

    // Get all active strategies
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
        rule_groups(
          id,
          rule_type,
          logic,
          required_conditions,
          trading_rules(id)
        )
      `)
      .eq('is_active', true);

    if (strategiesError) {
      console.error('[Monitor] Error fetching strategies:', strategiesError);
      throw strategiesError;
    }

    if (!strategies || strategies.length === 0) {
      console.log('[Monitor] No active strategies found');
      return new Response(
        JSON.stringify({ message: 'No active strategies found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Monitor] Found ${strategies.length} active strategies to monitor with FRESH data for ALL 10 indicators`);

    const results = [];

    // Process each strategy with FRESH indicator data verification
    for (const strategy of strategies) {
      try {
        console.log(`[Monitor] Processing strategy with FRESH data for ALL indicators: ${strategy.name} (${strategy.id})`);

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

        // Generate signal with FRESH indicator data verification for ALL 10 indicators
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
          evaluationDetails: signalResult.evaluationDetails || [],
          matchedConditions: signalResult.matchedConditions || [],
          conditionsVerified: signalResult.signalGenerated,
          freshDataVerified: signalResult.freshDataVerified || false,
          notificationStatus: signalResult.notificationStatus,
          externalNotificationsEnabled: strategy.signal_notifications_enabled,
          indicatorsSupported: 'ALL 10 indicators (RSI, SMA, EMA, MACD, CCI, Bollinger Bands, Stochastic, ATR, Williams %R, MFI)'
        });

        // Send external notifications if signal was generated and verified with FRESH data
        if (signalResult.signalGenerated && signalResult.shouldSendNotifications && signalResult.signalId) {
          console.log(`[Monitor] Signal verified with FRESH data for ${strategy.name}, sending external notifications...`);
          
          try {
            const notifications = await sendNotificationsForSignal(
              signalResult.signalId,
              strategy.user_id,
              signalResult.signalType,
              {
                strategyId: strategy.id,
                strategyName: strategy.name,
                targetAsset: strategy.target_asset,
                price: signalResult.evaluationDetails?.[0] || 'N/A',
                timeframe: strategy.timeframe,
                conditionsVerified: true,
                freshDataVerified: true,
                matchedConditions: signalResult.matchedConditions
              },
              supabaseClient
            );

            console.log(`[Monitor] External notifications sent successfully: ${notifications.join(', ')}`);
            
            const resultIndex = results.length - 1;
            results[resultIndex].notificationsSent = notifications;
          } catch (notificationError) {
            console.error('[Monitor] Error sending external notifications:', notificationError);
            const resultIndex = results.length - 1;
            results[resultIndex].notificationError = notificationError.message;
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
    const notificationsSent = results.filter(r => r.notificationsSent && r.notificationsSent.length > 0).length;
    
    console.log(`[Monitor] Signal monitoring completed with FRESH data verification for ALL 10 indicators. Generated ${signalsGenerated} verified signals from ${results.length} strategies, sent ${notificationsSent} external notifications`);

    return new Response(
      JSON.stringify({
        message: 'Signal monitoring completed with FRESH indicator data verification for ALL 10 indicators',
        processedStrategies: results.length,
        signalsGenerated: signalsGenerated,
        externalNotificationsSent: notificationsSent,
        results: results,
        timestamp: new Date().toISOString(),
        marketOpen: isMarketHours(),
        manualTrigger: isManualTrigger,
        freshDataVerification: true,
        conditionValidationEnabled: true,
        supportedIndicators: ['RSI', 'SMA', 'EMA', 'MACD', 'CCI', 'Bollinger Bands', 'Stochastic', 'ATR', 'Williams %R', 'MFI']
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

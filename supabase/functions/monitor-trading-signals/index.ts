import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Type definitions
interface Strategy {
  id: string;
  name: string;
  target_asset: string;
  timeframe: string;
  user_id: string;
  daily_signal_limit?: number;
  is_active: boolean;
  rule_groups: RuleGroup[];
}

interface RuleGroup {
  id: string;
  logic: 'AND' | 'OR';
  rule_type: 'entry' | 'exit';
  required_conditions?: number;
  trading_rules: TradingRule[];
}

interface TradingRule {
  id: string;
  left_type: string;
  left_indicator?: string;
  left_parameters?: Record<string, any>;
  left_value?: string;
  left_value_type?: string;
  condition: string;
  right_type: string;
  right_indicator?: string;
  right_parameters?: Record<string, any>;
  right_value?: string;
  right_value_type?: string;
}

interface MarketData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Price source calculation helper
class PriceSourceCalculator {
  static calculateSource(data: MarketData[], source: string): number[] {
    switch (source?.toLowerCase()) {
      case 'open':
        return data.map(d => d.open);
      case 'high':
        return data.map(d => d.high);
      case 'low':
        return data.map(d => d.low);
      case 'close':
      default:
        return data.map(d => d.close);
      case 'hl2':
        return data.map(d => (d.high + d.low) / 2);
      case 'hlc3':
        return data.map(d => (d.high + d.low + d.close) / 3);
      case 'ohlc4':
        return data.map(d => (d.open + d.high + d.low + d.close) / 4);
    }
  }
}

// Technical Indicators Calculator Class
class TechnicalIndicators {
  // Simple Moving Average
  static calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    const sum = prices.slice(0, period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  // Exponential Moving Average
  static calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    
    const multiplier = 2 / (period + 1);
    let ema = this.calculateSMA(prices.slice(0, period), period);
    
    for (let i = period; i < Math.min(prices.length, period * 2); i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  // Weighted Moving Average
  static calculateWMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    
    let weightedSum = 0;
    let weightSum = 0;
    
    for (let i = 0; i < period; i++) {
      const weight = i + 1;
      weightedSum += prices[i] * weight;
      weightSum += weight;
    }
    
    return weightedSum / weightSum;
  }

  // Relative Strength Index
  static calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = prices[i - 1] - prices[i];
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

  // MACD
  static calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): { line: number, signal: number, histogram: number } {
    if (prices.length < slowPeriod) return { line: 0, signal: 0, histogram: 0 };
    
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);
    const macdLine = fastEMA - slowEMA;
    
    // Simplified signal line calculation
    const signalLine = macdLine * 0.9;
    const histogram = macdLine - signalLine;
    
    return { line: macdLine, signal: signalLine, histogram };
  }

  // Commodity Channel Index with proper source handling
  static calculateCCI(data: MarketData[], period: number = 20, source: string = 'hlc3'): number {
    if (data.length < period) return 0;
    
    let typicalPrices: number[];
    
    // Use proper source calculation
    typicalPrices = PriceSourceCalculator.calculateSource(data.slice(0, period), source);
    
    const sma = typicalPrices.reduce((a, b) => a + b, 0) / period;
    const meanDeviation = typicalPrices.reduce((sum, price) => 
      sum + Math.abs(price - sma), 0
    ) / period;
    
    if (meanDeviation === 0) return 0;
    
    const currentTypicalPrice = typicalPrices[0];
    return (currentTypicalPrice - sma) / (0.015 * meanDeviation);
  }

  // Bollinger Bands
  static calculateBollingerBands(prices: number[], period: number = 20, deviation: number = 2): { upper: number, middle: number, lower: number } {
    if (prices.length < period) return { upper: 0, middle: 0, lower: 0 };
    
    const sma = this.calculateSMA(prices, period);
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

  // Stochastic Oscillator
  static calculateStochastic(data: MarketData[], kPeriod: number = 14, dPeriod: number = 3): { k: number, d: number } {
    if (data.length < kPeriod) return { k: 0, d: 0 };
    
    const highs = data.slice(0, kPeriod).map(d => d.high);
    const lows = data.slice(0, kPeriod).map(d => d.low);
    const closes = data.slice(0, kPeriod).map(d => d.close);
    
    const highestHigh = Math.max(...highs);
    const lowestLow = Math.min(...lows);
    
    const k = ((closes[0] - lowestLow) / (highestHigh - lowestLow)) * 100;
    const d = k * 0.9; // Simplified
    
    return { k, d };
  }

  // Average True Range
  static calculateATR(data: MarketData[], period: number = 14): number {
    if (data.length < period + 1) return 0;
    
    let trSum = 0;
    
    for (let i = 0; i < period; i++) {
      const high = data[i].high;
      const low = data[i].low;
      const prevClose = i < data.length - 1 ? data[i + 1].close : data[i].close;
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      
      trSum += tr;
    }
    
    return trSum / period;
  }

  // Money Flow Index
  static calculateMFI(data: MarketData[], period: number = 14): number {
    if (data.length < period + 1) return 50;
    
    let positiveFlow = 0;
    let negativeFlow = 0;
    
    for (let i = 0; i < period; i++) {
      const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3;
      const prevTypicalPrice = i < data.length - 1 ? 
        (data[i + 1].high + data[i + 1].low + data[i + 1].close) / 3 : typicalPrice;
      
      const moneyFlow = typicalPrice * data[i].volume;
      
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
}

// Market Hours Checker
class MarketHoursChecker {
  static isMarketOpen(): boolean {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        weekday: 'long',
        hour12: false
      });
      
      const parts = formatter.formatToParts(now);
      const partsObj = parts.reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
      }, {} as any);
      
      const dayName = partsObj.weekday;
      const hour = parseInt(partsObj.hour);
      const minute = parseInt(partsObj.minute);
      
      console.log(`[MarketHours] Current EST time: ${dayName} ${partsObj.hour}:${partsObj.minute}`);
      
      // Check if it's a weekday
      const isWeekday = !['Saturday', 'Sunday'].includes(dayName);
      
      if (!isWeekday) {
        console.log(`[MarketHours] Market closed - Weekend`);
        return false;
      }
      
      // Market hours: 9:30 AM to 4:00 PM EST
      const currentMinutes = hour * 60 + minute;
      const marketOpen = 9 * 60 + 30; // 9:30 AM
      const marketClose = 16 * 60; // 4:00 PM
      
      const isOpen = currentMinutes >= marketOpen && currentMinutes < marketClose;
      console.log(`[MarketHours] Market is ${isOpen ? 'OPEN' : 'CLOSED'}`);
      
      return isOpen;
    } catch (error) {
      console.error('[MarketHours] Error checking market hours:', error);
      return false;
    }
  }
}

// Market Data Service
class MarketDataService {
  private fmpApiKey: string;

  constructor(fmpApiKey: string) {
    this.fmpApiKey = fmpApiKey;
  }

  private mapTimeframeToFmpInterval(timeframe: string): string {
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

  // Get the most recent market data with current real-time timestamp
  async fetchCurrentMarketData(symbol: string, timeframe: string, limit: number = 100): Promise<MarketData[]> {
    const fmpInterval = this.mapTimeframeToFmpInterval(timeframe);
    let endpoint: string;
    
    // Record the exact time when we start fetching data
    const dataExtractionTime = new Date().toISOString();
    console.log(`[MarketData] Starting data extraction for ${symbol} at REAL-TIME: ${dataExtractionTime}`);
    
    if (['1min', '5min', '15min', '30min', '1hour', '4hour'].includes(fmpInterval)) {
      endpoint = `https://financialmodelingprep.com/api/v3/historical-chart/${fmpInterval}/${symbol}?apikey=${this.fmpApiKey}`;
    } else {
      endpoint = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${this.fmpApiKey}`;
    }

    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let marketData: MarketData[] = [];
    
    if (fmpInterval === '1day' || fmpInterval === '1week' || fmpInterval === '1month') {
      if (data.historical && Array.isArray(data.historical)) {
        marketData = data.historical
          .slice(0, limit)
          .map((item: any) => ({
            date: item.date,
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
            volume: parseInt(item.volume || 0)
          }))
          .reverse();
      }
    } else {
      if (Array.isArray(data)) {
        // For intraday data, get the most recent data points
        const sortedData = data
          .map((item: any) => ({
            date: item.date,
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
            volume: parseInt(item.volume || 0),
            timestamp: new Date(item.date).getTime()
          }))
          .sort((a, b) => b.timestamp - a.timestamp);

        // Take the most recent data points
        marketData = sortedData.slice(0, limit);
      }
    }

    if (marketData.length === 0) {
      throw new Error(`No current market data found for ${symbol}`);
    }

    // Record completion time for accurate timestamp tracking
    const dataProcessingCompleteTime = new Date().toISOString();
    console.log(`[MarketData] Data extraction and processing completed at REAL-TIME: ${dataProcessingCompleteTime}`);
    console.log(`[MarketData] Successfully fetched ${marketData.length} data points for ${symbol}`);
    console.log(`[MarketData] Latest data point from API: ${marketData[0].date}`);
    
    return marketData;
  }

  // Get current price quote with real-time timestamp tracking
  async getCurrentPrice(symbol: string): Promise<number> {
    const priceRequestTime = new Date().toISOString();
    console.log(`[MarketData] Requesting CURRENT real-time price for ${symbol} at: ${priceRequestTime}`);
    
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${this.fmpApiKey}`
    );

    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error(`No current price data for ${symbol}`);
    }

    const currentPrice = data[0].price;
    const priceReceivedTime = new Date().toISOString();
    console.log(`[MarketData] REAL-TIME price for ${symbol}: $${currentPrice} received at: ${priceReceivedTime}`);
    return currentPrice;
  }

  private getTimeframeMinutes(timeframe: string): number {
    const timeframeMap: { [key: string]: number } = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '30m': 30,
      '1h': 60,
      '4h': 240,
      'Daily': 1440,
      'Weekly': 10080,
      'Monthly': 43200
    };
    
    return timeframeMap[timeframe] || 1440;
  }
}

// Strategy Evaluator
class StrategyEvaluator {
  private indicators: Map<string, any> = new Map();

  async calculateIndicatorsForStrategy(strategy: Strategy, marketData: MarketData[]): Promise<void> {
    this.indicators.clear();
    
    const calculationStartTime = new Date().toISOString();
    console.log(`[StrategyEvaluator] Starting indicator calculations for strategy ${strategy.name} at REAL-TIME: ${calculationStartTime}`);
    
    const closes = marketData.map(d => d.close);
    const highs = marketData.map(d => d.high);
    const lows = marketData.map(d => d.low);
    const volumes = marketData.map(d => d.volume);
    
    // Store current prices with real-time context
    this.indicators.set('PRICE_close', closes[0]);
    this.indicators.set('PRICE_open', marketData[0].open);
    this.indicators.set('PRICE_high', highs[0]);
    this.indicators.set('PRICE_low', lows[0]);
    
    console.log(`[StrategyEvaluator] Using REAL-TIME prices calculated at ${calculationStartTime} - Close: ${closes[0]}, Open: ${marketData[0].open}, High: ${highs[0]}, Low: ${lows[0]}`);
    
    // Calculate indicators based on strategy rules using current data
    const indicatorConfigs = this.extractIndicatorConfigs(strategy);
    
    for (const [configKey, params] of indicatorConfigs) {
      const indicatorName = configKey.split('_')[0];
      
      try {
        let indicatorValue: any;
        
        switch (indicatorName.toLowerCase()) {
          case 'sma':
            const period = parseInt(params.period || '14');
            const smaSource = params.source || 'close';
            const smaPrices = PriceSourceCalculator.calculateSource(marketData, smaSource);
            indicatorValue = TechnicalIndicators.calculateSMA(smaPrices, period);
            console.log(`[Indicator] SMA(${period}, ${smaSource}) calculated with REAL-TIME data: ${indicatorValue}`);
            break;
            
          case 'ema':
            const emaPeriod = parseInt(params.period || '14');
            const emaSource = params.source || 'close';
            const emaPrices = PriceSourceCalculator.calculateSource(marketData, emaSource);
            indicatorValue = TechnicalIndicators.calculateEMA(emaPrices, emaPeriod);
            console.log(`[Indicator] EMA(${emaPeriod}, ${emaSource}) calculated with REAL-TIME data: ${indicatorValue}`);
            break;

          case 'wma':
          case 'weightedmovingaverage':
            const wmaPeriod = parseInt(params.period || '14');
            const wmaSource = params.source || 'close';
            const wmaPrices = PriceSourceCalculator.calculateSource(marketData, wmaSource);
            indicatorValue = TechnicalIndicators.calculateWMA(wmaPrices, wmaPeriod);
            console.log(`[Indicator] WMA(${wmaPeriod}, ${wmaSource}) calculated with REAL-TIME data: ${indicatorValue}`);
            break;
            
          case 'rsi':
            const rsiPeriod = parseInt(params.period || '14');
            const rsiSource = params.source || 'close';
            const rsiPrices = PriceSourceCalculator.calculateSource(marketData, rsiSource);
            indicatorValue = TechnicalIndicators.calculateRSI(rsiPrices, rsiPeriod);
            console.log(`[Indicator] RSI(${rsiPeriod}, ${rsiSource}) calculated with REAL-TIME data: ${indicatorValue}`);
            break;
            
          case 'macd':
            const fastPeriod = parseInt(params.fast || params.fastPeriod || '12');
            const slowPeriod = parseInt(params.slow || params.slowPeriod || '26');
            const signalPeriod = parseInt(params.signal || params.signalPeriod || '9');
            const macdSource = params.source || 'close';
            const macdPrices = PriceSourceCalculator.calculateSource(marketData, macdSource);
            indicatorValue = TechnicalIndicators.calculateMACD(macdPrices, fastPeriod, slowPeriod, signalPeriod);
            console.log(`[Indicator] MACD(${fastPeriod}, ${slowPeriod}, ${signalPeriod}, ${macdSource}) calculated with REAL-TIME data:`, indicatorValue);
            break;
            
          case 'cci':
            const cciPeriod = parseInt(params.period || '20');
            const cciSource = params.source || 'hlc3';
            indicatorValue = TechnicalIndicators.calculateCCI(marketData, cciPeriod, cciSource);
            console.log(`[Indicator] CCI(${cciPeriod}, ${cciSource}) calculated with REAL-TIME data: ${indicatorValue}`);
            break;
            
          case 'bollingerbands':
          case 'bbands':
            const bbPeriod = parseInt(params.period || '20');
            const deviation = parseFloat(params.deviation || '2');
            const bbSource = params.source || 'close';
            const bbPrices = PriceSourceCalculator.calculateSource(marketData, bbSource);
            indicatorValue = TechnicalIndicators.calculateBollingerBands(bbPrices, bbPeriod, deviation);
            console.log(`[Indicator] BollingerBands(${bbPeriod}, ${deviation}, ${bbSource}) calculated with REAL-TIME data:`, indicatorValue);
            break;
            
          case 'stochastic':
            const kPeriod = parseInt(params.k || params.kPeriod || '14');
            const dPeriod = parseInt(params.d || params.dPeriod || '3');
            indicatorValue = TechnicalIndicators.calculateStochastic(marketData, kPeriod, dPeriod);
            console.log(`[Indicator] Stochastic(${kPeriod}, ${dPeriod}) calculated with REAL-TIME data:`, indicatorValue);
            break;
            
          case 'atr':
            const atrPeriod = parseInt(params.period || '14');
            indicatorValue = TechnicalIndicators.calculateATR(marketData, atrPeriod);
            console.log(`[Indicator] ATR(${atrPeriod}) calculated with REAL-TIME data: ${indicatorValue}`);
            break;
            
          case 'mfi':
            const mfiPeriod = parseInt(params.period || '14');
            indicatorValue = TechnicalIndicators.calculateMFI(marketData, mfiPeriod);
            console.log(`[Indicator] MFI(${mfiPeriod}) calculated with REAL-TIME data: ${indicatorValue}`);
            break;
            
          default:
            console.warn(`[StrategyEvaluator] Unknown indicator: ${indicatorName}`);
            indicatorValue = 0;
        }
        
        this.indicators.set(configKey, indicatorValue);
        
      } catch (error) {
        console.error(`[StrategyEvaluator] Error calculating ${indicatorName}:`, error);
        this.indicators.set(configKey, 0);
      }
    }

    const calculationEndTime = new Date().toISOString();
    console.log(`[StrategyEvaluator] Completed indicator calculations at REAL-TIME: ${calculationEndTime}`);
  }

  private extractIndicatorConfigs(strategy: Strategy): Map<string, Record<string, any>> {
    const indicatorConfigs = new Map<string, Record<string, any>>();
    
    strategy.rule_groups.forEach(group => {
      group.trading_rules.forEach(rule => {
        if (rule.left_type === 'INDICATOR' && rule.left_indicator && rule.left_parameters) {
          const key = `${rule.left_indicator}_${JSON.stringify(rule.left_parameters)}`;
          indicatorConfigs.set(key, rule.left_parameters);
        }
        
        if (rule.right_type === 'INDICATOR' && rule.right_indicator && rule.right_parameters) {
          const key = `${rule.right_indicator}_${JSON.stringify(rule.right_parameters)}`;
          indicatorConfigs.set(key, rule.right_parameters);
        }
      });
    });
    
    return indicatorConfigs;
  }

  private getIndicatorValue(type: string, indicator?: string, params?: Record<string, any>, valueType?: string): number {
    if (type === 'PRICE') {
      return this.indicators.get(`PRICE_${indicator}`) || 0;
    }
    
    if (type === 'INDICATOR' && indicator && params) {
      const configKey = `${indicator}_${JSON.stringify(params)}`;
      const indicatorResult = this.indicators.get(configKey);
      
      if (typeof indicatorResult === 'object' && indicatorResult !== null) {
        switch (valueType?.toLowerCase()) {
          case 'signal': return indicatorResult.signal || 0;
          case 'line': return indicatorResult.line || 0;
          case 'histogram': return indicatorResult.histogram || 0;
          case 'upper': return indicatorResult.upper || 0;
          case 'middle': return indicatorResult.middle || 0;
          case 'lower': return indicatorResult.lower || 0;
          case 'k': return indicatorResult.k || 0;
          case 'd': return indicatorResult.d || 0;
          default: return indicatorResult.line || indicatorResult.value || indicatorResult.k || Object.values(indicatorResult)[0] || 0;
        }
      }
      
      return typeof indicatorResult === 'number' ? indicatorResult : 0;
    }
    
    return 0;
  }

  private evaluateCondition(condition: string, leftValue: number, rightValue: number): boolean {
    console.log(`[Condition] Evaluating: ${leftValue} ${condition} ${rightValue}`);
    
    switch (condition) {
      case 'GREATER_THAN': return leftValue > rightValue;
      case 'LESS_THAN': return leftValue < rightValue;
      case 'EQUAL': return Math.abs(leftValue - rightValue) < 0.0001;
      case 'GREATER_THAN_OR_EQUAL': return leftValue >= rightValue;
      case 'LESS_THAN_OR_EQUAL': return leftValue <= rightValue;
      case 'CROSSES_ABOVE': return leftValue > rightValue;
      case 'CROSSES_BELOW': return leftValue < rightValue;
      default: return false;
    }
  }

  private evaluateRuleGroup(group: RuleGroup): boolean {
    if (!group.trading_rules || group.trading_rules.length === 0) {
      return false;
    }

    console.log(`[RuleGroup] Evaluating group ${group.id} (${group.rule_type})`);
    console.log(`[RuleGroup] Logic: ${group.logic}, Rules: ${group.trading_rules.length}`);

    const results = group.trading_rules.map((rule, index) => {
      // Get left side value
      let leftValue: number;
      if (rule.left_type === 'VALUE') {
        leftValue = parseFloat(rule.left_value || '0');
      } else {
        leftValue = this.getIndicatorValue(rule.left_type, rule.left_indicator, rule.left_parameters, rule.left_value_type);
      }
      
      // Get right side value
      let rightValue: number;
      if (rule.right_type === 'VALUE') {
        rightValue = parseFloat(rule.right_value || '0');
      } else {
        rightValue = this.getIndicatorValue(rule.right_type, rule.right_indicator, rule.right_parameters, rule.right_value_type);
      }
      
      const result = this.evaluateCondition(rule.condition, leftValue, rightValue);
      console.log(`[RuleGroup] Rule ${index + 1}: ${leftValue} ${rule.condition} ${rightValue} = ${result}`);
      
      return result;
    });

    const trueCount = results.filter(Boolean).length;
    
    let groupResult: boolean;
    if (group.logic === 'OR') {
      const requiredConditions = group.required_conditions || 1;
      groupResult = trueCount >= requiredConditions;
    } else {
      groupResult = results.every(Boolean);
    }

    console.log(`[RuleGroup] Group result: ${groupResult}`);
    return groupResult;
  }

  evaluateStrategy(strategy: Strategy): { entrySignal: boolean, exitSignal: boolean } {
    const evaluationTime = new Date().toISOString();
    console.log(`[Strategy] Evaluating strategy: ${strategy.name} with REAL-TIME data at: ${evaluationTime}`);
    
    const entryGroups = strategy.rule_groups.filter(group => group.rule_type === 'entry');
    const exitGroups = strategy.rule_groups.filter(group => group.rule_type === 'exit');

    const entrySignal = entryGroups.some(group => this.evaluateRuleGroup(group));
    const exitSignal = exitGroups.some(group => this.evaluateRuleGroup(group));

    console.log(`[Strategy] Final result using REAL-TIME data - Entry: ${entrySignal}, Exit: ${exitSignal}`);
    return { entrySignal, exitSignal };
  }
}

// Notification Service
class NotificationService {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  private async checkUserProStatus(userId: string): Promise<boolean> {
    try {
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      if (error) return false;
      
      const tier = profile?.subscription_tier;
      return tier === 'pro' || tier === 'premium';
    } catch (error) {
      console.error('Error checking user subscription:', error);
      return false;
    }
  }

  private async checkDailySignalLimit(strategyId: string, userId: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: strategy, error: strategyError } = await this.supabase
        .from('strategies')
        .select('daily_signal_limit')
        .eq('id', strategyId)
        .single();

      if (strategyError || !strategy) return false;

      const { data: dailyCount, error: countError } = await this.supabase
        .from('daily_signal_counts')
        .select('notification_count')
        .eq('strategy_id', strategyId)
        .eq('signal_date', today)
        .single();

      if (countError && countError.code !== 'PGRST116') return true;

      const currentCount = dailyCount?.notification_count || 0;
      const dailyLimit = strategy.daily_signal_limit || 5;

      return currentCount < dailyLimit;
    } catch (error) {
      console.error('Error checking daily signal limit:', error);
      return true;
    }
  }

  private async incrementDailySignalCount(strategyId: string, userId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: existingCount, error: fetchError } = await this.supabase
        .from('daily_signal_counts')
        .select('*')
        .eq('strategy_id', strategyId)
        .eq('signal_date', today)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') return;

      if (existingCount) {
        await this.supabase
          .from('daily_signal_counts')
          .update({ 
            notification_count: existingCount.notification_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCount.id);
      } else {
        await this.supabase
          .from('daily_signal_counts')
          .insert({
            strategy_id: strategyId,
            user_id: userId,
            signal_date: today,
            notification_count: 1
          });
      }
    } catch (error) {
      console.error('Error incrementing daily signal count:', error);
    }
  }

  async sendNotifications(signal: any, strategy: Strategy): Promise<void> {
    console.log(`[Notifications] Processing notifications for signal ${signal.id}`);
    
    try {
      const isPro = await this.checkUserProStatus(strategy.user_id);
      if (!isPro) {
        console.log(`[Notifications] User is not Pro - skipping external notifications`);
        return;
      }

      const withinLimit = await this.checkDailySignalLimit(strategy.id, strategy.user_id);
      if (!withinLimit) {
        console.log(`[Notifications] Daily signal limit reached - skipping notifications`);
        return;
      }

      const { data: settings } = await this.supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', strategy.user_id)
        .single();

      if (!settings) {
        console.log('[Notifications] No notification settings found');
        return;
      }

      // Get user profile for timezone
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('timezone')
        .eq('id', strategy.user_id)
        .single();

      const signalType = signal.signal_type;
      const shouldSendEntry = signalType === 'entry' && settings.entry_signals;
      const shouldSendExit = signalType === 'exit' && settings.exit_signals;
      
      if (!shouldSendEntry && !shouldSendExit) {
        console.log(`[Notifications] Signal type ${signalType} not enabled`);
        return;
      }

      // Enhance signal data with user timezone and strategy info
      const enhancedSignalData = {
        ...signal.signal_data,
        signalId: signal.id,
        userId: strategy.user_id,
        strategyName: strategy.name,
        targetAsset: strategy.target_asset,
        timeframe: strategy.timeframe,
        currentPrice: signal.signal_data.current_price,
        userTimezone: profile?.timezone || 'UTC'
      };

      const notifications = [];

      // Send Discord notification
      if (settings.discord_enabled && settings.discord_webhook_url) {
        try {
          const discordResult = await this.supabase.functions.invoke('send-discord-notification', {
            body: {
              webhookUrl: settings.discord_webhook_url,
              signalData: enhancedSignalData,
              signalType: signalType
            }
          });
          
          if (!discordResult.error) {
            notifications.push('discord');
          }
        } catch (error) {
          console.error('Discord notification error:', error);
        }
      }

      // Send Telegram notification
      if (settings.telegram_enabled && settings.telegram_bot_token && settings.telegram_chat_id) {
        try {
          const telegramResult = await this.supabase.functions.invoke('send-telegram-notification', {
            body: {
              botToken: settings.telegram_bot_token,
              chatId: settings.telegram_chat_id,
              signalData: enhancedSignalData,
              signalType: signalType
            }
          });
          
          if (!telegramResult.error) {
            notifications.push('telegram');
          }
        } catch (error) {
          console.error('Telegram notification error:', error);
        }
      }

      // Send Email notification
      if (settings.email_enabled) {
        try {
          const { data: user } = await this.supabase.auth.admin.getUserById(strategy.user_id);
          if (user.user?.email) {
            const emailResult = await this.supabase.functions.invoke('send-email-notification', {
              body: {
                userEmail: user.user.email,
                signalData: enhancedSignalData,
                signalType: signalType
              }
            });
            
            if (!emailResult.error) {
              notifications.push('email');
            }
          }
        } catch (error) {
          console.error('Email notification error:', error);
        }
      }

      if (notifications.length > 0) {
        await this.incrementDailySignalCount(strategy.id, strategy.user_id);
      }

      console.log(`[Notifications] Sent via: ${notifications.join(', ')}`);

    } catch (error) {
      console.error('[Notifications] Error in sendNotifications:', error);
    }
  }
}

// Main handler
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

    // Parse request body JSON
    const reqBody = await req.json().catch(() => ({}));
    const isOptimized = reqBody?.optimized === true;
    const enableParallel = reqBody?.parallel_processing === true;

    // Record the exact start time of the monitoring process
    const monitoringStartTime = new Date().toISOString();
    console.log(`🚀 Starting ${isOptimized ? 'OPTIMIZED' : 'STANDARD'} signal monitoring process at: ${monitoringStartTime}`);

    // Check market hours first - this is critical for timing
    if (!MarketHoursChecker.isMarketOpen()) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Market is closed',
          timestamp: monitoringStartTime,
          optimization: isOptimized ? 'enabled' : 'disabled'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get active strategies
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

    console.log(`📋 Found ${strategies?.length || 0} active strategies (${isOptimized ? 'OPTIMIZED' : 'STANDARD'} mode)`);

    const processedStrategies = [];
    const errors = [];

    // Initialize services
    const marketDataService = new MarketDataService(fmpApiKey);
    const strategyEvaluator = new StrategyEvaluator();
    const notificationService = new NotificationService(supabase);

    if (enableParallel && strategies && strategies.length > 0) {
      console.log('🔄 Using PARALLEL processing mode for maximum performance');
      
      try {
        // Group strategies by asset to minimize API calls
        const assetGroups = new Map<string, typeof strategies>();
        strategies.forEach(strategy => {
          if (!strategy.target_asset) return;
          
          if (!assetGroups.has(strategy.target_asset)) {
            assetGroups.set(strategy.target_asset, []);
          }
          assetGroups.get(strategy.target_asset)?.push(strategy);
        });

        console.log(`📊 Processing ${assetGroups.size} unique assets in parallel`);

        // Process all asset groups in parallel
        const assetProcessingPromises = Array.from(assetGroups.entries()).map(async ([asset, assetStrategies]) => {
          const assetStartTime = new Date().toISOString();
          console.log(`\n📈 Processing ${assetStrategies.length} strategies for ${asset} starting at: ${assetStartTime}`);

          try {
            // Fetch market data once per asset
            const marketData = await marketDataService.fetchCurrentMarketData(asset, assetStrategies[0].timeframe, 100);
            
            // Process all strategies for this asset in parallel
            const strategyPromises = assetStrategies.map(async (strategy) => {
              const strategyProcessingStartTime = new Date().toISOString();
              
              try {
                if (!strategy.rule_groups || strategy.rule_groups.length === 0) {
                  console.log(`⚠️ Skipping strategy ${strategy.name} - no rule groups`);
                  return null;
                }

                // Calculate indicators and evaluate strategy
                await strategyEvaluator.calculateIndicatorsForStrategy(strategy, marketData);
                const evaluation = strategyEvaluator.evaluateStrategy(strategy);

                if (evaluation.entrySignal || evaluation.exitSignal) {
                  console.log(`🚨 SIGNAL DETECTED for strategy ${strategy.name} using PARALLEL processing!`);
                  
                  const signalType = evaluation.entrySignal ? 'entry' : 'exit';
                  const currentRealTime = new Date().toISOString();
                  
                  const signalData = {
                    strategy_id: strategy.id,
                    strategy_name: strategy.name,
                    asset: strategy.target_asset,
                    timeframe: strategy.timeframe,
                    signal_type: signalType,
                    timestamp: currentRealTime,
                    current_price: marketData[0].close,
                    data_timestamp: currentRealTime,
                    processing_mode: 'parallel_optimized',
                    asset_processing_start: assetStartTime,
                    strategy_processing_start: strategyProcessingStartTime
                  };

                  // Create signal in database
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

                  console.log(`✅ Signal ${signal.id} created with PARALLEL processing`);
                  
                  // Send notifications (non-blocking)
                  notificationService.sendNotifications(signal, strategy).catch(error => {
                    console.error(`❌ Notification error for signal ${signal.id}:`, error);
                  });
                  
                  return {
                    strategy_id: strategy.id,
                    strategy_name: strategy.name,
                    signal_type: signalType,
                    signal_id: signal.id,
                    data_timestamp: currentRealTime,
                    processing_time: new Date().toISOString(),
                    processing_mode: 'parallel'
                  };
                } else {
                  console.log(`❌ No signals generated for strategy ${strategy.name} (parallel mode)`);
                  return null;
                }

              } catch (error) {
                console.error(`❌ Error processing strategy ${strategy.name} (parallel):`, error);
                errors.push({
                  strategy_id: strategy.id,
                  strategy_name: strategy.name,
                  error: error.message,
                  processing_mode: 'parallel'
                });
                return null;
              }
            });

            // Wait for all strategies for this asset to complete
            const assetResults = await Promise.all(strategyPromises);
            return assetResults.filter(result => result !== null);

          } catch (error) {
            console.error(`❌ Error processing asset ${asset}:`, error);
            errors.push({
              asset: asset,
              error: error.message,
              processing_mode: 'parallel'
            });
            return [];
          }
        });

        // Wait for all assets to complete processing
        const allAssetResults = await Promise.all(assetProcessingPromises);
        processedStrategies.push(...allAssetResults.flat());

      } catch (error) {
        console.error(`💥 Error in parallel processing mode:`, error);
        errors.push({
          error: 'Parallel processing failed: ' + error.message,
          processing_mode: 'parallel'
        });
      }
    } else {
      // Fallback to sequential processing (existing code)
      console.log('🔄 Using SEQUENTIAL processing mode (fallback)');
      
      for (const strategy of strategies || []) {
        try {
          const strategyProcessingStartTime = new Date().toISOString();
          console.log(`\n🎯 Processing strategy: ${strategy.name} (${strategy.timeframe}) starting at REAL-TIME: ${strategyProcessingStartTime}`);
          
          if (!strategy.target_asset) {
            console.log(`⚠️ Skipping strategy ${strategy.name} - no target asset`);
            continue;
          }

          if (!strategy.rule_groups || strategy.rule_groups.length === 0) {
            console.log(`⚠️ Skipping strategy ${strategy.name} - no rule groups`);
            continue;
          }

          // Fetch current market data with real-time tracking
          const marketData = await marketDataService.fetchCurrentMarketData(
            strategy.target_asset, 
            strategy.timeframe, 
            100
          );

          console.log(`📈 Retrieved ${marketData.length} CURRENT data points for ${strategy.target_asset}`);

          // Calculate indicators with current market data
          await strategyEvaluator.calculateIndicatorsForStrategy(strategy, marketData);
          
          // Evaluate strategy conditions using current data
          const evaluation = strategyEvaluator.evaluateStrategy(strategy);

          if (evaluation.entrySignal || evaluation.exitSignal) {
            console.log(`🚨 SIGNAL DETECTED for strategy ${strategy.name} using REAL-TIME data!`);
            
            const signalType = evaluation.entrySignal ? 'entry' : 'exit';
            
            // Use CURRENT REAL-TIME timestamp for data_timestamp
            const currentRealTime = new Date().toISOString();
            
            const signalData = {
              strategy_id: strategy.id,
              strategy_name: strategy.name,
              asset: strategy.target_asset,
              timeframe: strategy.timeframe,
              signal_type: signalType,
              timestamp: currentRealTime,
              current_price: marketData[0].close,
              data_timestamp: currentRealTime // This is now the REAL-TIME when all calculations were performed
            };

            console.log(`📊 Signal data_timestamp set to CURRENT REAL-TIME: ${currentRealTime}`);

            // Create signal in database
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

            console.log(`✅ Signal ${signal.id} created successfully with REAL-TIME data_timestamp: ${currentRealTime}`);
            
            // Send notifications immediately
            await notificationService.sendNotifications(signal, strategy);
            
            processedStrategies.push({
              strategy_id: strategy.id,
              strategy_name: strategy.name,
              signal_type: signalType,
              signal_id: signal.id,
              data_timestamp: currentRealTime, // Real-time timestamp
              processing_time: new Date().toISOString()
            });
          } else {
            console.log(`❌ No signals generated for strategy ${strategy.name} with REAL-TIME data`);
          }

        } catch (error) {
          console.error(`❌ Error processing strategy ${strategy.name}:`, error);
          errors.push({
            strategy_id: strategy.id,
            strategy_name: strategy.name,
            error: error.message
          });
        }
      }
    }

    const monitoringCompleteTime = new Date().toISOString();
    const response = {
      success: true,
      message: `Processed ${strategies?.length || 0} strategies with ${isOptimized ? 'OPTIMIZED' : 'STANDARD'} ${enableParallel ? 'PARALLEL' : 'SEQUENTIAL'} processing`,
      signals_generated: processedStrategies.length,
      processed_strategies: processedStrategies,
      errors: errors,
      monitoring_start_time: monitoringStartTime,
      monitoring_complete_time: monitoringCompleteTime,
      processing_mode: enableParallel ? 'parallel' : 'sequential',
      optimization_enabled: isOptimized,
      performance_metrics: {
        total_time_ms: new Date(monitoringCompleteTime).getTime() - new Date(monitoringStartTime).getTime(),
        strategies_processed: strategies?.length || 0,
        signals_generated: processedStrategies.length,
        errors_count: errors.length,
        avg_time_per_strategy: strategies?.length > 0 
          ? Math.round((new Date(monitoringCompleteTime).getTime() - new Date(monitoringStartTime).getTime()) / strategies.length)
          : 0
      }
    };

    console.log(`\n🏁 ${isOptimized ? 'OPTIMIZED' : 'STANDARD'} signal monitoring completed at: ${monitoringCompleteTime}`);
    console.log(`📊 Performance: ${response.performance_metrics.total_time_ms}ms total, ${response.performance_metrics.avg_time_per_strategy}ms per strategy`);
    console.log('Final response:', response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Error in monitor-trading-signals:', error);
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

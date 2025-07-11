
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Type definitions
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
  rule_type: string;
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

interface MarketData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Technical Indicator Calculations
class TechnicalIndicators {
  // Simple Moving Average
  static calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) {
      console.log(`[SMA] Insufficient data: need ${period}, have ${prices.length}`);
      return 0;
    }
    const sum = prices.slice(0, period).reduce((a, b) => a + b, 0);
    const result = sum / period;
    console.log(`[SMA] Period: ${period}, Prices: [${prices.slice(0, period).join(', ')}], Result: ${result}`);
    return result;
  }

  // Exponential Moving Average
  static calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) {
      console.log(`[EMA] Insufficient data: need ${period}, have ${prices.length}`);
      return 0;
    }
    
    const multiplier = 2 / (period + 1);
    let ema = this.calculateSMA(prices.slice(0, period), period);
    
    console.log(`[EMA] Initial SMA: ${ema}, Multiplier: ${multiplier}`);
    
    for (let i = period; i < Math.min(prices.length, period * 2); i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
      console.log(`[EMA] Step ${i - period + 1}: Price ${prices[i]}, EMA: ${ema}`);
    }
    
    console.log(`[EMA] Period: ${period}, Final Result: ${ema}`);
    return ema;
  }

  // Relative Strength Index
  static calculateRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) {
      console.log(`[RSI] Insufficient data: need ${period + 1}, have ${prices.length}`);
      return 0;
    }
    
    let gains = 0;
    let losses = 0;
    
    console.log(`[RSI] Calculating price changes for period ${period}:`);
    
    for (let i = 1; i <= period; i++) {
      const change = prices[i - 1] - prices[i];
      console.log(`[RSI] Price change ${i}: ${prices[i - 1]} - ${prices[i]} = ${change}`);
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    console.log(`[RSI] Total gains: ${gains}, Total losses: ${losses}`);
    console.log(`[RSI] Avg gain: ${avgGain}, Avg loss: ${avgLoss}`);
    
    if (avgLoss === 0) {
      console.log(`[RSI] No losses, returning 100`);
      return 100;
    }
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    console.log(`[RSI] RS: ${rs}, Final RSI: ${rsi}`);
    return rsi;
  }

  // MACD
  static calculateMACD(prices: number[], fastPeriod: number, slowPeriod: number, signalPeriod: number): { line: number, signal: number, histogram: number } {
    if (prices.length < slowPeriod) {
      console.log(`[MACD] Insufficient data: need ${slowPeriod}, have ${prices.length}`);
      return { line: 0, signal: 0, histogram: 0 };
    }
    
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);
    const macdLine = fastEMA - slowEMA;
    
    console.log(`[MACD] Fast EMA (${fastPeriod}): ${fastEMA}`);
    console.log(`[MACD] Slow EMA (${slowPeriod}): ${slowEMA}`);
    console.log(`[MACD] MACD Line: ${macdLine}`);
    
    // Simplified signal line calculation
    const signalLine = macdLine * 0.9;
    const histogram = macdLine - signalLine;
    
    console.log(`[MACD] Signal Line: ${signalLine}, Histogram: ${histogram}`);
    
    return { line: macdLine, signal: signalLine, histogram };
  }

  // Commodity Channel Index
  static calculateCCI(highs: number[], lows: number[], closes: number[], period: number): number {
    if (closes.length < period) {
      console.log(`[CCI] Insufficient data: need ${period}, have ${closes.length}`);
      return 0;
    }
    
    const typicalPrices = closes.slice(0, period).map((close, i) => 
      (highs[i] + lows[i] + close) / 3
    );
    
    console.log(`[CCI] Typical prices: [${typicalPrices.join(', ')}]`);
    
    const sma = typicalPrices.reduce((a, b) => a + b, 0) / period;
    const meanDeviation = typicalPrices.reduce((sum, price) => 
      sum + Math.abs(price - sma), 0
    ) / period;
    
    console.log(`[CCI] SMA: ${sma}, Mean Deviation: ${meanDeviation}`);
    
    if (meanDeviation === 0) {
      console.log(`[CCI] Mean deviation is 0, returning 0`);
      return 0;
    }
    
    const currentTypicalPrice = (highs[0] + lows[0] + closes[0]) / 3;
    const cci = (currentTypicalPrice - sma) / (0.015 * meanDeviation);
    
    console.log(`[CCI] Current typical price: ${currentTypicalPrice}`);
    console.log(`[CCI] Final CCI: ${cci}`);
    
    return cci;
  }

  // Bollinger Bands
  static calculateBollingerBands(prices: number[], period: number, deviation: number): { upper: number, middle: number, lower: number } {
    if (prices.length < period) {
      console.log(`[BB] Insufficient data: need ${period}, have ${prices.length}`);
      return { upper: 0, middle: 0, lower: 0 };
    }
    
    const sma = this.calculateSMA(prices, period);
    const variance = prices.slice(0, period).reduce((sum, price) => 
      sum + Math.pow(price - sma, 2), 0
    ) / period;
    const stdDev = Math.sqrt(variance);
    
    const upper = sma + (deviation * stdDev);
    const lower = sma - (deviation * stdDev);
    
    console.log(`[BB] SMA: ${sma}, StdDev: ${stdDev}, Deviation: ${deviation}`);
    console.log(`[BB] Upper: ${upper}, Middle: ${sma}, Lower: ${lower}`);
    
    return { upper, middle: sma, lower };
  }

  // Stochastic Oscillator
  static calculateStochastic(highs: number[], lows: number[], closes: number[], kPeriod: number, dPeriod: number): { k: number, d: number } {
    if (closes.length < kPeriod) {
      console.log(`[STOCH] Insufficient data: need ${kPeriod}, have ${closes.length}`);
      return { k: 0, d: 0 };
    }
    
    const highestHigh = Math.max(...highs.slice(0, kPeriod));
    const lowestLow = Math.min(...lows.slice(0, kPeriod));
    
    const k = ((closes[0] - lowestLow) / (highestHigh - lowestLow)) * 100;
    const d = k * 0.9; // Simplified
    
    console.log(`[STOCH] Highest High: ${highestHigh}, Lowest Low: ${lowestLow}`);
    console.log(`[STOCH] Current Close: ${closes[0]}, %K: ${k}, %D: ${d}`);
    
    return { k, d };
  }

  // Average True Range
  static calculateATR(highs: number[], lows: number[], closes: number[], period: number): number {
    if (closes.length < period + 1) {
      console.log(`[ATR] Insufficient data: need ${period + 1}, have ${closes.length}`);
      return 0;
    }
    
    let trSum = 0;
    console.log(`[ATR] Calculating True Range for period ${period}:`);
    
    for (let i = 0; i < period; i++) {
      const high = highs[i];
      const low = lows[i];
      const prevClose = i < closes.length - 1 ? closes[i + 1] : closes[i];
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      
      console.log(`[ATR] Period ${i}: H=${high}, L=${low}, PrevC=${prevClose}, TR=${tr}`);
      trSum += tr;
    }
    
    const atr = trSum / period;
    console.log(`[ATR] Total TR: ${trSum}, ATR: ${atr}`);
    
    return atr;
  }

  // Williams %R
  static calculateWilliamsR(highs: number[], lows: number[], closes: number[], period: number): number {
    if (closes.length < period) {
      console.log(`[WILLR] Insufficient data: need ${period}, have ${closes.length}`);
      return 0;
    }
    
    const highestHigh = Math.max(...highs.slice(0, period));
    const lowestLow = Math.min(...lows.slice(0, period));
    
    const williamsR = ((highestHigh - closes[0]) / (highestHigh - lowestLow)) * -100;
    
    console.log(`[WILLR] Highest High: ${highestHigh}, Lowest Low: ${lowestLow}`);
    console.log(`[WILLR] Current Close: ${closes[0]}, Williams %R: ${williamsR}`);
    
    return williamsR;
  }

  // Money Flow Index
  static calculateMFI(highs: number[], lows: number[], closes: number[], volumes: number[], period: number): number {
    if (closes.length < period + 1) {
      console.log(`[MFI] Insufficient data: need ${period + 1}, have ${closes.length}`);
      return 0;
    }
    
    let positiveFlow = 0;
    let negativeFlow = 0;
    
    console.log(`[MFI] Calculating Money Flow for period ${period}:`);
    
    for (let i = 0; i < period; i++) {
      const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
      const prevTypicalPrice = i < closes.length - 1 ? 
        (highs[i + 1] + lows[i + 1] + closes[i + 1]) / 3 : typicalPrice;
      
      const moneyFlow = typicalPrice * volumes[i];
      
      console.log(`[MFI] Period ${i}: TP=${typicalPrice}, PrevTP=${prevTypicalPrice}, MF=${moneyFlow}`);
      
      if (typicalPrice > prevTypicalPrice) {
        positiveFlow += moneyFlow;
      } else if (typicalPrice < prevTypicalPrice) {
        negativeFlow += moneyFlow;
      }
    }
    
    console.log(`[MFI] Positive Flow: ${positiveFlow}, Negative Flow: ${negativeFlow}`);
    
    if (negativeFlow === 0) {
      console.log(`[MFI] No negative flow, returning 100`);
      return 100;
    }
    
    const moneyRatio = positiveFlow / negativeFlow;
    const mfi = 100 - (100 / (1 + moneyRatio));
    
    console.log(`[MFI] Money Ratio: ${moneyRatio}, MFI: ${mfi}`);
    
    return mfi;
  }
}

// Market Data Service
class MarketDataService {
  private fmpApiKey: string;

  constructor(fmpApiKey: string) {
    this.fmpApiKey = fmpApiKey;
  }

  // Map timeframe to FMP API intervals
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

  // Fetch market data from FMP
  async fetchMarketData(symbol: string, timeframe: string, limit: number = 100): Promise<MarketData[]> {
    const fmpInterval = this.mapTimeframeToFmpInterval(timeframe);
    let endpoint: string;
    
    if (['1min', '5min', '15min', '30min', '1hour', '4hour'].includes(fmpInterval)) {
      endpoint = `https://financialmodelingprep.com/api/v3/historical-chart/${fmpInterval}/${symbol}?apikey=${this.fmpApiKey}`;
    } else {
      endpoint = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${this.fmpApiKey}`;
    }

    console.log(`[MarketData] Fetching data for ${symbol} with timeframe ${timeframe} from: ${endpoint}`);
    
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
        marketData = data
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
    }

    if (marketData.length === 0) {
      throw new Error(`No market data found for ${symbol}`);
    }

    console.log(`[MarketData] Successfully fetched ${marketData.length} data points for ${symbol}`);
    console.log(`[MarketData] Latest 3 prices: ${marketData.slice(0, 3).map(d => `${d.date}: ${d.close}`).join(', ')}`);
    return marketData;
  }
}

// Strategy Evaluator
class StrategyEvaluator {
  private indicators: Map<string, any> = new Map();

  // Calculate all indicators for a strategy
  async calculateIndicatorsForStrategy(strategy: Strategy, marketData: MarketData[]): Promise<void> {
    this.indicators.clear();
    
    console.log(`[StrategyEvaluator] Calculating indicators for strategy ${strategy.name}`);
    console.log(`[StrategyEvaluator] Market data length: ${marketData.length}`);
    
    // Extract price arrays
    const closes = marketData.map(d => d.close);
    const highs = marketData.map(d => d.high);
    const lows = marketData.map(d => d.low);
    const volumes = marketData.map(d => d.volume);
    
    console.log(`[StrategyEvaluator] Price arrays - Closes: [${closes.slice(0, 5).join(', ')}...], Highs: [${highs.slice(0, 5).join(', ')}...], Lows: [${lows.slice(0, 5).join(', ')}...]`);
    
    // Store current prices for PRICE type comparisons
    this.indicators.set('PRICE_close', closes[0]);
    this.indicators.set('PRICE_open', marketData[0].open);
    this.indicators.set('PRICE_high', highs[0]);
    this.indicators.set('PRICE_low', lows[0]);
    
    console.log(`[StrategyEvaluator] Current prices - Close: ${closes[0]}, Open: ${marketData[0].open}, High: ${highs[0]}, Low: ${lows[0]}`);
    
    // Calculate indicators based on strategy rules
    const indicatorConfigs = this.extractIndicatorConfigs(strategy);
    
    console.log(`[StrategyEvaluator] Found ${indicatorConfigs.size} unique indicator configurations`);
    
    for (const [configKey, params] of indicatorConfigs) {
      const indicatorName = configKey.split('_')[0];
      
      console.log(`[StrategyEvaluator] Calculating ${indicatorName} with config: ${configKey}`);
      console.log(`[StrategyEvaluator] Parameters: ${JSON.stringify(params)}`);
      
      try {
        let indicatorValue: any;
        
        // Get price data based on source parameter
        const source = params.source || 'close';
        const sourcePrices = this.getPriceBySource(marketData, source);
        
        console.log(`[StrategyEvaluator] Using source '${source}', first 5 values: [${sourcePrices.slice(0, 5).join(', ')}]`);
        
        switch (indicatorName.toLowerCase()) {
          case 'sma':
            const period = parseInt(params.period || '14');
            indicatorValue = TechnicalIndicators.calculateSMA(sourcePrices, period);
            break;
            
          case 'ema':
            const emaPeriod = parseInt(params.period || '14');
            indicatorValue = TechnicalIndicators.calculateEMA(sourcePrices, emaPeriod);
            break;
            
          case 'rsi':
            const rsiPeriod = parseInt(params.period || '14');
            indicatorValue = TechnicalIndicators.calculateRSI(sourcePrices, rsiPeriod);
            break;
            
          case 'macd':
            const fastPeriod = parseInt(params.fast || params.fastPeriod || '12');
            const slowPeriod = parseInt(params.slow || params.slowPeriod || '26');
            const signalPeriod = parseInt(params.signal || params.signalPeriod || '9');
            indicatorValue = TechnicalIndicators.calculateMACD(sourcePrices, fastPeriod, slowPeriod, signalPeriod);
            break;
            
          case 'cci':
            const cciPeriod = parseInt(params.period || '20');
            indicatorValue = TechnicalIndicators.calculateCCI(highs, lows, closes, cciPeriod);
            break;
            
          case 'bollingerbands':
          case 'bbands':
            const bbPeriod = parseInt(params.period || '20');
            const deviation = parseFloat(params.deviation || params.nbDevUp || params.nbDevDn || '2');
            indicatorValue = TechnicalIndicators.calculateBollingerBands(sourcePrices, bbPeriod, deviation);
            break;
            
          case 'stochastic':
            const kPeriod = parseInt(params.k || params.kPeriod || params.fastK || '14');
            const dPeriod = parseInt(params.d || params.dPeriod || params.fastD || '3');
            indicatorValue = TechnicalIndicators.calculateStochastic(highs, lows, closes, kPeriod, dPeriod);
            break;
            
          case 'atr':
            const atrPeriod = parseInt(params.period || params.atrPeriod || '14');
            indicatorValue = TechnicalIndicators.calculateATR(highs, lows, closes, atrPeriod);
            break;
            
          case 'williamsr':
          case 'willr':
            const willrPeriod = parseInt(params.period || '14');
            indicatorValue = TechnicalIndicators.calculateWilliamsR(highs, lows, closes, willrPeriod);
            break;
            
          case 'mfi':
            const mfiPeriod = parseInt(params.period || '14');
            indicatorValue = TechnicalIndicators.calculateMFI(highs, lows, closes, volumes, mfiPeriod);
            break;
            
          default:
            console.warn(`[StrategyEvaluator] Unknown indicator: ${indicatorName}`);
            indicatorValue = 0;
        }
        
        this.indicators.set(configKey, indicatorValue);
        console.log(`[StrategyEvaluator] ✅ Calculated ${indicatorName}: ${JSON.stringify(indicatorValue)}`);
        
      } catch (error) {
        console.error(`[StrategyEvaluator] ❌ Error calculating ${indicatorName}:`, error);
        this.indicators.set(configKey, 0);
      }
    }
    
    console.log(`[StrategyEvaluator] All indicators calculated. Total stored: ${this.indicators.size}`);
  }

  // Extract unique indicator configurations from strategy rules
  private extractIndicatorConfigs(strategy: Strategy): Map<string, IndicatorParameters> {
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

  // Get price data based on source parameter
  private getPriceBySource(marketData: MarketData[], source: string = 'close'): number[] {
    switch (source.toLowerCase()) {
      case 'open': return marketData.map(d => d.open);
      case 'high': return marketData.map(d => d.high);
      case 'low': return marketData.map(d => d.low);
      case 'close':
      default: return marketData.map(d => d.close);
    }
  }

  // Get indicator value based on type and parameters
  private getIndicatorValue(type: string, indicator?: string, params?: IndicatorParameters, valueType?: string): number {
    console.log(`[IndicatorValue] Getting value for type: ${type}, indicator: ${indicator}, valueType: ${valueType}`);
    
    if (type === 'PRICE') {
      const value = this.indicators.get(`PRICE_${indicator}`) || 0;
      console.log(`[IndicatorValue] PRICE ${indicator}: ${value}`);
      return value;
    }
    
    if (type === 'INDICATOR' && indicator && params) {
      const configKey = `${indicator}_${JSON.stringify(params)}`;
      const indicatorResult = this.indicators.get(configKey);
      
      console.log(`[IndicatorValue] Looking up indicator with key: ${configKey}`);
      console.log(`[IndicatorValue] Found result: ${JSON.stringify(indicatorResult)}`);
      
      if (typeof indicatorResult === 'object' && indicatorResult !== null) {
        // Handle complex indicators like MACD, Bollinger Bands, Stochastic
        let value = 0;
        switch (valueType?.toLowerCase()) {
          case 'signal': 
            value = indicatorResult.signal || 0;
            break;
          case 'line': 
            value = indicatorResult.line || 0;
            break;
          case 'histogram': 
            value = indicatorResult.histogram || 0;
            break;
          case 'upper': 
            value = indicatorResult.upper || 0;
            break;
          case 'middle': 
            value = indicatorResult.middle || 0;
            break;
          case 'lower': 
            value = indicatorResult.lower || 0;
            break;
          case 'k': 
            value = indicatorResult.k || 0;
            break;
          case 'd': 
            value = indicatorResult.d || 0;
            break;
          default: 
            value = indicatorResult.line || indicatorResult.value || indicatorResult.k || Object.values(indicatorResult)[0] || 0;
        }
        console.log(`[IndicatorValue] Complex indicator ${indicator} (${valueType}): ${value}`);
        return value;
      }
      
      const value = typeof indicatorResult === 'number' ? indicatorResult : 0;
      console.log(`[IndicatorValue] Simple indicator ${indicator}: ${value}`);
      return value;
    }
    
    console.log(`[IndicatorValue] No value found, returning 0`);
    return 0;
  }

  // Evaluate condition
  private evaluateCondition(condition: string, leftValue: number, rightValue: number): boolean {
    console.log(`[Condition] Evaluating: ${leftValue} ${condition} ${rightValue}`);
    
    let result = false;
    switch (condition) {
      case 'GREATER_THAN':
        result = leftValue > rightValue;
        break;
      case 'LESS_THAN':
        result = leftValue < rightValue;
        break;
      case 'EQUAL':
        result = Math.abs(leftValue - rightValue) < 0.0001;
        break;
      case 'GREATER_THAN_OR_EQUAL':
        result = leftValue >= rightValue;
        break;
      case 'LESS_THAN_OR_EQUAL':
        result = leftValue <= rightValue;
        break;
      case 'CROSSES_ABOVE':
        result = leftValue > rightValue;
        break;
      case 'CROSSES_BELOW':
        result = leftValue < rightValue;
        break;
      default:
        console.warn(`[Condition] Unknown condition: ${condition}`);
        result = false;
    }
    
    console.log(`[Condition] Result: ${leftValue} ${condition} ${rightValue} = ${result}`);
    return result;
  }

  // Evaluate rule group
  private evaluateRuleGroup(group: RuleGroup): boolean {
    if (!group.trading_rules || group.trading_rules.length === 0) {
      console.log(`[RuleGroup] Group ${group.id} has no trading rules`);
      return false;
    }

    console.log(`[RuleGroup] ═══════════════════════════════════════`);
    console.log(`[RuleGroup] Evaluating group ${group.id} (${group.rule_type})`);
    console.log(`[RuleGroup] Logic: ${group.logic}, Rules: ${group.trading_rules.length}`);
    console.log(`[RuleGroup] Required conditions: ${group.required_conditions || 'all'}`);

    const results = group.trading_rules.map((rule, index) => {
      console.log(`[RuleGroup] ───────────────────────────────────────`);
      console.log(`[RuleGroup] Evaluating rule ${index + 1}/${group.trading_rules.length}: ${rule.id}`);
      
      // Get left side value
      let leftValue: number;
      if (rule.left_type === 'VALUE') {
        leftValue = parseFloat(rule.left_value || '0');
        console.log(`[RuleGroup] Left side (VALUE): ${leftValue}`);
      } else {
        leftValue = this.getIndicatorValue(rule.left_type, rule.left_indicator, rule.left_parameters, rule.left_value_type);
        console.log(`[RuleGroup] Left side (${rule.left_type} ${rule.left_indicator}): ${leftValue}`);
      }
      
      // Get right side value
      let rightValue: number;
      if (rule.right_type === 'VALUE') {
        rightValue = parseFloat(rule.right_value || '0');
        console.log(`[RuleGroup] Right side (VALUE): ${rightValue}`);
      } else {
        rightValue = this.getIndicatorValue(rule.right_type, rule.right_indicator, rule.right_parameters, rule.right_value_type);
        console.log(`[RuleGroup] Right side (${rule.right_type} ${rule.right_indicator}): ${rightValue}`);
      }
      
      const result = this.evaluateCondition(rule.condition, leftValue, rightValue);
      console.log(`[RuleGroup] Rule ${index + 1} result: ${result ? '✅ TRUE' : '❌ FALSE'}`);
      
      return result;
    });

    const trueCount = results.filter(Boolean).length;
    console.log(`[RuleGroup] ───────────────────────────────────────`);
    console.log(`[RuleGroup] Individual results: [${results.map(r => r ? 'T' : 'F').join(', ')}]`);
    console.log(`[RuleGroup] True conditions: ${trueCount}/${results.length}`);

    let groupResult: boolean;
    if (group.logic === 'OR') {
      const requiredConditions = group.required_conditions || 1;
      groupResult = trueCount >= requiredConditions;
      console.log(`[RuleGroup] OR logic: ${trueCount} >= ${requiredConditions} = ${groupResult ? '✅ TRUE' : '❌ FALSE'}`);
    } else {
      groupResult = results.every(Boolean);
      console.log(`[RuleGroup] AND logic: ${trueCount} === ${results.length} = ${groupResult ? '✅ TRUE' : '❌ FALSE'}`);
    }

    console.log(`[RuleGroup] Final group result: ${groupResult ? '✅ SATISFIED' : '❌ NOT SATISFIED'}`);
    console.log(`[RuleGroup] ═══════════════════════════════════════`);
    
    return groupResult;
  }

  // Evaluate strategy
  evaluateStrategy(strategy: Strategy): { entrySignal: boolean, exitSignal: boolean } {
    console.log(`[Strategy] 🚀 EVALUATING STRATEGY: ${strategy.name}`);
    console.log(`[Strategy] Strategy ID: ${strategy.id}`);
    console.log(`[Strategy] Asset: ${strategy.target_asset}, Timeframe: ${strategy.timeframe}`);
    console.log(`[Strategy] Total rule groups: ${strategy.rule_groups.length}`);
    
    const entryGroups = strategy.rule_groups.filter(group => group.rule_type === 'entry');
    const exitGroups = strategy.rule_groups.filter(group => group.rule_type === 'exit');

    console.log(`[Strategy] Entry groups: ${entryGroups.length}, Exit groups: ${exitGroups.length}`);

    let entrySignal = false;
    let exitSignal = false;

    // Evaluate entry groups
    if (entryGroups.length > 0) {
      console.log(`[Strategy] 📈 EVALUATING ENTRY GROUPS:`);
      entrySignal = entryGroups.some(group => {
        const result = this.evaluateRuleGroup(group);
        console.log(`[Strategy] Entry group ${group.id}: ${result ? '✅ TRIGGERED' : '❌ NOT TRIGGERED'}`);
        return result;
      });
      console.log(`[Strategy] 📈 ENTRY SIGNAL: ${entrySignal ? '🟢 GENERATED' : '🔴 NOT GENERATED'}`);
    } else {
      console.log(`[Strategy] 📈 No entry groups found`);
    }
    
    // Evaluate exit groups
    if (exitGroups.length > 0) {
      console.log(`[Strategy] 📉 EVALUATING EXIT GROUPS:`);
      exitSignal = exitGroups.some(group => {
        const result = this.evaluateRuleGroup(group);
        console.log(`[Strategy] Exit group ${group.id}: ${result ? '✅ TRIGGERED' : '❌ NOT TRIGGERED'}`);
        return result;
      });
      console.log(`[Strategy] 📉 EXIT SIGNAL: ${exitSignal ? '🟢 GENERATED' : '🔴 NOT GENERATED'}`);
    } else {
      console.log(`[Strategy] 📉 No exit groups found`);
    }

    console.log(`[Strategy] 🏁 FINAL RESULT - Entry: ${entrySignal}, Exit: ${exitSignal}`);
    return { entrySignal, exitSignal };
  }
}

// Market Hours Checker
class MarketHoursChecker {
  static checkMarketHours(): boolean {
    try {
      const now = new Date();
      
      // Create date in US Eastern timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        weekday: 'long',
        hour12: false
      });
      
      const parts = formatter.formatToParts(now);
      const partsObj = parts.reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
      }, {} as any);
      
      // Extract components
      const dayName = partsObj.weekday;
      const hour = parseInt(partsObj.hour);
      const minute = parseInt(partsObj.minute);
      
      console.log(`[MarketHours] Current EST time: ${dayName} ${partsObj.hour}:${partsObj.minute}:${partsObj.second}`);
      
      // Check if it's a weekday (Monday to Friday)
      const isWeekday = !['Saturday', 'Sunday'].includes(dayName);
      console.log(`[MarketHours] Is weekday: ${isWeekday}`);
      
      if (!isWeekday) {
        console.log(`[MarketHours] Market closed - Weekend`);
        return false;
      }
      
      // Market hours: 9:30 AM to 4:00 PM EST
      const currentMinutes = hour * 60 + minute;
      const marketOpen = 9 * 60 + 30; // 9:30 AM
      const marketClose = 16 * 60; // 4:00 PM
      
      const isMarketHours = currentMinutes >= marketOpen && currentMinutes < marketClose;
      
      console.log(`[MarketHours] Current time in minutes: ${currentMinutes}`);
      console.log(`[MarketHours] Market open: ${marketOpen} (9:30), Market close: ${marketClose} (16:00)`);
      console.log(`[MarketHours] Is within market hours: ${isMarketHours}`);
      console.log(`[MarketHours] Final result: ${isWeekday && isMarketHours ? 'OPEN' : 'CLOSED'}`);
      
      return isWeekday && isMarketHours;
    } catch (error) {
      console.error('[MarketHours] Error checking market hours:', error);
      return false;
    }
  }
  
  static getMarketStatus(): { isOpen: boolean; nextOpen?: string; marketHours: { open: string; close: string } } {
    const isOpen = this.checkMarketHours();
    const marketHours = {
      open: '9:30 AM ET',
      close: '4:00 PM ET'
    };
    
    if (isOpen) {
      return { isOpen: true, marketHours };
    }
    
    // Calculate next market open
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
    const currentMinutes = hour * 60 + minute;
    const marketClose = 16 * 60; // 4:00 PM
    
    // Find next market day
    let nextOpen = "Next weekday at 9:30 AM ET";
    
    if (['Monday', 'Tuesday', 'Wednesday', 'Thursday'].includes(dayName)) {
      // If it's Monday-Thursday and after market close, next day
      if (currentMinutes >= marketClose) {
        nextOpen = "Tomorrow at 9:30 AM ET";
      } else {
        nextOpen = "Today at 9:30 AM ET";  
      }
    } else if (dayName === 'Friday') {
      // If it's Friday, next is Monday
      nextOpen = "Monday at 9:30 AM ET";
    } else if (dayName === 'Saturday') {
      nextOpen = "Monday at 9:30 AM ET";
    } else if (dayName === 'Sunday') {
      nextOpen = "Tomorrow at 9:30 AM ET";
    }
    
    return { isOpen: false, nextOpen, marketHours };
  }
}

// Notification Service
class NotificationService {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  // Check if user is Pro
  private async checkUserProStatus(userId: string): Promise<boolean> {
    try {
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking user subscription:', error);
        return false;
      }

      const tier = profile?.subscription_tier;
      return tier === 'pro' || tier === 'premium';
    } catch (error) {
      console.error('Error in checkUserProStatus:', error);
      return false;
    }
  }

  // Check daily signal limit
  private async checkDailySignalLimit(strategyId: string, userId: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get strategy's daily limit
      const { data: strategy, error: strategyError } = await this.supabase
        .from('strategies')
        .select('daily_signal_limit')
        .eq('id', strategyId)
        .single();

      if (strategyError || !strategy) {
        console.error('Error fetching strategy:', strategyError);
        return false;
      }

      // Get current daily count
      const { data: dailyCount, error: countError } = await this.supabase
        .from('daily_signal_counts')
        .select('notification_count')
        .eq('strategy_id', strategyId)
        .eq('signal_date', today)
        .single();

      if (countError && countError.code !== 'PGRST116') {
        console.error('Error fetching daily signal count:', countError);
        return true;
      }

      const currentCount = dailyCount?.notification_count || 0;
      const dailyLimit = strategy.daily_signal_limit || 5;

      return currentCount < dailyLimit;
    } catch (error) {
      console.error('Error checking daily signal limit:', error);
      return true;
    }
  }

  // Increment daily signal count
  private async incrementDailySignalCount(strategyId: string, userId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: existingCount, error: fetchError } = await this.supabase
        .from('daily_signal_counts')
        .select('*')
        .eq('strategy_id', strategyId)
        .eq('signal_date', today)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching daily signal count:', fetchError);
        return;
      }

      if (existingCount) {
        const { error: updateError } = await this.supabase
          .from('daily_signal_counts')
          .update({ 
            notification_count: existingCount.notification_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCount.id);

        if (updateError) {
          console.error('Error updating daily signal count:', updateError);
        }
      } else {
        const { error: insertError } = await this.supabase
          .from('daily_signal_counts')
          .insert({
            strategy_id: strategyId,
            user_id: userId,
            signal_date: today,
            notification_count: 1
          });

        if (insertError) {
          console.error('Error creating daily signal count:', insertError);
        }
      }
    } catch (error) {
      console.error('Error incrementing daily signal count:', error);
    }
  }

  // Send notifications
  async sendNotifications(signal: any, strategy: Strategy): Promise<void> {
    console.log(`Processing notifications for signal ${signal.id}`);
    
    try {
      // Check if user is Pro
      const isPro = await this.checkUserProStatus(strategy.user_id);
      if (!isPro) {
        console.log(`User ${strategy.user_id} is not Pro - skipping external notifications`);
        return;
      }

      // Check daily signal limit
      const withinLimit = await this.checkDailySignalLimit(strategy.id, strategy.user_id);
      if (!withinLimit) {
        console.log(`Daily signal limit reached for strategy ${strategy.id} - skipping notifications`);
        return;
      }

      // Get user's notification settings
      const { data: settings } = await this.supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', strategy.user_id)
        .single();

      if (!settings) {
        console.log('No notification settings found for user:', strategy.user_id);
        return;
      }

      // Check if this type of signal should be sent
      const signalType = signal.signal_type;
      const shouldSendEntry = signalType === 'entry' && settings.entry_signals;
      const shouldSendExit = signalType === 'exit' && settings.exit_signals;
      
      if (!shouldSendEntry && !shouldSendExit) {
        console.log(`Signal type ${signalType} not enabled for notifications`);
        return;
      }

      const notifications = [];

      // Send Discord notification
      if (settings.discord_enabled && settings.discord_webhook_url) {
        console.log('Sending Discord notification...');
        try {
          const discordResult = await this.supabase.functions.invoke('send-discord-notification', {
            body: {
              webhookUrl: settings.discord_webhook_url,
              signalData: signal.signal_data,
              signalType: signalType
            }
          });
          
          if (discordResult.error) {
            console.error('Discord notification failed:', discordResult.error);
          } else {
            console.log('Discord notification sent successfully');
            notifications.push('discord');
          }
        } catch (error) {
          console.error('Discord notification error:', error);
        }
      }

      // Send Telegram notification
      if (settings.telegram_enabled && settings.telegram_bot_token && settings.telegram_chat_id) {
        console.log('Sending Telegram notification...');
        try {
          const telegramResult = await this.supabase.functions.invoke('send-telegram-notification', {
            body: {
              botToken: settings.telegram_bot_token,
              chatId: settings.telegram_chat_id,
              signalData: signal.signal_data,
              signalType: signalType
            }
          });
          
          if (telegramResult.error) {
            console.error('Telegram notification failed:', telegramResult.error);
          } else {
            console.log('Telegram notification sent successfully');
            notifications.push('telegram');
          }
        } catch (error) {
          console.error('Telegram notification error:', error);
        }
      }

      // Send Email notification
      if (settings.email_enabled) {
        console.log('Sending Email notification...');
        try {
          const { data: user } = await this.supabase.auth.admin.getUserById(strategy.user_id);
          if (user.user?.email) {
            const emailResult = await this.supabase.functions.invoke('send-email-notification', {
              body: {
                userEmail: user.user.email,
                signalData: signal.signal_data,
                signalType: signalType
              }
            });
            
            if (emailResult.error) {
              console.error('Email notification failed:', emailResult.error);
            } else {
              console.log('Email notification sent successfully');
              notifications.push('email');
            }
          }
        } catch (error) {
          console.error('Email notification error:', error);
        }
      }

      // Increment daily signal count if notifications were sent
      if (notifications.length > 0) {
        await this.incrementDailySignalCount(strategy.id, strategy.user_id);
      }

      console.log(`Notifications sent via: ${notifications.join(', ')}`);

    } catch (error) {
      console.error('Error in sendNotifications:', error);
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

    console.log('🚀 Starting signal monitoring process...');

    // Check market hours with improved timezone handling
    const marketStatus = MarketHoursChecker.getMarketStatus();
    console.log('📊 Market status:', marketStatus);
    
    if (!marketStatus.isOpen) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Market is closed. ${marketStatus.nextOpen ? `Opens ${marketStatus.nextOpen}` : 'Closed'}`,
          market_status: marketStatus
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

    console.log(`📋 Found ${strategies?.length || 0} active strategies`);

    const processedStrategies = [];
    const errors = [];
    
    // Initialize services
    const marketDataService = new MarketDataService(fmpApiKey);
    const strategyEvaluator = new StrategyEvaluator();
    const notificationService = new NotificationService(supabase);

    for (const strategy of strategies || []) {
      try {
        console.log(`\n🎯 ═══════════════════════════════════════`);
        console.log(`🎯 PROCESSING STRATEGY: ${strategy.name}`);
        console.log(`🎯 ID: ${strategy.id}`);
        console.log(`🎯 Asset: ${strategy.target_asset}, Timeframe: ${strategy.timeframe}`);
        console.log(`🎯 ═══════════════════════════════════════`);
        
        if (!strategy.target_asset) {
          console.log(`⚠️ Skipping strategy ${strategy.name} - no target asset`);
          continue;
        }

        if (!strategy.rule_groups || strategy.rule_groups.length === 0) {
          console.log(`⚠️ Skipping strategy ${strategy.name} - no rule groups`);
          continue;
        }

        // Fetch market data
        const marketData = await marketDataService.fetchMarketData(
          strategy.target_asset, 
          strategy.timeframe, 
          100
        );

        console.log(`📈 Retrieved ${marketData.length} data points for ${strategy.target_asset}`);
        console.log(`💰 Latest price: $${marketData[0].close} at ${marketData[0].date}`);

        // Calculate indicators
        await strategyEvaluator.calculateIndicatorsForStrategy(strategy, marketData);
        
        // Evaluate strategy
        const evaluation = strategyEvaluator.evaluateStrategy(strategy);
        console.log(`🎲 Strategy evaluation result:`, evaluation);

        if (evaluation.entrySignal || evaluation.exitSignal) {
          console.log(`🎯 🚨 SIGNAL DETECTED for strategy ${strategy.name}! 🚨`);
          
          const signalType = evaluation.entrySignal ? 'entry' : 'exit';
          const signalData = {
            strategy_id: strategy.id,
            strategy_name: strategy.name,
            asset: strategy.target_asset,
            timeframe: strategy.timeframe,
            signal_type: signalType,
            timestamp: new Date().toISOString(),
            current_price: marketData[0].close
          };

          console.log(`📊 Signal data:`, signalData);

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
            console.error('❌ Error inserting signal:', signalError);
            throw signalError;
          }

          console.log(`✅ Signal ${signal.id} created successfully`);
          
          // Send notifications
          await notificationService.sendNotifications(signal, strategy);
          
          processedStrategies.push({
            strategy_id: strategy.id,
            strategy_name: strategy.name,
            signal_type: signalType,
            signal_id: signal.id
          });
        } else {
          console.log(`❌ No signals generated for strategy ${strategy.name}`);
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

    const response = {
      success: true,
      message: `Processed ${strategies?.length || 0} strategies`,
      signals_generated: processedStrategies.length,
      processed_strategies: processedStrategies,
      errors: errors
    };

    console.log('\n🏁 Signal monitoring completed:', response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Error in monitor-trading-signals:', error);
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

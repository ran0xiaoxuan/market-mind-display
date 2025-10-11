import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Constants
const CCI_CONSTANT = 0.015; // Standard CCI constant multiplier
const DEFAULT_ACCOUNT_CAPITAL = 10000;
const DEFAULT_RSI_PERIOD = 14;
const DEFAULT_MACD_FAST = 12;
const DEFAULT_MACD_SLOW = 26;
const DEFAULT_MACD_SIGNAL = 9;
const DEFAULT_BB_PERIOD = 20;
const DEFAULT_BB_DEVIATION = 2;

// Logging configuration
const LOG_LEVEL = Deno.env.get('LOG_LEVEL') || 'INFO'; // DEBUG, INFO, WARN, ERROR
const shouldLog = (level: string): boolean => {
  const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
  const currentLevel = levels.indexOf(LOG_LEVEL);
  const messageLevel = levels.indexOf(level);
  return messageLevel >= currentLevel;
};

const logDebug = (...args: any[]) => shouldLog('DEBUG') && console.log(...args);
const logInfo = (...args: any[]) => shouldLog('INFO') && console.log(...args);
const logWarn = (...args: any[]) => shouldLog('WARN') && console.warn(...args);
const logError = (...args: any[]) => shouldLog('ERROR') && console.error(...args);

// Type definitions
interface Strategy {
  id: string;
  name: string;
  target_asset: string;
  timeframe: string;
  user_id: string;
  daily_signal_limit?: number;
  is_active: boolean;
  account_capital?: number;
  risk_tolerance?: string;
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

// Position sizing calculator
class PositionSizeCalculator {
  private static readonly VALID_RISK_TOLERANCES = ['conservative', 'moderate', 'aggressive'];
  
  static getRiskPercentage(riskTolerance: string): number {
    // Input validation
    if (!riskTolerance || typeof riskTolerance !== 'string') {
      logWarn('[PositionSize] Invalid risk tolerance, using default moderate');
      return 0.25;
    }
    
    const normalizedTolerance = riskTolerance.toLowerCase();
    
    switch (normalizedTolerance) {
      case 'conservative':
        return 0.15; // 15%
      case 'moderate':
        return 0.25; // 25%
      case 'aggressive':
        return 0.35; // 35%
      default:
        logWarn(`[PositionSize] Unknown risk tolerance: ${riskTolerance}, using moderate`);
        return 0.25; // Default to moderate
    }
  }

  static calculatePositionSize(accountCapital: number, riskTolerance: string, assetPrice: number): {
    quantity: number;
    amount: number;
    positionPercentage: number;
  } {
    // Input validation
    if (!accountCapital || accountCapital <= 0) {
      logWarn(`[PositionSize] Invalid account capital: ${accountCapital}`);
      return { quantity: 0, amount: 0, positionPercentage: 0 };
    }
    
    if (!assetPrice || assetPrice <= 0) {
      logWarn(`[PositionSize] Invalid asset price: ${assetPrice}`);
      return { quantity: 0, amount: 0, positionPercentage: 0 };
    }

    const positionPercentage = this.getRiskPercentage(riskTolerance);
    const positionValue = accountCapital * positionPercentage;
    const quantity = Math.floor(positionValue / assetPrice);
    const actualAmount = quantity * assetPrice;
    const actualPercentage = (actualAmount / accountCapital) * 100;

    return {
      quantity,
      amount: actualAmount,
      positionPercentage: actualPercentage
    };
  }
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
    if (!prices || prices.length < period) {
      logWarn(`[SMA] Insufficient data: ${prices?.length || 0} < ${period}`);
      throw new Error(`Insufficient data for SMA calculation: need ${period} points, have ${prices?.length || 0}`);
    }
    const sum = prices.slice(0, period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  // Exponential Moving Average
  static calculateEMA(prices: number[], period: number): number {
    if (!prices || prices.length < period) {
      logWarn(`[EMA] Insufficient data: ${prices?.length || 0} < ${period}`);
      throw new Error(`Insufficient data for EMA calculation: need ${period} points, have ${prices?.length || 0}`);
    }
    
    const multiplier = 2 / (period + 1);
    let ema = this.calculateSMA(prices.slice(0, period), period);
    
    for (let i = period; i < Math.min(prices.length, period * 2); i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }
  
  // Calculate EMA array for MACD signal line
  static calculateEMAArray(prices: number[], period: number): number[] {
    if (!prices || prices.length < period) {
      throw new Error(`Insufficient data for EMA array: need ${period} points, have ${prices?.length || 0}`);
    }
    
    const result: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // Initialize with SMA
    const initialSMA = this.calculateSMA(prices.slice(0, period), period);
    result.push(initialSMA);
    
    // Calculate EMA for remaining points
    for (let i = period; i < prices.length; i++) {
      const ema = (prices[i] * multiplier) + (result[result.length - 1] * (1 - multiplier));
      result.push(ema);
    }
    
    return result;
  }

  // Weighted Moving Average
  static calculateWMA(prices: number[], period: number): number {
    if (!prices || prices.length < period) {
      logWarn(`[WMA] Insufficient data: ${prices?.length || 0} < ${period}`);
      throw new Error(`Insufficient data for WMA calculation: need ${period} points, have ${prices?.length || 0}`);
    }
    
    let weightedSum = 0;
    let weightSum = 0;
    
    for (let i = 0; i < period; i++) {
      const weight = period - i; // Weight decreases with older data
      weightedSum += prices[i] * weight;
      weightSum += weight;
    }
    
    return weightedSum / weightSum;
  }

  // Relative Strength Index - FIXED: Correct price change direction
  static calculateRSI(prices: number[], period: number = DEFAULT_RSI_PERIOD): number {
    if (!prices || prices.length < period + 1) {
      logWarn(`[RSI] Insufficient data: ${prices?.length || 0} < ${period + 1}`);
      throw new Error(`Insufficient data for RSI calculation: need ${period + 1} points, have ${prices?.length || 0}`);
    }
    
    let gains = 0;
    let losses = 0;
    
    // FIX: Calculate price changes from older to newer (i+1 to i)
    // prices[0] is newest, so we compare prices[i+1] (older) to prices[i] (newer)
    for (let i = 0; i < period; i++) {
      const change = prices[i] - prices[i + 1]; // Newer - Older
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

  // MACD - FIXED: Proper signal line calculation using EMA
  static calculateMACD(prices: number[], fastPeriod: number = DEFAULT_MACD_FAST, slowPeriod: number = DEFAULT_MACD_SLOW, signalPeriod: number = DEFAULT_MACD_SIGNAL): { line: number, signal: number, histogram: number } {
    if (!prices || prices.length < slowPeriod + signalPeriod) {
      logWarn(`[MACD] Insufficient data: ${prices?.length || 0} < ${slowPeriod + signalPeriod}`);
      throw new Error(`Insufficient data for MACD calculation: need ${slowPeriod + signalPeriod} points, have ${prices?.length || 0}`);
    }
    
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);
    const macdLine = fastEMA - slowEMA;
    
    // FIX: Calculate proper MACD signal line using EMA of MACD line
    // We need historical MACD values to calculate signal line properly
    const macdHistory: number[] = [];
    for (let i = 0; i <= Math.min(signalPeriod * 2, prices.length - slowPeriod); i++) {
      const slicedPrices = prices.slice(i);
      if (slicedPrices.length >= slowPeriod) {
        const fastEMAHist = this.calculateEMA(slicedPrices, fastPeriod);
        const slowEMAHist = this.calculateEMA(slicedPrices, slowPeriod);
        macdHistory.push(fastEMAHist - slowEMAHist);
      }
    }
    
    const signalLine = macdHistory.length >= signalPeriod 
      ? this.calculateEMA(macdHistory, signalPeriod)
      : macdLine; // Fallback if not enough data
    
    const histogram = macdLine - signalLine;
    
    return { line: macdLine, signal: signalLine, histogram };
  }

  // Commodity Channel Index with proper source handling - FIXED: Error handling and constant
  static calculateCCI(data: MarketData[], period: number = 20, source: string = 'hlc3'): number {
    if (!data || data.length < period) {
      logWarn(`[CCI] Insufficient data: ${data?.length || 0} < ${period}`);
      throw new Error(`Insufficient data for CCI calculation: need ${period} points, have ${data?.length || 0}`);
    }
    
    // Use proper source calculation
    const typicalPrices = PriceSourceCalculator.calculateSource(data.slice(0, period), source);
    
    const sma = typicalPrices.reduce((a, b) => a + b, 0) / period;
    const meanDeviation = typicalPrices.reduce((sum, price) => 
      sum + Math.abs(price - sma), 0
    ) / period;
    
    if (meanDeviation === 0) {
      logWarn('[CCI] Mean deviation is 0, returning 0');
      return 0;
    }
    
    const currentTypicalPrice = typicalPrices[0]; // First element is most recent
    return (currentTypicalPrice - sma) / (CCI_CONSTANT * meanDeviation);
  }

  // Bollinger Bands - FIXED: Error handling
  static calculateBollingerBands(prices: number[], period: number = DEFAULT_BB_PERIOD, deviation: number = DEFAULT_BB_DEVIATION): { upper: number, middle: number, lower: number } {
    if (!prices || prices.length < period) {
      logWarn(`[BollingerBands] Insufficient data: ${prices?.length || 0} < ${period}`);
      throw new Error(`Insufficient data for Bollinger Bands: need ${period} points, have ${prices?.length || 0}`);
    }
    
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

  // Stochastic Oscillator - FIXED: Proper D value calculation using SMA
  static calculateStochastic(data: MarketData[], kPeriod: number = 14, dPeriod: number = 3): { k: number, d: number } {
    if (!data || data.length < kPeriod + dPeriod - 1) {
      logWarn(`[Stochastic] Insufficient data: ${data?.length || 0} < ${kPeriod + dPeriod - 1}`);
      throw new Error(`Insufficient data for Stochastic: need ${kPeriod + dPeriod - 1} points, have ${data?.length || 0}`);
    }
    
    // Calculate K values for D period
    const kValues: number[] = [];
    
    for (let j = 0; j < dPeriod; j++) {
      const periodData = data.slice(j, j + kPeriod);
      const highs = periodData.map(d => d.high);
      const lows = periodData.map(d => d.low);
      const currentClose = periodData[0].close;
      
      const highestHigh = Math.max(...highs);
      const lowestLow = Math.min(...lows);
      
      if (highestHigh === lowestLow) {
        kValues.push(50); // Neutral value when no range
      } else {
        const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
        kValues.push(k);
      }
    }
    
    // FIX: D is the SMA of K values
    const d = kValues.reduce((a, b) => a + b, 0) / kValues.length;
    
    return { k: kValues[0], d: d };
  }

  // Average True Range - FIXED: Boundary check
  static calculateATR(data: MarketData[], period: number = 14): number {
    if (!data || data.length < period + 1) {
      logWarn(`[ATR] Insufficient data: ${data?.length || 0} < ${period + 1}`);
      throw new Error(`Insufficient data for ATR: need ${period + 1} points, have ${data?.length || 0}`);
    }
    
    let trSum = 0;
    
    // FIX: Proper boundary check - ensure we have previous close
    for (let i = 0; i < period; i++) {
      const high = data[i].high;
      const low = data[i].low;
      // Safe access to previous close
      const prevClose = (i + 1 < data.length) ? data[i + 1].close : data[i].close;
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      
      trSum += tr;
    }
    
    return trSum / period;
  }

  // Money Flow Index - FIXED: Error handling
  static calculateMFI(data: MarketData[], period: number = 14): number {
    if (!data || data.length < period + 1) {
      logWarn(`[MFI] Insufficient data: ${data?.length || 0} < ${period + 1}`);
      throw new Error(`Insufficient data for MFI: need ${period + 1} points, have ${data?.length || 0}`);
    }
    
    let positiveFlow = 0;
    let negativeFlow = 0;
    
    for (let i = 0; i < period; i++) {
      const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3;
      const prevTypicalPrice = (i + 1 < data.length) ? 
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

// Market Hours Checker - FIXED: Improved timezone handling with fallback
class MarketHoursChecker {
  static isMarketOpen(): boolean {
    try {
      const now = new Date();
      
      // Method 1: Try using Intl API (preferred)
      try {
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
        
        logInfo(`[MarketHours] Current EST time: ${dayName} ${partsObj.hour}:${partsObj.minute}`);
        
        return this.checkMarketHours(dayName, hour, minute);
        
      } catch (intlError) {
        logWarn('[MarketHours] Intl API failed, using fallback method:', intlError);
        
        // Method 2: Fallback - Manual UTC to EST conversion
        // EST is UTC-5, EDT is UTC-4 (we'll use EST for simplicity)
        const utcHour = now.getUTCHours();
        const utcMinute = now.getUTCMinutes();
        const utcDay = now.getUTCDay();
        
        // Convert UTC to EST (UTC-5)
        let estHour = utcHour - 5;
        let estDay = utcDay;
        
        if (estHour < 0) {
          estHour += 24;
          estDay = (estDay - 1 + 7) % 7;
        }
        
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const estDayName = dayNames[estDay];
        
        logInfo(`[MarketHours] Fallback EST time: ${estDayName} ${estHour}:${utcMinute}`);
        
        return this.checkMarketHours(estDayName, estHour, utcMinute);
      }
      
    } catch (error) {
      logError('[MarketHours] Error checking market hours:', error);
      return false;
    }
  }
  
  private static checkMarketHours(dayName: string, hour: number, minute: number): boolean {
    // Check if it's a weekday
    const isWeekday = !['Saturday', 'Sunday'].includes(dayName);
    
    if (!isWeekday) {
      logInfo(`[MarketHours] Market closed - Weekend`);
      return false;
    }
    
    // Market hours: 9:30 AM to 4:00 PM EST
    const currentMinutes = hour * 60 + minute;
    const marketOpen = 9 * 60 + 30; // 9:30 AM
    const marketClose = 16 * 60; // 4:00 PM
    
    const isOpen = currentMinutes >= marketOpen && currentMinutes < marketClose;
    logInfo(`[MarketHours] Market is ${isOpen ? 'OPEN' : 'CLOSED'}`);
    
    return isOpen;
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
    logDebug(`[MarketData] Starting data extraction for ${symbol} at: ${dataExtractionTime}`);
    
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

    logDebug(`[MarketData] Successfully fetched ${marketData.length} data points for ${symbol}`);
    logDebug(`[MarketData] Latest data point: ${marketData[0].date}`);
    
    return marketData;
  }

  // Get current price quote with real-time timestamp tracking
  async getCurrentPrice(symbol: string): Promise<number> {
    logDebug(`[MarketData] Requesting current price for ${symbol}`);
    
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
    logDebug(`[MarketData] Price for ${symbol}: $${currentPrice}`);
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

// Strategy Evaluator - FIXED: Optimized memory usage
class StrategyEvaluator {
  private indicators: Map<string, any> = new Map();

  async calculateIndicatorsForStrategy(strategy: Strategy, marketData: MarketData[]): Promise<void> {
    this.indicators.clear();
    
    logDebug(`[StrategyEvaluator] Calculating indicators for strategy: ${strategy.name}`);
    
    // OPTIMIZATION: Store current prices directly without creating separate arrays
    this.indicators.set('PRICE_close', marketData[0].close);
    this.indicators.set('PRICE_open', marketData[0].open);
    this.indicators.set('PRICE_high', marketData[0].high);
    this.indicators.set('PRICE_low', marketData[0].low);
    
    logDebug(`[StrategyEvaluator] Current prices - Close: ${marketData[0].close}, Open: ${marketData[0].open}`);
    
    // Calculate indicators based on strategy rules using current data
    const indicatorConfigs = this.extractIndicatorConfigs(strategy);
    
    for (const [configKey, params] of indicatorConfigs) {
      // Extract indicator name - handle names with spaces (e.g., "Bollinger Bands")
      // The configKey format is: "IndicatorName_{json}"
      const lastJsonStart = configKey.lastIndexOf('_{');
      const indicatorName = lastJsonStart > 0 ? configKey.substring(0, lastJsonStart) : configKey.split('_')[0];
      
      try {
        let indicatorValue: any;
        
        switch (indicatorName.toLowerCase().replace(/\s+/g, '')) {
          case 'sma':
            const period = parseInt(params.period || '14');
            const smaSource = params.source || 'close';
            const smaPrices = PriceSourceCalculator.calculateSource(marketData, smaSource);
            indicatorValue = TechnicalIndicators.calculateSMA(smaPrices, period);
            logDebug(`[Indicator] SMA(${period}, ${smaSource}): ${indicatorValue}`);
            break;
            
          case 'ema':
            const emaPeriod = parseInt(params.period || '14');
            const emaSource = params.source || 'close';
            const emaPrices = PriceSourceCalculator.calculateSource(marketData, emaSource);
            indicatorValue = TechnicalIndicators.calculateEMA(emaPrices, emaPeriod);
            logDebug(`[Indicator] EMA(${emaPeriod}, ${emaSource}): ${indicatorValue}`);
            break;

          case 'wma':
          case 'weightedmovingaverage':
            const wmaPeriod = parseInt(params.period || '14');
            const wmaSource = params.source || 'close';
            const wmaPrices = PriceSourceCalculator.calculateSource(marketData, wmaSource);
            indicatorValue = TechnicalIndicators.calculateWMA(wmaPrices, wmaPeriod);
            logDebug(`[Indicator] WMA(${wmaPeriod}, ${wmaSource}): ${indicatorValue}`);
            break;
            
          case 'rsi':
            const rsiPeriod = parseInt(params.period || '14');
            const rsiSource = params.source || 'close';
            const rsiPrices = PriceSourceCalculator.calculateSource(marketData, rsiSource);
            indicatorValue = TechnicalIndicators.calculateRSI(rsiPrices, rsiPeriod);
            logDebug(`[Indicator] RSI(${rsiPeriod}, ${rsiSource}): ${indicatorValue}`);
            break;
            
          case 'macd':
            const fastPeriod = parseInt(params.fast || params.fastPeriod || '12');
            const slowPeriod = parseInt(params.slow || params.slowPeriod || '26');
            const signalPeriod = parseInt(params.signal || params.signalPeriod || '9');
            const macdSource = params.source || 'close';
            const macdPrices = PriceSourceCalculator.calculateSource(marketData, macdSource);
            indicatorValue = TechnicalIndicators.calculateMACD(macdPrices, fastPeriod, slowPeriod, signalPeriod);
            logDebug(`[Indicator] MACD(${fastPeriod}, ${slowPeriod}, ${signalPeriod}):`, indicatorValue);
            break;
            
          case 'cci':
            const cciPeriod = parseInt(params.period || '20');
            const cciSource = params.source || 'hlc3';
            indicatorValue = TechnicalIndicators.calculateCCI(marketData, cciPeriod, cciSource);
            logDebug(`[Indicator] CCI(${cciPeriod}, ${cciSource}): ${indicatorValue}`);
            break;
            
          case 'bollingerbands':
          case 'bbands':
            const bbPeriod = parseInt(params.period || '20');
            const deviation = parseFloat(params.deviation || '2');
            const bbSource = params.source || 'close';
            const bbPrices = PriceSourceCalculator.calculateSource(marketData, bbSource);
            indicatorValue = TechnicalIndicators.calculateBollingerBands(bbPrices, bbPeriod, deviation);
            logDebug(`[Indicator] BollingerBands(${bbPeriod}, ${deviation}):`, indicatorValue);
            break;
            
          case 'stochastic':
            const kPeriod = parseInt(params.k || params.kPeriod || '14');
            const dPeriod = parseInt(params.d || params.dPeriod || '3');
            indicatorValue = TechnicalIndicators.calculateStochastic(marketData, kPeriod, dPeriod);
            logDebug(`[Indicator] Stochastic(${kPeriod}, ${dPeriod}):`, indicatorValue);
            break;
            
          case 'atr':
            const atrPeriod = parseInt(params.period || '14');
            indicatorValue = TechnicalIndicators.calculateATR(marketData, atrPeriod);
            logDebug(`[Indicator] ATR(${atrPeriod}): ${indicatorValue}`);
            break;
            
          case 'mfi':
            const mfiPeriod = parseInt(params.period || '14');
            indicatorValue = TechnicalIndicators.calculateMFI(marketData, mfiPeriod);
            logDebug(`[Indicator] MFI(${mfiPeriod}): ${indicatorValue}`);
            break;
            
          default:
            logWarn(`[StrategyEvaluator] Unknown indicator: ${indicatorName}`);
            throw new Error(`Unknown indicator: ${indicatorName}`);
        }
        
        this.indicators.set(configKey, indicatorValue);
        
      } catch (error) {
        logError(`[StrategyEvaluator] Error calculating ${indicatorName}:`, error);
        throw error; // Re-throw to handle at strategy level
      }
    }

    logDebug(`[StrategyEvaluator] Completed indicator calculations for ${strategy.name}`);
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
    // Normalize type to uppercase for compatibility
    const normalizedType = type?.toUpperCase();
    
    if (normalizedType === 'PRICE') {
      return this.indicators.get(`PRICE_${indicator}`) || 0;
    }
    
    if (normalizedType === 'INDICATOR' && indicator && params) {
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
    logDebug(`[Condition] Evaluating: ${leftValue} ${condition} ${rightValue}`);
    
    // Normalize condition for compatibility (support both formats)
    const normalizedCondition = condition?.toUpperCase().replace(/\s+/g, '_');
    
    switch (normalizedCondition) {
      case 'GREATER_THAN':
      case '>':
        return leftValue > rightValue;
      case 'LESS_THAN':
      case '<':
        return leftValue < rightValue;
      case 'EQUAL':
      case 'EQUALS':
      case '==':
      case '=':
        return Math.abs(leftValue - rightValue) < 0.0001;
      case 'NOT_EQUALS':
      case '!=':
        return Math.abs(leftValue - rightValue) >= 0.0001;
      case 'GREATER_THAN_OR_EQUAL':
      case '>=':
        return leftValue >= rightValue;
      case 'LESS_THAN_OR_EQUAL':
      case '<=':
        return leftValue <= rightValue;
      case 'CROSSES_ABOVE':
        return leftValue > rightValue;
      case 'CROSSES_BELOW':
        return leftValue < rightValue;
      default:
        logWarn(`[Condition] Unknown condition: ${condition}`);
        return false;
    }
  }

  private evaluateRuleGroup(group: RuleGroup): boolean {
    if (!group.trading_rules || group.trading_rules.length === 0) {
      return false;
    }

    logDebug(`[RuleGroup] Evaluating group ${group.id} (${group.rule_type}) with ${group.logic} logic`);

    const results = group.trading_rules.map((rule, index) => {
      // Get left side value
      let leftValue: number;
      const normalizedLeftType = rule.left_type?.toUpperCase();
      
      if (normalizedLeftType === 'VALUE') {
        leftValue = parseFloat(rule.left_value || '0');
      } else {
        leftValue = this.getIndicatorValue(rule.left_type, rule.left_indicator, rule.left_parameters, rule.left_value_type);
      }
      
      // Get right side value
      let rightValue: number;
      const normalizedRightType = rule.right_type?.toUpperCase();
      
      if (normalizedRightType === 'VALUE') {
        rightValue = parseFloat(rule.right_value || '0');
      } else {
        rightValue = this.getIndicatorValue(rule.right_type, rule.right_indicator, rule.right_parameters, rule.right_value_type);
      }
      
      const result = this.evaluateCondition(rule.condition, leftValue, rightValue);
      logDebug(`[RuleGroup] Rule ${index + 1}: ${rule.left_indicator || rule.left_value}(${leftValue.toFixed(4)}) ${rule.condition} ${rule.right_indicator || rule.right_value}(${rightValue.toFixed(4)}) = ${result}`);
      
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

    logDebug(`[RuleGroup] Group result: ${groupResult}`);
    return groupResult;
  }

  evaluateStrategy(strategy: Strategy): { entrySignal: boolean, exitSignal: boolean } {
    logInfo(`[Strategy] Evaluating strategy: ${strategy.name}`);
    
    const entryGroups = strategy.rule_groups.filter(group => group.rule_type === 'entry');
    const exitGroups = strategy.rule_groups.filter(group => group.rule_type === 'exit');

    const entrySignal = entryGroups.some(group => this.evaluateRuleGroup(group));
    const exitSignal = exitGroups.some(group => this.evaluateRuleGroup(group));

    logInfo(`[Strategy] Result - Entry: ${entrySignal}, Exit: ${exitSignal}`);
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

  // FIXED: Use atomic increment to prevent race conditions and correctly count signals
  private async incrementDailySignalCount(strategyId: string, userId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Use PostgreSQL RPC function for atomic increment operation
      // This prevents race conditions when multiple signals are generated simultaneously
      const { error } = await this.supabase.rpc('increment_daily_signal_count', {
        p_strategy_id: strategyId,
        p_user_id: userId,
        p_signal_date: today
      });

      if (error) {
        // Fallback to manual increment if RPC function doesn't exist
        logWarn('[NotificationService] RPC function not found, using fallback method');
        
        // First, try to get existing count
        const { data: existingCount, error: fetchError } = await this.supabase
          .from('daily_signal_counts')
          .select('*')
          .eq('strategy_id', strategyId)
          .eq('signal_date', today)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          logError('[NotificationService] Error fetching daily signal count:', fetchError);
          return;
        }

        if (existingCount) {
          // Update existing count - INCREMENT it
          const { error: updateError } = await this.supabase
            .from('daily_signal_counts')
            .update({ 
              notification_count: existingCount.notification_count + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingCount.id);

          if (updateError) {
            logError('[NotificationService] Error updating daily signal count:', updateError);
          } else {
            logInfo(`[NotificationService] Daily signal count incremented to ${existingCount.notification_count + 1}`);
          }
        } else {
          // Create new count record - START at 1
          const { error: insertError } = await this.supabase
            .from('daily_signal_counts')
            .insert({
              strategy_id: strategyId,
              user_id: userId,
              signal_date: today,
              notification_count: 1
            });

          if (insertError) {
            logError('[NotificationService] Error creating daily signal count:', insertError);
          } else {
            logInfo(`[NotificationService] Daily signal count initialized to 1`);
          }
        }
      } else {
        logDebug(`[NotificationService] Daily signal count incremented via RPC`);
      }
    } catch (error) {
      logError('[NotificationService] Error incrementing daily signal count:', error);
    }
  }

  async sendNotifications(signal: any, strategy: Strategy): Promise<void> {
    logInfo(`[Notifications] Processing notifications for signal ${signal.id}`);
    
    try {
      const isPro = await this.checkUserProStatus(strategy.user_id);
      if (!isPro) {
        logDebug(`[Notifications] User is not Pro - skipping external notifications`);
        return;
      }

      const withinLimit = await this.checkDailySignalLimit(strategy.id, strategy.user_id);
      if (!withinLimit) {
        logInfo(`[Notifications] Daily signal limit reached - skipping notifications`);
        return;
      }

      const { data: settings } = await this.supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', strategy.user_id)
        .single();

      if (!settings) {
        logDebug('[Notifications] No notification settings found');
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
        logDebug(`[Notifications] Signal type ${signalType} not enabled`);
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

      const notifications: string[] = [];

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
          logError('[Notifications] Discord notification error:', error);
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
          logError('[Notifications] Telegram notification error:', error);
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
          logError('[Notifications] Email notification error:', error);
        }
      }

      if (notifications.length > 0) {
        await this.incrementDailySignalCount(strategy.id, strategy.user_id);
      }

      logInfo(`[Notifications] Sent via: ${notifications.join(', ') || 'none'}`);

    } catch (error) {
      logError('[Notifications] Error in sendNotifications:', error);
    }
  }
}

// Helper class to manage timeframe-based evaluation scheduling
class TimeframeEvaluationManager {
  // 计算下次评估的时间（基于策略的timeframe）
  static calculateNextEvaluationTime(timeframe: string, currentTime: Date = new Date()): Date {
    const nextEval = new Date(currentTime);
    
    switch (timeframe) {
      case '5m':
        // 对齐到下一个5分钟边界
        const next5Min = Math.ceil(nextEval.getMinutes() / 5) * 5;
        nextEval.setMinutes(next5Min);
        nextEval.setSeconds(0, 0);
        break;
      case '15m':
        // 对齐到下一个15分钟边界
        const next15Min = Math.ceil(nextEval.getMinutes() / 15) * 15;
        nextEval.setMinutes(next15Min);
        nextEval.setSeconds(0, 0);
        break;
      case '30m':
        // 对齐到下一个30分钟边界
        const next30Min = Math.ceil(nextEval.getMinutes() / 30) * 30;
        nextEval.setMinutes(next30Min);
        nextEval.setSeconds(0, 0);
        break;
      case '1h':
        nextEval.setHours(nextEval.getHours() + 1);
        nextEval.setMinutes(0, 0, 0);
        break;
      case '4h':
        // 对齐到下一个4小时边界
        const next4Hour = Math.ceil(nextEval.getHours() / 4) * 4;
        nextEval.setHours(next4Hour);
        nextEval.setMinutes(0, 0, 0);
        break;
      case 'Daily':
        // 下一个交易日的收盘时间 (4:00 PM ET)
        nextEval.setDate(nextEval.getDate() + 1);
        nextEval.setHours(16, 0, 0, 0);
        // 跳过周末
        while (nextEval.getDay() === 0 || nextEval.getDay() === 6) {
          nextEval.setDate(nextEval.getDate() + 1);
        }
        break;
      default:
        // 默认1小时后（用于未知的timeframe）
        logWarn(`⚠️ Unknown timeframe: ${timeframe}, defaulting to 1 hour`);
        nextEval.setHours(nextEval.getHours() + 1);
    }
    
    return nextEval;
  }

  // 判断策略是否应该在当前时间被评估
  static shouldEvaluateNow(
    strategy: Strategy,
    evaluationRecord: any | null,
    currentTime: Date = new Date()
  ): boolean {
    // 如果没有评估记录，说明是新策略，应该立即评估
    if (!evaluationRecord || !evaluationRecord.next_evaluation_due) {
      logInfo(`✅ Strategy ${strategy.name}: First evaluation (no record)`);
      return true;
    }

    const nextDue = new Date(evaluationRecord.next_evaluation_due);
    
    // 如果当前时间 >= 下次应该评估的时间，则评估
    if (currentTime >= nextDue) {
      logInfo(`✅ Strategy ${strategy.name}: Due for evaluation (${strategy.timeframe})`);
      return true;
    }

    // 否则跳过
    const minutesUntilNext = Math.round((nextDue.getTime() - currentTime.getTime()) / 60000);
    logInfo(`⏭️ Strategy ${strategy.name}: Skipping - next check in ${minutesUntilNext} minutes`);
    return false;
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
    logInfo(`🚀 Starting ${isOptimized ? 'OPTIMIZED' : 'STANDARD'} signal monitoring at: ${monitoringStartTime}`);

    // Check market hours first - this is critical for timing
    if (!MarketHoursChecker.isMarketOpen()) {
      logInfo('Market is closed - exiting early');
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

    // Get active strategies with their evaluation records
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

    logInfo(`📋 Found ${strategies?.length || 0} active strategies`);

    // Get all strategy evaluation records
    const { data: evaluations, error: evaluationsError } = await supabase
      .from('strategy_evaluations')
      .select('*')
      .in('strategy_id', strategies?.map(s => s.id) || []);

    if (evaluationsError) {
      logWarn('⚠️ Could not fetch strategy evaluations:', evaluationsError);
      // Continue without evaluation records
    }

    // Create a map of strategy_id -> evaluation record for quick lookup
    const evaluationMap = new Map();
    if (evaluations) {
      evaluations.forEach(evaluation => evaluationMap.set(evaluation.strategy_id, evaluation));
    }

    // Filter strategies based on timeframe schedule
    const currentTime = new Date();
    const strategiesToProcess = strategies?.filter(strategy => {
      const evaluation = evaluationMap.get(strategy.id);
      return TimeframeEvaluationManager.shouldEvaluateNow(strategy, evaluation, currentTime);
    }) || [];

    logInfo(`🎯 Processing ${strategiesToProcess.length} strategies (filtered by timeframe schedule)`);

    const processedStrategies: any[] = [];
    const errors: any[] = [];
    const evaluatedStrategyIds: string[] = []; // 跟踪已评估的策略ID

    // Initialize services
    const marketDataService = new MarketDataService(fmpApiKey);
    const strategyEvaluator = new StrategyEvaluator();
    const notificationService = new NotificationService(supabase);

    if (enableParallel && strategiesToProcess && strategiesToProcess.length > 0) {
      logInfo('🔄 Using PARALLEL processing mode');
      
      try {
        // Group strategies by asset to minimize API calls
        const assetGroups = new Map<string, typeof strategiesToProcess>();
        strategiesToProcess.forEach(strategy => {
          if (!strategy.target_asset) return;
          
          if (!assetGroups.has(strategy.target_asset)) {
            assetGroups.set(strategy.target_asset, []);
          }
          assetGroups.get(strategy.target_asset)?.push(strategy);
        });

        logInfo(`📊 Processing ${assetGroups.size} unique assets in parallel`);

        // Process all asset groups in parallel
        const assetProcessingPromises = Array.from(assetGroups.entries()).map(async ([asset, assetStrategies]) => {
          const assetStartTime = new Date().toISOString();
          logDebug(`📈 Processing ${assetStrategies.length} strategies for ${asset}`);

          try {
            // Fetch market data once per asset
            const marketData = await marketDataService.fetchCurrentMarketData(asset, assetStrategies[0].timeframe, 100);
            
            // Process all strategies for this asset in parallel
            const strategyPromises = assetStrategies.map(async (strategy) => {
              const strategyProcessingStartTime = new Date().toISOString();
              
              try {
                if (!strategy.rule_groups || strategy.rule_groups.length === 0) {
                  logWarn(`⚠️ Skipping strategy ${strategy.name} - no rule groups`);
                  return null;
                }

                // Calculate indicators and evaluate strategy
                await strategyEvaluator.calculateIndicatorsForStrategy(strategy, marketData);
                const evaluation = strategyEvaluator.evaluateStrategy(strategy);

                if (evaluation.entrySignal || evaluation.exitSignal) {
                  logInfo(`🚨 SIGNAL DETECTED: ${strategy.name} (parallel)`);
                  
                  const signalType = evaluation.entrySignal ? 'entry' : 'exit';
                  const currentRealTime = new Date().toISOString();
                  
                  // Calculate position size based on strategy parameters
                  const accountCapital = strategy.account_capital || DEFAULT_ACCOUNT_CAPITAL;
                  const riskTolerance = strategy.risk_tolerance || 'moderate';
                  const currentPrice = marketData[0].close;
                  const positionSize = PositionSizeCalculator.calculatePositionSize(
                    accountCapital,
                    riskTolerance,
                    currentPrice
                  );
                  
                  const signalData = {
                    strategy_id: strategy.id,
                    strategy_name: strategy.name,
                    asset: strategy.target_asset,
                    timeframe: strategy.timeframe,
                    signal_type: signalType,
                    timestamp: currentRealTime,
                    current_price: currentPrice,
                    quantity: positionSize.quantity,
                    amount: positionSize.amount,
                    position_percentage: positionSize.positionPercentage,
                    account_capital: accountCapital,
                    risk_tolerance: riskTolerance,
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

                  logInfo(`✅ Signal ${signal.id} created (parallel)`);
                  
                  // Send notifications (non-blocking)
                  notificationService.sendNotifications(signal, strategy).catch(error => {
                    logError(`❌ Notification error for signal ${signal.id}:`, error);
                  });
                  
                  // 更新策略评估记录（不阻塞主流程）
                  const nextEvalTime = TimeframeEvaluationManager.calculateNextEvaluationTime(
                    strategy.timeframe,
                    new Date()
                  );
                  supabase
                    .from('strategy_evaluations')
                    .upsert({
                      strategy_id: strategy.id,
                      timeframe: strategy.timeframe,
                      last_evaluated_at: new Date().toISOString(),
                      next_evaluation_due: nextEvalTime.toISOString(),
                      evaluation_count: (evaluationMap.get(strategy.id)?.evaluation_count || 0) + 1
                    }, { onConflict: 'strategy_id' })
                    .then(({ error }) => {
                      if (error) {
                        logWarn(`⚠️ Failed to update evaluation record: ${error.message}`);
                      } else {
                        logDebug(`📝 Updated evaluation record for ${strategy.name}`);
                      }
                    });
                  
                  evaluatedStrategyIds.push(strategy.id);
                  
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
                  logDebug(`No signals for strategy ${strategy.name}`);
                  
                  // 即使没有生成信号，也要更新评估记录
                  const nextEvalTime = TimeframeEvaluationManager.calculateNextEvaluationTime(
                    strategy.timeframe,
                    new Date()
                  );
                  supabase
                    .from('strategy_evaluations')
                    .upsert({
                      strategy_id: strategy.id,
                      timeframe: strategy.timeframe,
                      last_evaluated_at: new Date().toISOString(),
                      next_evaluation_due: nextEvalTime.toISOString(),
                      evaluation_count: (evaluationMap.get(strategy.id)?.evaluation_count || 0) + 1
                    }, { onConflict: 'strategy_id' })
                    .then(({ error }) => {
                      if (error) {
                        logWarn(`⚠️ Failed to update evaluation record: ${error.message}`);
                      } else {
                        logDebug(`📝 Updated evaluation record for ${strategy.name}`);
                      }
                    });
                  
                  evaluatedStrategyIds.push(strategy.id);
                  
                  return null;
                }

              } catch (error) {
                logError(`❌ Error processing strategy ${strategy.name}:`, error);
                errors.push({
                  strategy_id: strategy.id,
                  strategy_name: strategy.name,
                  error: error.message,
                  processing_mode: 'parallel'
                });
                return null;
              } finally {
                // 确保即使出错也记录评估尝试
                if (!evaluatedStrategyIds.includes(strategy.id)) {
                  const nextEvalTime = TimeframeEvaluationManager.calculateNextEvaluationTime(
                    strategy.timeframe,
                    new Date()
                  );
                  supabase
                    .from('strategy_evaluations')
                    .upsert({
                      strategy_id: strategy.id,
                      timeframe: strategy.timeframe,
                      last_evaluated_at: new Date().toISOString(),
                      next_evaluation_due: nextEvalTime.toISOString(),
                      evaluation_count: (evaluationMap.get(strategy.id)?.evaluation_count || 0) + 1
                    }, { onConflict: 'strategy_id' })
                    .then(({ error }) => {
                      if (error) {
                        logWarn(`⚠️ Failed to update evaluation record in finally: ${error.message}`);
                      }
                    });
                }
              }
            });

            // Wait for all strategies for this asset to complete
            const assetResults = await Promise.all(strategyPromises);
            return assetResults.filter(result => result !== null);

          } catch (error) {
            logError(`❌ Error processing asset ${asset}:`, error);
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
        logError(`💥 Error in parallel processing:`, error);
        errors.push({
          error: 'Parallel processing failed: ' + error.message,
          processing_mode: 'parallel'
        });
      }
    } else {
      // Fallback to sequential processing (existing code)
      logInfo('🔄 Using SEQUENTIAL processing mode');
      
      for (const strategy of strategiesToProcess || []) {
        try {
          logDebug(`🎯 Processing strategy: ${strategy.name}`);
          
          if (!strategy.target_asset) {
            logWarn(`⚠️ Skipping ${strategy.name} - no target asset`);
            continue;
          }

          if (!strategy.rule_groups || strategy.rule_groups.length === 0) {
            logWarn(`⚠️ Skipping ${strategy.name} - no rule groups`);
            continue;
          }

          // Fetch current market data
          const marketData = await marketDataService.fetchCurrentMarketData(
            strategy.target_asset, 
            strategy.timeframe, 
            100
          );

          // Calculate indicators with current market data
          await strategyEvaluator.calculateIndicatorsForStrategy(strategy, marketData);
          
          // Evaluate strategy conditions
          const evaluation = strategyEvaluator.evaluateStrategy(strategy);

          if (evaluation.entrySignal || evaluation.exitSignal) {
            logInfo(`🚨 SIGNAL DETECTED: ${strategy.name}`);
            
            const signalType = evaluation.entrySignal ? 'entry' : 'exit';
            const currentRealTime = new Date().toISOString();
            
            // Calculate position size based on strategy parameters
            const accountCapital = strategy.account_capital || DEFAULT_ACCOUNT_CAPITAL;
            const riskTolerance = strategy.risk_tolerance || 'moderate';
            const currentPrice = marketData[0].close;
            const positionSize = PositionSizeCalculator.calculatePositionSize(
              accountCapital,
              riskTolerance,
              currentPrice
            );
            
            const signalData = {
              strategy_id: strategy.id,
              strategy_name: strategy.name,
              asset: strategy.target_asset,
              timeframe: strategy.timeframe,
              signal_type: signalType,
              timestamp: currentRealTime,
              current_price: currentPrice,
              quantity: positionSize.quantity,
              amount: positionSize.amount,
              position_percentage: positionSize.positionPercentage,
              account_capital: accountCapital,
              risk_tolerance: riskTolerance,
              data_timestamp: currentRealTime
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

            logInfo(`✅ Signal ${signal.id} created`);
            
            // Send notifications immediately
            await notificationService.sendNotifications(signal, strategy);
            
            // Auto-execute trade on Alpaca (if configured)
            try {
              const alpacaResponse = await fetch(
                `${Deno.env.get('SUPABASE_URL')}/functions/v1/alpaca-auto-trade`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    signal_id: signal.id,
                    strategy_id: strategy.id,
                  }),
                }
              );
              
              if (alpacaResponse.ok) {
                const alpacaResult = await alpacaResponse.json();
                if (alpacaResult.success) {
                  logInfo(`🤖 Alpaca trade executed: ${alpacaResult.message}`);
                } else {
                  logDebug(`⏭️ Alpaca trade skipped: ${alpacaResult.message}`);
                }
              } else {
                logWarn(`⚠️ Alpaca auto-trade call failed: ${alpacaResponse.statusText}`);
              }
            } catch (alpacaError) {
              logWarn(`⚠️ Error calling Alpaca auto-trade: ${alpacaError.message}`);
            }
            
            // 更新策略评估记录
            const nextEvalTime = TimeframeEvaluationManager.calculateNextEvaluationTime(
              strategy.timeframe,
              new Date()
            );
            const { error: updateError } = await supabase
              .from('strategy_evaluations')
              .upsert({
                strategy_id: strategy.id,
                timeframe: strategy.timeframe,
                last_evaluated_at: new Date().toISOString(),
                next_evaluation_due: nextEvalTime.toISOString(),
                evaluation_count: (evaluationMap.get(strategy.id)?.evaluation_count || 0) + 1
              }, { onConflict: 'strategy_id' });
            
            if (updateError) {
              logWarn(`⚠️ Failed to update evaluation record: ${updateError.message}`);
            } else {
              logDebug(`📝 Updated evaluation record for ${strategy.name}`);
            }
            
            evaluatedStrategyIds.push(strategy.id);
            
            processedStrategies.push({
              strategy_id: strategy.id,
              strategy_name: strategy.name,
              signal_type: signalType,
              signal_id: signal.id,
              data_timestamp: currentRealTime,
              processing_time: new Date().toISOString()
            });
          } else {
            logDebug(`No signals for ${strategy.name}`);
            
            // 即使没有生成信号，也要更新评估记录
            const nextEvalTime = TimeframeEvaluationManager.calculateNextEvaluationTime(
              strategy.timeframe,
              new Date()
            );
            const { error: updateError2 } = await supabase
              .from('strategy_evaluations')
              .upsert({
                strategy_id: strategy.id,
                timeframe: strategy.timeframe,
                last_evaluated_at: new Date().toISOString(),
                next_evaluation_due: nextEvalTime.toISOString(),
                evaluation_count: (evaluationMap.get(strategy.id)?.evaluation_count || 0) + 1
              }, { onConflict: 'strategy_id' });
            
            if (updateError2) {
              logWarn(`⚠️ Failed to update evaluation record: ${updateError2.message}`);
            } else {
              logDebug(`📝 Updated evaluation record for ${strategy.name}`);
            }
            
            evaluatedStrategyIds.push(strategy.id);
          }

        } catch (error) {
          logError(`❌ Error processing ${strategy.name}:`, error);
          errors.push({
            strategy_id: strategy.id,
            strategy_name: strategy.name,
            error: error.message
          });
        } finally {
          // 确保即使出错也记录评估尝试
          if (!evaluatedStrategyIds.includes(strategy.id)) {
            const nextEvalTime = TimeframeEvaluationManager.calculateNextEvaluationTime(
              strategy.timeframe,
              new Date()
            );
            supabase
              .from('strategy_evaluations')
              .upsert({
                strategy_id: strategy.id,
                timeframe: strategy.timeframe,
                last_evaluated_at: new Date().toISOString(),
                next_evaluation_due: nextEvalTime.toISOString(),
                evaluation_count: (evaluationMap.get(strategy.id)?.evaluation_count || 0) + 1
              }, { onConflict: 'strategy_id' })
              .then(({ error }) => {
                if (error) {
                  logWarn(`⚠️ Failed to update evaluation record in finally: ${error.message}`);
                }
              });
          }
        }
      }
    }

    const monitoringCompleteTime = new Date().toISOString();
    const response = {
      success: true,
      message: `Processed ${strategiesToProcess.length}/${strategies?.length || 0} strategies (filtered by timeframe) with ${isOptimized ? 'OPTIMIZED' : 'STANDARD'} ${enableParallel ? 'PARALLEL' : 'SEQUENTIAL'} processing`,
      signals_generated: processedStrategies.length,
      processed_strategies: processedStrategies,
      errors: errors,
      monitoring_start_time: monitoringStartTime,
      monitoring_complete_time: monitoringCompleteTime,
      processing_mode: enableParallel ? 'parallel' : 'sequential',
      optimization_enabled: isOptimized,
      timeframe_filtering: {
        total_active_strategies: strategies?.length || 0,
        strategies_due_for_evaluation: strategiesToProcess.length,
        strategies_skipped: (strategies?.length || 0) - strategiesToProcess.length,
        evaluated_count: evaluatedStrategyIds.length
      },
      performance_metrics: {
        total_time_ms: new Date(monitoringCompleteTime).getTime() - new Date(monitoringStartTime).getTime(),
        strategies_processed: strategiesToProcess.length,
        signals_generated: processedStrategies.length,
        errors_count: errors.length,
        avg_time_per_strategy: strategiesToProcess.length > 0 
          ? Math.round((new Date(monitoringCompleteTime).getTime() - new Date(monitoringStartTime).getTime()) / strategiesToProcess.length)
          : 0
      }
    };

    logInfo(`🏁 Monitoring completed: ${processedStrategies.length} signals, ${errors.length} errors`);
    logInfo(`📊 Performance: ${response.performance_metrics.total_time_ms}ms total`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logError('💥 Error in monitor-trading-signals:', error);
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

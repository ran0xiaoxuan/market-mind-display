
// Core technical indicators implementation using JavaScript
// This replaces TAAPI with local calculations

export interface IndicatorInput {
  open?: number[];
  high?: number[];
  low?: number[];
  close: number[];
  volume?: number[];
}

export interface IndicatorConfig {
  period?: number;
  fastPeriod?: number;
  slowPeriod?: number;
  signalPeriod?: number;
  deviation?: number;
  multiplier?: number;
  kPeriod?: number;
  dPeriod?: number;
  slowing?: number;
  [key: string]: any;
}

export interface IndicatorResult {
  value?: number;
  values?: number[];
  upper?: number;
  middle?: number;
  lower?: number;
  macd?: number;
  signal?: number;
  histogram?: number;
  k?: number;
  d?: number;
  [key: string]: any;
}

// Simple Moving Average
export const calculateSMA = (data: number[], period: number): number[] => {
  const result: number[] = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }
  
  return result;
};

// Exponential Moving Average
export const calculateEMA = (data: number[], period: number): number[] => {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // First value is SMA
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(ema);
  
  for (let i = period; i < data.length; i++) {
    ema = (data[i] * multiplier) + (ema * (1 - multiplier));
    result.push(ema);
  }
  
  return result;
};

// Relative Strength Index
export const calculateRSI = (data: number[], period: number = 14): number[] => {
  const result: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // Calculate initial averages
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  // Calculate RSI
  for (let i = period - 1; i < gains.length; i++) {
    if (i === period - 1) {
      // First RSI calculation
      const rs = avgGain / avgLoss;
      result.push(100 - (100 / (1 + rs)));
    } else {
      // Smoothed averages
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
      const rs = avgGain / avgLoss;
      result.push(100 - (100 / (1 + rs)));
    }
  }
  
  return result;
};

// MACD
export const calculateMACD = (
  data: number[], 
  fastPeriod: number = 12, 
  slowPeriod: number = 26, 
  signalPeriod: number = 9
): { macd: number[]; signal: number[]; histogram: number[] } => {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  
  // Calculate MACD line
  const macd: number[] = [];
  const startIndex = slowPeriod - fastPeriod;
  
  for (let i = 0; i < fastEMA.length - startIndex; i++) {
    macd.push(fastEMA[i + startIndex] - slowEMA[i]);
  }
  
  // Calculate signal line
  const signal = calculateEMA(macd, signalPeriod);
  
  // Calculate histogram
  const histogram: number[] = [];
  const signalStartIndex = signalPeriod - 1;
  
  for (let i = 0; i < signal.length; i++) {
    histogram.push(macd[i + signalStartIndex] - signal[i]);
  }
  
  return { macd, signal, histogram };
};

// Bollinger Bands
export const calculateBollingerBands = (
  data: number[], 
  period: number = 20, 
  deviation: number = 2
): { upper: number[]; middle: number[]; lower: number[] } => {
  const middle = calculateSMA(data, period);
  const upper: number[] = [];
  const lower: number[] = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    const upperBand = mean + (deviation * stdDev);
    const lowerBand = mean - (deviation * stdDev);
    
    upper.push(upperBand);
    lower.push(lowerBand);
  }
  
  return { upper, middle, lower };
};

// Stochastic Oscillator
export const calculateStochastic = (
  high: number[], 
  low: number[], 
  close: number[], 
  kPeriod: number = 14, 
  dPeriod: number = 3
): { k: number[]; d: number[] } => {
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

// Average True Range
export const calculateATR = (
  high: number[], 
  low: number[], 
  close: number[], 
  period: number = 14
): number[] => {
  const trueRanges: number[] = [];
  
  for (let i = 1; i < close.length; i++) {
    const tr1 = high[i] - low[i];
    const tr2 = Math.abs(high[i] - close[i - 1]);
    const tr3 = Math.abs(low[i] - close[i - 1]);
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }
  
  return calculateSMA(trueRanges, period);
};

// Commodity Channel Index
export const calculateCCI = (
  high: number[], 
  low: number[], 
  close: number[], 
  period: number = 20
): number[] => {
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

// Williams %R
export const calculateWilliamsR = (
  high: number[], 
  low: number[], 
  close: number[], 
  period: number = 14
): number[] => {
  const result: number[] = [];
  
  for (let i = period - 1; i < close.length; i++) {
    const highestHigh = Math.max(...high.slice(i - period + 1, i + 1));
    const lowestLow = Math.min(...low.slice(i - period + 1, i + 1));
    const williamsR = ((highestHigh - close[i]) / (highestHigh - lowestLow)) * -100;
    result.push(williamsR);
  }
  
  return result;
};

// Money Flow Index
export const calculateMFI = (
  high: number[], 
  low: number[], 
  close: number[], 
  volume: number[], 
  period: number = 14
): number[] => {
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

// Main indicator calculation function
export const calculateIndicator = (
  indicator: string,
  input: IndicatorInput,
  config: IndicatorConfig = {}
): IndicatorResult => {
  const { close, high, low, volume } = input;
  const normalizedIndicator = indicator.toLowerCase().replace(/\s+/g, '');
  
  switch (normalizedIndicator) {
    case 'sma':
    case 'movingaverage':
      const smaResult = calculateSMA(close, config.period || 14);
      return { value: smaResult[smaResult.length - 1], values: smaResult };
      
    case 'ema':
      const emaResult = calculateEMA(close, config.period || 14);
      return { value: emaResult[emaResult.length - 1], values: emaResult };
      
    case 'rsi':
      const rsiResult = calculateRSI(close, config.period || 14);
      return { value: rsiResult[rsiResult.length - 1], values: rsiResult };
      
    case 'macd':
      const macdResult = calculateMACD(
        close, 
        config.fastPeriod || 12, 
        config.slowPeriod || 26, 
        config.signalPeriod || 9
      );
      return {
        macd: macdResult.macd[macdResult.macd.length - 1],
        signal: macdResult.signal[macdResult.signal.length - 1],
        histogram: macdResult.histogram[macdResult.histogram.length - 1],
        values: macdResult.macd
      };
      
    case 'bollingerbands':
    case 'bbands':
      if (!high || !low) throw new Error('Bollinger Bands requires high and low prices');
      const bbResult = calculateBollingerBands(close, config.period || 20, config.deviation || 2);
      return {
        upper: bbResult.upper[bbResult.upper.length - 1],
        middle: bbResult.middle[bbResult.middle.length - 1],
        lower: bbResult.lower[bbResult.lower.length - 1],
        values: bbResult.middle
      };
      
    case 'stochastic':
    case 'stoch':
      if (!high || !low) throw new Error('Stochastic requires high and low prices');
      const stochResult = calculateStochastic(
        high, 
        low, 
        close, 
        config.kPeriod || 14, 
        config.dPeriod || 3
      );
      return {
        k: stochResult.k[stochResult.k.length - 1],
        d: stochResult.d[stochResult.d.length - 1],
        values: stochResult.k
      };
      
    case 'atr':
      if (!high || !low) throw new Error('ATR requires high and low prices');
      const atrResult = calculateATR(high, low, close, config.period || 14);
      return { value: atrResult[atrResult.length - 1], values: atrResult };
      
    case 'cci':
      if (!high || !low) throw new Error('CCI requires high and low prices');
      const cciResult = calculateCCI(high, low, close, config.period || 20);
      return { value: cciResult[cciResult.length - 1], values: cciResult };
      
    case 'williamsr':
    case 'willr':
      if (!high || !low) throw new Error('Williams %R requires high and low prices');
      const willrResult = calculateWilliamsR(high, low, close, config.period || 14);
      return { value: willrResult[willrResult.length - 1], values: willrResult };
      
    case 'mfi':
      if (!high || !low || !volume) throw new Error('MFI requires high, low prices and volume');
      const mfiResult = calculateMFI(high, low, close, volume, config.period || 14);
      return { value: mfiResult[mfiResult.length - 1], values: mfiResult };
      
    default:
      throw new Error(`Unsupported indicator: ${indicator}`);
  }
};

// Get supported indicators list
export const getSupportedIndicators = (): string[] => {
  return [
    'SMA', 'EMA', 'RSI', 'MACD', 'Bollinger Bands', 
    'Stochastic', 'ATR', 'CCI', 'Williams %R', 'MFI'
  ];
};

// Map indicator names to internal names
export const mapIndicatorName = (indicator: string): string => {
  const indicatorMap: { [key: string]: string } = {
    'Moving Average': 'SMA',
    'Simple Moving Average': 'SMA',
    'Exponential Moving Average': 'EMA',
    'Relative Strength Index': 'RSI',
    'MACD': 'MACD',
    'Bollinger Bands': 'Bollinger Bands',
    'Stochastic': 'Stochastic',
    'Average True Range': 'ATR',
    'Commodity Channel Index': 'CCI',
    'Williams %R': 'Williams %R',
    'Money Flow Index': 'MFI'
  };
  
  return indicatorMap[indicator] || indicator;
};

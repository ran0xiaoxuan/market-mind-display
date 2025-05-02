
export interface IndicatorParameters {
  // Basic parameters
  period?: string;
  interval?: string;
  source?: string;
  backtracks?: string;
  
  // Moving Averages
  optInTimePeriod?: string;
  
  // MACD parameters
  fast?: string;
  slow?: string;
  signal?: string;
  fastPeriod?: string;
  slowPeriod?: string;
  signalPeriod?: string;
  
  // Bollinger Bands parameters
  deviation?: string;
  nbDevUp?: string;
  nbDevDn?: string;
  maType?: string;
  
  // Stochastic parameters
  k?: string; 
  d?: string;
  fastK?: string;
  fastD?: string;
  slowK?: string;
  slowD?: string;
  smoothK?: string;
  smoothD?: string;
  kPeriod?: string;
  dPeriod?: string;
  slowing?: string;
  
  // Ichimoku parameters
  conversionPeriod?: string;
  basePeriod?: string;
  laggingSpan?: string;
  displacement?: string;
  
  // Generic parameters
  length?: string;
  timeperiod?: string;
  multiplier?: string;
  
  // ATR and derived indicators
  atrPeriod?: string;
  
  // Channel indicators
  channelPeriod?: string;
  upperDeviation?: string;
  lowerDeviation?: string;
  
  // Awesome Oscillator parameters
  fastLength?: string;
  slowLength?: string;
  signalLength?: string;
  
  // RSI/Momentum parameters
  rsiPeriod?: string;
  
  // Candle formations parameters
  optInPenetration?: string;
  
  // Heikin Ashi parameters
  wicks?: string;
  
  // Specific TAAPI parameters
  chart?: string;
  exchange?: string;
  symbol?: string;
  
  // Dynamic parameters for future indicators
  [key: string]: string | undefined;
}

export interface BacktestData {
  id: number;
  version: string;
  date: string;
  time: string;
  isLatest?: boolean;
  metrics: {
    totalReturn: string;
    totalReturnValue: number;
    sharpeRatio: number;
    winRate: string;
    maxDrawdown: string;
    maxDrawdownValue: number;
    trades: number;
  };
  parameters: {
    [key: string]: string | number;
  };
  entryRules: {
    id: number;
    logic: string;
    inequalities: {
      id: number;
      left: {
        type: string;
        indicator?: string;
        parameters?: IndicatorParameters;
        value?: string;
      };
      condition: string;
      right: {
        type: string;
        indicator?: string;
        parameters?: IndicatorParameters;
        value?: string;
      };
    }[];
  }[];
  exitRules: {
    id: number;
    logic: string;
    inequalities: {
      id: number;
      left: {
        type: string;
        indicator?: string;
        parameters?: IndicatorParameters;
        value?: string;
      };
      condition: string;
      right: {
        type: string;
        indicator?: string;
        parameters?: IndicatorParameters;
        value?: string;
      };
    }[];
  }[];
}

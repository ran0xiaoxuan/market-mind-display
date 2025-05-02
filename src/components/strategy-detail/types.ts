
export type IndicatorParameters = {
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
};

export type InequalitySide = {
  type: string;
  indicator?: string;
  parameters?: IndicatorParameters;
  value?: string;
  valueType?: string; // Added for specific components of indicators (MACD Line, Signal, Lower Band, etc.)
};

export type Inequality = {
  id: number;
  left: InequalitySide;
  condition: string;
  right: InequalitySide;
  explanation?: string; // Added to store AI's explanation for each rule
};

export type RuleGroupData = {
  id: number;
  logic: string;
  inequalities: Inequality[];
  requiredConditions?: number; // Number of conditions that must be met for OR groups
};

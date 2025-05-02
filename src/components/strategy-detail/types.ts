
export type IndicatorParameters = {
  period?: string;
  fast?: string;
  slow?: string;
  signal?: string;
  deviation?: string; // For Bollinger Bands
  k?: string; // For Stochastic
  d?: string; // For Stochastic
  conversionPeriod?: string; // For Ichimoku
  basePeriod?: string; // For Ichimoku
  laggingSpan?: string; // For Ichimoku
  displacement?: string; // For Ichimoku
  maType?: string; // Moving Average Type
  length?: string; // Generic period parameter
  multiplier?: string; // For ATR-based indicators
  source?: string; // Price source (close, open, high, low)
  upperDeviation?: string; // Upper deviation for bands
  lowerDeviation?: string; // Lower deviation for bands
  atrPeriod?: string; // ATR period for indicators like Keltner
  channelPeriod?: string; // For channel indicators like Donchian
  fastK?: string; // Fast %K for advanced stochastics
  slowK?: string; // Slow %K for advanced stochastics
  slowD?: string; // Slow %D for advanced stochastics
  smoothK?: string; // Smoothing for K line
  smoothD?: string; // Smoothing for D line
  fastLength?: string; // Alternative naming for fast period
  slowLength?: string; // Alternative naming for slow period
  signalLength?: string; // Alternative naming for signal period
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

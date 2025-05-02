
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

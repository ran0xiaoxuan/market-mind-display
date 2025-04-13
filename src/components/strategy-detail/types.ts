

export type IndicatorParameters = {
  period?: string;
  fast?: string;
  slow?: string;
  signal?: string;
};

export type InequalitySide = {
  type: string;
  indicator?: string;
  parameters?: IndicatorParameters;
  value?: string;
  valueType?: string; // Added for MACD value type (MACD Line, Signal, Histogram)
};

export type Inequality = {
  id: number;
  left: InequalitySide;
  condition: string;
  right: InequalitySide;
};

export type RuleGroupData = {
  id: number;
  logic: string;
  inequalities: Inequality[];
};

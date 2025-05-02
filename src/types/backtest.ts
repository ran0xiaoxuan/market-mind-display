
export interface IndicatorParameters {
  period?: string;
  fast?: string;
  slow?: string;
  signal?: string;
  deviation?: string;
  k?: string; 
  d?: string;
  conversionPeriod?: string;
  basePeriod?: string;
  laggingSpan?: string;
  displacement?: string;
  maType?: string;
  length?: string;
  multiplier?: string;
  source?: string;
  upperDeviation?: string;
  lowerDeviation?: string;
  atrPeriod?: string;
  channelPeriod?: string;
  fastK?: string;
  slowK?: string;
  slowD?: string;
  smoothK?: string;
  smoothD?: string;
  fastLength?: string;
  slowLength?: string;
  signalLength?: string;
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

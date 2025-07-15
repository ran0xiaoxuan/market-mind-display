import { supabase } from "@/integrations/supabase/client";
import { TradingRule } from "@/types/backtest";

export interface RuleEvaluationResult {
  rule_id: string;
  left_value: number;
  right_value: number;
  condition: string;
  result: boolean;
  explanation: string;
}

export interface GroupEvaluationResult {
  group_id: string;
  rule_type: 'entry' | 'exit';
  logic: 'AND' | 'OR';
  required_conditions?: number;
  rule_results: RuleEvaluationResult[];
  group_result: boolean;
  explanation: string;
}

export interface StrategyEvaluationResult {
  strategy_id: string;
  timestamp: string;
  symbol: string;
  current_price: number;
  group_results: GroupEvaluationResult[];
  entry_signal: boolean;
  exit_signal: boolean;
  overall_explanation: string;
}

// Indicator name mapping for consistency
const indicatorMap: Record<string, string> = {
  'Simple Moving Average': 'SMA',
  'Exponential Moving Average': 'EMA',
  'Weighted Moving Average': 'WMA',
  'Relative Strength Index': 'RSI',
  'MACD': 'MACD',
  'Bollinger Bands': 'BBANDS',
  'Stochastic': 'STOCH',
  'Average True Range': 'ATR',
  'Commodity Channel Index': 'CCI',
  'Money Flow Index': 'MFI',
  'Moving Average': 'SMA',
  'WMA': 'WMA'
};

// Map display names to service format
export const mapIndicatorName = (displayName: string): string => {
  return indicatorMap[displayName] || displayName;
};

// Service placeholder - would integrate with actual evaluation service
export const evaluateStrategy = async (
  strategyId: string,
  symbol: string,
  timeframe: string
): Promise<StrategyEvaluationResult | null> => {
  try {
    // This would integrate with the actual strategy evaluation service
    // For now, return a placeholder
    console.log(`Evaluating strategy ${strategyId} for ${symbol} on ${timeframe}`);
    
    return {
      strategy_id: strategyId,
      timestamp: new Date().toISOString(),
      symbol,
      current_price: 150.0, // Placeholder
      group_results: [],
      entry_signal: false,
      exit_signal: false,
      overall_explanation: "Strategy evaluation not implemented"
    };
  } catch (error) {
    console.error('Error evaluating strategy:', error);
    return null;
  }
};

// Get recent evaluations for a strategy
export const getRecentEvaluations = async (
  strategyId: string,
  limit: number = 10
): Promise<StrategyEvaluationResult[]> => {
  try {
    // This would fetch from the evaluations table
    // For now, return empty array
    console.log(`Fetching recent evaluations for strategy ${strategyId}`);
    return [];
  } catch (error) {
    console.error('Error fetching recent evaluations:', error);
    return [];
  }
};

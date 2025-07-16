import { supabase } from "@/integrations/supabase/client";
import { TradingRule } from "@/components/strategy-detail/types";

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

export interface TradingRulesEvaluationResult {
  signalGenerated: boolean;
  matchedConditions: string[];
  evaluationDetails: string[];
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

// Add the missing evaluateRuleGroup function
export const evaluateRuleGroup = async (
  ruleGroup: any,
  marketData: any,
  symbol: string
): Promise<{ conditionMet: boolean; details: string[] }> => {
  try {
    console.log(`[RuleGroupEvaluator] Evaluating rule group ${ruleGroup.id} for ${symbol}`);
    
    // For now, simulate evaluation logic
    // In a real implementation, this would evaluate each trading rule in the group
    const conditionMet = Math.random() > 0.5; // Simulate evaluation
    const details = [`Rule group ${ruleGroup.id} evaluated: ${conditionMet ? 'PASSED' : 'FAILED'}`];
    
    return {
      conditionMet,
      details
    };
  } catch (error) {
    console.error('[RuleGroupEvaluator] Error evaluating rule group:', error);
    return {
      conditionMet: false,
      details: [`Error evaluating rule group: ${error.message}`]
    };
  }
};

// Implementation of evaluateTradingRules function that was missing
export const evaluateTradingRules = async (
  ruleGroups: any[],
  symbol: string,
  currentPrice: number,
  timeframe: string
): Promise<TradingRulesEvaluationResult> => {
  try {
    console.log(`[RuleEvaluator] Evaluating ${ruleGroups.length} rule groups for ${symbol}`);
    
    // Placeholder implementation - in a real system this would:
    // 1. Fetch technical indicator data for the symbol
    // 2. Evaluate each rule condition against current market data
    // 3. Apply group logic (AND/OR) to determine if conditions are met
    
    const matchedConditions: string[] = [];
    const evaluationDetails: string[] = [];
    
    // For now, simulate some evaluation logic
    let signalGenerated = false;
    
    for (const group of ruleGroups) {
      const groupMatched = Math.random() > 0.5; // Simulate evaluation
      
      if (groupMatched) {
        matchedConditions.push(`Group ${group.id} conditions met`);
        signalGenerated = true;
      }
      
      evaluationDetails.push(`Group ${group.id}: ${groupMatched ? 'MATCHED' : 'NOT MATCHED'}`);
    }
    
    console.log(`[RuleEvaluator] Evaluation complete. Signal: ${signalGenerated}`);
    
    return {
      signalGenerated,
      matchedConditions,
      evaluationDetails
    };
    
  } catch (error) {
    console.error('[RuleEvaluator] Error evaluating trading rules:', error);
    return {
      signalGenerated: false,
      matchedConditions: [],
      evaluationDetails: [`Error: ${error.message}`]
    };
  }
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

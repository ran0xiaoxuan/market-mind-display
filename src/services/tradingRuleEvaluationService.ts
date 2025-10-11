import { supabase } from "@/integrations/supabase/client";
import { TradingRule } from "@/components/strategy-detail/types";
import { getTaapiIndicator, getIndicatorValue, mapParametersToTaapi } from "./taapiService";
import { OptimizedMarketData } from "./optimizedMarketDataService";

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
  'Simple Moving Average': 'sma',
  'Exponential Moving Average': 'ema',
  'Weighted Moving Average': 'wma',
  'Double Exponential Moving Average': 'dema',
  'Triple Exponential Moving Average': 'tema',
  'Hull Moving Average': 'hma',
  'Volume Weighted Average Price': 'vwap',
  'Relative Strength Index': 'rsi',
  'MACD': 'macd',
  'Bollinger Bands': 'bbands',
  'Stochastic': 'stoch',
  'Stochastic RSI': 'stochrsi',
  'Average True Range': 'atr',
  'Normalized Average True Range': 'natr',
  'Commodity Channel Index': 'cci',
  'Money Flow Index': 'mfi',
  'Rate of Change': 'roc',
  'Williams %R': 'willr',
  'Chande Momentum Oscillator': 'cmo',
  'Average Directional Index': 'adx',
  'SuperTrend': 'supertrend',
  'Keltner Channel': 'keltnerchannels',
  'Donchian Channel': 'donchian',
  'On Balance Volume': 'obv',
  'Chaikin Money Flow': 'cmf',
  'SMA': 'sma',
  'EMA': 'ema',
  'WMA': 'wma',
  'DEMA': 'dema',
  'TEMA': 'tema',
  'HMA': 'hma',
  'VWAP': 'vwap',
  'RSI': 'rsi',
  'ATR': 'atr',
  'NATR': 'natr',
  'CCI': 'cci',
  'MFI': 'mfi',
  'ROC': 'roc',
  'CMO': 'cmo',
  'ADX': 'adx',
  'OBV': 'obv',
  'CMF': 'cmf'
};

// Map display names to TAAPI API format
export const mapIndicatorName = (displayName: string): string => {
  const mapped = indicatorMap[displayName];
  if (mapped) {
    return mapped;
  }
  // If not found in map, convert to lowercase and remove spaces
  return displayName.toLowerCase().replace(/\s+/g, '');
};

/**
 * 获取指标或价格的值
 * 这是核心函数 - 根据规则类型获取实际的数值
 */
const getRuleValue = async (
  type: string,
  indicator: string | null,
  parameters: any,
  value: string | null,
  marketData: OptimizedMarketData[],
  symbol: string,
  timeframe: string
): Promise<number | null> => {
  try {
    console.log(`[GetRuleValue] Type: ${type}, Indicator: ${indicator}, Value: ${value}`);

    // 如果是常量值（数字）
    if (type === 'value' && value) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        console.log(`[GetRuleValue] Using constant value: ${numValue}`);
        return numValue;
      }
    }

    // 如果是价格类型
    if (type === 'price') {
      if (!marketData || marketData.length === 0) {
        console.error('[GetRuleValue] No market data available for price');
        return null;
      }
      
      const latestData = marketData[marketData.length - 1];
      let priceValue: number;
      
      switch (indicator?.toLowerCase()) {
        case 'open':
          priceValue = latestData.open;
          break;
        case 'high':
          priceValue = latestData.high;
          break;
        case 'low':
          priceValue = latestData.low;
          break;
        case 'close':
        default:
          priceValue = latestData.close;
          break;
      }
      
      console.log(`[GetRuleValue] Using ${indicator || 'close'} price: ${priceValue}`);
      return priceValue;
    }

    // 如果是成交量类型
    if (type === 'volume') {
      if (!marketData || marketData.length === 0) {
        console.error('[GetRuleValue] No market data available for volume');
        return null;
      }
      
      const latestData = marketData[marketData.length - 1];
      console.log(`[GetRuleValue] Using volume: ${latestData.volume}`);
      return latestData.volume;
    }

    // 如果是指标类型
    if (type === 'indicator' && indicator) {
      const mappedIndicator = mapIndicatorName(indicator);
      console.log(`[GetRuleValue] Fetching indicator: ${mappedIndicator} for ${symbol}`);
      
      // 准备TAAPI参数
      const taapiParams = {
        ...parameters,
        symbol,
        interval: mapTimeframeToTaapiInterval(timeframe)
      };
      
      console.log(`[GetRuleValue] TAAPI params:`, taapiParams);
      
      // 调用TAAPI API获取指标值
      const indicatorData = await getTaapiIndicator(
        mappedIndicator,
        symbol,
        taapiParams.interval,
        taapiParams
      );
      
      if (!indicatorData) {
        console.error(`[GetRuleValue] Failed to fetch indicator data for ${mappedIndicator}`);
        return null;
      }
      
      // 从响应中提取指标值（考虑多值指标）
      const valueType = parameters?.valueType;
      const indicatorValue = getIndicatorValue(mappedIndicator, indicatorData, valueType);
      
      console.log(`[GetRuleValue] Indicator ${mappedIndicator} value: ${indicatorValue}`);
      return indicatorValue;
    }

    console.error(`[GetRuleValue] Unknown type: ${type}`);
    return null;
    
  } catch (error) {
    console.error('[GetRuleValue] Error getting rule value:', error);
    return null;
  }
};

/**
 * 时间周期映射到TAAPI格式
 */
const mapTimeframeToTaapiInterval = (timeframe: string): string => {
  const timeframeMap: { [key: string]: string } = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1h': '1h',
    '4h': '4h',
    'Daily': '1d',
    'Weekly': '1w',
    'Monthly': '1M'
  };
  
  return timeframeMap[timeframe] || '1d';
};

/**
 * 评估单条交易规则
 * 比较左侧和右侧的值，判断条件是否满足
 */
const evaluateSingleRule = async (
  rule: any,
  marketData: OptimizedMarketData[],
  symbol: string,
  timeframe: string
): Promise<RuleEvaluationResult> => {
  try {
    console.log(`[EvaluateSingleRule] Evaluating rule ${rule.id}`);
    
    // 获取左侧值
    const leftValue = await getRuleValue(
      rule.left_type,
      rule.left_indicator,
      rule.left_parameters,
      rule.left_value,
      marketData,
      symbol,
      timeframe
    );
    
    // 获取右侧值
    const rightValue = await getRuleValue(
      rule.right_type,
      rule.right_indicator,
      rule.right_parameters,
      rule.right_value,
      marketData,
      symbol,
      timeframe
    );
    
    if (leftValue === null || rightValue === null) {
      console.error(`[EvaluateSingleRule] Failed to get values. Left: ${leftValue}, Right: ${rightValue}`);
      return {
        rule_id: rule.id,
        left_value: leftValue || 0,
        right_value: rightValue || 0,
        condition: rule.condition,
        result: false,
        explanation: `Failed to evaluate: Left=${leftValue}, Right=${rightValue}`
      };
    }
    
    // 评估条件
    let result = false;
    const condition = rule.condition;
    
    switch (condition) {
      case '>':
      case 'greater_than':
        result = leftValue > rightValue;
        break;
      case '<':
      case 'less_than':
        result = leftValue < rightValue;
        break;
      case '>=':
      case 'greater_than_or_equal':
        result = leftValue >= rightValue;
        break;
      case '<=':
      case 'less_than_or_equal':
        result = leftValue <= rightValue;
        break;
      case '==':
      case '=':
      case 'equals':
        result = Math.abs(leftValue - rightValue) < 0.0001; // 浮点数比较
        break;
      case '!=':
      case 'not_equals':
        result = Math.abs(leftValue - rightValue) >= 0.0001;
        break;
      case 'crosses_above':
        // 这需要历史数据来判断穿越，暂时简化为大于
        result = leftValue > rightValue;
        break;
      case 'crosses_below':
        // 这需要历史数据来判断穿越，暂时简化为小于
        result = leftValue < rightValue;
        break;
      default:
        console.warn(`[EvaluateSingleRule] Unknown condition: ${condition}`);
        result = false;
    }
    
    const explanation = `${rule.left_indicator || rule.left_value} (${leftValue.toFixed(4)}) ${condition} ${rule.right_indicator || rule.right_value} (${rightValue.toFixed(4)}) = ${result}`;
    
    console.log(`[EvaluateSingleRule] ${explanation}`);
    
    return {
      rule_id: rule.id,
      left_value: leftValue,
      right_value: rightValue,
      condition: condition,
      result: result,
      explanation: explanation
    };
    
  } catch (error) {
    console.error('[EvaluateSingleRule] Error evaluating rule:', error);
    return {
      rule_id: rule.id,
      left_value: 0,
      right_value: 0,
      condition: rule.condition,
      result: false,
      explanation: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * 评估规则组
 * 这是主要的评估函数，会被信号生成服务调用
 */
export const evaluateRuleGroup = async (
  ruleGroup: any,
  marketData: OptimizedMarketData[],
  symbol: string,
  timeframe: string = '1h'
): Promise<{ conditionMet: boolean; details: string[] }> => {
  try {
    console.log(`[RuleGroupEvaluator] Evaluating rule group ${ruleGroup.id} (${ruleGroup.rule_type}) for ${symbol}`);
    console.log(`[RuleGroupEvaluator] Logic: ${ruleGroup.logic}, Required conditions: ${ruleGroup.required_conditions}`);
    
    const tradingRules = ruleGroup.trading_rules || [];
    
    if (tradingRules.length === 0) {
      console.warn(`[RuleGroupEvaluator] No trading rules in group ${ruleGroup.id}`);
      return {
        conditionMet: false,
        details: ['No trading rules defined in this group']
      };
    }
    
    // 评估所有规则
    const ruleResults: RuleEvaluationResult[] = [];
    for (const rule of tradingRules) {
      const result = await evaluateSingleRule(rule, marketData, symbol, timeframe);
      ruleResults.push(result);
    }
    
    // 根据逻辑类型判断组结果
    let groupResult = false;
    const details: string[] = [];
    
    const passedRules = ruleResults.filter(r => r.result);
    const passedCount = passedRules.length;
    const totalCount = ruleResults.length;
    
    switch (ruleGroup.logic) {
      case 'AND':
        groupResult = passedCount === totalCount;
        details.push(`AND logic: ${passedCount}/${totalCount} rules passed. Result: ${groupResult}`);
        break;
        
      case 'OR':
        groupResult = passedCount > 0;
        details.push(`OR logic: ${passedCount}/${totalCount} rules passed. Result: ${groupResult}`);
        break;
        
      case 'AT_LEAST':
        const required = ruleGroup.required_conditions || 1;
        groupResult = passedCount >= required;
        details.push(`AT_LEAST ${required}: ${passedCount}/${totalCount} rules passed. Result: ${groupResult}`);
        break;
        
      default:
        // 默认使用AND逻辑
        groupResult = passedCount === totalCount;
        details.push(`Default AND logic: ${passedCount}/${totalCount} rules passed. Result: ${groupResult}`);
    }
    
    // 添加每条规则的详细信息
    ruleResults.forEach(r => {
      details.push(`  - ${r.explanation}`);
    });
    
    console.log(`[RuleGroupEvaluator] Group ${ruleGroup.id} result: ${groupResult}`);
    
    return {
      conditionMet: groupResult,
      details: details
    };
    
  } catch (error) {
    console.error('[RuleGroupEvaluator] Error evaluating rule group:', error);
    return {
      conditionMet: false,
      details: [`Error evaluating rule group: ${error instanceof Error ? error.message : 'Unknown error'}`]
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

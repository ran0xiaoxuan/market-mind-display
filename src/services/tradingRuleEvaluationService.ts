
import { RuleGroupData } from "@/components/strategy-detail/types";
import { getTaapiIndicator, getIndicatorValue } from "./taapiService";

export interface RuleEvaluation {
  signalGenerated: boolean;
  matchedConditions: string[];
  evaluationDetails: string[];
}

export const evaluateTradingRules = async (
  ruleGroups: RuleGroupData[],
  asset: string,
  currentPrice: number,
  timeframe: string = '1d'
): Promise<RuleEvaluation> => {
  try {
    console.log(`[RuleEvaluation] Starting evaluation for ${asset} at price ${currentPrice} with timeframe ${timeframe}`);
    console.log(`[RuleEvaluation] Rule groups:`, ruleGroups);

    const evaluation: RuleEvaluation = {
      signalGenerated: false,
      matchedConditions: [],
      evaluationDetails: []
    };

    if (!ruleGroups || ruleGroups.length === 0) {
      evaluation.evaluationDetails.push('No rule groups provided');
      return evaluation;
    }

    // Separate AND and OR groups
    const andGroups = ruleGroups.filter(group => group.logic === 'AND');
    const orGroups = ruleGroups.filter(group => group.logic === 'OR');

    console.log(`[RuleEvaluation] Found ${andGroups.length} AND groups and ${orGroups.length} OR groups`);

    let allAndGroupsSatisfied = true;
    let allOrGroupsSatisfied = true;

    // Evaluate all AND groups - ALL must be satisfied
    for (const andGroup of andGroups) {
      const groupResult = await evaluateRuleGroup(andGroup, asset, currentPrice, timeframe);
      
      evaluation.evaluationDetails.push(`AND Group evaluation: ${groupResult.satisfied ? 'SATISFIED' : 'NOT SATISFIED'}`);
      evaluation.evaluationDetails.push(...groupResult.details);
      evaluation.matchedConditions.push(...groupResult.matchedConditions);

      if (!groupResult.satisfied) {
        allAndGroupsSatisfied = false;
        console.log(`[RuleEvaluation] AND group failed - signal cannot be generated`);
      }
    }

    // Evaluate all OR groups - each must meet its required conditions
    for (const orGroup of orGroups) {
      const groupResult = await evaluateRuleGroup(orGroup, asset, currentPrice, timeframe);
      
      evaluation.evaluationDetails.push(`OR Group evaluation: ${groupResult.satisfied ? 'SATISFIED' : 'NOT SATISFIED'}`);
      evaluation.evaluationDetails.push(...groupResult.details);
      evaluation.matchedConditions.push(...groupResult.matchedConditions);

      if (!groupResult.satisfied) {
        allOrGroupsSatisfied = false;
        console.log(`[RuleEvaluation] OR group failed - signal cannot be generated`);
      }
    }

    // Final decision: All AND groups AND all OR groups must be satisfied
    evaluation.signalGenerated = allAndGroupsSatisfied && allOrGroupsSatisfied;

    console.log(`[RuleEvaluation] Final result: AND groups=${allAndGroupsSatisfied}, OR groups=${allOrGroupsSatisfied}, Signal=${evaluation.signalGenerated}`);

    return evaluation;
  } catch (error) {
    console.error('[RuleEvaluation] Error evaluating trading rules:', error);
    return {
      signalGenerated: false,
      matchedConditions: [],
      evaluationDetails: [`Error during evaluation: ${error.message}`]
    };
  }
};

interface GroupEvaluationResult {
  satisfied: boolean;
  matchedConditions: string[];
  details: string[];
  conditionsMetCount: number;
  totalConditions: number;
}

const evaluateRuleGroup = async (
  group: RuleGroupData,
  asset: string,
  currentPrice: number,
  timeframe: string
): Promise<GroupEvaluationResult> => {
  const result: GroupEvaluationResult = {
    satisfied: false,
    matchedConditions: [],
    details: [],
    conditionsMetCount: 0,
    totalConditions: 0
  };

  if (!group.inequalities || group.inequalities.length === 0) {
    result.details.push(`${group.logic} Group: No conditions defined`);
    result.satisfied = group.logic === 'AND' ? true : false; // Empty AND group is satisfied, empty OR group is not
    return result;
  }

  result.totalConditions = group.inequalities.length;
  console.log(`[GroupEvaluation] Evaluating ${group.logic} group with ${result.totalConditions} conditions`);

  // Evaluate each condition in the group
  for (let i = 0; i < group.inequalities.length; i++) {
    const inequality = group.inequalities[i];
    try {
      const conditionMet = await evaluateInequality(inequality, asset, currentPrice, timeframe);
      const conditionDescription = formatConditionDescription(inequality);
      
      if (conditionMet) {
        result.conditionsMetCount++;
        result.matchedConditions.push(conditionDescription);
        result.details.push(`  ✓ ${conditionDescription}`);
        console.log(`[GroupEvaluation] Condition ${i + 1} MET: ${conditionDescription}`);
      } else {
        result.details.push(`  ✗ ${conditionDescription}`);
        console.log(`[GroupEvaluation] Condition ${i + 1} NOT MET: ${conditionDescription}`);
      }
    } catch (error) {
      console.error(`[GroupEvaluation] Error evaluating condition ${i + 1}:`, error);
      result.details.push(`  ⚠ Error evaluating condition: ${error.message}`);
    }
  }

  // Determine if group is satisfied based on logic
  if (group.logic === 'AND') {
    // AND group: ALL conditions must be met
    result.satisfied = result.conditionsMetCount === result.totalConditions;
    result.details.push(`AND Group Result: ${result.conditionsMetCount}/${result.totalConditions} conditions met - ${result.satisfied ? 'SATISFIED' : 'NOT SATISFIED'}`);
  } else if (group.logic === 'OR') {
    // OR group: Required number of conditions must be met
    const requiredConditions = group.requiredConditions || 1;
    result.satisfied = result.conditionsMetCount >= requiredConditions;
    result.details.push(`OR Group Result: ${result.conditionsMetCount}/${result.totalConditions} conditions met (required: ${requiredConditions}) - ${result.satisfied ? 'SATISFIED' : 'NOT SATISFIED'}`);
  }

  return result;
};

const formatConditionDescription = (inequality: any): string => {
  const leftSide = inequality.left?.type === 'INDICATOR' 
    ? `${inequality.left.indicator}${inequality.left.valueType ? ` (${inequality.left.valueType})` : ''}`
    : inequality.left?.type === 'PRICE' 
    ? 'Price'
    : inequality.left?.value || 'Unknown';

  const rightSide = inequality.right?.type === 'INDICATOR'
    ? `${inequality.right.indicator}${inequality.right.valueType ? ` (${inequality.right.valueType})` : ''}`
    : inequality.right?.type === 'PRICE'
    ? 'Price'
    : inequality.right?.value || 'Unknown';

  const operator = mapConditionToOperator(inequality.condition);
  
  return `${leftSide} ${operator} ${rightSide}`;
};

const mapConditionToOperator = (condition: string): string => {
  const conditionMap: { [key: string]: string } = {
    'GREATER_THAN': '>',
    'LESS_THAN': '<', 
    'GREATER_THAN_OR_EQUAL': '>=',
    'LESS_THAN_OR_EQUAL': '<=',
    'EQUAL': '==',
    'NOT_EQUAL': '!=',
    '>': '>',
    '<': '<',
    '>=': '>=',
    '<=': '<=',
    '==': '==',
    '!=': '!='
  };
  
  return conditionMap[condition] || condition;
};

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

const evaluateInequality = async (inequality: any, asset: string, currentPrice: number, timeframe: string): Promise<boolean> => {
  try {
    console.log(`[InequalityEval] Evaluating: ${JSON.stringify(inequality)}`);

    // Get left side value
    const leftValue = await getValueFromSide(inequality.left, asset, currentPrice, timeframe);
    if (leftValue === null) {
      console.log(`[InequalityEval] Left side value is null`);
      return false;
    }

    // Get right side value
    const rightValue = await getValueFromSide(inequality.right, asset, currentPrice, timeframe);
    if (rightValue === null) {
      console.log(`[InequalityEval] Right side value is null`);
      return false;
    }

    const operator = mapConditionToOperator(inequality.condition);
    console.log(`[InequalityEval] Comparing: ${leftValue} ${operator} ${rightValue}`);

    // Evaluate condition
    let result = false;
    switch (operator) {
      case '>':
        result = leftValue > rightValue;
        break;
      case '<':
        result = leftValue < rightValue;
        break;
      case '>=':
        result = leftValue >= rightValue;
        break;
      case '<=':
        result = leftValue <= rightValue;
        break;
      case '==':
        result = Math.abs(leftValue - rightValue) < 0.0001; // Handle floating point comparison
        break;
      case '!=':
        result = Math.abs(leftValue - rightValue) >= 0.0001;
        break;
      default:
        console.error('[InequalityEval] Unknown condition:', inequality.condition);
        return false;
    }

    console.log(`[InequalityEval] Result: ${result}`);
    return result;
  } catch (error) {
    console.error('[InequalityEval] Error evaluating inequality:', error);
    return false;
  }
};

const getIndicatorValueWithType = async (
  indicator: string, 
  asset: string, 
  parameters: any,
  valueType?: string,
  timeframe: string = '1d'
): Promise<number | null> => {
  try {
    const indicatorMap: { [key: string]: string } = {
      'RSI': 'rsi',
      'MACD': 'macd',
      'Moving Average': 'sma',
      'SMA': 'sma',
      'EMA': 'ema',
      'WMA': 'wma',
      'TRIMA': 'trima',
      'KAMA': 'kama',
      'Bollinger Bands': 'bbands',
      'Stochastic': 'stoch',
      'StochRSI': 'stochrsi',
      'Ultimate Oscillator': 'ultosc',
      'Awesome Oscillator': 'ao',
      'MFI': 'mfi',
      'ADX': 'adx',
      'DMI': 'dmi',
      'Ichimoku Cloud': 'ichimoku',
      'PSAR': 'psar',
      'VWAP': 'vwap',
      'Supertrend': 'supertrend',
      'TTM Squeeze': 'ttmsqueeze',
      'ATR': 'atr',
      'Keltner Channel': 'keltnerchannels',
      'Donchian Channel': 'donchian',
      'Chandelier Exit': 'chandelier',
      'Volume': 'volume',
      'Chaikin Money Flow': 'cmf',
      'Volume Oscillator': 'volumeoscillator',
      'Heikin Ashi': 'heikinashi',
      'CCI': 'cci',
      'Williams %R': 'willr',
      'Momentum': 'mom',
      'CMO': 'cmo'
    };

    const taapiIndicator = indicatorMap[indicator];
    if (!taapiIndicator) {
      console.error('[IndicatorValue] Unsupported indicator:', indicator);
      return null;
    }

    const taapiTimeframe = mapTimeframeToTaapiInterval(timeframe);
    console.log(`[IndicatorValue] Getting ${indicator} for ${asset} with timeframe ${taapiTimeframe}`);

    const indicatorData = await getTaapiIndicator(taapiIndicator, asset, taapiTimeframe, parameters);
    
    if (!indicatorData) {
      console.error('[IndicatorValue] Failed to get indicator data for:', indicator);
      return null;
    }

    const value = getIndicatorValue(indicator, indicatorData, valueType);
    console.log(`[IndicatorValue] ${indicator} value: ${value}`);
    return value;
  } catch (error) {
    console.error('[IndicatorValue] Error getting indicator value:', error);
    return null;
  }
};

const getValueFromSide = async (side: any, asset: string, currentPrice: number, timeframe: string): Promise<number | null> => {
  try {
    console.log(`[ValueFromSide] Getting value for side:`, side);

    switch (side.type) {
      case 'INDICATOR':
        if (!side.indicator) {
          console.log(`[ValueFromSide] No indicator specified`);
          return null;
        }
        return await getIndicatorValueWithType(
          side.indicator, 
          asset, 
          side.parameters || {}, 
          side.valueType,
          timeframe
        );
      
      case 'PRICE':
        console.log(`[ValueFromSide] Using current price: ${currentPrice}`);
        return currentPrice;
      
      case 'VALUE':
        const value = parseFloat(side.value);
        if (isNaN(value)) {
          console.log(`[ValueFromSide] Invalid value: ${side.value}`);
          return null;
        }
        console.log(`[ValueFromSide] Using constant value: ${value}`);
        return value;
      
      default:
        console.error('[ValueFromSide] Unknown side type:', side.type);
        return null;
    }
  } catch (error) {
    console.error('[ValueFromSide] Error getting value from side:', error);
    return null;
  }
};

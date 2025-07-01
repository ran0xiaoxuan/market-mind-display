
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
  timeframe: string = '1d' // Add timeframe parameter with default
): Promise<RuleEvaluation> => {
  try {
    const evaluation: RuleEvaluation = {
      signalGenerated: false,
      matchedConditions: [],
      evaluationDetails: []
    };

    if (!ruleGroups || ruleGroups.length === 0) {
      return evaluation;
    }

    let andGroupSatisfied = true;
    let orGroupSatisfied = false;
    let orGroupExists = false;

    for (const group of ruleGroups) {
      if (!group.inequalities || group.inequalities.length === 0) {
        continue;
      }

      const isAndGroup = group.logic === 'AND';
      const isOrGroup = group.logic === 'OR';

      if (isOrGroup) {
        orGroupExists = true;
      }

      let groupConditionsMet = 0;
      const groupEvaluations: string[] = [];

      for (const inequality of group.inequalities) {
        try {
          const conditionMet = await evaluateInequality(inequality, asset, currentPrice, timeframe);
          
          if (conditionMet) {
            groupConditionsMet++;
            const conditionDescription = `${inequality.left.type === 'INDICATOR' ? inequality.left.indicator : inequality.left.type} ${mapConditionToOperator(inequality.condition)} ${inequality.right.type === 'INDICATOR' ? inequality.right.indicator : inequality.right.value}`;
            evaluation.matchedConditions.push(conditionDescription);
            groupEvaluations.push(`✓ ${conditionDescription}`);
          } else {
            const conditionDescription = `${inequality.left.type === 'INDICATOR' ? inequality.left.indicator : inequality.left.type} ${mapConditionToOperator(inequality.condition)} ${inequality.right.type === 'INDICATOR' ? inequality.right.indicator : inequality.right.value}`;
            groupEvaluations.push(`✗ ${conditionDescription}`);
          }
        } catch (error) {
          console.error('Error evaluating inequality:', error);
          groupEvaluations.push(`⚠ Error evaluating condition`);
        }
      }

      // Evaluate group logic
      if (isAndGroup) {
        // All conditions must be met for AND group
        const allConditionsMet = groupConditionsMet === group.inequalities.length;
        if (!allConditionsMet) {
          andGroupSatisfied = false;
        }
        evaluation.evaluationDetails.push(`AND Group: ${groupConditionsMet}/${group.inequalities.length} conditions met`);
        evaluation.evaluationDetails.push(...groupEvaluations);
      } else if (isOrGroup) {
        // Required number of conditions must be met for OR group
        const requiredConditions = group.requiredConditions || 1;
        const orGroupMet = groupConditionsMet >= requiredConditions;
        if (orGroupMet) {
          orGroupSatisfied = true;
        }
        evaluation.evaluationDetails.push(`OR Group: ${groupConditionsMet}/${group.inequalities.length} conditions met (required: ${requiredConditions})`);
        evaluation.evaluationDetails.push(...groupEvaluations);
      }
    }

    // Final signal determination
    if (orGroupExists) {
      // Both AND and OR groups must be satisfied if OR group exists
      evaluation.signalGenerated = andGroupSatisfied && orGroupSatisfied;
    } else {
      // Only AND group needs to be satisfied
      evaluation.signalGenerated = andGroupSatisfied;
    }

    return evaluation;
  } catch (error) {
    console.error('Error evaluating trading rules:', error);
    return {
      signalGenerated: false,
      matchedConditions: [],
      evaluationDetails: ['Error during evaluation']
    };
  }
};

// Map condition strings to operators
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

// Convert strategy timeframe to TAAPI format
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
    // Get left side value
    const leftValue = await getValueFromSide(inequality.left, asset, currentPrice, timeframe);
    if (leftValue === null) return false;

    // Get right side value
    const rightValue = await getValueFromSide(inequality.right, asset, currentPrice, timeframe);
    if (rightValue === null) return false;

    // Map condition to operator
    const operator = mapConditionToOperator(inequality.condition);

    console.log(`Evaluating: ${leftValue} ${operator} ${rightValue}`);

    // Evaluate condition
    switch (operator) {
      case '>':
        return leftValue > rightValue;
      case '<':
        return leftValue < rightValue;
      case '>=':
        return leftValue >= rightValue;
      case '<=':
        return leftValue <= rightValue;
      case '==':
        return Math.abs(leftValue - rightValue) < 0.0001; // Handle floating point comparison
      case '!=':
        return Math.abs(leftValue - rightValue) >= 0.0001;
      default:
        console.error('Unknown condition:', inequality.condition);
        return false;
    }
  } catch (error) {
    console.error('Error evaluating inequality:', error);
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
    // Map indicator names to TAAPI indicator codes
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
      console.error('Unsupported indicator:', indicator);
      return null;
    }

    // Convert timeframe to TAAPI format and use it instead of hardcoded '1d'
    const taapiTimeframe = mapTimeframeToTaapiInterval(timeframe);
    console.log(`Getting indicator ${indicator} for ${asset} with timeframe ${taapiTimeframe} (from strategy timeframe ${timeframe})`);

    // Get indicator data from TAAPI with the correct timeframe
    const indicatorData = await getTaapiIndicator(taapiIndicator, asset, taapiTimeframe, parameters);
    
    if (!indicatorData) {
      console.error('Failed to get indicator data for:', indicator);
      return null;
    }

    // Use the updated getIndicatorValue function that handles value types
    return getIndicatorValue(indicator, indicatorData, valueType);
  } catch (error) {
    console.error('Error getting indicator value:', error);
    return null;
  }
};

const getValueFromSide = async (side: any, asset: string, currentPrice: number, timeframe: string): Promise<number | null> => {
  try {
    switch (side.type) {
      case 'INDICATOR':
        if (!side.indicator) return null;
        return await getIndicatorValueWithType(
          side.indicator, 
          asset, 
          side.parameters || {}, 
          side.valueType,
          timeframe
        );
      
      case 'PRICE':
        return currentPrice;
      
      case 'VALUE':
        const value = parseFloat(side.value);
        return isNaN(value) ? null : value;
      
      default:
        console.error('Unknown side type:', side.type);
        return null;
    }
  } catch (error) {
    console.error('Error getting value from side:', error);
    return null;
  }
};

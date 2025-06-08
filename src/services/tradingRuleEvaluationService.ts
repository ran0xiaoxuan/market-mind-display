
import { RuleGroupData } from "@/components/strategy-detail/types";
import { getTaapiIndicator } from "./taapiService";

export interface RuleEvaluation {
  signalGenerated: boolean;
  matchedConditions: string[];
  evaluationDetails: string[];
}

export const evaluateTradingRules = async (
  ruleGroups: RuleGroupData[],
  asset: string,
  currentPrice: number
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
          const conditionMet = await evaluateInequality(inequality, asset, currentPrice);
          
          if (conditionMet) {
            groupConditionsMet++;
            const conditionDescription = `${inequality.left.type === 'INDICATOR' ? inequality.left.indicator : inequality.left.type} ${inequality.condition} ${inequality.right.type === 'INDICATOR' ? inequality.right.indicator : inequality.right.value}`;
            evaluation.matchedConditions.push(conditionDescription);
            groupEvaluations.push(`✓ ${conditionDescription}`);
          } else {
            const conditionDescription = `${inequality.left.type === 'INDICATOR' ? inequality.left.indicator : inequality.left.type} ${inequality.condition} ${inequality.right.type === 'INDICATOR' ? inequality.right.indicator : inequality.right.value}`;
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

const evaluateInequality = async (inequality: any, asset: string, currentPrice: number): Promise<boolean> => {
  try {
    // Get left side value
    const leftValue = await getValueFromSide(inequality.left, asset, currentPrice);
    if (leftValue === null) return false;

    // Get right side value
    const rightValue = await getValueFromSide(inequality.right, asset, currentPrice);
    if (rightValue === null) return false;

    // Evaluate condition
    switch (inequality.condition) {
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

const getValueFromSide = async (side: any, asset: string, currentPrice: number): Promise<number | null> => {
  try {
    switch (side.type) {
      case 'INDICATOR':
        if (!side.indicator) return null;
        return await getIndicatorValue(side.indicator, asset, side.parameters || {});
      
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

const getIndicatorValue = async (indicator: string, asset: string, parameters: any): Promise<number | null> => {
  try {
    // Map indicator names to TAAPI indicator codes
    const indicatorMap: { [key: string]: string } = {
      'RSI': 'rsi',
      'MACD': 'macd',
      'Moving Average': 'sma',
      'SMA': 'sma',
      'EMA': 'ema',
      'Bollinger Bands': 'bbands',
      'Stochastic': 'stoch',
      'Volume': 'volume'
    };

    const taapiIndicator = indicatorMap[indicator];
    if (!taapiIndicator) {
      console.error('Unsupported indicator:', indicator);
      return null;
    }

    // Get indicator data from TAAPI
    const indicatorData = await getTaapiIndicator(taapiIndicator, asset, '1d', parameters);
    
    if (!indicatorData) {
      console.error('Failed to get indicator data for:', indicator);
      return null;
    }

    // Handle different indicator return types based on the TAAPI response structure
    if (typeof indicatorData.value === 'number') {
      return indicatorData.value;
    } 
    
    // Handle MACD indicator which has multiple values
    if (taapiIndicator === 'macd') {
      return indicatorData.valueMACD || indicatorData.valueHistogram || null;
    } 
    
    // Handle Bollinger Bands which has multiple bands
    if (taapiIndicator === 'bbands') {
      return indicatorData.valueMiddleBand || null;
    } 
    
    // Handle Stochastic which has K and D lines
    if (taapiIndicator === 'stoch') {
      return indicatorData.valueK || null;
    }

    // If it's an array, take the first value
    if (Array.isArray(indicatorData.value) && indicatorData.value.length > 0) {
      return indicatorData.value[0];
    }

    return null;
  } catch (error) {
    console.error('Error getting indicator value:', error);
    return null;
  }
};

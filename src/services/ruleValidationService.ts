
export interface RuleValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
}

export const validateTradingRules = (entryRules: any[], exitRules: any[]): RuleValidationResult => {
  const result: RuleValidationResult = {
    isValid: true,
    warnings: [],
    errors: [],
    suggestions: []
  };

  // Validate entry rules
  validateRuleGroups(entryRules, 'entry', result);
  
  // Validate exit rules
  validateRuleGroups(exitRules, 'exit', result);

  // Check for logical consistency between entry and exit
  validateEntryExitConsistency(entryRules, exitRules, result);

  return result;
};

const validateRuleGroups = (ruleGroups: any[], ruleType: 'entry' | 'exit', result: RuleValidationResult) => {
  for (const group of ruleGroups) {
    const rules = group.inequalities || [];
    
    // Check for contradictory RSI conditions within the same group
    const rsiRules = rules.filter((rule: any) => 
      rule.left?.indicator === 'RSI' || rule.right?.indicator === 'RSI'
    );

    if (rsiRules.length > 1) {
      validateRSIConsistency(rsiRules, ruleType, group.logic, result);
    }

    // Check for suspicious RSI thresholds
    for (const rule of rsiRules) {
      validateRSIThreshold(rule, ruleType, result);
    }

    // Check OR group configuration
    if (group.logic === 'OR') {
      validateORGroup(group, result);
    }
  }
};

const validateRSIConsistency = (rsiRules: any[], ruleType: string, groupLogic: string, result: RuleValidationResult) => {
  const overboughtConditions = rsiRules.filter((rule: any) => {
    const condition = rule.condition?.toUpperCase();
    const threshold = parseFloat(rule.right?.value || '0');
    return (condition === 'GREATER_THAN' || condition === '>') && threshold > 60;
  });

  const oversoldConditions = rsiRules.filter((rule: any) => {
    const condition = rule.condition?.toUpperCase();
    const threshold = parseFloat(rule.right?.value || '0');
    return (condition === 'LESS_THAN' || condition === '<') && threshold < 40;
  });

  if (overboughtConditions.length > 0 && oversoldConditions.length > 0) {
    if (groupLogic === 'AND') {
      result.errors.push(
        `${ruleType} rules contain contradictory RSI conditions in AND group: both overbought (RSI > 60) and oversold (RSI < 40) conditions cannot be true simultaneously.`
      );
      result.isValid = false;
    } else if (groupLogic === 'OR') {
      result.warnings.push(
        `${ruleType} rules contain both overbought and oversold RSI conditions in OR group. This may create conflicting signals.`
      );
    }
  }
};

const validateRSIThreshold = (rule: any, ruleType: string, result: RuleValidationResult) => {
  const condition = rule.condition?.toUpperCase();
  const threshold = parseFloat(rule.right?.value || '0');

  if (ruleType === 'entry') {
    if ((condition === 'GREATER_THAN' || condition === '>') && threshold > 70) {
      result.warnings.push(
        `Entry condition "RSI > ${threshold}" may generate buy signals in overbought conditions. Consider using "RSI < 30" for oversold entries instead.`
      );
    }
  }

  if (ruleType === 'exit') {
    if ((condition === 'LESS_THAN' || condition === '<') && threshold < 30) {
      result.warnings.push(
        `Exit condition "RSI < ${threshold}" may generate sell signals in oversold conditions, potentially missing recovery opportunities.`
      );
    }
  }
};

const validateORGroup = (group: any, result: RuleValidationResult) => {
  const rules = group.inequalities || [];
  const requiredConditions = group.requiredConditions || 1;

  if (rules.length === 1) {
    const suggestion = 'OR groups work best with at least 2 conditions for confirmation. Consider adding another indicator or condition.';
    if (!result.suggestions.includes(suggestion)) {
      result.suggestions.push(suggestion);
    }
  }

  if (requiredConditions >= rules.length && rules.length > 1) {
    result.warnings.push(
      `OR group requires ${requiredConditions} out of ${rules.length} conditions, which means all conditions must be met. Consider using AND logic instead.`
    );
  }
};

const validateEntryExitConsistency = (entryRules: any[], exitRules: any[], result: RuleValidationResult) => {
  // Check if both entry and exit use the same indicators with opposite conditions
  const entryIndicators = extractIndicators(entryRules);
  const exitIndicators = extractIndicators(exitRules);

  const commonIndicators = entryIndicators.filter(entry => 
    exitIndicators.some(exit => exit.indicator === entry.indicator)
  );

  for (const commonIndicator of commonIndicators) {
    const entryCondition = entryIndicators.find(e => e.indicator === commonIndicator.indicator);
    const exitCondition = exitIndicators.find(e => e.indicator === commonIndicator.indicator);

    if (entryCondition && exitCondition) {
      validateIndicatorConsistency(entryCondition, exitCondition, result);
    }
  }
};

const extractIndicators = (ruleGroups: any[]) => {
  const indicators: Array<{ indicator: string; condition: string; threshold: number }> = [];

  for (const group of ruleGroups) {
    const rules = group.inequalities || [];
    for (const rule of rules) {
      if (rule.left?.indicator) {
        indicators.push({
          indicator: rule.left.indicator,
          condition: rule.condition,
          threshold: parseFloat(rule.right?.value || '0')
        });
      }
    }
  }

  return indicators;
};

const validateIndicatorConsistency = (entry: any, exit: any, result: RuleValidationResult) => {
  if (entry.indicator === 'RSI') {
    const entryCondition = entry.condition?.toUpperCase();
    const exitCondition = exit.condition?.toUpperCase();

    // Check for logical flow: oversold entry should lead to overbought exit
    if ((entryCondition === 'LESS_THAN' || entryCondition === '<') && entry.threshold < 40) {
      if (!((exitCondition === 'GREATER_THAN' || exitCondition === '>') && exit.threshold > 60)) {
        result.suggestions.push(
          'Consider setting exit condition to "RSI > 70" when entry is "RSI < 30" for a complete oversold-to-overbought cycle.'
        );
      }
    }
  }
};

export const getRecommendedFixes = (validationResult: RuleValidationResult): string[] => {
  const fixes: string[] = [];

  if (validationResult.errors.length > 0) {
    fixes.push('🔴 Critical Issues Found:');
    fixes.push(...validationResult.errors.map(error => `  • ${error}`));
  }

  if (validationResult.warnings.length > 0) {
    fixes.push('🟡 Warnings:');
    fixes.push(...validationResult.warnings.map(warning => `  • ${warning}`));
  }

  if (validationResult.suggestions.length > 0) {
    fixes.push('💡 Suggestions:');
    fixes.push(...validationResult.suggestions.map(suggestion => `  • ${suggestion}`));
  }

  return fixes;
};

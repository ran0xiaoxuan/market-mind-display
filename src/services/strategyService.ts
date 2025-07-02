import { supabase } from "@/integrations/supabase/client";
import { Strategy } from "@/components/strategy-detail/types";
import { RuleGroupData, Inequality } from "@/components/strategy-detail/types";

export const getStrategies = async (): Promise<Strategy[]> => {
  try {
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching strategies:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Failed to fetch strategies:", error);
    return [];
  }
};

export const getStrategyById = async (id: string): Promise<Strategy | null> => {
  try {
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error("Error fetching strategy by ID:", error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error("Failed to fetch strategy by ID:", error);
    return null;
  }
};

export const getTradingRulesForStrategy = async (strategyId: string) => {
  try {
    console.log(`Fetching trading rules for strategy: ${strategyId}`);
    
    // Get rule groups with their trading rules
    const { data: ruleGroups, error } = await supabase
      .from('rule_groups')
      .select(`
        *,
        trading_rules (*)
      `)
      .eq('strategy_id', strategyId)
      .order('group_order');

    if (error) {
      console.error('Error fetching rule groups:', error);
      throw error;
    }

    if (!ruleGroups || ruleGroups.length === 0) {
      console.log('No rule groups found for strategy');
      return null;
    }

    console.log('Raw rule groups from database:', JSON.stringify(ruleGroups, null, 2));

    // Separate entry and exit rules
    const entryGroups = ruleGroups.filter(group => group.rule_type === 'entry');
    const exitGroups = ruleGroups.filter(group => group.rule_type === 'exit');

    // Transform rule groups to match our RuleGroupData interface
    const transformRuleGroup = (group: any): RuleGroupData => {
      const inequalities = (group.trading_rules || [])
        .sort((a: any, b: any) => a.inequality_order - b.inequality_order)
        .map((rule: any) => {
          console.log(`Transforming rule:`, rule);
          
          const inequality: Inequality = {
            id: rule.id,
            left: {
              type: rule.left_type,
              indicator: rule.left_type === 'INDICATOR' ? rule.left_indicator : undefined,
              parameters: rule.left_type === 'INDICATOR' ? (rule.left_parameters || {}) : undefined,
              value: (rule.left_type === 'PRICE' || rule.left_type === 'VALUE') ? rule.left_value : undefined, // Correctly map price/value
              valueType: rule.left_type === 'INDICATOR' ? rule.left_value_type : undefined
            },
            condition: rule.condition,
            right: {
              type: rule.right_type,
              indicator: rule.right_type === 'INDICATOR' ? rule.right_indicator : undefined,
              parameters: rule.right_type === 'INDICATOR' ? (rule.right_parameters || {}) : undefined,
              value: (rule.right_type === 'PRICE' || rule.right_type === 'VALUE') ? rule.right_value : undefined, // Correctly map price/value
              valueType: rule.right_type === 'INDICATOR' ? rule.right_value_type : undefined
            },
            explanation: rule.explanation
          };
          
          console.log(`Transformed inequality:`, inequality);
          return inequality;
        });

      return {
        id: group.id,
        logic: group.logic as 'AND' | 'OR',
        inequalities,
        requiredConditions: group.required_conditions || 1
      };
    };

    const entryRules = entryGroups.map(transformRuleGroup);
    const exitRules = exitGroups.map(transformRuleGroup);

    console.log('Transformed entry rules:', JSON.stringify(entryRules, null, 2));
    console.log('Transformed exit rules:', JSON.stringify(exitRules, null, 2));

    return {
      entryRules,
      exitRules
    };

  } catch (error) {
    console.error('Error in getTradingRulesForStrategy:', error);
    throw error;
  }
};

export const deleteStrategy = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('strategies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting strategy:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to delete strategy:", error);
    return false;
  }
};

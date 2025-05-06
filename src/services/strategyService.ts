import { supabase } from "@/integrations/supabase/client";
import { RuleGroupData } from "@/components/strategy-detail/types";

export interface Strategy {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  isActive: boolean;
  market: string;
  timeframe: string;
  targetAsset: string;
  userId: string;
  stopLoss: string;
  takeProfit: string;
  singleBuyVolume: string;
  maxBuyVolume: string;
}

export interface GeneratedStrategy {
  name: string;
  description: string;
  market: string;
  timeframe: string;
  targetAsset: string;
  entryRules: RuleGroupData[];
  exitRules: RuleGroupData[];
  riskManagement: {
    stopLoss: string;
    takeProfit: string;
    singleBuyVolume: string;
    maxBuyVolume: string;
  }
}

export const getStrategies = async (): Promise<Strategy[]> => {
  try {
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching strategies:", error);
      throw error;
    }

    return data as Strategy[];
  } catch (error) {
    console.error("Error in getStrategies:", error);
    throw error;
  }
};

export const deleteStrategy = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('strategies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting strategy:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deleteStrategy:", error);
    throw error;
  }
};

export const updateStrategy = async (id: string, updates: Partial<Strategy>): Promise<Strategy | null> => {
  try {
    const { data, error } = await supabase
      .from('strategies')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error("Error updating strategy:", error);
      throw error;
    }

    return data as Strategy;
  } catch (error) {
    console.error("Error in updateStrategy:", error);
    throw error;
  }
};

export const createStrategy = async (strategy: Omit<Strategy, 'id' | 'createdAt' | 'updatedAt'>): Promise<Strategy | null> => {
  try {
    const { data, error } = await supabase
      .from('strategies')
      .insert([strategy])
      .select('*')
      .single();

    if (error) {
      console.error("Error creating strategy:", error);
      throw error;
    }

    return data as Strategy;
  } catch (error) {
    console.error("Error in createStrategy:", error);
    throw error;
  }
};

export const saveGeneratedStrategy = async (strategy: GeneratedStrategy): Promise<string> => {
  try {
    // First, create the base strategy
    const { data: strategyData, error: strategyError } = await supabase
      .from('strategies')
      .insert([{
        name: strategy.name,
        description: strategy.description,
        market: strategy.market,
        timeframe: strategy.timeframe,
        target_asset: strategy.targetAsset,
        stop_loss: strategy.riskManagement.stopLoss,
        take_profit: strategy.riskManagement.takeProfit,
        single_buy_volume: strategy.riskManagement.singleBuyVolume,
        max_buy_volume: strategy.riskManagement.maxBuyVolume
      }])
      .select('*')
      .single();

    if (strategyError) {
      console.error("Error saving strategy:", strategyError);
      throw strategyError;
    }

    const strategyId = strategyData.id;

    // Process entry rules
    await saveRuleGroups(strategyId, strategy.entryRules, 'entry');
    
    // Process exit rules
    await saveRuleGroups(strategyId, strategy.exitRules, 'exit');

    return strategyId;
  } catch (error) {
    console.error("Error in saveGeneratedStrategy:", error);
    throw error;
  }
};

const saveRuleGroups = async (
  strategyId: string, 
  ruleGroups: RuleGroupData[], 
  ruleType: 'entry' | 'exit'
) => {
  try {
    // Process each rule group
    for (let i = 0; i < ruleGroups.length; i++) {
      const group = ruleGroups[i];
      
      // Create the rule group
      const { data: groupData, error: groupError } = await supabase
        .from('rule_groups')
        .insert({
          strategy_id: strategyId,
          group_order: i + 1,
          required_conditions: group.requiredConditions || null,
          rule_type: ruleType,
          logic: group.logic,
          explanation: group.explanation || null
        })
        .select('*')
        .single();

      if (groupError) {
        console.error("Error saving rule group:", groupError);
        throw groupError;
      }

      const groupId = groupData.id;

      // Process inequalities for this group
      if (group.inequalities && group.inequalities.length > 0) {
        for (let j = 0; j < group.inequalities.length; j++) {
          const inequality = group.inequalities[j];
          
          await supabase
            .from('trading_rules')
            .insert({
              rule_group_id: groupId,
              inequality_order: j + 1,
              left_type: inequality.left.type,
              left_indicator: inequality.left.indicator || null,
              left_parameters: inequality.left.parameters || null,
              left_value: inequality.left.value || null,
              left_value_type: inequality.left.valueType || null,
              condition: inequality.condition,
              right_type: inequality.right.type,
              right_indicator: inequality.right.indicator || null,
              right_parameters: inequality.right.parameters || null,
              right_value: inequality.right.value || null,
              right_value_type: inequality.right.valueType || null,
              explanation: inequality.explanation || null
            });
        }
      }
    }
  } catch (error) {
    console.error("Error in saveRuleGroups:", error);
    throw error;
  }
};

export const getRiskManagementForStrategy = async (strategyId: string): Promise<RiskManagementData | null> => {
  try {
    const { data, error } = await supabase
      .from('strategies')
      .select('stopLoss, takeProfit, singleBuyVolume, maxBuyVolume')
      .eq('id', strategyId)
      .single();

    if (error) {
      console.error("Error fetching risk management data:", error);
      throw error;
    }

    if (!data) {
      console.warn("No risk management data found for strategy ID:", strategyId);
      return null;
    }

    return data as RiskManagementData;
  } catch (error) {
    console.error("Error in getRiskManagementForStrategy:", error);
    throw error;
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
      console.error("Error fetching strategy:", error);
      throw error;
    }

    if (!data) {
      console.warn("No strategy found with ID:", id);
      return null;
    }

    console.log("Retrieved strategy:", data);
    return data as Strategy;
  } catch (error) {
    console.error("Error in getStrategyById:", error);
    throw error;
  }
};

export const getTradingRulesForStrategy = async (strategyId: string) => {
  try {
    // First, get all the rule groups for this strategy
    const { data: entryGroups, error: entryGroupsError } = await supabase
      .from('rule_groups')
      .select('*')
      .eq('strategy_id', strategyId)
      .eq('rule_type', 'entry')
      .order('group_order', { ascending: true });

    if (entryGroupsError) {
      console.error("Error fetching entry rule groups:", entryGroupsError);
      throw entryGroupsError;
    }

    const { data: exitGroups, error: exitGroupsError } = await supabase
      .from('rule_groups')
      .select('*')
      .eq('strategy_id', strategyId)
      .eq('rule_type', 'exit')
      .order('group_order', { ascending: true });

    if (exitGroupsError) {
      console.error("Error fetching exit rule groups:", exitGroupsError);
      throw exitGroupsError;
    }

    // Format entry groups
    const entryRules = await Promise.all(entryGroups.map(async (group) => {
      const { data: inequalities, error: inequalitiesError } = await supabase
        .from('trading_rules')
        .select('*')
        .eq('rule_group_id', group.id)
        .order('inequality_order', { ascending: true });

      if (inequalitiesError) {
        console.error("Error fetching inequalities for group:", inequalitiesError);
        throw inequalitiesError;
      }

      return {
        id: group.id,
        logic: group.logic,
        requiredConditions: group.required_conditions,
        inequalities: inequalities.map(formatInequality)
      };
    }));

    // Format exit groups
    const exitRules = await Promise.all(exitGroups.map(async (group) => {
      const { data: inequalities, error: inequalitiesError } = await supabase
        .from('trading_rules')
        .select('*')
        .eq('rule_group_id', group.id)
        .order('inequality_order', { ascending: true });

      if (inequalitiesError) {
        console.error("Error fetching inequalities for group:", inequalitiesError);
        throw inequalitiesError;
      }

      return {
        id: group.id,
        logic: group.logic,
        requiredConditions: group.required_conditions,
        inequalities: inequalities.map(formatInequality)
      };
    }));

    return { entryRules, exitRules };
  } catch (error) {
    console.error("Error in getTradingRulesForStrategy:", error);
    return { entryRules: [], exitRules: [] };
  }
};

// Helper function to format inequality from database to UI format
const formatInequality = (inequality: any) => {
  return {
    id: inequality.id,
    left: {
      type: inequality.left_type,
      indicator: inequality.left_indicator,
      parameters: inequality.left_parameters,
      value: inequality.left_value,
      valueType: inequality.left_value_type
    },
    condition: inequality.condition,
    right: {
      type: inequality.right_type,
      indicator: inequality.right_indicator,
      parameters: inequality.right_parameters,
      value: inequality.right_value,
      valueType: inequality.right_value_type
    },
    explanation: inequality.explanation
  };
};

import { supabase } from "@/integrations/supabase/client";

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

export interface RiskManagementData {
  stopLoss: string;
  takeProfit: string;
  singleBuyVolume: string;
  maxBuyVolume: string;
}

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

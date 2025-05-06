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

export interface RiskManagementData {
  stopLoss: string;
  takeProfit: string;
  singleBuyVolume: string;
  maxBuyVolume: string;
}

// Convert snake_case database fields to camelCase for our Strategy interface
const mapDbStrategyToInterface = (dbStrategy: any): Strategy => {
  return {
    id: dbStrategy.id,
    createdAt: dbStrategy.created_at,
    updatedAt: dbStrategy.updated_at,
    name: dbStrategy.name,
    description: dbStrategy.description,
    isActive: dbStrategy.is_active,
    market: dbStrategy.market,
    timeframe: dbStrategy.timeframe,
    targetAsset: dbStrategy.target_asset,
    userId: dbStrategy.user_id,
    stopLoss: dbStrategy.stop_loss,
    takeProfit: dbStrategy.take_profit,
    singleBuyVolume: dbStrategy.single_buy_volume,
    maxBuyVolume: dbStrategy.max_buy_volume
  };
};

// Convert camelCase interface fields to snake_case for database
const mapInterfaceToDbStrategy = (strategy: Omit<Strategy, 'id' | 'createdAt' | 'updatedAt'>) => {
  return {
    name: strategy.name,
    description: strategy.description,
    is_active: strategy.isActive,
    market: strategy.market,
    timeframe: strategy.timeframe,
    target_asset: strategy.targetAsset,
    user_id: strategy.userId,
    stop_loss: strategy.stopLoss,
    take_profit: strategy.takeProfit,
    single_buy_volume: strategy.singleBuyVolume,
    max_buy_volume: strategy.maxBuyVolume
  };
};

// Generate strategy using AI
export const generateStrategy = async (
  assetType: "stocks" | "cryptocurrency",
  asset: string,
  description: string
): Promise<GeneratedStrategy> => {
  try {
    // Call the Supabase Edge Function that generates the strategy
    const { data, error } = await supabase.functions.invoke('generate-strategy', {
      body: {
        assetType,
        asset,
        description
      }
      // The timeoutMs property is not supported in the current type definition
      // We'll rely on the default timeout instead
    });

    if (error) {
      console.error("Error from generate-strategy function:", error);
      throw {
        message: `Error from AI service: ${error.message}`,
        type: error.name === 'AbortError' ? 'timeout_error' : 'api_error'
      };
    }

    console.log("Generated strategy data:", data);
    return data as GeneratedStrategy;
  } catch (error: any) {
    // Handle timeouts and connection errors
    if (error.message && error.message.includes('timeout')) {
      throw {
        message: "The request timed out. Please try again with a simpler description.",
        type: "timeout_error"
      };
    }
    
    // Handle connection errors
    if (!navigator.onLine || error.message?.includes('Failed to fetch')) {
      throw {
        message: "Failed to connect to the AI service. Please check your internet connection.",
        type: "connection_error"
      };
    }

    // Handle API key errors
    if (error.message?.includes('API key')) {
      throw {
        message: "API key error: The AI service could not authenticate. Check your Supabase Edge Function configuration.",
        type: "api_key_error"
      };
    }

    // Otherwise, just pass through the error
    console.error("Error in generateStrategy:", error);
    throw error;
  }
};

export const generateFallbackStrategy = (
  assetType: "stocks" | "cryptocurrency",
  asset: string,
  description: string
): GeneratedStrategy => {
  // Create a template strategy based on the asset type
  const timeframe = assetType === 'cryptocurrency' ? '1h' : '1d';
  const name = `${asset} ${assetType === 'cryptocurrency' ? 'Crypto' : 'Stock'} Strategy`;

  const strategy: GeneratedStrategy = {
    name: name,
    description: description || `A simple ${assetType} strategy for ${asset}`,
    market: assetType === 'cryptocurrency' ? 'Cryptocurrency' : 'Stock Market',
    timeframe: timeframe,
    targetAsset: asset,
    entryRules: [
      {
        id: 1,
        logic: "ALL",
        requiredConditions: 2,
        explanation: "Enter when both conditions are met",
        inequalities: [
          {
            id: 1,
            left: {
              type: "INDICATOR",
              indicator: "SMA",
              parameters: { period: "20" },
              valueType: "number"
            },
            condition: "CROSSES_ABOVE",
            right: {
              type: "INDICATOR",
              indicator: "SMA",
              parameters: { period: "50" },
              valueType: "number"
            },
            explanation: "Short-term moving average crosses above long-term moving average"
          },
          {
            id: 2,
            left: {
              type: "INDICATOR",
              indicator: "RSI",
              parameters: { period: "14" },
              valueType: "number"
            },
            condition: "GREATER_THAN",
            right: {
              type: "VALUE",
              value: "50",
              valueType: "number"
            },
            explanation: "RSI indicates bullish momentum"
          }
        ]
      }
    ],
    exitRules: [
      {
        id: 1,
        logic: "ANY",
        requiredConditions: 1,
        explanation: "Exit when any condition is met",
        inequalities: [
          {
            id: 1,
            left: {
              type: "INDICATOR", 
              indicator: "SMA",
              parameters: { period: "20" },
              valueType: "number"
            },
            condition: "CROSSES_BELOW",
            right: {
              type: "INDICATOR",
              indicator: "SMA",
              parameters: { period: "50" },
              valueType: "number"
            },
            explanation: "Short-term moving average crosses below long-term moving average"
          },
          {
            id: 2,
            left: {
              type: "INDICATOR",
              indicator: "PRICE",
              valueType: "number"
            },
            condition: "LESS_THAN",
            right: {
              type: "VALUE",
              value: assetType === 'cryptocurrency' ? "Support level" : "Previous low",
              valueType: "number"
            },
            explanation: "Price breaks below support"
          }
        ]
      }
    ],
    riskManagement: {
      stopLoss: "5%",
      takeProfit: "15%",
      singleBuyVolume: assetType === 'cryptocurrency' ? "100 USDT" : "10% of portfolio",
      maxBuyVolume: assetType === 'cryptocurrency' ? "1000 USDT" : "30% of portfolio"
    }
  };

  return strategy;
};

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

    // Map each database strategy object to our Strategy interface
    return data.map(mapDbStrategyToInterface);
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
    // Convert any camelCase properties to snake_case for the database
    const dbUpdates: any = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.market !== undefined) dbUpdates.market = updates.market;
    if (updates.timeframe !== undefined) dbUpdates.timeframe = updates.timeframe;
    if (updates.targetAsset !== undefined) dbUpdates.target_asset = updates.targetAsset;
    if (updates.userId !== undefined) dbUpdates.user_id = updates.userId;
    if (updates.stopLoss !== undefined) dbUpdates.stop_loss = updates.stopLoss;
    if (updates.takeProfit !== undefined) dbUpdates.take_profit = updates.takeProfit;
    if (updates.singleBuyVolume !== undefined) dbUpdates.single_buy_volume = updates.singleBuyVolume;
    if (updates.maxBuyVolume !== undefined) dbUpdates.max_buy_volume = updates.maxBuyVolume;

    const { data, error } = await supabase
      .from('strategies')
      .update(dbUpdates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error("Error updating strategy:", error);
      throw error;
    }

    return mapDbStrategyToInterface(data);
  } catch (error) {
    console.error("Error in updateStrategy:", error);
    throw error;
  }
};

export const createStrategy = async (strategy: Omit<Strategy, 'id' | 'createdAt' | 'updatedAt'>): Promise<Strategy | null> => {
  try {
    // Convert from camelCase to snake_case for DB
    const dbStrategy = mapInterfaceToDbStrategy(strategy);
    
    const { data, error } = await supabase
      .from('strategies')
      .insert([dbStrategy])
      .select('*')
      .single();

    if (error) {
      console.error("Error creating strategy:", error);
      throw error;
    }

    return mapDbStrategyToInterface(data);
  } catch (error) {
    console.error("Error in createStrategy:", error);
    throw error;
  }
};

export const saveGeneratedStrategy = async (strategy: GeneratedStrategy): Promise<string> => {
  try {
    // First, create the base strategy with proper user_id
    const currentUser = await supabase.auth.getUser();
    const userId = currentUser.data.user?.id || 'anonymous';
    
    const { data: strategyData, error: strategyError } = await supabase
      .from('strategies')
      .insert({
        name: strategy.name,
        description: strategy.description,
        market: strategy.market,
        timeframe: strategy.timeframe,
        target_asset: strategy.targetAsset,
        stop_loss: strategy.riskManagement.stopLoss,
        take_profit: strategy.riskManagement.takeProfit,
        single_buy_volume: strategy.riskManagement.singleBuyVolume,
        max_buy_volume: strategy.riskManagement.maxBuyVolume,
        user_id: userId
      })
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
      .select('stop_loss, take_profit, single_buy_volume, max_buy_volume')
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

    return {
      stopLoss: data.stop_loss || '',
      takeProfit: data.take_profit || '',
      singleBuyVolume: data.single_buy_volume || '',
      maxBuyVolume: data.max_buy_volume || ''
    };
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
    // Convert the database object to our Strategy interface
    return mapDbStrategyToInterface(data);
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

    // If no rule groups were found, return empty arrays instead of throwing an error
    const entryRules = entryGroups && entryGroups.length > 0 
      ? await Promise.all(entryGroups.map(async (group) => {
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
            explanation: group.explanation,
            inequalities: inequalities ? inequalities.map(formatInequality) : []
          };
        }))
      : [];

    // Format exit groups
    const exitRules = exitGroups && exitGroups.length > 0
      ? await Promise.all(exitGroups.map(async (group) => {
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
            explanation: group.explanation,
            inequalities: inequalities ? inequalities.map(formatInequality) : []
          };
        }))
      : [];

    return { entryRules, exitRules };
  } catch (error) {
    console.error("Error in getTradingRulesForStrategy:", error);
    // Return empty arrays instead of throwing to prevent UI crashes
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

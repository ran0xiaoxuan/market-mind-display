import { supabase } from "@/integrations/supabase/client";
import { RuleGroupData } from "@/components/strategy-detail/types";

export interface Strategy {
  id: string;
  name: string;
  description?: string;
  targetAsset?: string;
  targetAssetName?: string;
  isActive: boolean;
  timeframe: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  stopLoss?: string;
  takeProfit?: string;
  singleBuyVolume?: string;
  maxBuyVolume?: string;
}

export interface GeneratedStrategy {
  name: string;
  description: string;
  timeframe: string;
  targetAsset?: string;
  entryRules: RuleGroupData[];
  exitRules: RuleGroupData[];
  riskManagement: {
    stopLoss: string;
    takeProfit: string;
    singleBuyVolume: string;
    maxBuyVolume: string;
  };
}

export interface ServiceError {
  message: string;
  type: string;
  retryable: boolean;
  details?: string[];
}

export const getStrategies = async (): Promise<Strategy[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("strategies")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching strategies:", error);
    throw new Error("Failed to fetch strategies");
  }

  return data.map(strategy => ({
    id: strategy.id,
    name: strategy.name,
    description: strategy.description || "",
    targetAsset: strategy.target_asset || "",
    targetAssetName: strategy.target_asset_name || "",
    isActive: strategy.is_active,
    timeframe: strategy.timeframe,
    createdAt: strategy.created_at,
    updatedAt: strategy.updated_at,
    userId: strategy.user_id,
    stopLoss: strategy.stop_loss || "",
    takeProfit: strategy.take_profit || "",
    singleBuyVolume: strategy.single_buy_volume || "",
    maxBuyVolume: strategy.max_buy_volume || ""
  }));
};

export const getStrategyById = async (strategyId: string): Promise<Strategy | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("strategies")
    .select("*")
    .eq("id", strategyId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Error fetching strategy:", error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    description: data.description || "",
    targetAsset: data.target_asset || "",
    targetAssetName: data.target_asset_name || "",
    isActive: data.is_active,
    timeframe: data.timeframe,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    userId: data.user_id,
    stopLoss: data.stop_loss || "",
    takeProfit: data.take_profit || "",
    singleBuyVolume: data.single_buy_volume || "",
    maxBuyVolume: data.max_buy_volume || ""
  };
};

export const getTradingRulesForStrategy = async (strategyId: string): Promise<{ entryRules: RuleGroupData[], exitRules: RuleGroupData[] } | null> => {
  const { data: ruleGroups, error: ruleGroupsError } = await supabase
    .from("rule_groups")
    .select(`
      id,
      rule_type,
      group_order,
      logic,
      required_conditions,
      trading_rules (
        id,
        inequality_order,
        left_type,
        left_indicator,
        left_parameters,
        left_value,
        left_value_type,
        condition,
        right_type,
        right_indicator,
        right_parameters,
        right_value,
        right_value_type,
        explanation
      )
    `)
    .eq("strategy_id", strategyId)
    .order("group_order");

  if (ruleGroupsError) {
    console.error("Error fetching rule groups:", ruleGroupsError);
    return null;
  }

  const entryRules: RuleGroupData[] = [];
  const exitRules: RuleGroupData[] = [];

  ruleGroups?.forEach(group => {
    const inequalities = group.trading_rules
      ?.sort((a, b) => a.inequality_order - b.inequality_order)
      .map(rule => ({
        id: rule.id,
        left: {
          type: rule.left_type,
          indicator: rule.left_indicator,
          parameters: (rule.left_parameters as any) || {},
          value: rule.left_value,
          valueType: rule.left_value_type
        },
        condition: rule.condition,
        right: {
          type: rule.right_type,
          indicator: rule.right_indicator,
          parameters: (rule.right_parameters as any) || {},
          value: rule.right_value,
          valueType: rule.right_value_type
        },
        explanation: rule.explanation
      })) || [];

    const ruleGroupData: RuleGroupData = {
      id: group.id,
      logic: group.logic as "AND" | "OR",
      inequalities,
      requiredConditions: group.required_conditions
    };

    if (group.rule_type === "entry") {
      entryRules.push(ruleGroupData);
    } else {
      exitRules.push(ruleGroupData);
    }
  });

  return { entryRules, exitRules };
};

export const getRiskManagementForStrategy = async (strategyId: string) => {
  const strategy = await getStrategyById(strategyId);
  if (!strategy) return null;

  return {
    stopLoss: strategy.stopLoss || "Not set",
    takeProfit: strategy.takeProfit || "Not set",
    singleBuyVolume: strategy.singleBuyVolume || "Not set",
    maxBuyVolume: strategy.maxBuyVolume || "Not set"
  };
};

export const generateStrategy = async (assetType: string, selectedAsset: string, description: string): Promise<GeneratedStrategy> => {
  try {
    console.log('Calling generate-strategy edge function with:', {
      assetType,
      selectedAsset,
      strategyDescription: description
    });

    const { data, error } = await supabase.functions.invoke('generate-strategy', {
      body: {
        assetType,
        selectedAsset,
        strategyDescription: description
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      
      // Handle different types of errors
      if (error.message?.includes('Failed to fetch')) {
        throw {
          message: "Unable to connect to AI service. The service may be temporarily unavailable.",
          type: "connection_error",
          retryable: true,
          details: ["Check your internet connection", "The AI service may be restarting", "Try again in a few moments"]
        } as ServiceError;
      }
      
      if (error.message?.includes('timeout')) {
        throw {
          message: "Request timed out. Please try with a simpler strategy description.",
          type: "timeout_error",
          retryable: true,
          details: ["Try reducing the complexity of your strategy description", "Use fewer technical indicators", "Break down complex requirements"]
        } as ServiceError;
      }

      // Generic error handling
      throw {
        message: error.message || "AI service is currently unavailable",
        type: "api_error",
        retryable: true,
        details: ["The AI service may be temporarily down", "Try using the template strategy option", "Contact support if the issue persists"]
      } as ServiceError;
    }

    if (!data) {
      throw {
        message: "No response received from AI service",
        type: "api_error",
        retryable: true,
        details: ["The AI service returned an empty response", "Try again with a different strategy description"]
      } as ServiceError;
    }

    console.log('Strategy generated successfully:', data);
    return data;
  } catch (error: any) {
    console.error('Error in generateStrategy:', error);
    
    // If it's already a ServiceError, re-throw it
    if (error.type) {
      throw error;
    }
    
    // Handle network errors
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw {
        message: "Network connection failed. Please check your internet connection.",
        type: "connection_error",
        retryable: true,
        details: ["Check your internet connection", "Try refreshing the page", "The service may be temporarily unavailable"]
      } as ServiceError;
    }
    
    // Generic fallback
    throw {
      message: "An unexpected error occurred while generating the strategy",
      type: "unknown_error",
      retryable: true,
      details: ["Try again in a few moments", "Use the template strategy option", "Contact support if the issue persists"]
    } as ServiceError;
  }
};

export const saveGeneratedStrategy = async (generatedStrategy: GeneratedStrategy): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  // Insert strategy
  const { data: strategy, error: strategyError } = await supabase
    .from("strategies")
    .insert({
      name: generatedStrategy.name,
      description: generatedStrategy.description,
      timeframe: generatedStrategy.timeframe,
      target_asset: generatedStrategy.targetAsset,
      user_id: user.id,
      is_active: true,
      stop_loss: generatedStrategy.riskManagement.stopLoss,
      take_profit: generatedStrategy.riskManagement.takeProfit,
      single_buy_volume: generatedStrategy.riskManagement.singleBuyVolume,
      max_buy_volume: generatedStrategy.riskManagement.maxBuyVolume
    })
    .select()
    .single();

  if (strategyError) {
    throw new Error("Failed to save strategy");
  }

  const strategyId = strategy.id;

  // Save entry rules
  for (let groupIndex = 0; groupIndex < generatedStrategy.entryRules.length; groupIndex++) {
    const group = generatedStrategy.entryRules[groupIndex];
    
    const { data: entryGroup, error: entryGroupError } = await supabase
      .from("rule_groups")
      .insert({
        strategy_id: strategyId,
        rule_type: "entry",
        group_order: groupIndex + 1,
        logic: group.logic,
        required_conditions: group.logic === "OR" ? group.requiredConditions : null
      })
      .select()
      .single();

    if (entryGroupError) throw new Error("Failed to save entry rules");

    // Save inequalities for this group
    for (let i = 0; i < group.inequalities.length; i++) {
      const inequality = group.inequalities[i];
      const { error: ruleError } = await supabase
        .from("trading_rules")
        .insert({
          rule_group_id: entryGroup.id,
          inequality_order: i + 1,
          left_type: inequality.left.type,
          left_indicator: inequality.left.indicator,
          left_parameters: inequality.left.parameters,
          left_value: inequality.left.value,
          left_value_type: inequality.left.valueType,
          condition: inequality.condition,
          right_type: inequality.right.type,
          right_indicator: inequality.right.indicator,
          right_parameters: inequality.right.parameters,
          right_value: inequality.right.value,
          right_value_type: inequality.right.valueType,
          explanation: inequality.explanation
        });

      if (ruleError) throw new Error("Failed to save trading rule");
    }
  }

  // Save exit rules
  for (let groupIndex = 0; groupIndex < generatedStrategy.exitRules.length; groupIndex++) {
    const group = generatedStrategy.exitRules[groupIndex];
    
    const { data: exitGroup, error: exitGroupError } = await supabase
      .from("rule_groups")
      .insert({
        strategy_id: strategyId,
        rule_type: "exit",
        group_order: groupIndex + 1,
        logic: group.logic,
        required_conditions: group.logic === "OR" ? group.requiredConditions : null
      })
      .select()
      .single();

    if (exitGroupError) throw new Error("Failed to save exit rules");

    // Save inequalities for this group
    for (let i = 0; i < group.inequalities.length; i++) {
      const inequality = group.inequalities[i];
      const { error: ruleError } = await supabase
        .from("trading_rules")
        .insert({
          rule_group_id: exitGroup.id,
          inequality_order: i + 1,
          left_type: inequality.left.type,
          left_indicator: inequality.left.indicator,
          left_parameters: inequality.left.parameters,
          left_value: inequality.left.value,
          left_value_type: inequality.left.valueType,
          condition: inequality.condition,
          right_type: inequality.right.type,
          right_indicator: inequality.right.indicator,
          right_parameters: inequality.right.parameters,
          right_value: inequality.right.value,
          right_value_type: inequality.right.valueType,
          explanation: inequality.explanation
        });

      if (ruleError) throw new Error("Failed to save trading rule");
    }
  }

  return strategyId;
};

export const checkAIServiceHealth = async (): Promise<{ healthy: boolean; details?: any; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-strategy', {
      body: { healthCheck: true }
    });

    if (error) {
      return { healthy: false, error: error.message };
    }

    return { healthy: true, details: data };
  } catch (error) {
    console.error("Health check failed:", error);
    return { healthy: false, error: "Health check failed" };
  }
};

export const generateFallbackStrategy = (assetType: string, selectedAsset: string, description: string): GeneratedStrategy => {
  return {
    name: `${selectedAsset} Template Strategy`,
    description: `A template trading strategy for ${selectedAsset} based on: ${description}`,
    timeframe: "Daily",
    targetAsset: selectedAsset,
    entryRules: [
      {
        id: 1,
        logic: "AND",
        inequalities: [
          {
            id: 1,
            left: {
              type: "indicator",
              indicator: "RSI",
              parameters: { period: "14" },
              value: "",
              valueType: "number"
            },
            condition: "<",
            right: {
              type: "value",
              indicator: "",
              parameters: {},
              value: "30",
              valueType: "number"
            },
            explanation: "RSI is oversold (below 30)"
          }
        ]
      }
    ],
    exitRules: [
      {
        id: 1,
        logic: "OR",
        inequalities: [
          {
            id: 1,
            left: {
              type: "indicator",
              indicator: "RSI",
              parameters: { period: "14" },
              value: "",
              valueType: "number"
            },
            condition: ">",
            right: {
              type: "value",
              indicator: "",
              parameters: {},
              value: "70",
              valueType: "number"
            },
            explanation: "RSI is overbought (above 70)"
          }
        ]
      }
    ],
    riskManagement: {
      stopLoss: "5",
      takeProfit: "10",
      singleBuyVolume: "1000",
      maxBuyVolume: "5000"
    }
  };
};

export const deleteStrategy = async (strategyId: string): Promise<void> => {
  console.log("Attempting to delete strategy:", strategyId);
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  // First check if the strategy belongs to the user and can be deleted
  const { data: strategy, error: fetchError } = await supabase
    .from("strategies")
    .select("id, user_id, can_be_deleted")
    .eq("id", strategyId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !strategy) {
    console.error("Strategy not found or access denied:", fetchError);
    throw new Error("Strategy not found or you don't have permission to delete it");
  }

  // Use the cascade deletion function to avoid recursion issues
  const { error } = await supabase.rpc('delete_strategy_cascade', {
    strategy_uuid: strategyId
  });

  if (error) {
    console.error("Error deleting strategy:", error);
    throw new Error(error.message || "Failed to delete strategy");
  }

  console.log("Strategy deleted successfully:", strategyId);
  
  // Dispatch a custom event to notify other components
  window.dispatchEvent(new CustomEvent('strategy-deleted', { detail: strategyId }));
};

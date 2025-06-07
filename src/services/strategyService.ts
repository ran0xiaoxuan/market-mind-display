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
  console.log('=== Starting AI strategy generation ===');
  console.log('Parameters:', { assetType, selectedAsset, descriptionLength: description.length });

  // Enhanced validation
  if (!assetType || !selectedAsset || !description) {
    throw {
      message: "Missing required parameters",
      type: "validation_error",
      retryable: false,
      details: ["All fields are required"]
    } as ServiceError;
  }

  if (description.length < 10) {
    throw {
      message: "Strategy description too short",
      type: "validation_error", 
      retryable: false,
      details: ["Description must be at least 10 characters"]
    } as ServiceError;
  }

  const requestPayload = {
    assetType,
    selectedAsset,
    strategyDescription: description
  };

  console.log('Sending request to edge function...');

  try {
    // Use direct fetch to edge function as fallback
    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/generate-strategy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabase.supabaseKey}`,
        'apikey': supabase.supabaseKey,
      },
      body: JSON.stringify(requestPayload),
    });

    console.log('Direct fetch response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Direct fetch error:', errorText);
      
      if (response.status === 404) {
        throw {
          message: "AI service endpoint not found",
          type: "service_unavailable",
          retryable: true,
          details: ["The AI service may be deploying", "Try again in a moment"]
        } as ServiceError;
      }

      throw {
        message: `AI service error: ${response.status}`,
        type: "service_unavailable",
        retryable: true,
        details: ["Service temporarily unavailable"]
      } as ServiceError;
    }

    const data = await response.json();
    console.log('Strategy generated successfully via direct fetch');
    
    // Validate response structure
    if (!data || !data.name || !data.entryRules || !data.exitRules) {
      throw {
        message: "Invalid response from AI service",
        type: "parsing_error",
        retryable: true,
        details: ["AI service returned incomplete data"]
      } as ServiceError;
    }

    return data as GeneratedStrategy;

  } catch (fetchError: any) {
    console.error('Direct fetch failed, trying Supabase client...');
    
    // Fallback to Supabase client method
    try {
      const { data, error } = await supabase.functions.invoke('generate-strategy', {
        body: requestPayload,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        console.error('Supabase client error:', error);
        throw {
          message: "AI service unavailable",
          type: "connection_error",
          retryable: true,
          details: ["Unable to connect to AI service", "Check your connection"]
        } as ServiceError;
      }

      if (!data) {
        throw {
          message: "No response from AI service",
          type: "service_unavailable",
          retryable: true,
          details: ["Service returned empty response"]
        } as ServiceError;
      }

      console.log('Strategy generated successfully via Supabase client');
      return data as GeneratedStrategy;

    } catch (supabaseError: any) {
      console.error('Both methods failed:', supabaseError);
      
      // Handle specific error types
      if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
        throw {
          message: "Network connection failed",
          type: "connection_error",
          retryable: true,
          details: ["Check your internet connection", "Service may be temporarily down"]
        } as ServiceError;
      }

      throw {
        message: "AI service is temporarily unavailable",
        type: "service_unavailable",
        retryable: true,
        details: ["Try the template strategy option", "Service will be restored shortly"]
      } as ServiceError;
    }
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
    console.log('Checking AI service health...');
    
    // Try direct fetch first
    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/generate-strategy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabase.supabaseKey}`,
        'apikey': supabase.supabaseKey,
      },
      body: JSON.stringify({ healthCheck: true }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Health check successful via direct fetch');
      return { 
        healthy: true, 
        details: { 
          ...data, 
          method: 'direct_fetch',
          timestamp: new Date().toISOString() 
        } 
      };
    }

    console.log('Direct fetch failed, trying Supabase client...');
    
    // Fallback to Supabase client
    const { data, error } = await supabase.functions.invoke('generate-strategy', {
      body: { healthCheck: true },
      headers: { 'Content-Type': 'application/json' }
    });

    if (!error && data) {
      console.log('Health check successful via Supabase client');
      return { 
        healthy: true, 
        details: { 
          ...data, 
          method: 'supabase_client',
          timestamp: new Date().toISOString() 
        } 
      };
    }

    console.error('Both health check methods failed');
    return { 
      healthy: false, 
      error: "Service is offline - unable to connect via any method",
      details: { timestamp: new Date().toISOString() }
    };

  } catch (error: any) {
    console.error("Health check failed:", error);
    return { 
      healthy: false, 
      error: "Health check failed: " + error.message,
      details: { timestamp: new Date().toISOString() }
    };
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

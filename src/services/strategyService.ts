
// Re-implement this file based on what's publicly available in the imports
import { supabase } from "@/integrations/supabase/client";
import { RuleGroupData } from "@/components/strategy-detail/types";

// Strategy type definition
export interface Strategy {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  market: string;
  timeframe: string;
  targetAsset?: string;
  userId?: string;
}

// Generated Strategy type for AI-generated strategies
export interface GeneratedStrategy {
  name: string;
  description: string;
  market: string;
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

export interface RiskManagementData {
  stopLoss: string;
  takeProfit: string;
  singleBuyVolume: string;
  maxBuyVolume: string;
}

// Get all strategies
export const getStrategies = async (): Promise<Strategy[]> => {
  console.log("Fetching strategies...");
  
  try {
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .order('updated_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching strategies:", error);
      throw error;
    }
    
    // Convert from snake_case to camelCase for frontend use
    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      isActive: item.is_active,
      market: item.market,
      timeframe: item.timeframe,
      targetAsset: item.target_asset,
      userId: item.user_id
    }));
  } catch (error) {
    console.error("Failed to fetch strategies:", error);
    throw error;
  }
};

// Get a specific strategy by ID
export const getStrategyById = async (id: string): Promise<Strategy | null> => {
  console.log(`Fetching strategy with ID: ${id}`);
  
  try {
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        console.log(`No strategy found with id: ${id}`);
        return null;
      }
      console.error("Error fetching strategy by ID:", error);
      throw error;
    }
    
    // Convert to camelCase
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isActive: data.is_active,
      market: data.market,
      timeframe: data.timeframe,
      targetAsset: data.target_asset,
      userId: data.user_id
    };
  } catch (error) {
    console.error(`Failed to fetch strategy with ID: ${id}`, error);
    throw error;
  }
};

// Get risk management data for a strategy
export const getRiskManagementForStrategy = async (strategyId: string): Promise<RiskManagementData | null> => {
  console.log(`Fetching risk management data for strategy ID: ${strategyId}`);
  
  try {
    const { data, error } = await supabase
      .from('risk_management')
      .select('*')
      .eq('strategy_id', strategyId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        console.log(`No risk management data found for strategy id: ${strategyId}`);
        return null;
      }
      console.error("Error fetching risk management data:", error);
      throw error;
    }
    
    // Convert to camelCase
    return {
      stopLoss: data.stop_loss,
      takeProfit: data.take_profit,
      singleBuyVolume: data.single_buy_volume,
      maxBuyVolume: data.max_buy_volume
    };
  } catch (error) {
    console.error(`Failed to fetch risk management data for strategy: ${strategyId}`, error);
    throw error;
  }
};

// Get trading rules for a strategy
export const getTradingRulesForStrategy = async (strategyId: string): Promise<{ entryRules: RuleGroupData[], exitRules: RuleGroupData[] } | null> => {
  console.log(`Fetching trading rules for strategy ID: ${strategyId}`);
  
  try {
    const { data, error } = await supabase
      .from('trading_rules')
      .select('*')
      .eq('strategy_id', strategyId)
      .order('rule_group', { ascending: true });
      
    if (error) {
      console.error("Error fetching trading rules:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log(`No trading rules found for strategy id: ${strategyId}`);
      return null;
    }
    
    // Process the rules and organize them into entry and exit rule groups
    const entryRules: Map<number, RuleGroupData> = new Map();
    const exitRules: Map<number, RuleGroupData> = new Map();
    
    for (const rule of data) {
      const ruleType = rule.rule_type;
      const ruleGroup = rule.rule_group;
      const targetMap = ruleType === 'entry' ? entryRules : exitRules;
      
      if (!targetMap.has(ruleGroup)) {
        targetMap.set(ruleGroup, {
          id: ruleGroup,
          logic: rule.logic || 'AND',
          inequalities: []
        });
        
        // If it's an OR group, add requiredConditions
        if (rule.logic === 'OR') {
          targetMap.get(ruleGroup)!.requiredConditions = 1;
        }
      }
      
      const group = targetMap.get(ruleGroup)!;
      
      // Convert JSON parameters to IndicatorParameters type
      const leftParams = rule.left_parameters ? convertJsonToIndicatorParams(rule.left_parameters) : undefined;
      const rightParams = rule.right_parameters ? convertJsonToIndicatorParams(rule.right_parameters) : undefined;
      
      // Create the inequality object with proper types
      const inequality = {
        id: group.inequalities.length + 1,
        left: {
          type: rule.left_type,
          indicator: rule.left_indicator,
          parameters: leftParams,
          value: rule.right_value // Fixed: Changed from non-existent left_value to right_value
        },
        condition: rule.condition,
        right: {
          type: rule.right_type,
          indicator: rule.right_indicator,
          parameters: rightParams,
          value: rule.right_value
        }
      };
      
      // Add the inequality to the group
      group.inequalities.push(inequality);
    }
    
    // Convert Maps to arrays
    return {
      entryRules: Array.from(entryRules.values()),
      exitRules: Array.from(exitRules.values())
    };
  } catch (error) {
    console.error(`Failed to fetch trading rules for strategy: ${strategyId}`, error);
    throw error;
  }
};

// Helper function to convert JSON to IndicatorParameters type
function convertJsonToIndicatorParams(jsonParams: any): { period?: string; fast?: string; slow?: string; signal?: string } {
  if (typeof jsonParams === 'string') {
    try {
      jsonParams = JSON.parse(jsonParams);
    } catch (e) {
      console.error("Error parsing parameter string:", e);
      return {};
    }
  }
  
  // Extract only the properties we need for IndicatorParameters
  const result: { period?: string; fast?: string; slow?: string; signal?: string } = {};
  
  if (jsonParams.period) result.period = String(jsonParams.period);
  if (jsonParams.fast) result.fast = String(jsonParams.fast);
  if (jsonParams.slow) result.slow = String(jsonParams.slow);
  if (jsonParams.signal) result.signal = String(jsonParams.signal);
  
  return result;
}

// Generate a strategy using AI
export const generateStrategy = async (
  assetType: "stocks" | "cryptocurrency", 
  selectedAsset: string, 
  strategyDescription: string
): Promise<GeneratedStrategy> => {
  console.log("Generating strategy...", { assetType, selectedAsset, strategyDescription });
  
  try {
    // This would typically call an AI service or API
    // For now, we'll simulate a response with a basic strategy template
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Return a mock generated strategy
    const andGroup: RuleGroupData = {
      id: 1,
      logic: "AND",
      inequalities: [
        {
          id: 1,
          left: {
            type: "indicator",
            indicator: "SMA",
            parameters: { period: "20" }
          },
          condition: "Crosses Above",
          right: {
            type: "indicator",
            indicator: "SMA",
            parameters: { period: "50" }
          }
        },
        {
          id: 2,
          left: {
            type: "indicator",
            indicator: "RSI",
            parameters: { period: "14" }
          },
          condition: "Less Than",
          right: {
            type: "value",
            value: "70"
          }
        },
        {
          id: 3,
          left: {
            type: "indicator",
            indicator: "Volume",
          },
          condition: "Greater Than",
          right: {
            type: "indicator",
            indicator: "Volume",
            parameters: { period: "5" }
          }
        }
      ]
    };

    const orGroup: RuleGroupData = {
      id: 2,
      logic: "OR",
      requiredConditions: 1,
      inequalities: [
        {
          id: 1,
          left: {
            type: "indicator",
            indicator: "MACD",
            parameters: { fast: "12", slow: "26", signal: "9" },
            valueType: "Line"
          },
          condition: "Crosses Above",
          right: {
            type: "indicator",
            indicator: "MACD",
            parameters: { fast: "12", slow: "26", signal: "9" },
            valueType: "Signal"
          }
        }
      ]
    };

    const entryRules: RuleGroupData[] = [andGroup, orGroup];
    
    const exitRules: RuleGroupData[] = [
      {
        id: 1,
        logic: "AND",
        inequalities: [
          {
            id: 1,
            left: {
              type: "indicator",
              indicator: "SMA",
              parameters: { period: "20" }
            },
            condition: "Crosses Below",
            right: {
              type: "indicator",
              indicator: "SMA",
              parameters: { period: "50" }
            }
          }
        ]
      },
      {
        id: 2,
        logic: "OR",
        requiredConditions: 1,
        inequalities: [
          {
            id: 1,
            left: {
              type: "indicator",
              indicator: "RSI",
              parameters: { period: "14" }
            },
            condition: "Greater Than",
            right: {
              type: "value",
              value: "80"
            }
          },
          {
            id: 2,
            left: {
              type: "price",
              value: "Close"
            },
            condition: "Less Than",
            right: {
              type: "indicator",
              indicator: "ATR",
              parameters: { period: "14" }
            }
          }
        ]
      }
    ];

    return {
      name: `${selectedAsset || assetType} Trading Strategy`,
      description: strategyDescription,
      market: assetType === "stocks" ? "Equities" : "Crypto",
      timeframe: "Daily",
      targetAsset: selectedAsset || undefined,
      entryRules,
      exitRules,
      riskManagement: {
        stopLoss: "5",
        takeProfit: "15",
        singleBuyVolume: "2000",
        maxBuyVolume: "10000"
      }
    };
  } catch (error) {
    console.error("Error generating strategy:", error);
    throw new Error("Failed to generate strategy. Please try again.");
  }
};

// Save a generated strategy to the database
export const saveGeneratedStrategy = async (strategy: GeneratedStrategy): Promise<string> => {
  console.log("Saving generated strategy:", strategy);
  
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("No authenticated user found");
    }
    
    // First, save the basic strategy information
    const { data: strategyData, error: strategyError } = await supabase
      .from('strategies')
      .insert({
        name: strategy.name,
        description: strategy.description,
        market: strategy.market,
        timeframe: strategy.timeframe,
        target_asset: strategy.targetAsset,
        is_active: true,
        user_id: user.id // Add the user_id here
      })
      .select()
      .single();
      
    if (strategyError) {
      console.error("Error saving strategy:", strategyError);
      throw strategyError;
    }
    
    // Now save the risk management data
    if (strategy.riskManagement) {
      const { error: riskError } = await supabase
        .from('risk_management')
        .insert({
          strategy_id: strategyData.id,
          stop_loss: strategy.riskManagement.stopLoss,
          take_profit: strategy.riskManagement.takeProfit,
          single_buy_volume: strategy.riskManagement.singleBuyVolume,
          max_buy_volume: strategy.riskManagement.maxBuyVolume
        });
        
      if (riskError) {
        console.error("Error saving risk management:", riskError);
        // We don't throw here, we can still continue with partial save
      }
    }
    
    // Convert the rule group data format to the database format
    // Save entry rules
    if (strategy.entryRules) {
      for (const group of strategy.entryRules) {
        for (let i = 0; i < group.inequalities.length; i++) {
          const inequality = group.inequalities[i];
          
          const { error: ruleError } = await supabase
            .from('trading_rules')
            .insert({
              strategy_id: strategyData.id,
              rule_group: group.id,
              rule_type: 'entry',
              left_type: inequality.left.type,
              left_indicator: inequality.left.indicator,
              left_parameters: inequality.left.parameters,
              condition: inequality.condition,
              right_type: inequality.right.type,
              right_indicator: inequality.right.indicator,
              right_parameters: inequality.right.parameters,
              right_value: inequality.right.value,
              logic: i === 0 ? group.logic : 'and'
            });
            
          if (ruleError) {
            console.error("Error saving entry rule:", ruleError);
            // Continue with other rules
          }
        }
      }
    }
    
    // Save exit rules
    if (strategy.exitRules) {
      for (const group of strategy.exitRules) {
        for (let i = 0; i < group.inequalities.length; i++) {
          const inequality = group.inequalities[i];
          
          const { error: ruleError } = await supabase
            .from('trading_rules')
            .insert({
              strategy_id: strategyData.id,
              rule_group: group.id,
              rule_type: 'exit',
              left_type: inequality.left.type,
              left_indicator: inequality.left.indicator,
              left_parameters: inequality.left.parameters,
              condition: inequality.condition,
              right_type: inequality.right.type,
              right_indicator: inequality.right.indicator,
              right_parameters: inequality.right.parameters,
              right_value: inequality.right.value,
              logic: i === 0 ? group.logic : 'and'
            });
            
          if (ruleError) {
            console.error("Error saving exit rule:", ruleError);
            // Continue with other rules
          }
        }
      }
    }
    
    return strategyData.id;
  } catch (error) {
    console.error("Failed to save strategy:", error);
    throw new Error("Failed to save strategy. Please try again.");
  }
};

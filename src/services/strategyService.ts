import { supabase } from "@/integrations/supabase/client";
import { RuleGroupData } from "@/components/strategy-detail/types";

export interface Strategy {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  isActive: boolean;
  timeframe: string;
  targetAsset: string;
  targetAssetName?: string;
  userId: string;
  stopLoss: string;
  takeProfit: string;
  singleBuyVolume: string;
  maxBuyVolume: string;
}

export interface GeneratedStrategy {
  name: string;
  description: string;
  timeframe: string;
  targetAsset: string;
  targetAssetName?: string;
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

// Enhanced error types for better error handling
export interface ServiceError {
  message: string;
  type: 'connection_error' | 'api_key_error' | 'timeout_error' | 'rate_limit_error' | 'parsing_error' | 'validation_error' | 'unknown_error';
  details?: any;
  timestamp?: string;
  retryable?: boolean;
}

// Health check function for AI service with improved error handling
export const checkAIServiceHealth = async (): Promise<{ healthy: boolean; details?: any; error?: string }> => {
  try {
    console.log("Checking AI service health...");
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const { data, error } = await supabase.functions.invoke('generate-strategy', {
      body: { health: true },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (error) {
      console.error("Health check failed:", error);
      return { 
        healthy: false, 
        error: error.message,
        details: error 
      };
    }

    console.log("Health check successful:", data);
    return { 
      healthy: true, 
      details: data 
    };
  } catch (error: any) {
    console.error("Health check error:", error);
    return { 
      healthy: false, 
      error: error.message || "Health check failed" 
    };
  }
};

// Improved retry utility with exponential backoff and better error classification
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  retryableErrors: string[] = ['connection_error', 'timeout_error', 'rate_limit_error']
): Promise<T> => {
  let lastError: ServiceError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed:`, error);
      
      // Don't retry if error is not retryable
      if (error.type && !retryableErrors.includes(error.type)) {
        console.log("Error not retryable, throwing immediately");
        throw lastError;
      }
      
      if (attempt === maxRetries) {
        console.log("Max retries reached, throwing error");
        throw lastError;
      }
      
      // Exponential backoff with jitter
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1) + Math.random() * 500, 10000);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// Enhanced input validation
const validateGenerateStrategyInput = (
  assetType: "stocks",
  asset: string,
  description: string
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!assetType || assetType !== "stocks") {
    errors.push("Asset type must be 'stocks'");
  }
  
  if (!asset || asset.trim().length === 0) {
    errors.push("Asset symbol is required");
  } else if (asset.length > 10) {
    errors.push("Asset symbol must be 10 characters or less");
  }
  
  if (!description || description.trim().length === 0) {
    errors.push("Strategy description is required");
  } else if (description.trim().length < 10) {
    errors.push("Strategy description must be at least 10 characters");
  } else if (description.length > 2000) {
    errors.push("Strategy description must be less than 2000 characters");
  }
  
  return { valid: errors.length === 0, errors };
};

// Generate strategy with enhanced connection handling and retry logic
export const generateStrategy = async (
  assetType: "stocks",
  asset: string,
  description: string
): Promise<GeneratedStrategy> => {
  // Input validation
  const validation = validateGenerateStrategyInput(assetType, asset, description);
  if (!validation.valid) {
    throw {
      message: `Input validation failed: ${validation.errors.join(', ')}`,
      type: "validation_error",
      details: validation.errors,
      retryable: false
    } as ServiceError;
  }

  // Network connectivity check
  if (!navigator.onLine) {
    throw {
      message: "No internet connection. Please check your network and try again.",
      type: "connection_error",
      retryable: true
    } as ServiceError;
  }

  try {
    console.log("Starting strategy generation with enhanced retry logic...", {
      assetType,
      asset,
      descriptionLength: description.length,
      timestamp: new Date().toISOString()
    });
    
    const result = await retryWithBackoff(async () => {
      // Call the Supabase Edge Function with improved error handling and timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log("Request timeout, aborting...");
        controller.abort();
      }, 40000); // 40 second timeout

      try {
        const { data, error } = await supabase.functions.invoke('generate-strategy', {
          body: {
            assetType,
            selectedAsset: asset,
            strategyDescription: description
          },
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (error) {
          console.error("Error from generate-strategy function:", error);
          
          // Enhanced error classification with better network error detection
          const errorMessage = error.message || "Unknown error";
          let errorType: ServiceError['type'] = "unknown_error";
          let retryable = false;
          
          // More comprehensive error classification
          if (error.name === "FunctionsFetchError" || 
              errorMessage.includes("Failed to send a request") ||
              errorMessage.includes("Failed to fetch") ||
              errorMessage.includes("fetch") ||
              errorMessage.includes("Network error") ||
              errorMessage.includes("ERR_NETWORK") ||
              errorMessage.includes("ERR_INTERNET_DISCONNECTED") ||
              errorMessage.includes("connection_error") ||
              errorMessage.includes("ECONNREFUSED") ||
              errorMessage.includes("ENOTFOUND") ||
              errorMessage.includes("ETIMEDOUT")) {
            errorType = "connection_error";
            retryable = true;
          } else if (errorMessage.includes("API key") || 
                     errorMessage.includes("authentication") ||
                     errorMessage.includes("401") ||
                     errorMessage.includes("api_key_error")) {
            errorType = "api_key_error";
            retryable = false;
          } else if (errorMessage.includes("timeout") || 
                     errorMessage.includes("timed out") ||
                     errorMessage.includes("408") ||
                     errorMessage.includes("timeout_error") ||
                     error.name === "AbortError") {
            errorType = "timeout_error";
            retryable = true;
          } else if (errorMessage.includes("rate limit") ||
                     errorMessage.includes("429") ||
                     errorMessage.includes("rate_limit_error")) {
            errorType = "rate_limit_error";
            retryable = true;
          } else if (errorMessage.includes("parse") ||
                     errorMessage.includes("JSON") ||
                     errorMessage.includes("parsing_error")) {
            errorType = "parsing_error";
            retryable = false;
          }
          
          throw {
            message: errorMessage,
            type: errorType,
            details: error,
            retryable,
            timestamp: new Date().toISOString()
          } as ServiceError;
        }

        if (!data) {
          throw {
            message: "No data received from AI service",
            type: "parsing_error",
            retryable: false
          } as ServiceError;
        }

        console.log("Strategy generation successful:", {
          strategyName: data.name,
          timestamp: new Date().toISOString()
        });

        return data as GeneratedStrategy;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw {
            message: "Request timeout - please try again",
            type: "timeout_error",
            retryable: true,
            timestamp: new Date().toISOString()
          } as ServiceError;
        }
        
        throw fetchError;
      }
    }, 3, 2000); // 3 retries with 2 second base delay

    return result;
  } catch (error: any) {
    console.error("Final error in generateStrategy:", error);
    
    // If it's already a ServiceError, pass it through
    if (error.type) {
      throw error;
    }
    
    // Handle unexpected errors with better classification
    let errorType: ServiceError['type'] = "unknown_error";
    let retryable = false;
    
    if (error.message && (
      error.message.includes('Failed to fetch') || 
      error.message.includes('fetch') ||
      error.message.includes('Network error') ||
      error.message.includes('ERR_NETWORK') ||
      error.message.includes('ERR_INTERNET_DISCONNECTED') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND')
    )) {
      errorType = "connection_error";
      retryable = true;
    } else if (error.message && (error.message.includes('timeout') || error.name === 'AbortError')) {
      errorType = "timeout_error";
      retryable = true;
    }

    throw {
      message: error.message || "Unexpected error occurred",
      type: errorType,
      details: error,
      retryable,
      timestamp: new Date().toISOString()
    } as ServiceError;
  }
};

// Generate fallback strategy
export const generateFallbackStrategy = (
  assetType: "stocks",
  asset: string,
  description: string
): GeneratedStrategy => {
  console.log("Generating fallback template strategy for:", asset);
  
  const strategy: GeneratedStrategy = {
    name: `${asset} Template Trading Strategy`,
    description: `A template trading strategy for ${asset} based on proven technical indicators. This strategy combines moving averages for trend identification with RSI for momentum confirmation. Suitable for medium-term positions with balanced risk management. Template strategies provide a solid foundation that can be customized based on market conditions and personal preferences.`,
    timeframe: 'Daily',
    targetAsset: asset,
    entryRules: [
      {
        id: 1,
        logic: "AND",
        requiredConditions: 2,
        explanation: "Primary entry conditions - all must be met",
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
            explanation: "Short-term moving average crosses above long-term moving average indicating upward trend"
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
            explanation: "RSI above 50 indicates bullish momentum"
          }
        ]
      },
      {
        id: 2,
        logic: "OR",
        requiredConditions: 1,
        explanation: "Additional confirmation signals - at least one should be met",
        inequalities: [
          {
            id: 3,
            left: {
              type: "INDICATOR",
              indicator: "Volume",
              parameters: { period: "20" },
              valueType: "number"
            },
            condition: "GREATER_THAN",
            right: {
              type: "INDICATOR",
              indicator: "SMA",
              parameters: { period: "20", source: "volume" },
              valueType: "number"
            },
            explanation: "Volume above average confirms strong market interest"
          },
          {
            id: 4,
            left: {
              type: "INDICATOR",
              indicator: "MACD",
              parameters: { fast: "12", slow: "26", signal: "9" },
              valueType: "number"
            },
            condition: "CROSSES_ABOVE",
            right: {
              type: "INDICATOR",
              indicator: "MACD Signal",
              parameters: { fast: "12", slow: "26", signal: "9" },
              valueType: "number"
            },
            explanation: "MACD crossing above signal line provides trend confirmation"
          }
        ]
      }
    ],
    exitRules: [
      {
        id: 1,
        logic: "OR",
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
              indicator: "RSI",
              parameters: { period: "14" },
              valueType: "number"
            },
            condition: "GREATER_THAN",
            right: {
              type: "VALUE",
              value: "70",
              valueType: "number"
            },
            explanation: "RSI above 70 indicates overbought conditions"
          },
          {
            id: 3,
            left: {
              type: "INDICATOR",
              indicator: "RSI",
              parameters: { period: "14" },
              valueType: "number"
            },
            condition: "LESS_THAN",
            right: {
              type: "VALUE",
              value: "30",
              valueType: "number"
            },
            explanation: "RSI below 30 indicates oversold conditions (stop loss scenario)"
          }
        ]
      }
    ],
    riskManagement: {
      stopLoss: "5%",
      takeProfit: "12%",
      singleBuyVolume: "$1000",
      maxBuyVolume: "$5000"
    }
  };

  return strategy;
};

// Convert snake_case database fields to camelCase for our Strategy interface
const mapDbStrategyToInterface = (dbStrategy: any): Strategy => {
  return {
    id: dbStrategy.id,
    createdAt: dbStrategy.created_at,
    updatedAt: dbStrategy.updated_at,
    name: dbStrategy.name,
    description: dbStrategy.description,
    isActive: dbStrategy.is_active,
    timeframe: dbStrategy.timeframe,
    targetAsset: dbStrategy.target_asset,
    targetAssetName: dbStrategy.target_asset_name,
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
    timeframe: strategy.timeframe,
    target_asset: strategy.targetAsset,
    target_asset_name: strategy.targetAssetName,
    user_id: strategy.userId,
    stop_loss: strategy.stopLoss,
    take_profit: strategy.takeProfit,
    single_buy_volume: strategy.singleBuyVolume,
    max_buy_volume: strategy.maxBuyVolume
  };
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
    console.log("Attempting to delete strategy with ID:", id);
    
    // First, delete related rule groups (which will cascade to trading rules)
    const { error: ruleGroupsError } = await supabase
      .from('rule_groups')
      .delete()
      .eq('strategy_id', id);
      
    if (ruleGroupsError) {
      console.error("Error deleting rule groups:", ruleGroupsError);
      throw ruleGroupsError;
    }
    
    console.log("Successfully deleted related rule groups");
    
    // Now delete the strategy itself
    const { error } = await supabase
      .from('strategies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting strategy:", error);
      throw error;
    }
    
    console.log("Strategy deletion successful");
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
    if (updates.timeframe !== undefined) dbUpdates.timeframe = updates.timeframe;
    if (updates.targetAsset !== undefined) dbUpdates.target_asset = updates.targetAsset;
    if (updates.targetAssetName !== undefined) dbUpdates.target_asset_name = updates.targetAssetName;
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
    // First, ensure user is authenticated before proceeding
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("User authentication error:", authError);
      throw new Error("Authentication required to save strategy");
    }
    
    const userId = user.id;
    console.log("Saving strategy for user:", userId);
    
    // Create the base strategy first in a transaction
    const { data: strategyData, error: strategyError } = await supabase
      .from('strategies')
      .insert({
        name: strategy.name,
        description: strategy.description,
        timeframe: strategy.timeframe,
        target_asset: strategy.targetAsset,
        target_asset_name: strategy.targetAssetName,
        stop_loss: strategy.riskManagement.stopLoss,
        take_profit: strategy.riskManagement.takeProfit,
        single_buy_volume: strategy.riskManagement.singleBuyVolume,
        max_buy_volume: strategy.riskManagement.maxBuyVolume,
        user_id: userId,
        is_active: false
      })
      .select('*')
      .single();

    if (strategyError) {
      console.error("Error saving strategy:", strategyError);
      throw strategyError;
    }

    const strategyId = strategyData.id;
    console.log("Strategy base data saved with ID:", strategyId);

    if (strategy.entryRules && strategy.entryRules.length > 0) {
      await saveRuleGroups(strategyId, strategy.entryRules, 'entry');
      console.log("Entry rules saved successfully");
    } else {
      console.warn("No entry rules to save");
    }
    
    if (strategy.exitRules && strategy.exitRules.length > 0) {
      await saveRuleGroups(strategyId, strategy.exitRules, 'exit');
      console.log("Exit rules saved successfully");
    } else {
      console.warn("No exit rules to save");
    }

    return strategyId;
  } catch (error) {
    console.error("Error in saveGeneratedStrategy:", error);
    throw error;
  }
};

// Updated to ensure consistent format between save and retrieve
const saveRuleGroups = async (
  strategyId: string, 
  ruleGroups: RuleGroupData[], 
  ruleType: 'entry' | 'exit'
) => {
  try {
    console.log(`Saving ${ruleType} rule groups:`, JSON.stringify(ruleGroups));
    
    // Process each rule group sequentially to avoid RLS policy issues
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
          logic: group.logic || (i === 0 ? 'AND' : 'OR'),
          explanation: group.explanation || null
        })
        .select('*')
        .single();

      if (groupError) {
        console.error(`Error saving ${ruleType} rule group:`, groupError);
        throw groupError;
      }

      const groupId = groupData.id;
      console.log(`Created rule group with ID ${groupId} for ${ruleType} rules`);

      if (group.inequalities && group.inequalities.length > 0) {
        console.log(`Saving ${group.inequalities.length} inequalities for group ${groupId}`);
        
        // Save each inequality sequentially
        for (let j = 0; j < group.inequalities.length; j++) {
          const inequality = group.inequalities[j];
          
          // Ensure we have all the required fields with proper default values
          const { data: ruleData, error: ruleError } = await supabase
            .from('trading_rules')
            .insert({
              rule_group_id: groupId,
              inequality_order: j + 1,
              left_type: inequality.left?.type || 'INDICATOR',
              left_indicator: inequality.left?.indicator || null,
              left_parameters: inequality.left?.parameters || null,
              left_value: inequality.left?.value || null,
              left_value_type: inequality.left?.valueType || null,
              condition: inequality.condition || '',
              right_type: inequality.right?.type || 'VALUE',
              right_indicator: inequality.right?.indicator || null,
              right_parameters: inequality.right?.parameters || null,
              right_value: inequality.right?.value || null,
              right_value_type: inequality.right?.valueType || null,
              explanation: inequality.explanation || null
            })
            .select('*')
            .single();
          
          if (ruleError) {
            console.error(`Error saving inequality ${j+1} for group ${groupId}:`, ruleError);
            console.error("Inequality data:", JSON.stringify(inequality));
            throw ruleError;
          }
          
          console.log(`Saved inequality ${j+1} with ID ${ruleData.id}`);
        }
      } else {
        console.warn(`No inequalities to save for group ${groupId}`);
      }
    }
  } catch (error) {
    console.error(`Error in saveRuleGroups (${ruleType}):`, error);
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

// Unified function to ensure consistent format between storage and retrieval
export const getTradingRulesForStrategy = async (strategyId: string) => {
  try {
    console.log("Fetching trading rules for strategy:", strategyId);
    
    // First, get all the rule groups for this strategy
    const { data: ruleGroups, error: ruleGroupsError } = await supabase
      .from('rule_groups')
      .select('*')
      .eq('strategy_id', strategyId)
      .order('group_order', { ascending: true });

    if (ruleGroupsError) {
      console.error("Error fetching rule groups:", ruleGroupsError);
      throw ruleGroupsError;
    }

    console.log("Fetched rule groups:", ruleGroups);
    
    if (!ruleGroups || ruleGroups.length === 0) {
      console.warn("No rule groups found for strategy:", strategyId);
      return { entryRules: [], exitRules: [] };
    }

    // Separate entry and exit rule groups
    const entryRuleGroups = ruleGroups.filter(group => group.rule_type === 'entry');
    const exitRuleGroups = ruleGroups.filter(group => group.rule_type === 'exit');
    
    console.log(`Found ${entryRuleGroups.length} entry rule groups and ${exitRuleGroups.length} exit rule groups`);

    // Process entry groups
    const entryRules = entryRuleGroups.length > 0 
      ? await Promise.all(entryRuleGroups.map(async (group) => {
          const { data: inequalities, error: inequalitiesError } = await supabase
            .from('trading_rules')
            .select('*')
            .eq('rule_group_id', group.id)
            .order('inequality_order', { ascending: true });

          if (inequalitiesError) {
            console.error("Error fetching inequalities for entry group:", inequalitiesError);
            throw inequalitiesError;
          }

          console.log(`Fetched ${inequalities?.length || 0} inequalities for entry group ${group.id}`);
          
          return {
            id: group.id,
            logic: group.logic || (entryRuleGroups.indexOf(group) === 0 ? 'AND' : 'OR'),
            requiredConditions: group.required_conditions || 1,
            explanation: group.explanation,
            inequalities: inequalities ? inequalities.map(formatInequality) : []
          };
        }))
      : [];

    // Process exit groups
    const exitRules = exitRuleGroups.length > 0
      ? await Promise.all(exitRuleGroups.map(async (group) => {
          const { data: inequalities, error: inequalitiesError } = await supabase
            .from('trading_rules')
            .select('*')
            .eq('rule_group_id', group.id)
            .order('inequality_order', { ascending: true });

          if (inequalitiesError) {
            console.error("Error fetching inequalities for exit group:", inequalitiesError);
            throw inequalitiesError;
          }
          
          console.log(`Fetched ${inequalities?.length || 0} inequalities for exit group ${group.id}`);

          return {
            id: group.id,
            logic: group.logic || (exitRuleGroups.indexOf(group) === 0 ? 'AND' : 'OR'),
            requiredConditions: group.required_conditions || 1,
            explanation: group.explanation,
            inequalities: inequalities ? inequalities.map(formatInequality) : []
          };
        }))
      : [];

    console.log("Final processed trading rules:", { 
      entryRules: entryRules.length, 
      exitRules: exitRules.length 
    });
    
    return { entryRules, exitRules };
  } catch (error) {
    console.error("Error in getTradingRulesForStrategy:", error);
    // Return empty arrays instead of throwing to prevent UI crashes
    return { entryRules: [], exitRules: [] };
  }
};

// Helper function to format inequality from database to UI format - updated for consistent format
const formatInequality = (inequality: any) => {
  return {
    id: inequality.id,
    left: {
      type: inequality.left_type || 'INDICATOR',
      indicator: inequality.left_indicator || '',
      parameters: inequality.left_parameters || {},
      value: inequality.left_value || '',
      valueType: inequality.left_value_type || 'number'
    },
    condition: inequality.condition || '',
    right: {
      type: inequality.right_type || 'VALUE',
      indicator: inequality.right_indicator || '',
      parameters: inequality.right_parameters || {},
      value: inequality.right_value || '',
      valueType: inequality.right_value_type || 'number'
    },
    explanation: inequality.explanation || ''
  };
};

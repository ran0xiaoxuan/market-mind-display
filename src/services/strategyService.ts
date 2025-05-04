
import { supabase } from "@/integrations/supabase/client";
import { RuleGroupData, Inequality, RuleGroup, TradingRule, IndicatorParameters } from "@/components/strategy-detail/types";

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
  stopLoss?: string;
  takeProfit?: string;
  singleBuyVolume?: string;
  maxBuyVolume?: string;
}

// Enhanced the GeneratedStrategy type to include explanations and requiredConditions
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
      userId: item.user_id,
      stopLoss: item.stop_loss,
      takeProfit: item.take_profit,
      singleBuyVolume: item.single_buy_volume,
      maxBuyVolume: item.max_buy_volume
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
      userId: data.user_id,
      stopLoss: data.stop_loss,
      takeProfit: data.take_profit,
      singleBuyVolume: data.single_buy_volume,
      maxBuyVolume: data.max_buy_volume
    };
  } catch (error) {
    console.error(`Failed to fetch strategy with ID: ${id}`, error);
    throw error;
  }
};

// Get risk management data for a strategy - directly from strategies table
export const getRiskManagementForStrategy = async (strategyId: string): Promise<RiskManagementData | null> => {
  console.log(`Fetching risk management data for strategy ID: ${strategyId}`);
  
  try {
    const { data, error } = await supabase
      .from('strategies')
      .select('stop_loss, take_profit, single_buy_volume, max_buy_volume')
      .eq('id', strategyId)
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
    
    // Return data directly from strategies table
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

// Updated to work with the new database schema
export const getTradingRulesForStrategy = async (strategyId: string): Promise<{ entryRules: RuleGroupData[], exitRules: RuleGroupData[] } | null> => {
  console.log(`Fetching trading rules for strategy ID: ${strategyId}`);
  
  try {
    // First fetch the rule groups for this strategy
    const { data: ruleGroupsData, error: ruleGroupsError } = await supabase
      .from('rule_groups')
      .select('*')
      .eq('strategy_id', strategyId)
      .order('group_order', { ascending: true });
      
    if (ruleGroupsError) {
      console.error("Error fetching rule groups:", ruleGroupsError);
      throw ruleGroupsError;
    }
    
    if (!ruleGroupsData || ruleGroupsData.length === 0) {
      console.log(`No trading rules found for strategy id: ${strategyId}`);
      return null;
    }
    
    // Now fetch all trading rules related to these rule groups
    const ruleGroupIds = ruleGroupsData.map(group => group.id);
    const { data: rulesData, error: rulesError } = await supabase
      .from('trading_rules')
      .select('*')
      .in('rule_group_id', ruleGroupIds)
      .order('inequality_order', { ascending: true });
      
    if (rulesError) {
      console.error("Error fetching trading rules:", rulesError);
      throw rulesError;
    }
    
    // Process the rules and organize them into entry and exit rule groups
    const entryRules: Map<number, RuleGroupData> = new Map();
    const exitRules: Map<number, RuleGroupData> = new Map();
    
    for (const group of ruleGroupsData) {
      const groupId = group.id;
      const groupOrder = group.group_order;
      const ruleType = group.rule_type;
      const targetMap = ruleType === 'entry' ? entryRules : exitRules;
      
      // Create rule group object
      targetMap.set(groupOrder, {
        id: groupOrder,
        logic: group.logic || 'AND',
        inequalities: [],
        // Add requiredConditions if this is an OR logic group
        ...(group.logic === 'OR' && group.required_conditions !== undefined && {
          requiredConditions: group.required_conditions
        }),
        // Default to 1 if not specified but it is an OR group
        ...(group.logic === 'OR' && group.required_conditions === undefined && {
          requiredConditions: 1
        })
      });
      
      // Find all rules for this group
      const groupRules = rulesData.filter(rule => rule.rule_group_id === groupId);
      
      // Sort rules by inequality_order
      groupRules.sort((a, b) => a.inequality_order - b.inequality_order);
      
      // Process each rule in the group
      for (const rule of groupRules) {
        const ruleGroupData = targetMap.get(groupOrder);
        
        if (ruleGroupData) {
          // Convert parameters from JSON to objects if needed
          const leftParams = rule.left_parameters 
            ? convertJsonToIndicatorParams(rule.left_parameters) 
            : undefined;
            
          const rightParams = rule.right_parameters 
            ? convertJsonToIndicatorParams(rule.right_parameters) 
            : undefined;
          
          // Create the inequality object
          const inequality: Inequality = {
            id: rule.inequality_order,
            left: {
              type: rule.left_type,
              indicator: rule.left_indicator,
              parameters: leftParams,
              value: rule.left_value,
              valueType: rule.left_value_type
            },
            condition: rule.condition,
            right: {
              type: rule.right_type,
              indicator: rule.right_indicator,
              parameters: rightParams,
              value: rule.right_value,
              valueType: rule.right_value_type
            },
            explanation: rule.explanation
          };
          
          // Add to the rules array
          ruleGroupData.inequalities.push(inequality);
        }
      }
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

// Add new function to delete a strategy and all related data
export const deleteStrategy = async (strategyId: string): Promise<void> => {
  console.log(`Deleting strategy with ID: ${strategyId}`);
  
  try {
    // First check if the strategy exists
    const { data: strategy, error: fetchError } = await supabase
      .from('strategies')
      .select('id')
      .eq('id', strategyId)
      .single();
      
    if (fetchError || !strategy) {
      console.error("Strategy not found or error fetching:", fetchError);
      throw new Error("Strategy not found");
    }

    // 1. Delete trading rules
    // First get all rule groups
    const { data: ruleGroups } = await supabase
      .from('rule_groups')
      .select('id')
      .eq('strategy_id', strategyId);
      
    if (ruleGroups && ruleGroups.length > 0) {
      const ruleGroupIds = ruleGroups.map(group => group.id);
      
      // Delete trading rules for these rule groups
      const { error: tradingRulesError } = await supabase
        .from('trading_rules')
        .delete()
        .in('rule_group_id', ruleGroupIds);
        
      if (tradingRulesError) {
        console.error("Error deleting trading rules:", tradingRulesError);
        throw tradingRulesError;
      }
      
      // Delete the rule groups
      const { error: ruleGroupsError } = await supabase
        .from('rule_groups')
        .delete()
        .eq('strategy_id', strategyId);
        
      if (ruleGroupsError) {
        console.error("Error deleting rule groups:", ruleGroupsError);
        throw ruleGroupsError;
      }
    }
    
    // 2. Get all backtests for this strategy to delete related backtest trades
    const { data: backtests } = await supabase
      .from('backtests')
      .select('id')
      .eq('strategy_id', strategyId);
      
    // 3. Delete backtest trades for each backtest
    if (backtests && backtests.length > 0) {
      for (const backtest of backtests) {
        const { error: tradeError } = await supabase
          .from('backtest_trades')
          .delete()
          .eq('backtest_id', backtest.id);
          
        if (tradeError) {
          console.error(`Error deleting backtest trades for backtest ${backtest.id}:`, tradeError);
          throw tradeError;
        }
      }
      
      // 4. Delete the backtests themselves
      const { error: backtestError } = await supabase
        .from('backtests')
        .delete()
        .eq('strategy_id', strategyId);
        
      if (backtestError) {
        console.error("Error deleting backtests:", backtestError);
        throw backtestError;
      }
    }
    
    // 5. Delete strategy versions
    const { error: versionError } = await supabase
      .from('strategy_versions')
      .delete()
      .eq('strategy_id', strategyId);
      
    if (versionError) {
      console.error("Error deleting strategy versions:", versionError);
      throw versionError;
    }
    
    // 6. Finally delete the strategy itself
    const { error: strategyError } = await supabase
      .from('strategies')
      .delete()
      .eq('id', strategyId);
      
    if (strategyError) {
      console.error("Error deleting strategy:", strategyError);
      throw strategyError;
    }
    
    console.log("Strategy and all associated data successfully deleted");
    
    // Dispatch a custom event that listeners can use to refresh their data
    window.dispatchEvent(new CustomEvent('strategy-deleted', { 
      detail: { strategyId } 
    }));
  } catch (error) {
    console.error("Error in deleteStrategy:", error);
    throw error;
  }
};

// Helper function to convert JSON to IndicatorParameters type
function convertJsonToIndicatorParams(jsonParams: any): IndicatorParameters {
  if (typeof jsonParams === 'string') {
    try {
      jsonParams = JSON.parse(jsonParams);
    } catch (e) {
      console.error("Error parsing parameter string:", e);
      return {};
    }
  }
  
  // Extract only the properties we need for IndicatorParameters
  const result: IndicatorParameters = {};
  
  // Map all properties from jsonParams to result
  Object.entries(jsonParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      result[key] = String(value);
    }
  });
  
  return result;
}

// Generate a strategy using AI
export const generateStrategy = async (
  assetType: "stocks" | "cryptocurrency", 
  selectedAsset: string, 
  strategyDescription: string
): Promise<GeneratedStrategy> => {
  console.log("Generating strategy with AI service...", { assetType, selectedAsset, strategyDescription });
  
  try {
    console.time("strategy-generation");
    
    // Add a local timeout to prevent hanging requests
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Request timed out after 20 seconds")), 20000);
    });

    // Call the Supabase Edge Function to generate strategy using Bailian AI
    const functionCallPromise = supabase.functions.invoke('generate-strategy', {
      body: { 
        assetType, 
        selectedAsset, 
        strategyDescription 
      }
    });
    
    // Race between the function call and timeout
    const { data, error } = await Promise.race([functionCallPromise, timeoutPromise]) as any;
    
    console.timeEnd("strategy-generation");
    
    if (error) {
      console.error("Error calling generate-strategy function:", error);
      
      // Enhanced error categorization for better analytics and user feedback
      let errorCode = "UNKNOWN_ERROR";
      let errorMessage = error.message || "An unknown error occurred";
      
      if (errorMessage.includes("timed out") || errorMessage === "Request timed out after 20 seconds") {
        errorCode = "TIMEOUT_ERROR";
        errorMessage = "The request timed out. Please try again with a shorter description.";
      } else if (errorMessage.includes("rate limit")) {
        errorCode = "RATE_LIMIT_ERROR";
        errorMessage = "AI service is currently busy. Please try again in a few minutes.";
      } else if (error.status === 401 || error.status === 403 || errorMessage.includes("authentication")) {
        errorCode = "AUTH_ERROR";
        errorMessage = "AI service authentication issue. Please contact support.";
      } else if (errorMessage.includes("Failed to send") || errorMessage.includes("Failed to fetch")) {
        errorCode = "CONNECTION_ERROR";
        errorMessage = "Failed to connect to the AI service. Please check your internet connection and try again.";
      }
      
      // Log detailed error for monitoring with the error code
      console.error(`Strategy generation failed [${errorCode}]:`, error);
      
      throw new Error(`Failed to generate strategy: ${errorMessage}`);
    }
    
    if (!data) {
      console.error("No data returned from strategy generation service");
      throw new Error("No data returned from strategy generation service");
    }
    
    // Check if data has the expected structure
    if (!data.name || !data.market || !data.timeframe) {
      console.error("Incomplete data structure returned:", data);
      throw new Error("Invalid strategy format returned from service");
    }
    
    console.log("Strategy generated successfully:", data);
    
    // Ensure data has the required structure
    const strategy: GeneratedStrategy = {
      name: data.name || `${selectedAsset} Trading Strategy`,
      description: data.description || strategyDescription,
      market: data.market || (assetType === "stocks" ? "Equities" : "Crypto"),
      timeframe: data.timeframe || "Daily",
      targetAsset: data.targetAsset || selectedAsset,
      entryRules: ensureRuleGroups(data.entryRules),
      exitRules: ensureRuleGroups(data.exitRules),
      riskManagement: {
        stopLoss: data.riskManagement?.stopLoss || "5",
        takeProfit: data.riskManagement?.takeProfit || "15",
        singleBuyVolume: data.riskManagement?.singleBuyVolume || "2000",
        maxBuyVolume: data.riskManagement?.maxBuyVolume || "10000"
      }
    };
    
    return strategy;
  } catch (error) {
    console.error("Error generating strategy:", error);
    
    // Check if we can retry automatically for specific errors
    const errorMsg = error.message || "";
    if ((errorMsg.includes("timed out") || errorMsg.includes("CONNECTION_ERROR") || errorMsg.includes("Failed to fetch")) && !errorMsg.includes("after multiple attempts")) {
      console.warn("Attempting to retry strategy generation due to connection issue");
      try {
        // Wait a moment before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate a fallback strategy instead of retrying to improve user experience
        return generateFallbackStrategy(assetType, selectedAsset, strategyDescription);
      } catch (retryError) {
        console.error("Retry also failed:", retryError);
      }
    }
    
    // Provide fallback mock data if the API call fails - with clear notification this is a fallback
    console.warn("Using fallback strategy data due to error:", error);
    
    return generateFallbackStrategy(assetType, selectedAsset, strategyDescription);
  }
};

// Helper function to ensure rule groups are properly formatted
function ensureRuleGroups(rules: any[]): RuleGroupData[] {
  if (!rules || !Array.isArray(rules) || rules.length === 0) {
    // Create default rule groups if none provided
    return [
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
            condition: "Crosses Above",
            right: {
              type: "indicator",
              indicator: "SMA",
              parameters: { period: "50" }
            },
            explanation: "When a faster moving average crosses above a slower one, it indicates a potential uptrend beginning."
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
            condition: "Less Than",
            right: {
              type: "value",
              value: "30"
            },
            explanation: "RSI below 30 indicates an oversold condition, suggesting a potential buying opportunity."
          }
        ]
      }
    ];
  }
  
  // Ensure each rule group has required fields
  return rules.map((group, index) => {
    return {
      id: group.id || index + 1,
      logic: group.logic || "AND",
      requiredConditions: group.logic === "OR" ? (group.requiredConditions || 1) : undefined,
      inequalities: Array.isArray(group.inequalities) ? group.inequalities.map((ineq, i) => ({
        id: ineq.id || i + 1,
        left: {
          type: ineq.left?.type || "indicator",
          indicator: ineq.left?.indicator,
          parameters: ineq.left?.parameters,
          value: ineq.left?.value
        },
        condition: ineq.condition || "Crosses Above",
        right: {
          type: ineq.right?.type || "value",
          indicator: ineq.right?.indicator,
          parameters: ineq.right?.parameters,
          value: ineq.right?.value || "0"
        },
        explanation: ineq.explanation || ""
      })) : []
    };
  });
}

// Generate a fallback strategy when AI service fails
function generateFallbackStrategy(assetType: "stocks" | "cryptocurrency", selectedAsset: string, strategyDescription: string): GeneratedStrategy {
  console.log("Generating fallback strategy", { assetType, selectedAsset, strategyDescription });
  
  const isCrypto = assetType === "cryptocurrency";
  
  // Create a more descriptive fallback strategy name to clearly indicate it's a fallback
  const strategyName = `${selectedAsset} ${isCrypto ? "Cryptocurrency" : "Stock"} Strategy [AI Unavailable]`;
  
  // Make the fallback strategy more specific based on input
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
        },
        explanation: "When a faster moving average crosses above a slower one, it indicates a potential uptrend beginning."
      }
    ]
  };

  // Try to parse the strategy description for keywords to make the fallback more relevant
  let rsiThreshold = isCrypto ? "35" : "30";
  let useMACD = false;
  let useBollingerBands = false;
  
  // Simple keyword matching to customize the fallback strategy
  if (strategyDescription) {
    const lowerDesc = strategyDescription.toLowerCase();
    if (lowerDesc.includes("rsi")) {
      // Strategy specifically mentioned RSI
      if (lowerDesc.includes("rsi") && lowerDesc.match(/\brsi\D*(\d+)/)) {
        const match = lowerDesc.match(/\brsi\D*(\d+)/);
        if (match && match[1]) {
          const value = parseInt(match[1]);
          if (value > 0 && value < 50) {
            rsiThreshold = match[1];
          }
        }
      }
    }
    
    // Check for other indicators
    useMACD = lowerDesc.includes("macd");
    useBollingerBands = lowerDesc.includes("bollinger");
  }

  // Add more suitable indicators based on asset type and user description
  const orGroup: RuleGroupData = {
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
        condition: "Less Than",
        right: {
          type: "value",
          value: rsiThreshold
        },
        explanation: `RSI below ${rsiThreshold} indicates an oversold condition, suggesting a potential buying opportunity.`
      }
    ]
  };
  
  // Add MACD if mentioned or for crypto
  if (useMACD || isCrypto) {
    orGroup.inequalities.push({
      id: orGroup.inequalities.length + 1,
      left: {
        type: "indicator",
        indicator: "MACD",
        parameters: { fast: "12", slow: "26", signal: "9" }
      },
      condition: "Crosses Above",
      right: {
        type: "value",
        value: "0"
      },
      explanation: "MACD crossing above zero indicates a potential shift in momentum to the upside."
    });
  }
  
  // Add Bollinger Bands if mentioned
  if (useBollingerBands) {
    orGroup.inequalities.push({
      id: orGroup.inequalities.length + 1,
      left: {
        type: "price",
        value: "Close"
      },
      condition: "Less Than",
      right: {
        type: "indicator",
        indicator: "Bollinger Bands",
        parameters: { period: "20", stdDev: "2" }
      },
      explanation: "Price touching the lower Bollinger Band may indicate an oversold condition and potential reversal point."
    });
  }

  // Custom risk parameters based on asset type
  const riskParams = {
    stopLoss: isCrypto ? "8" : "5", // Wider stop for crypto
    takeProfit: isCrypto ? "20" : "15", // Higher target for crypto
    singleBuyVolume: "2000",
    maxBuyVolume: "10000"
  };

  return {
    name: strategyName,
    description: `A basic ${isCrypto ? "cryptocurrency" : "stock"} trading strategy for ${selectedAsset} based on ${useMACD ? "MACD, " : ""}${useBollingerBands ? "Bollinger Bands, " : ""}moving averages and oscillator indicators. (Fallback template - AI service currently unavailable)`,
    market: isCrypto ? "Cryptocurrency" : "Equities",
    timeframe: "Daily",
    targetAsset: selectedAsset,
    entryRules: [andGroup, orGroup],
    exitRules: [
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
            },
            explanation: "When a faster moving average crosses below a slower one, it indicates a potential downtrend beginning."
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
              value: isCrypto ? "75" : "70"
            },
            explanation: `RSI above ${isCrypto ? "75" : "70"} indicates an overbought condition, suggesting it's time to take profits.`
          },
          {
            id: 2,
            left: {
              type: "price",
              value: "Close"
            },
            condition: "Less Than",
            right: {
              type: "value",
              value: "Stop Loss"
            },
            explanation: "Exit position if price closes below the stop loss threshold to manage risk."
          }
        ]
      }
    ],
    riskManagement: riskParams
  };
}

// Save a generated strategy to the database - updated for the new schema
export const saveGeneratedStrategy = async (strategy: GeneratedStrategy): Promise<string> => {
  console.log("Saving generated strategy:", strategy);
  
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("No authenticated user found");
    }
    
    // Save the strategy with risk management data directly in the strategies table
    const { data: strategyData, error: strategyError } = await supabase
      .from('strategies')
      .insert({
        name: strategy.name,
        description: strategy.description,
        market: strategy.market,
        timeframe: strategy.timeframe,
        target_asset: strategy.targetAsset,
        is_active: true,
        user_id: user.id,
        stop_loss: strategy.riskManagement.stopLoss,
        take_profit: strategy.riskManagement.takeProfit,
        single_buy_volume: strategy.riskManagement.singleBuyVolume,
        max_buy_volume: strategy.riskManagement.maxBuyVolume
      })
      .select()
      .single();
      
    if (strategyError) {
      console.error("Error saving strategy:", strategyError);
      throw strategyError;
    }
    
    // Save entry rules - first create rule groups, then individual rules
    if (strategy.entryRules && strategy.entryRules.length > 0) {
      for (let groupIndex = 0; groupIndex < strategy.entryRules.length; groupIndex++) {
        const group = strategy.entryRules[groupIndex];
        
        // Create the rule group first
        const { data: ruleGroupData, error: ruleGroupError } = await supabase
          .from('rule_groups')
          .insert({
            strategy_id: strategyData.id,
            rule_type: 'entry',
            group_order: groupIndex + 1,
            logic: group.logic,
            required_conditions: group.logic === 'OR' ? group.requiredConditions : null,
            explanation: null // Could add group level explanation in the future
          })
          .select()
          .single();
        
        if (ruleGroupError) {
          console.error("Error creating entry rule group:", ruleGroupError);
          continue;
        }
        
        // Now create each trading rule in this group
        for (let i = 0; i < group.inequalities.length; i++) {
          const inequality = group.inequalities[i];
          
          const { error: ruleError } = await supabase
            .from('trading_rules')
            .insert({
              rule_group_id: ruleGroupData.id,
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
            
          if (ruleError) {
            console.error("Error saving entry rule:", ruleError);
            // Continue with other rules
          }
        }
      }
    }
    
    // Save exit rules - similar process as entry rules
    if (strategy.exitRules && strategy.exitRules.length > 0) {
      for (let groupIndex = 0; groupIndex < strategy.exitRules.length; groupIndex++) {
        const group = strategy.exitRules[groupIndex];
        
        // Create the rule group first
        const { data: ruleGroupData, error: ruleGroupError } = await supabase
          .from('rule_groups')
          .insert({
            strategy_id: strategyData.id,
            rule_type: 'exit',
            group_order: groupIndex + 1,
            logic: group.logic,
            required_conditions: group.logic === 'OR' ? group.requiredConditions : null,
            explanation: null // Could add group level explanation in the future
          })
          .select()
          .single();
        
        if (ruleGroupError) {
          console.error("Error creating exit rule group:", ruleGroupError);
          continue;
        }
        
        // Now create each trading rule in this group
        for (let i = 0; i < group.inequalities.length; i++) {
          const inequality = group.inequalities[i];
          
          const { error: ruleError } = await supabase
            .from('trading_rules')
            .insert({
              rule_group_id: ruleGroupData.id,
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

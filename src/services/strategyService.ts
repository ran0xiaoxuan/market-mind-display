
// Re-implement this file based on what's publicly available in the imports
import { supabase } from "@/integrations/supabase/client";

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
  entryRules: {
    description: string;
    conditions: string[];
  };
  exitRules: {
    description: string;
    conditions: string[];
  };
  riskManagement: {
    stopLoss?: string;
    takeProfit?: string;
    positionSizing?: string;
    riskPerTrade?: string;
  };
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
    return {
      name: `${selectedAsset || assetType} Trading Strategy`,
      description: strategyDescription,
      market: assetType === "stocks" ? "Equities" : "Crypto",
      timeframe: "Daily",
      targetAsset: selectedAsset || undefined,
      entryRules: {
        description: "Entry rules based on technical indicators",
        conditions: [
          "Price crosses above 20-day moving average",
          "RSI is below 70",
          "Volume is above 5-day average volume"
        ]
      },
      exitRules: {
        description: "Exit rules to secure profits and limit losses",
        conditions: [
          "Price crosses below 10-day moving average",
          "RSI crosses above 80",
          "Take profit at 15% gain",
          "Stop loss at 5% loss"
        ]
      },
      riskManagement: {
        stopLoss: "5% below entry price",
        takeProfit: "15% above entry price",
        positionSizing: "2% of portfolio per trade",
        riskPerTrade: "1% maximum risk per trade"
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
    // First, save the basic strategy information
    const { data: strategyData, error: strategyError } = await supabase
      .from('strategies')
      .insert({
        name: strategy.name,
        description: strategy.description,
        market: strategy.market,
        timeframe: strategy.timeframe,
        target_asset: strategy.targetAsset,
        is_active: true
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
          single_buy_volume: strategy.riskManagement.positionSizing,
          max_buy_volume: strategy.riskManagement.riskPerTrade
        });
        
      if (riskError) {
        console.error("Error saving risk management:", riskError);
        // We don't throw here, we can still continue with partial save
      }
    }
    
    // Save entry rules
    if (strategy.entryRules && strategy.entryRules.conditions) {
      for (let i = 0; i < strategy.entryRules.conditions.length; i++) {
        const { error: ruleError } = await supabase
          .from('trading_rules')
          .insert({
            strategy_id: strategyData.id,
            rule_group: i + 1,
            rule_type: 'entry',
            left_type: 'condition',
            condition: 'equals',
            right_type: 'value',
            right_value: strategy.entryRules.conditions[i],
            logic: i === 0 ? 'initial' : 'and'
          });
          
        if (ruleError) {
          console.error("Error saving entry rule:", ruleError);
          // Continue with other rules
        }
      }
    }
    
    // Save exit rules
    if (strategy.exitRules && strategy.exitRules.conditions) {
      for (let i = 0; i < strategy.exitRules.conditions.length; i++) {
        const { error: ruleError } = await supabase
          .from('trading_rules')
          .insert({
            strategy_id: strategyData.id,
            rule_group: i + 1,
            rule_type: 'exit',
            left_type: 'condition',
            condition: 'equals',
            right_type: 'value',
            right_value: strategy.exitRules.conditions[i],
            logic: i === 0 ? 'initial' : 'and'
          });
          
        if (ruleError) {
          console.error("Error saving exit rule:", ruleError);
          // Continue with other rules
        }
      }
    }
    
    return strategyData.id;
  } catch (error) {
    console.error("Failed to save strategy:", error);
    throw new Error("Failed to save strategy. Please try again.");
  }
};


import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface IndicatorParameters {
  period?: string;
  fast?: string;
  slow?: string;
  signal?: string;
}

export interface InequalitySide {
  type: string;
  indicator?: string;
  parameters?: IndicatorParameters;
  value?: string;
  valueType?: string;
}

export interface Inequality {
  id: number;
  left: InequalitySide;
  condition: string;
  right: InequalitySide;
}

export interface RuleGroup {
  id: number;
  logic: string;
  inequalities: Inequality[];
  requiredConditions?: number;
}

export interface RiskManagement {
  stopLoss: string;
  takeProfit: string;
  singleBuyVolume: string;
  maxBuyVolume: string;
}

export interface Strategy {
  id?: string;
  name: string;
  description?: string;
  market: string;
  timeframe: string;
  targetAsset?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

export interface GeneratedStrategy {
  name: string;
  description: string;
  market: string;
  timeframe: string;
  targetAsset: string;
  riskManagement: RiskManagement;
  entryRules: RuleGroup[];
  exitRules: RuleGroup[];
}

export const generateStrategy = async (
  assetType: "stocks" | "cryptocurrency",
  selectedAsset: string,
  strategyDescription: string
): Promise<GeneratedStrategy> => {
  try {
    const response = await fetch("/api/generate-strategy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabase.auth.getSession()}`
      },
      body: JSON.stringify({
        assetType,
        selectedAsset,
        strategyDescription
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate strategy");
    }

    return await response.json();
  } catch (error) {
    console.error("Error generating strategy:", error);
    toast.error("Failed to generate strategy");
    throw error;
  }
};

export const saveGeneratedStrategy = async (
  generatedStrategy: GeneratedStrategy
): Promise<string> => {
  try {
    // Get the current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("User not authenticated");
    }
    const userId = session.user.id;

    // 1. Insert the strategy
    const { data: strategyData, error: strategyError } = await supabase
      .from("strategies")
      .insert({
        name: generatedStrategy.name,
        description: generatedStrategy.description,
        market: generatedStrategy.market,
        timeframe: generatedStrategy.timeframe,
        target_asset: generatedStrategy.targetAsset,
        is_active: true,
        user_id: userId  // Add user_id to fix the first error
      })
      .select()
      .single();

    if (strategyError) throw strategyError;
    if (!strategyData) throw new Error("Failed to create strategy");

    const strategyId = strategyData.id;

    // 2. Insert risk management
    const { error: riskError } = await supabase
      .from("risk_management")
      .insert({
        strategy_id: strategyId,
        stop_loss: generatedStrategy.riskManagement.stopLoss,
        take_profit: generatedStrategy.riskManagement.takeProfit,
        single_buy_volume: generatedStrategy.riskManagement.singleBuyVolume,
        max_buy_volume: generatedStrategy.riskManagement.maxBuyVolume
      });

    if (riskError) throw riskError;

    // 3. Insert entry rules
    for (const ruleGroup of generatedStrategy.entryRules) {
      for (const inequality of ruleGroup.inequalities) {
        const { error: ruleError } = await supabase
          .from("trading_rules")
          .insert({
            strategy_id: strategyId,
            rule_type: "entry",
            rule_group: ruleGroup.id,
            logic: ruleGroup.logic,
            left_type: inequality.left.type,
            left_indicator: inequality.left.indicator,
            left_parameters: inequality.left.parameters as any,
            condition: inequality.condition,
            right_type: inequality.right.type,
            right_indicator: inequality.right.indicator,
            right_parameters: inequality.right.parameters as any,
            right_value: inequality.right.value
          });

        if (ruleError) throw ruleError;
      }
    }

    // 4. Insert exit rules
    for (const ruleGroup of generatedStrategy.exitRules) {
      for (const inequality of ruleGroup.inequalities) {
        const { error: ruleError } = await supabase
          .from("trading_rules")
          .insert({
            strategy_id: strategyId,
            rule_type: "exit",
            rule_group: ruleGroup.id,
            logic: ruleGroup.logic,
            left_type: inequality.left.type,
            left_indicator: inequality.left.indicator,
            left_parameters: inequality.left.parameters as any,
            condition: inequality.condition,
            right_type: inequality.right.type,
            right_indicator: inequality.right.indicator,
            right_parameters: inequality.right.parameters as any,
            right_value: inequality.right.value
          });

        if (ruleError) throw ruleError;
      }
    }

    // 5. Create an initial version
    const { error: versionError } = await supabase
      .from("strategy_versions")
      .insert({
        strategy_id: strategyId,
        version_number: 1,
        changes: "Initial strategy generated by AI",
        user_id: userId  // Add user_id to fix the version error
      });

    if (versionError) throw versionError;

    return strategyId;
  } catch (error) {
    console.error("Error saving generated strategy:", error);
    toast.error("Failed to save strategy");
    throw error;
  }
};

export const getStrategies = async (): Promise<Strategy[]> => {
  try {
    const { data, error } = await supabase
      .from("strategies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error fetching strategies:", error);
    toast.error("Failed to load strategies");
    return [];
  }
};

export const getStrategy = async (strategyId: string): Promise<{
  strategy: Strategy;
  riskManagement: RiskManagement;
  entryRules: RuleGroup[];
  exitRules: RuleGroup[];
} | null> => {
  try {
    // Fetch strategy
    const { data: strategyData, error: strategyError } = await supabase
      .from("strategies")
      .select("*")
      .eq("id", strategyId)
      .single();

    if (strategyError) throw strategyError;
    if (!strategyData) return null;

    // Fetch risk management
    const { data: riskData, error: riskError } = await supabase
      .from("risk_management")
      .select("*")
      .eq("strategy_id", strategyId)
      .single();

    if (riskError && riskError.code !== "PGRST116") throw riskError; // PGRST116 is "no rows returned" error

    // Fetch trading rules
    const { data: rulesData, error: rulesError } = await supabase
      .from("trading_rules")
      .select("*")
      .eq("strategy_id", strategyId)
      .order("rule_group", { ascending: true });

    if (rulesError) throw rulesError;

    // Process entry rules
    const entryRules: RuleGroup[] = [];
    const exitRules: RuleGroup[] = [];

    // Group rules by rule_type and rule_group
    const entryRulesMap = new Map<number, { logic: string, inequalities: Inequality[] }>();
    const exitRulesMap = new Map<number, { logic: string, inequalities: Inequality[] }>();

    for (const rule of rulesData) {
      const inequality: Inequality = {
        id: parseInt(rule.id), // Convert string id to number
        left: {
          type: rule.left_type,
          indicator: rule.left_indicator,
          parameters: rule.left_parameters as unknown as IndicatorParameters, // Properly cast parameters
          value: rule.left_value // This field may not exist in the DB
        },
        condition: rule.condition,
        right: {
          type: rule.right_type,
          indicator: rule.right_indicator,
          parameters: rule.right_parameters as unknown as IndicatorParameters, // Properly cast parameters
          value: rule.right_value
        }
      };

      if (rule.rule_type === "entry") {
        if (!entryRulesMap.has(rule.rule_group)) {
          entryRulesMap.set(rule.rule_group, { 
            logic: rule.logic, 
            inequalities: []
          });
        }
        entryRulesMap.get(rule.rule_group)?.inequalities.push(inequality);
      } else if (rule.rule_type === "exit") {
        if (!exitRulesMap.has(rule.rule_group)) {
          exitRulesMap.set(rule.rule_group, { 
            logic: rule.logic, 
            inequalities: []
          });
        }
        exitRulesMap.get(rule.rule_group)?.inequalities.push(inequality);
      }
    }

    // Convert maps to arrays
    entryRulesMap.forEach((value, key) => {
      entryRules.push({
        id: key,
        logic: value.logic,
        inequalities: value.inequalities,
        requiredConditions: value.logic === "OR" ? 1 : undefined
      });
    });

    exitRulesMap.forEach((value, key) => {
      exitRules.push({
        id: key,
        logic: value.logic,
        inequalities: value.inequalities,
        requiredConditions: value.logic === "OR" ? 1 : undefined
      });
    });

    return {
      strategy: {
        id: strategyData.id,
        name: strategyData.name,
        description: strategyData.description,
        market: strategyData.market,
        timeframe: strategyData.timeframe,
        targetAsset: strategyData.target_asset,
        isActive: strategyData.is_active,
        createdAt: strategyData.created_at,
        updatedAt: strategyData.updated_at,
      },
      riskManagement: riskData ? {
        stopLoss: riskData.stop_loss,
        takeProfit: riskData.take_profit,
        singleBuyVolume: riskData.single_buy_volume,
        maxBuyVolume: riskData.max_buy_volume
      } : {
        stopLoss: "0",
        takeProfit: "0",
        singleBuyVolume: "0",
        maxBuyVolume: "0"
      },
      entryRules,
      exitRules
    };
  } catch (error) {
    console.error("Error fetching strategy:", error);
    toast.error("Failed to load strategy");
    return null;
  }
};

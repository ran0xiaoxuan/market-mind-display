
import { supabase } from "@/integrations/supabase/client";
import { RuleGroupData, Inequality } from "@/components/strategy-detail/types";

// Define the Strategy type here since it's not in the types file
export type Strategy = {
  id: string;
  name: string;
  description?: string;
  timeframe: string;
  targetAsset?: string;
  targetAssetName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  canBeDeleted?: boolean;
  dailySignalLimit?: number;
  signalNotificationsEnabled?: boolean;
  isRecommendedCopy?: boolean;
  sourceStrategyId?: string;
};

// Define GeneratedStrategy type
export type GeneratedStrategy = {
  name: string;
  description: string;
  timeframe: string;
  targetAsset?: string;
  entryRules: {
    logic: 'AND' | 'OR';
    requiredConditions?: number;
    inequalities: Inequality[];
  }[];
  exitRules: {
    logic: 'AND' | 'OR';
    requiredConditions?: number;
    inequalities: Inequality[];
  }[];
};

export const getStrategies = async (): Promise<Strategy[]> => {
  try {
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching strategies:", error);
      return [];
    }

    return data?.map(strategy => ({
      id: strategy.id,
      name: strategy.name,
      description: strategy.description,
      timeframe: strategy.timeframe,
      targetAsset: strategy.target_asset,
      targetAssetName: strategy.target_asset_name,
      isActive: strategy.is_active,
      createdAt: strategy.created_at,
      updatedAt: strategy.updated_at,
      userId: strategy.user_id,
      canBeDeleted: strategy.can_be_deleted,
      dailySignalLimit: strategy.daily_signal_limit,
      signalNotificationsEnabled: strategy.signal_notifications_enabled,
      isRecommendedCopy: strategy.is_recommended_copy,
      sourceStrategyId: strategy.source_strategy_id,
    })) || [];
  } catch (error) {
    console.error("Failed to fetch strategies:", error);
    return [];
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
      console.error("Error fetching strategy by ID:", error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      timeframe: data.timeframe,
      targetAsset: data.target_asset,
      targetAssetName: data.target_asset_name,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      userId: data.user_id,
      canBeDeleted: data.can_be_deleted,
      dailySignalLimit: data.daily_signal_limit,
      signalNotificationsEnabled: data.signal_notifications_enabled,
      isRecommendedCopy: data.is_recommended_copy,
      sourceStrategyId: data.source_strategy_id,
    };
  } catch (error) {
    console.error("Failed to fetch strategy by ID:", error);
    return null;
  }
};

export const getTradingRulesForStrategy = async (strategyId: string) => {
  try {
    console.log(`Fetching trading rules for strategy: ${strategyId}`);
    
    // Get rule groups with their trading rules
    const { data: ruleGroups, error } = await supabase
      .from('rule_groups')
      .select(`
        *,
        trading_rules (*)
      `)
      .eq('strategy_id', strategyId)
      .order('group_order');

    if (error) {
      console.error('Error fetching rule groups:', error);
      throw error;
    }

    if (!ruleGroups || ruleGroups.length === 0) {
      console.log('No rule groups found for strategy');
      return null;
    }

    console.log('Raw rule groups from database:', JSON.stringify(ruleGroups, null, 2));

    // Separate entry and exit rules
    const entryGroups = ruleGroups.filter(group => group.rule_type === 'entry');
    const exitGroups = ruleGroups.filter(group => group.rule_type === 'exit');

    // Transform rule groups to match our RuleGroupData interface
    const transformRuleGroup = (group: any): RuleGroupData => {
      const inequalities = (group.trading_rules || [])
        .sort((a: any, b: any) => a.inequality_order - b.inequality_order)
        .map((rule: any) => {
          console.log(`Transforming rule:`, rule);
          
          const inequality: Inequality = {
            id: rule.id,
            left: {
              type: rule.left_type,
              indicator: rule.left_type === 'INDICATOR' ? rule.left_indicator : undefined,
              parameters: rule.left_type === 'INDICATOR' ? (rule.left_parameters || {}) : undefined,
              value: (rule.left_type === 'PRICE' || rule.left_type === 'VALUE') ? rule.left_value : undefined,
              valueType: rule.left_type === 'INDICATOR' ? rule.left_value_type : undefined
            },
            condition: rule.condition,
            right: {
              type: rule.right_type,
              indicator: rule.right_type === 'INDICATOR' ? rule.right_indicator : undefined,
              parameters: rule.right_type === 'INDICATOR' ? (rule.right_parameters || {}) : undefined,
              value: (rule.right_type === 'PRICE' || rule.right_type === 'VALUE') ? rule.right_value : undefined,
              valueType: rule.right_type === 'INDICATOR' ? rule.right_value_type : undefined
            },
            explanation: rule.explanation
          };
          
          console.log(`Transformed inequality:`, inequality);
          return inequality;
        });

      return {
        id: group.id,
        logic: group.logic as 'AND' | 'OR',
        inequalities,
        requiredConditions: group.required_conditions || 1
      };
    };

    const entryRules = entryGroups.map(transformRuleGroup);
    const exitRules = exitGroups.map(transformRuleGroup);

    console.log('Transformed entry rules:', JSON.stringify(entryRules, null, 2));
    console.log('Transformed exit rules:', JSON.stringify(exitRules, null, 2));

    return {
      entryRules,
      exitRules
    };

  } catch (error) {
    console.error('Error in getTradingRulesForStrategy:', error);
    throw error;
  }
};

export const deleteStrategy = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('strategies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting strategy:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to delete strategy:", error);
    return false;
  }
};

// AI Strategy functions
export const generateStrategy = async (
  assetType: string,
  asset: string,
  description: string
): Promise<GeneratedStrategy> => {
  try {
    const response = await supabase.functions.invoke('generate-strategy', {
      body: { assetType, asset, description }
    });

    if (response.error) {
      throw new ServiceError(response.error.message || 'Failed to generate strategy', 'api_error');
    }

    return response.data;
  } catch (error: any) {
    console.error('Error generating strategy:', error);
    throw new ServiceError(error.message || 'Failed to generate strategy', 'unknown_error');
  }
};

export const saveGeneratedStrategy = async (
  strategy: GeneratedStrategy,
  userId: string
): Promise<string> => {
  try {
    // Insert the strategy
    const { data: strategyData, error: strategyError } = await supabase
      .from('strategies')
      .insert({
        name: strategy.name,
        description: strategy.description,
        timeframe: strategy.timeframe,
        target_asset: strategy.targetAsset,
        user_id: userId,
        is_active: true
      })
      .select()
      .single();

    if (strategyError) {
      throw new Error(`Failed to save strategy: ${strategyError.message}`);
    }

    const strategyId = strategyData.id;

    // Save entry rules
    await saveRuleGroups(strategyId, strategy.entryRules, 'entry');
    
    // Save exit rules
    await saveRuleGroups(strategyId, strategy.exitRules, 'exit');

    return strategyId;
  } catch (error: any) {
    console.error('Error saving generated strategy:', error);
    throw error;
  }
};

const saveRuleGroups = async (
  strategyId: string,
  ruleGroups: GeneratedStrategy['entryRules'],
  ruleType: 'entry' | 'exit'
) => {
  for (let i = 0; i < ruleGroups.length; i++) {
    const group = ruleGroups[i];
    
    // Insert rule group
    const { data: groupData, error: groupError } = await supabase
      .from('rule_groups')
      .insert({
        strategy_id: strategyId,
        rule_type: ruleType,
        group_order: i,
        logic: group.logic,
        required_conditions: group.requiredConditions || 1
      })
      .select()
      .single();

    if (groupError) {
      throw new Error(`Failed to save rule group: ${groupError.message}`);
    }

    // Insert trading rules for this group
    for (let j = 0; j < group.inequalities.length; j++) {
      const inequality = group.inequalities[j];
      
      const { error: ruleError } = await supabase
        .from('trading_rules')
        .insert({
          rule_group_id: groupData.id,
          inequality_order: j,
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
        throw new Error(`Failed to save trading rule: ${ruleError.message}`);
      }
    }
  }
};

export const checkAIServiceHealth = async () => {
  try {
    const response = await supabase.functions.invoke('generate-strategy', {
      body: { healthCheck: true }
    });
    
    return { healthy: !response.error, details: response.data };
  } catch (error) {
    return { healthy: false, error: 'Health check failed' };
  }
};

export const generateFallbackStrategy = (
  assetType: string,
  asset: string,
  description: string
): GeneratedStrategy => {
  return {
    name: `Template Strategy for ${asset}`,
    description: `This is a template strategy based on your description: "${description}". You can customize the rules as needed.`,
    timeframe: '1d',
    targetAsset: asset,
    entryRules: [
      {
        logic: 'AND',
        requiredConditions: 1,
        inequalities: [
          {
            id: 1,
            left: {
              type: 'INDICATOR',
              indicator: 'RSI',
              parameters: { period: '14' },
              valueType: 'Value'
            },
            condition: 'LESS_THAN',
            right: {
              type: 'VALUE',
              value: '30'
            },
            explanation: 'RSI indicates oversold condition'
          }
        ]
      }
    ],
    exitRules: [
      {
        logic: 'OR',
        requiredConditions: 1,
        inequalities: [
          {
            id: 1,
            left: {
              type: 'INDICATOR',
              indicator: 'RSI',
              parameters: { period: '14' },
              valueType: 'Value'
            },
            condition: 'GREATER_THAN',
            right: {
              type: 'VALUE',
              value: '70'
            },
            explanation: 'RSI indicates overbought condition'
          }
        ]
      }
    ]
  };
};

export class ServiceError extends Error {
  type: string;
  retryable?: boolean;
  details?: string[];

  constructor(message: string, type: string, retryable?: boolean, details?: string[]) {
    super(message);
    this.name = 'ServiceError';
    this.type = type;
    this.retryable = retryable;
    this.details = details;
  }
}

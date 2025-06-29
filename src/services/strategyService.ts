import { supabase } from "@/integrations/supabase/client";

export interface Strategy {
  id: string;
  name: string;
  description: string;
  timeframe: string;
  targetAsset: string;
  targetAssetName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  canBeDeleted: boolean;
  isRecommendedCopy: boolean;
  sourceStrategyId?: string;
}

export interface GeneratedStrategyRule {
  logic: string;
  inequalities: {
    left: {
      type: string;
      indicator?: string;
      parameters?: Record<string, any>;
      value?: string;
      valueType?: string;
    };
    condition: string;
    right: {
      type: string;
      indicator?: string;
      parameters?: Record<string, any>;
      value?: string;
      valueType?: string;
    };
    explanation?: string;
  }[];
  requiredConditions?: number; // Add this property
}

export interface GeneratedStrategy {
  name: string;
  description: string;
  timeframe: string;
  targetAsset: string;
  entryRules: GeneratedStrategyRule[];
  exitRules: GeneratedStrategyRule[];
}

export interface ServiceError {
  message: string;
  type: 'connection_error' | 'api_key_error' | 'timeout_error' | 'rate_limit_error' | 'validation_error' | 'parsing_error' | 'service_unavailable' | 'unknown_error';
  retryable: boolean;
  details?: string[];
}

export const getStrategies = async () => {
  try {
    const { data: strategies, error } = await supabase
      .from('strategies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return strategies?.map(strategy => ({
      id: strategy.id,
      name: strategy.name,
      description: strategy.description || '',
      timeframe: strategy.timeframe,
      targetAsset: strategy.target_asset || '',
      targetAssetName: strategy.target_asset_name || '',
      isActive: strategy.is_active,
      createdAt: strategy.created_at,
      updatedAt: strategy.updated_at,
      userId: strategy.user_id,
      canBeDeleted: strategy.can_be_deleted,
      isRecommendedCopy: strategy.is_recommended_copy,
      sourceStrategyId: strategy.source_strategy_id
    })) || [];
  } catch (error) {
    console.error('Error fetching strategies:', error);
    throw error;
  }
};

export const getStrategyById = async (id: string): Promise<Strategy | null> => {
  try {
    const { data: strategy, error } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    if (!strategy) {
      return null;
    }

    return {
      id: strategy.id,
      name: strategy.name,
      description: strategy.description || '',
      timeframe: strategy.timeframe,
      targetAsset: strategy.target_asset || '',
      targetAssetName: strategy.target_asset_name || '',
      isActive: strategy.is_active,
      createdAt: strategy.created_at,
      updatedAt: strategy.updated_at,
      userId: strategy.user_id,
      canBeDeleted: strategy.can_be_deleted,
      isRecommendedCopy: strategy.is_recommended_copy,
      sourceStrategyId: strategy.source_strategy_id
    };
  } catch (error) {
    console.error(`Error fetching strategy ${id}:`, error);
    throw error;
  }
};

export const deleteStrategy = async (strategyId: string) => {
  try {
    console.log(`Deleting strategy ${strategyId} using cascade function`);

    // Use the database cascade function to properly delete strategy and all related data
    const { error } = await supabase.rpc('delete_strategy_cascade', {
      strategy_uuid: strategyId
    });

    if (error) {
      console.error('Error calling delete_strategy_cascade:', error);
      throw error;
    }

    console.log(`Strategy ${strategyId} deleted successfully using cascade function`);

    // Dispatch custom event to notify components that strategy was deleted
    window.dispatchEvent(new CustomEvent('strategy-deleted', { detail: { strategyId } }));
  } catch (error) {
    console.error('Error in deleteStrategy:', error);
    throw error;
  }
};

export const generateStrategy = async (assetType: string, selectedAsset: string, strategyDescription: string): Promise<GeneratedStrategy> => {
  try {
    console.log('Sending strategy generation request:', { assetType, selectedAsset, strategyDescription });
    
    const { data, error } = await supabase.functions.invoke('generate-strategy', {
      body: { 
        assetType, 
        selectedAsset, 
        strategyDescription 
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw {
        message: error.message || 'Failed to generate strategy',
        type: 'api_key_error',
        retryable: true,
        details: [error.message]
      } as ServiceError;
    }

    console.log('Strategy generation successful:', data);
    return data;
  } catch (error: any) {
    console.error('Error generating strategy:', error);
    
    if (error.type) {
      throw error;
    }
    
    throw {
      message: 'Failed to generate strategy',
      type: 'unknown_error',
      retryable: true,
      details: [error.message || 'Unknown error occurred']
    } as ServiceError;
  }
};

export const checkAIServiceHealth = async (): Promise<{ healthy: boolean; details?: any; error?: string }> => {
  try {
    console.log('Checking AI service health...');
    const { data, error } = await supabase.functions.invoke('generate-strategy', {
      body: { healthCheck: true }
    });

    if (error) {
      console.error('Health check error:', error);
      return {
        healthy: false,
        error: error.message || 'Health check failed'
      };
    }

    console.log('Health check response:', data);
    return {
      healthy: true,
      details: data
    };
  } catch (error: any) {
    console.error('AI service health check failed:', error);
    return {
      healthy: false,
      error: error.message || 'Health check failed'
    };
  }
};

export const generateFallbackStrategy = (assetType: string, selectedAsset: string, strategyDescription: string): GeneratedStrategy => {
  return {
    name: `Simple RSI Strategy for ${selectedAsset}`,
    description: `A basic RSI strategy for ${selectedAsset} that buys when RSI is below 30 and sells when RSI is above 70. Based on: ${strategyDescription}`,
    timeframe: "1D",
    targetAsset: selectedAsset,
    targetAssetName: selectedAsset,
    entryRules: [{
      logic: "AND",
      inequalities: [{
        left: {
          type: "indicator",
          indicator: "RSI",
          parameters: { period: 14 }
        },
        condition: "<",
        right: {
          type: "value",
          value: "30",
          valueType: "number"
        },
        explanation: "RSI is oversold"
      }]
    }],
    exitRules: [{
      logic: "AND",
      inequalities: [{
        left: {
          type: "indicator",
          indicator: "RSI",
          parameters: { period: 14 }
        },
        condition: ">",
        right: {
          type: "value",
          value: "70",
          valueType: "number"
        },
        explanation: "RSI is overbought"
      }]
    }]
  };
};

export const getTradingRulesForStrategy = async (strategyId: string) => {
  try {
    const { data: ruleGroups, error } = await supabase
      .from('rule_groups')
      .select(`
        id,
        rule_type,
        logic,
        required_conditions,
        group_order,
        trading_rules (
          id,
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
          explanation,
          inequality_order
        )
      `)
      .eq('strategy_id', strategyId)
      .order('group_order');

    if (error) {
      throw error;
    }

    if (!ruleGroups || ruleGroups.length === 0) {
      return { entryRules: [], exitRules: [] };
    }

    const formatRuleGroup = (group: any) => ({
      id: group.group_order,
      logic: group.logic,
      requiredConditions: group.required_conditions,
      inequalities: (group.trading_rules || [])
        .sort((a: any, b: any) => a.inequality_order - b.inequality_order)
        .map((rule: any) => ({
          left: {
            type: rule.left_type,
            indicator: rule.left_indicator,
            parameters: rule.left_parameters || {},
            value: rule.left_value,
            valueType: rule.left_value_type
          },
          condition: rule.condition,
          right: {
            type: rule.right_type,
            indicator: rule.right_indicator,
            parameters: rule.right_parameters || {},
            value: rule.right_value,
            valueType: rule.right_value_type
          },
          explanation: rule.explanation
        }))
    });

    const entryRules = ruleGroups
      .filter(group => group.rule_type === 'entry')
      .map(formatRuleGroup);

    const exitRules = ruleGroups
      .filter(group => group.rule_type === 'exit')
      .map(formatRuleGroup);

    return { entryRules, exitRules };
  } catch (error) {
    console.error(`Error fetching trading rules for strategy ${strategyId}:`, error);
    throw error;
  }
};

export const saveGeneratedStrategy = async (strategy: GeneratedStrategy, userId: string): Promise<string> => {
  try {
    console.log('Saving generated strategy:', strategy);
    
    // Insert the strategy without risk management fields (they were removed)
    const { data: savedStrategy, error: strategyError } = await supabase
      .from('strategies')
      .insert({
        name: strategy.name,
        description: strategy.description,
        timeframe: strategy.timeframe,
        target_asset: strategy.targetAsset,
        target_asset_name: strategy.targetAssetName,
        user_id: userId,
        is_active: false
      })
      .select()
      .single();

    if (strategyError) {
      console.error('Error saving strategy:', strategyError);
      throw strategyError;
    }

    console.log('Strategy saved:', savedStrategy);
    
    // Save entry rules
    for (let groupIndex = 0; groupIndex < strategy.entryRules.length; groupIndex++) {
      const group = strategy.entryRules[groupIndex];
      
      if (!group.inequalities || group.inequalities.length === 0) {
        continue;
      }

      const { data: entryGroup, error: entryGroupError } = await supabase
        .from('rule_groups')
        .insert({
          strategy_id: savedStrategy.id,
          rule_type: 'entry',
          group_order: groupIndex + 1,
          logic: group.logic,
          required_conditions: group.logic === 'OR' ? (group as any).requiredConditions : null
        })
        .select()
        .single();

      if (entryGroupError) {
        console.error('Error saving entry rule group:', entryGroupError);
        throw entryGroupError;
      }

      for (let i = 0; i < group.inequalities.length; i++) {
        const inequality = group.inequalities[i];
        
        const { error: ruleError } = await supabase
          .from('trading_rules')
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

        if (ruleError) {
          console.error('Error saving entry rule:', ruleError);
          throw ruleError;
        }
      }
    }

    // Save exit rules
    for (let groupIndex = 0; groupIndex < strategy.exitRules.length; groupIndex++) {
      const group = strategy.exitRules[groupIndex];
      
      if (!group.inequalities || group.inequalities.length === 0) {
        continue;
      }

      const { data: exitGroup, error: exitGroupError } = await supabase
        .from('rule_groups')
        .insert({
          strategy_id: savedStrategy.id,
          rule_type: 'exit',
          group_order: groupIndex + 1,
          logic: group.logic,
          required_conditions: group.logic === 'OR' ? (group as any).requiredConditions : null
        })
        .select()
        .single();

      if (exitGroupError) {
        console.error('Error saving exit rule group:', exitGroupError);
        throw exitGroupError;
      }

      for (let i = 0; i < group.inequalities.length; i++) {
        const inequality = group.inequalities[i];
        
        const { error: ruleError } = await supabase
          .from('trading_rules')
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

        if (ruleError) {
          console.error('Error saving exit rule:', ruleError);
          throw ruleError;
        }
      }
    }

    console.log('All trading rules saved successfully');
    return savedStrategy.id;
  } catch (error) {
    console.error('Error in saveGeneratedStrategy:', error);
    throw error;
  }
};

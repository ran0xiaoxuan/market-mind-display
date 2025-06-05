import { supabase } from '@/integrations/supabase/client';

export interface Strategy {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
  targetAsset?: string;
  targetAssetName?: string;
  timeframe: string;
  stopLoss?: string;
  takeProfit?: string;
  singleBuyVolume?: string;
  maxBuyVolume?: string;
  userId: string;
  canBeDeleted: boolean;
  isRecommendedCopy: boolean;
  sourceStrategyId?: string;
}

export interface ServiceError {
  message: string;
  type: 'connection_error' | 'api_key_error' | 'timeout_error' | 'rate_limit_error' | 'validation_error' | 'parsing_error' | 'unknown_error';
  retryable: boolean;
  details?: string[];
}

export interface GeneratedStrategy {
  name: string;
  description: string;
  targetAsset: string;
  targetAssetName: string;
  timeframe: string;
  stopLoss?: string;
  takeProfit?: string;
  singleBuyVolume?: string;
  maxBuyVolume?: string;
  entryRules: any[];
  exitRules: any[];
}

export const getStrategies = async (): Promise<Strategy[]> => {
  console.log('Fetching strategies...');
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log('No authenticated user found');
    return [];
  }

  const { data, error } = await supabase
    .from('strategies')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching strategies:', error);
    throw error;
  }

  console.log('Fetched strategies:', data);

  return data?.map(strategy => ({
    id: strategy.id,
    name: strategy.name,
    description: strategy.description,
    createdAt: strategy.created_at,
    updatedAt: strategy.updated_at,
    isActive: strategy.is_active,
    targetAsset: strategy.target_asset,
    targetAssetName: strategy.target_asset_name,
    timeframe: strategy.timeframe,
    stopLoss: strategy.stop_loss,
    takeProfit: strategy.take_profit,
    singleBuyVolume: strategy.single_buy_volume,
    maxBuyVolume: strategy.max_buy_volume,
    userId: strategy.user_id,
    canBeDeleted: strategy.can_be_deleted,
    isRecommendedCopy: strategy.is_recommended_copy,
    sourceStrategyId: strategy.source_strategy_id
  })) || [];
};

export const getStrategyById = async (id: string): Promise<Strategy | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  const { data, error } = await supabase
    .from('strategies')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching strategy:', error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    isActive: data.is_active,
    targetAsset: data.target_asset,
    targetAssetName: data.target_asset_name,
    timeframe: data.timeframe,
    stopLoss: data.stop_loss,
    takeProfit: data.take_profit,
    singleBuyVolume: data.single_buy_volume,
    maxBuyVolume: data.max_buy_volume,
    userId: data.user_id,
    canBeDeleted: data.can_be_deleted,
    isRecommendedCopy: data.is_recommended_copy,
    sourceStrategyId: data.source_strategy_id
  };
};

export const getTradingRulesForStrategy = async (strategyId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  // Fetch rule groups for this strategy
  const { data: ruleGroups, error: ruleGroupsError } = await supabase
    .from('rule_groups')
    .select(`
      *,
      trading_rules (*)
    `)
    .eq('strategy_id', strategyId)
    .order('group_order');

  if (ruleGroupsError) {
    console.error('Error fetching rule groups:', ruleGroupsError);
    throw ruleGroupsError;
  }

  const entryRules = ruleGroups?.filter(group => group.rule_type === 'entry') || [];
  const exitRules = ruleGroups?.filter(group => group.rule_type === 'exit') || [];

  return {
    entryRules,
    exitRules
  };
};

export const getRiskManagementForStrategy = async (strategyId: string) => {
  const strategy = await getStrategyById(strategyId);
  
  if (!strategy) {
    throw new Error('Strategy not found');
  }

  return {
    stopLoss: strategy.stopLoss,
    takeProfit: strategy.takeProfit,
    singleBuyVolume: strategy.singleBuyVolume,
    maxBuyVolume: strategy.maxBuyVolume
  };
};

export const createStrategy = async (strategy: Omit<Strategy, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'canBeDeleted' | 'isRecommendedCopy'>): Promise<Strategy> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  const { data, error } = await supabase
    .from('strategies')
    .insert({
      name: strategy.name,
      description: strategy.description,
      is_active: strategy.isActive,
      target_asset: strategy.targetAsset,
      target_asset_name: strategy.targetAssetName,
      timeframe: strategy.timeframe,
      stop_loss: strategy.stopLoss,
      take_profit: strategy.takeProfit,
      single_buy_volume: strategy.singleBuyVolume,
      max_buy_volume: strategy.maxBuyVolume,
      user_id: user.id,
      source_strategy_id: strategy.sourceStrategyId
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating strategy:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    isActive: data.is_active,
    targetAsset: data.target_asset,
    targetAssetName: data.target_asset_name,
    timeframe: data.timeframe,
    stopLoss: data.stop_loss,
    takeProfit: data.take_profit,
    singleBuyVolume: data.single_buy_volume,
    maxBuyVolume: data.max_buy_volume,
    userId: data.user_id,
    canBeDeleted: data.can_be_deleted,
    isRecommendedCopy: data.is_recommended_copy,
    sourceStrategyId: data.source_strategy_id
  };
};

export const updateStrategy = async (id: string, updates: Partial<Omit<Strategy, 'id' | 'createdAt' | 'userId'>>): Promise<Strategy> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  const updateData: any = {};
  
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
  if (updates.targetAsset !== undefined) updateData.target_asset = updates.targetAsset;
  if (updates.targetAssetName !== undefined) updateData.target_asset_name = updates.targetAssetName;
  if (updates.timeframe !== undefined) updateData.timeframe = updates.timeframe;
  if (updates.stopLoss !== undefined) updateData.stop_loss = updates.stopLoss;
  if (updates.takeProfit !== undefined) updateData.take_profit = updates.takeProfit;
  if (updates.singleBuyVolume !== undefined) updateData.single_buy_volume = updates.singleBuyVolume;
  if (updates.maxBuyVolume !== undefined) updateData.max_buy_volume = updates.maxBuyVolume;

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('strategies')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating strategy:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    isActive: data.is_active,
    targetAsset: data.target_asset,
    targetAssetName: data.target_asset_name,
    timeframe: data.timeframe,
    stopLoss: data.stop_loss,
    takeProfit: data.take_profit,
    singleBuyVolume: data.single_buy_volume,
    maxBuyVolume: data.max_buy_volume,
    userId: data.user_id,
    canBeDeleted: data.can_be_deleted,
    isRecommendedCopy: data.is_recommended_copy,
    sourceStrategyId: data.source_strategy_id
  };
};

export const deleteStrategy = async (id: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  // Use the database function for safe cascade deletion
  const { error } = await supabase.rpc('delete_strategy_cascade', {
    strategy_uuid: id
  });

  if (error) {
    console.error('Error deleting strategy:', error);
    throw error;
  }
};

export const checkAIServiceHealth = async (): Promise<{ healthy: boolean; details?: any; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-strategy', {
      body: { 
        test: true,
        assetType: 'stocks',
        selectedAsset: 'AAPL',
        strategyDescription: 'health check'
      }
    });

    if (error) {
      return { healthy: false, error: error.message };
    }

    return { healthy: true, details: data };
  } catch (error) {
    return { healthy: false, error: 'Health check failed' };
  }
};

export const generateStrategy = async (
  assetType: string,
  selectedAsset: string,
  strategyDescription: string
): Promise<GeneratedStrategy> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-strategy', {
      body: {
        assetType,
        selectedAsset,
        strategyDescription
      }
    });

    if (error) {
      const serviceError: ServiceError = {
        message: error.message || 'Failed to generate strategy',
        type: 'api_key_error',
        retryable: true
      };
      throw serviceError;
    }

    return data as GeneratedStrategy;
  } catch (error: any) {
    if (error.type) {
      throw error;
    }

    const serviceError: ServiceError = {
      message: error.message || 'Unknown error occurred',
      type: 'unknown_error',
      retryable: false
    };
    throw serviceError;
  }
};

export const generateFallbackStrategy = (
  assetType: string,
  selectedAsset: string,
  strategyDescription: string
): GeneratedStrategy => {
  return {
    name: `${selectedAsset} Template Strategy`,
    description: `Template strategy for ${selectedAsset} based on: ${strategyDescription}`,
    targetAsset: selectedAsset,
    targetAssetName: selectedAsset,
    timeframe: '1d',
    stopLoss: '5%',
    takeProfit: '10%',
    singleBuyVolume: '100',
    maxBuyVolume: '1000',
    entryRules: [],
    exitRules: []
  };
};

export const saveGeneratedStrategy = async (generatedStrategy: GeneratedStrategy): Promise<Strategy> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  // Create the strategy
  const strategy = await createStrategy({
    name: generatedStrategy.name,
    description: generatedStrategy.description,
    isActive: false,
    targetAsset: generatedStrategy.targetAsset,
    targetAssetName: generatedStrategy.targetAssetName,
    timeframe: generatedStrategy.timeframe,
    stopLoss: generatedStrategy.stopLoss,
    takeProfit: generatedStrategy.takeProfit,
    singleBuyVolume: generatedStrategy.singleBuyVolume,
    maxBuyVolume: generatedStrategy.maxBuyVolume
  });

  // TODO: Save entry and exit rules if provided
  if (generatedStrategy.entryRules && generatedStrategy.entryRules.length > 0) {
    // Implementation for saving rules would go here
  }

  if (generatedStrategy.exitRules && generatedStrategy.exitRules.length > 0) {
    // Implementation for saving rules would go here
  }

  return strategy;
};

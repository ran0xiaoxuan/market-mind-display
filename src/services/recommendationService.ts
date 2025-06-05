
import { supabase } from '@/integrations/supabase/client';
import { Strategy } from './strategyService';

export interface RecommendedStrategy {
  id: string;
  strategyId: string;
  isOfficial: boolean;
  strategy: Strategy;
}

export const getRecommendedStrategies = async (): Promise<RecommendedStrategy[]> => {
  const { data, error } = await supabase
    .from('recommended_strategies')
    .select(`
      *,
      strategies (*)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching recommended strategies:', error);
    throw error;
  }

  return data?.map(item => ({
    id: item.id,
    strategyId: item.strategy_id,
    isOfficial: item.is_official,
    strategy: {
      id: item.strategies.id,
      name: item.strategies.name,
      description: item.strategies.description,
      createdAt: item.strategies.created_at,
      updatedAt: item.strategies.updated_at,
      isActive: item.strategies.is_active,
      targetAsset: item.strategies.target_asset,
      targetAssetName: item.strategies.target_asset_name,
      timeframe: item.strategies.timeframe,
      stopLoss: item.strategies.stop_loss,
      takeProfit: item.strategies.take_profit,
      singleBuyVolume: item.strategies.single_buy_volume,
      maxBuyVolume: item.strategies.max_buy_volume,
      userId: item.strategies.user_id,
      canBeDeleted: item.strategies.can_be_deleted,
      isRecommendedCopy: item.strategies.is_recommended_copy,
      sourceStrategyId: item.strategies.source_strategy_id
    }
  })) || [];
};

export const getStrategyApplyCounts = async (): Promise<Record<string, number>> => {
  const { data, error } = await supabase
    .from('strategy_applications')
    .select('strategy_id')
    .order('strategy_id');

  if (error) {
    console.error('Error fetching apply counts:', error);
    return {};
  }

  const counts: Record<string, number> = {};
  data?.forEach(item => {
    counts[item.strategy_id] = (counts[item.strategy_id] || 0) + 1;
  });

  return counts;
};

export const trackStrategyApplication = async (strategyId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  const { error } = await supabase
    .from('strategy_applications')
    .insert({
      strategy_id: strategyId,
      user_id: user.id
    });

  if (error) {
    console.error('Error tracking strategy application:', error);
    throw error;
  }
};

export const applyStrategy = async (strategyId: string): Promise<Strategy> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  // Get the original strategy
  const { data: originalStrategy, error: fetchError } = await supabase
    .from('strategies')
    .select('*')
    .eq('id', strategyId)
    .single();

  if (fetchError || !originalStrategy) {
    throw new Error('Strategy not found');
  }

  // Create a copy for the user
  const { data: newStrategy, error: createError } = await supabase
    .from('strategies')
    .insert({
      name: `${originalStrategy.name} (Copy)`,
      description: originalStrategy.description,
      target_asset: originalStrategy.target_asset,
      target_asset_name: originalStrategy.target_asset_name,
      timeframe: originalStrategy.timeframe,
      stop_loss: originalStrategy.stop_loss,
      take_profit: originalStrategy.take_profit,
      single_buy_volume: originalStrategy.single_buy_volume,
      max_buy_volume: originalStrategy.max_buy_volume,
      is_active: false,
      user_id: user.id,
      is_recommended_copy: true,
      source_strategy_id: strategyId
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating strategy copy:', createError);
    throw createError;
  }

  // Track the application
  await trackStrategyApplication(strategyId);

  return {
    id: newStrategy.id,
    name: newStrategy.name,
    description: newStrategy.description,
    createdAt: newStrategy.created_at,
    updatedAt: newStrategy.updated_at,
    isActive: newStrategy.is_active,
    targetAsset: newStrategy.target_asset,
    targetAssetName: newStrategy.target_asset_name,
    timeframe: newStrategy.timeframe,
    stopLoss: newStrategy.stop_loss,
    takeProfit: newStrategy.take_profit,
    singleBuyVolume: newStrategy.single_buy_volume,
    maxBuyVolume: newStrategy.max_buy_volume,
    userId: newStrategy.user_id,
    canBeDeleted: newStrategy.can_be_deleted,
    isRecommendedCopy: newStrategy.is_recommended_copy,
    sourceStrategyId: newStrategy.source_strategy_id
  };
};

export const createRecommendedStrategy = async (strategyId: string): Promise<void> => {
  const { error } = await supabase
    .from('recommended_strategies')
    .insert({
      strategy_id: strategyId,
      is_official: false
    });

  if (error) {
    console.error('Error creating recommended strategy:', error);
    throw error;
  }
};

export const removeRecommendedStrategy = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('recommended_strategies')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error removing recommended strategy:', error);
    throw error;
  }
};

export const createRecommendation = createRecommendedStrategy;


import { supabase } from '@/integrations/supabase/client';

export interface RecommendedStrategy {
  id: string;
  strategyId: string;
  recommendedBy: string;
  isOfficial: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  strategy: {
    id: string;
    name: string;
    description?: string;
    targetAsset?: string;
    targetAssetName?: string;
    timeframe: string;
    isActive: boolean;
  };
}

export const getRecommendedStrategies = async (): Promise<RecommendedStrategy[]> => {
  const { data, error } = await supabase
    .from('recommended_strategies')
    .select(`
      *,
      strategy:strategies!strategy_id (
        id,
        name,
        description,
        target_asset,
        target_asset_name,
        timeframe,
        is_active
      )
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching recommended strategies:', error);
    throw error;
  }

  return data?.map(item => ({
    id: item.id,
    strategyId: item.strategy_id,
    recommendedBy: item.recommended_by,
    isOfficial: item.is_official,
    isPublic: item.is_public,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    strategy: {
      id: item.strategy.id,
      name: item.strategy.name,
      description: item.strategy.description,
      targetAsset: item.strategy.target_asset,
      targetAssetName: item.strategy.target_asset_name,
      timeframe: item.strategy.timeframe,
      isActive: item.strategy.is_active
    }
  })) || [];
};

export const getStrategyApplyCounts = async (): Promise<Record<string, number>> => {
  const { data, error } = await supabase
    .from('strategy_applications')
    .select('strategy_id');

  if (error) {
    console.error('Error fetching strategy apply counts:', error);
    throw error;
  }

  const counts: Record<string, number> = {};
  data?.forEach(application => {
    counts[application.strategy_id] = (counts[application.strategy_id] || 0) + 1;
  });

  return counts;
};

export const applyStrategy = async (strategyId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  // Check if strategy exists and is public
  const { data: strategy, error: strategyError } = await supabase
    .from('strategies')
    .select('id, name, description, target_asset, target_asset_name, timeframe, stop_loss, take_profit, single_buy_volume, max_buy_volume')
    .eq('id', strategyId)
    .single();

  if (strategyError || !strategy) {
    throw new Error('Strategy not found or not accessible');
  }

  // Create a copy of the strategy for the user
  const { data: newStrategy, error: createError } = await supabase
    .from('strategies')
    .insert({
      user_id: user.id,
      name: `${strategy.name} (Copy)`,
      description: strategy.description,
      target_asset: strategy.target_asset,
      target_asset_name: strategy.target_asset_name,
      timeframe: strategy.timeframe,
      stop_loss: strategy.stop_loss,
      take_profit: strategy.take_profit,
      single_buy_volume: strategy.single_buy_volume,
      max_buy_volume: strategy.max_buy_volume,
      is_active: false,
      source_strategy_id: strategyId,
      is_recommended_copy: true
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating strategy copy:', createError);
    throw createError;
  }

  // Record the application
  const { error: applicationError } = await supabase
    .from('strategy_applications')
    .insert({
      strategy_id: strategyId,
      user_id: user.id
    });

  if (applicationError) {
    console.error('Error recording strategy application:', applicationError);
    // Don't throw here as the strategy copy was successful
  }
};

export const createRecommendation = async (
  originalStrategyId: string,
  recommendedStrategyId: string,
  isOfficial: boolean = false
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  const { error } = await supabase
    .from('strategy_recommendations')
    .insert({
      original_strategy_id: originalStrategyId,
      recommended_strategy_id: recommendedStrategyId,
      recommended_by: user.id,
      is_official: isOfficial
    });

  if (error) {
    console.error('Error creating recommendation:', error);
    throw error;
  }
};

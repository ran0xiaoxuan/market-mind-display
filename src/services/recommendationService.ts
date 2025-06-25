
import { supabase } from "@/integrations/supabase/client";

export interface RecommendedStrategy {
  id: string;
  name: string;
  description: string;
  targetAsset: string;
  targetAssetName?: string;
  isActive: boolean;
  timeframe: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  isOfficial: boolean;
  recommendedBy?: string;
}

export const getRecommendedStrategies = async (): Promise<RecommendedStrategy[]> => {
  try {
    const { data: recommendations, error } = await supabase
      .from('recommended_strategies')
      .select(`
        is_official,
        recommended_by,
        strategies (
          id,
          name,
          description,
          timeframe,
          target_asset,
          target_asset_name,
          is_active,
          created_at,
          updated_at,
          user_id
        )
      `)
      .eq('deprecated', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return recommendations?.map(rec => ({
      id: rec.strategies.id,
      name: rec.strategies.name,
      description: rec.strategies.description || '',
      targetAsset: rec.strategies.target_asset || '',
      targetAssetName: rec.strategies.target_asset_name || '',
      isActive: rec.strategies.is_active,
      timeframe: rec.strategies.timeframe,
      createdAt: rec.strategies.created_at,
      updatedAt: rec.strategies.updated_at,
      userId: rec.strategies.user_id,
      isOfficial: rec.is_official,
      recommendedBy: rec.recommended_by
    })) || [];

  } catch (error) {
    console.error('Error fetching recommended strategies:', error);
    throw error;
  }
};

export const getStrategyApplyCounts = async (): Promise<Map<string, number>> => {
  try {
    const { data: applyCounts, error } = await supabase
      .from('strategy_applications')
      .select('strategy_id');

    if (error) {
      throw error;
    }

    const countMap = new Map<string, number>();
    applyCounts?.forEach(record => {
      const count = countMap.get(record.strategy_id) || 0;
      countMap.set(record.strategy_id, count + 1);
    });

    return countMap;
  } catch (error) {
    console.error('Error fetching strategy apply counts:', error);
    return new Map();
  }
};

export const recommendStrategy = async (strategyId: string, isOfficial: boolean = false) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('recommended_strategies')
      .insert({
        strategy_id: strategyId,
        is_official: isOfficial,
        recommended_by: user.user.id
      });

    if (error) {
      throw error;
    }

    console.log(`Strategy ${strategyId} recommended successfully`);

  } catch (error) {
    console.error('Error recommending strategy:', error);
    throw error;
  }
};

export const removeRecommendation = async (strategyId: string) => {
  try {
    const { error } = await supabase
      .from('recommended_strategies')
      .update({ deprecated: true })
      .eq('strategy_id', strategyId);

    if (error) {
      throw error;
    }

    console.log(`Recommendation for strategy ${strategyId} removed successfully`);

  } catch (error) {
    console.error('Error removing recommendation:', error);
    throw error;
  }
};

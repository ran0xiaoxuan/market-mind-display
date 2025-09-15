import { supabase } from "@/integrations/supabase/client";

export interface RecommendationItem {
  id: string;
  originalStrategyId: string;
  originalUserId: string;
  name: string;
  description: string | null;
  timeframe: string;
  targetAsset: string | null;
  targetAssetName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const getRecommendations = async (): Promise<RecommendationItem[]> => {
  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((r: any) => ({
    id: r.id,
    originalStrategyId: r.original_strategy_id,
    originalUserId: r.original_user_id,
    name: r.name,
    description: r.description,
    timeframe: r.timeframe,
    targetAsset: r.target_asset,
    targetAssetName: r.target_asset_name,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
};

export const shareStrategyToRecommendations = async (strategyId: string) => {
  const { data, error } = await supabase.functions.invoke('share-strategy', {
    body: { strategyId }
  });
  if (error) throw error;
  return data;
};

export const copyRecommendationToMyStrategies = async (recommendationId: string) => {
  const { data, error } = await supabase.functions.invoke('copy-recommended-strategy', {
    body: { recommendationId }
  });
  if (error) throw error;
  return data;
};

export const getRecommendationDetail = async (recommendationId: string) => {
  const { data, error } = await supabase.functions.invoke('get-recommendation-detail', {
    body: { recommendationId }
  });
  if (error) throw error;
  return data as {
    recommendation: any;
    strategy: any;
    entryRules: any[];
    exitRules: any[];
  };
};

export const isStrategyShared = async (strategyId: string) => {
  const { data, error } = await supabase
    .from('recommendations')
    .select('id')
    .eq('original_strategy_id', strategyId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return !!data?.id;
};

export const unshareStrategyFromRecommendations = async (strategyId: string) => {
  const { data, error } = await supabase.functions.invoke('unshare-strategy', {
    body: { strategyId }
  });
  if (error) throw error;
  return data;
}; 
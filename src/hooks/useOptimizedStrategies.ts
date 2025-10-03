
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OptimizedStrategy {
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
  // Optimized fields
  totalSignals?: number;
  totalRules?: number;
  lastSignalAt?: string;
}

export const useOptimizedStrategies = () => {
  return useQuery({
    queryKey: ['strategies', 'optimized'],
    queryFn: async (): Promise<OptimizedStrategy[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Single optimized query that fetches strategies with aggregated data
      const { data: strategies, error } = await supabase
        .from('strategies')
        .select(`
          *,
          trading_signals(count),
          rule_groups(
            id,
            trading_rules(count)
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Transform data to include aggregated counts
      return strategies?.map(strategy => ({
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
        totalSignals: strategy.trading_signals?.[0]?.count || 0,
        totalRules: strategy.rule_groups?.reduce((total: number, rg: any) => 
          total + (rg.trading_rules?.[0]?.count || 0), 0) || 0
      })) || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when switching tabs/windows
  });
};

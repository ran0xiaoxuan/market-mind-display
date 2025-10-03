
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OptimizedStrategyDetail {
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
  entryRules: any[];
  exitRules: any[];
  recentSignals: any[];
  totalSignals: number;
}

export const useOptimizedStrategyDetail = (strategyId: string) => {
  return useQuery({
    queryKey: ['strategy', strategyId, 'detail'],
    queryFn: async (): Promise<OptimizedStrategyDetail> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Single query to get strategy with all related data
      const { data: strategy, error } = await supabase
        .from('strategies')
        .select(`
          *,
          rule_groups(
            id,
            rule_type,
            logic,
            group_order,
            explanation,
            required_conditions,
            trading_rules(
              id,
              inequality_order,
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
              explanation
            )
          ),
          trading_signals(
            id,
            created_at,
            signal_type,
            signal_data,
            processed
          )
        `)
        .eq('id', strategyId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (!strategy) throw new Error('Strategy not found');

      // Process rule groups
      const entryRules = strategy.rule_groups
        ?.filter((rg: any) => rg.rule_type === 'entry')
        ?.sort((a: any, b: any) => a.group_order - b.group_order)
        ?.map((rg: any) => ({
          ...rg,
          inequalities: rg.trading_rules
            ?.sort((a: any, b: any) => a.inequality_order - b.inequality_order)
            ?.map((rule: any) => ({
              id: rule.id,
              left: {
                type: rule.left_type,
                indicator: rule.left_indicator,
                parameters: rule.left_parameters,
                value: rule.left_value,
                valueType: rule.left_value_type
              },
              condition: rule.condition,
              right: {
                type: rule.right_type,
                indicator: rule.right_indicator,
                parameters: rule.right_parameters,
                value: rule.right_value,
                valueType: rule.right_value_type
              },
              explanation: rule.explanation
            })) || []
        })) || [];

      const exitRules = strategy.rule_groups
        ?.filter((rg: any) => rg.rule_type === 'exit')
        ?.sort((a: any, b: any) => a.group_order - b.group_order)
        ?.map((rg: any) => ({
          ...rg,
          inequalities: rg.trading_rules
            ?.sort((a: any, b: any) => a.inequality_order - b.inequality_order)
            ?.map((rule: any) => ({
              id: rule.id,
              left: {
                type: rule.left_type,
                indicator: rule.left_indicator,
                parameters: rule.left_parameters,
                value: rule.left_value,
                valueType: rule.left_value_type
              },
              condition: rule.condition,
              right: {
                type: rule.right_type,
                indicator: rule.right_indicator,
                parameters: rule.right_parameters,
                value: rule.right_value,
                valueType: rule.right_value_type
              },
              explanation: rule.explanation
            })) || []
        })) || [];

      // Process recent signals (last 20)
      const recentSignals = strategy.trading_signals
        ?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        ?.slice(0, 20) || [];

      return {
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
        entryRules,
        exitRules,
        recentSignals,
        totalSignals: strategy.trading_signals?.length || 0
      };
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when switching tabs/windows
  });
};

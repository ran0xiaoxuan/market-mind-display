
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardMetrics {
  strategiesCount: string;
  activeStrategies: string;
  signalAmount: string;
  conditionsCount: string;
  strategiesChange: { value: string; positive: boolean };
  activeChange: { value: string; positive: boolean };
  signalChange: { value: string; positive: boolean };
  conditionsChange: { value: string; positive: boolean };
}

export interface DashboardTrade {
  id: string;
  date: string;
  type: string;
  signal: string;
  price: string;
  contracts: number;
  profit: string | null;
  profitPercentage?: string | null;
  strategyName?: string;
  targetAsset?: string;
  strategyId?: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentTrades: DashboardTrade[];
  strategies: Array<{
    id: string;
    name: string;
    targetAsset?: string;
    isActive: boolean;
    updatedAt: string;
    signalNotificationsEnabled?: boolean;
  }>;
}

export const useOptimizedDashboard = (timeRange: '7d' | '30d' | 'all' = '7d') => {
  return useQuery({
    queryKey: ['dashboard', timeRange],
    queryFn: async (): Promise<DashboardData> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case 'all':
        default:
          startDate = new Date('2020-01-01');
          break;
      }

      // Parallel queries for better performance
      const [strategiesResult, signalsResult, rulesResult] = await Promise.all([
        // Get strategies with basic info
        supabase
          .from('strategies')
          .select('id, name, target_asset, is_active, updated_at, signal_notifications_enabled')
          .eq('user_id', user.id),
        
        // Get recent trading signals with strategy info
        supabase
          .from('trading_signals')
          .select(`
            id,
            created_at,
            signal_type,
            signal_data,
            strategy_id,
            strategies!inner(name, target_asset, user_id)
          `)
          .eq('strategies.user_id', user.id)
          .eq('processed', true)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Get total rule count
        supabase
          .from('trading_rules')
          .select(`
            id,
            rule_groups!inner(
              strategy_id,
              strategies!inner(user_id)
            )
          `)
          .eq('rule_groups.strategies.user_id', user.id)
      ]);

      const strategies = strategiesResult.data || [];
      const signals = signalsResult.data || [];
      const rules = rulesResult.data || [];

      // Calculate metrics
      const totalStrategies = strategies.length;
      const activeStrategies = strategies.filter(s => s.is_active).length;
      const totalSignals = signals.length;
      const totalRules = rules.length;

      // Format recent trades
      const recentTrades: DashboardTrade[] = signals.map(signal => {
        const signalData = (signal.signal_data as any) || {};
        const strategy = signal.strategies;
        
        return {
          id: signal.id,
          date: signal.created_at,
          type: signal.signal_type === 'entry' ? 'Buy' : 'Sell',
          signal: signalData.reason || 'Trading Signal',
          price: `$${(signalData.price || 0).toFixed(2)}`,
          contracts: 1,
          profit: signalData.profit !== null && signalData.profit !== undefined 
            ? `${signalData.profit >= 0 ? '+' : ''}$${signalData.profit.toFixed(2)}` 
            : null,
          profitPercentage: signalData.profitPercentage !== null && signalData.profitPercentage !== undefined
            ? `${signalData.profitPercentage >= 0 ? '+' : ''}${signalData.profitPercentage.toFixed(2)}%`
            : null,
          strategyId: signal.strategy_id,
          strategyName: strategy?.name || 'Unknown Strategy',
          targetAsset: strategy?.target_asset || 'Unknown Asset'
        };
      });

      return {
        metrics: {
          strategiesCount: totalStrategies.toString(),
          activeStrategies: activeStrategies.toString(),
          signalAmount: totalSignals.toString(),
          conditionsCount: totalRules.toString(),
          strategiesChange: { value: "+0", positive: false },
          activeChange: { value: "+0", positive: false },
          signalChange: { value: "+0", positive: false },
          conditionsChange: { value: "+0", positive: false }
        },
        recentTrades,
        strategies: strategies.map(s => ({
          id: s.id,
          name: s.name,
          targetAsset: s.target_asset,
          isActive: s.is_active,
          updatedAt: s.updated_at,
          signalNotificationsEnabled: s.signal_notifications_enabled
        }))
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for dashboard data
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

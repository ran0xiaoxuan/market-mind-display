
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

      // Get user's strategies first
      const { data: strategies, error: strategiesError } = await supabase
        .from('strategies')
        .select('id, name, target_asset, is_active, updated_at, signal_notifications_enabled')
        .eq('user_id', user.id);

      if (strategiesError) throw strategiesError;
      const userStrategies = strategies || [];
      const userStrategyIds = userStrategies.map(s => s.id);

      // Count ALL trading signals for the user's strategies based on time range
      let signalCountQuery = supabase
        .from('trading_signals')
        .select('id', { count: 'exact', head: true })
        .in('strategy_id', userStrategyIds.length > 0 ? userStrategyIds : ['']);

      // Only apply date filter if not "all time"
      if (timeRange !== 'all') {
        signalCountQuery = signalCountQuery.gte('created_at', startDate.toISOString());
      }

      // Build the trading signals query for display - REMOVED THE LIMIT
      let signalsQuery = supabase
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
        .order('created_at', { ascending: false });

      // Only apply date filter if not "all time"
      if (timeRange !== 'all') {
        signalsQuery = signalsQuery.gte('created_at', startDate.toISOString());
      }

      // Parallel queries for better performance
      const [signalCountResult, signalsResult, rulesResult] = await Promise.all([
        // Count all signals for metrics
        signalCountQuery,
        
        // Get ALL signals for display (no limit)
        signalsQuery,
        
        // Get ALL trading rules count for all strategies of this user
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

      const totalSignalCount = signalCountResult.count || 0;
      const signals = signalsResult.data || [];
      const rules = rulesResult.data || [];

      console.log(`Total strategies: ${userStrategies.length}`);
      console.log(`Total signals count: ${totalSignalCount}`);
      console.log(`Signals fetched for display: ${signals.length}`);
      console.log(`Total rules: ${rules.length}`);
      console.log(`Time range: ${timeRange}`);
      console.log(`Date filter applied: ${timeRange !== 'all' ? startDate.toISOString() : 'No date filter (all time)'}`);

      // Calculate metrics
      const totalStrategies = userStrategies.length;
      
      // Active strategies are those with signal_notifications_enabled = true
      const activeStrategies = userStrategies.filter(s => s.signal_notifications_enabled === true).length;
      
      const totalRules = rules.length;

      console.log(`Active strategies (with notifications enabled): ${activeStrategies}`);
      console.log(`Total conditions: ${totalRules}`);

      // Format ALL trades for display - now includes all signals without limit
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
          signalAmount: totalSignalCount.toString(),
          conditionsCount: totalRules.toString(),
          strategiesChange: { value: "+0", positive: false },
          activeChange: { value: "+0", positive: false },
          signalChange: { value: "+0", positive: false },
          conditionsChange: { value: "+0", positive: false }
        },
        recentTrades,
        strategies: userStrategies.map(s => ({
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

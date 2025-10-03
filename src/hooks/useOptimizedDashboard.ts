
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
  quantity?: number;
  amount?: number;
  profit: string | null;
  profitPercentage?: string | null;
  strategyName?: string;
  targetAsset?: string;
  targetAssetName?: string;
  strategyId?: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentTrades: DashboardTrade[];
  totalSignalsCount: number;
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

      // Calculate date range for both metrics and signals
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

      // If no strategies, return empty data
      if (userStrategyIds.length === 0) {
        return {
          metrics: {
            strategiesCount: '0',
            activeStrategies: '0',
            signalAmount: '0',
            conditionsCount: '0',
            strategiesChange: { value: "+0", positive: false },
            activeChange: { value: "+0", positive: false },
            signalChange: { value: "+0", positive: false },
            conditionsChange: { value: "+0", positive: false }
          },
          recentTrades: [],
          totalSignalsCount: 0,
          strategies: []
        };
      }

      // Count signals for metrics based on time range
      let signalCountQuery = supabase
        .from('trading_signals')
        .select('id', { count: 'exact', head: true })
        .in('strategy_id', userStrategyIds);

      // Apply date filter for metrics if not "all time"
      if (timeRange !== 'all') {
        signalCountQuery = signalCountQuery.gte('created_at', startDate.toISOString());
      }

      // Get total count of signals matching the time range filter
      let totalSignalsCountQuery = supabase
        .from('trading_signals')
        .select('id', { count: 'exact', head: true })
        .in('strategy_id', userStrategyIds);

      if (timeRange !== 'all') {
        totalSignalsCountQuery = totalSignalsCountQuery.gte('created_at', startDate.toISOString());
      }

      // Get trading signals filtered by time range (limited to 500 for display)
      let signalsQuery = supabase
        .from('trading_signals')
        .select(`
          id,
          created_at,
          signal_type,
          signal_data,
          strategy_id,
          strategies!inner(name, target_asset, target_asset_name, user_id)
        `)
        .eq('strategies.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);

      // Apply date filter for signals based on time range
      if (timeRange !== 'all') {
        signalsQuery = signalsQuery.gte('created_at', startDate.toISOString());
      }

      // Get rules count
      const rulesQuery = supabase
        .from('trading_rules')
        .select(`
          id,
          rule_groups!inner(
            strategy_id,
            strategies!inner(user_id)
          )
        `)
        .eq('rule_groups.strategies.user_id', user.id);

      // Parallel queries for better performance
      const [signalCountResult, totalSignalsCountResult, signalsResult, rulesResult] = await Promise.all([
        signalCountQuery,
        totalSignalsCountQuery,
        signalsQuery,
        rulesQuery
      ]);

      const totalSignalCount = signalCountResult.count || 0;
      const totalSignalsCount = totalSignalsCountResult.count || 0;
      const signals = signalsResult.data || [];
      const rules = rulesResult.data || [];

      console.log(`Total strategies: ${userStrategies.length}`);
      console.log(`Total signals count (for metrics): ${totalSignalCount}`);
      console.log(`Total signals count (filtered): ${totalSignalsCount}`);
      console.log(`Filtered signals fetched: ${signals.length}`);
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

      // Format trades for display
      const recentTrades: DashboardTrade[] = signals.map(signal => {
        const signalData = (signal.signal_data as any) || {};
        const strategy = signal.strategies;
        
        // Extract price from signal_data - try multiple possible fields
        let signalPrice = 0;
        if (signalData.current_price !== undefined && signalData.current_price !== null) {
          signalPrice = Number(signalData.current_price);
        } else if (signalData.price !== undefined && signalData.price !== null) {
          signalPrice = Number(signalData.price);
        } else if (signalData.close_price !== undefined && signalData.close_price !== null) {
          signalPrice = Number(signalData.close_price);
        }
        
        // Ensure price is a valid number
        if (isNaN(signalPrice) || signalPrice <= 0) {
          signalPrice = 0;
        }
        
        console.log('Processing signal for Trade History:', {
          signalId: signal.id,
          signalType: signal.signal_type,
          extractedPrice: signalPrice,
          signalData: signalData
        });
        
        // Extract quantity and amount from signal data
        const quantity = signalData.quantity || null;
        const amount = signalData.amount || null;
        
        return {
          id: signal.id,
          date: signal.created_at,
          type: signal.signal_type === 'entry' ? 'Buy' : 'Sell',
          signal: signalData.reason || signalData.message || 'Trading Signal',
          price: signalPrice > 0 ? `$${signalPrice.toFixed(2)}` : 'N/A',
          contracts: 1,
          quantity: quantity,
          amount: amount,
          profit: signalData.profit !== null && signalData.profit !== undefined 
            ? `${signalData.profit >= 0 ? '+' : ''}$${signalData.profit.toFixed(2)}` 
            : null,
          profitPercentage: signalData.profitPercentage !== null && signalData.profitPercentage !== undefined
            ? `${signalData.profitPercentage >= 0 ? '+' : ''}${signalData.profitPercentage.toFixed(2)}%`
            : null,
          strategyId: signal.strategy_id,
          strategyName: strategy?.name || 'Unknown Strategy',
          targetAsset: strategy?.target_asset || 'Unknown Asset',
          targetAssetName: strategy?.target_asset_name || null
        };
      });

      console.log(`Formatted trades for display: ${recentTrades.length}`);

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
        totalSignalsCount,
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
    refetchOnWindowFocus: false, // Don't refetch when switching tabs/windows
  });
};

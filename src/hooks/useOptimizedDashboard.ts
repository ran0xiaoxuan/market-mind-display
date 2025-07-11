
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

      console.log(`Dashboard: Starting fetch with timeRange: ${timeRange}`);

      // Calculate date range for filtering
      const now = new Date();
      let startDate: Date | null = null;
      
      switch (timeRange) {
        case '7d':
          startDate = new Date();
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate = new Date();
          startDate.setDate(now.getDate() - 30);
          break;
        case 'all':
        default:
          startDate = null; // No date filter for "all time"
          break;
      }

      console.log(`Dashboard: Date filter - ${startDate ? startDate.toISOString() : 'No date filter (all time)'}`);

      // Get user's strategies first
      const { data: strategies, error: strategiesError } = await supabase
        .from('strategies')
        .select('id, name, target_asset, is_active, updated_at, signal_notifications_enabled')
        .eq('user_id', user.id);

      if (strategiesError) {
        console.error('Dashboard: Error fetching strategies:', strategiesError);
        throw strategiesError;
      }

      const userStrategies = strategies || [];
      const userStrategyIds = userStrategies.map(s => s.id);
      
      console.log(`Dashboard: Found ${userStrategies.length} strategies for user`);
      console.log(`Dashboard: Strategy IDs:`, userStrategyIds);

      if (userStrategyIds.length === 0) {
        console.log('Dashboard: No strategies found, returning empty data');
        return {
          metrics: {
            strategiesCount: "0",
            activeStrategies: "0",
            signalAmount: "0",
            conditionsCount: "0",
            strategiesChange: { value: "+0", positive: false },
            activeChange: { value: "+0", positive: false },
            signalChange: { value: "+0", positive: false },
            conditionsChange: { value: "+0", positive: false }
          },
          recentTrades: [],
          strategies: []
        };
      }

      // Build the trading signals query with proper joins
      let signalsQuery = supabase
        .from('trading_signals')
        .select(`
          id,
          created_at,
          signal_type,
          signal_data,
          strategy_id,
          strategies!inner(
            id,
            name,
            target_asset,
            user_id
          )
        `)
        .eq('strategies.user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply date filter if not "all time"
      if (startDate) {
        signalsQuery = signalsQuery.gte('created_at', startDate.toISOString());
        console.log(`Dashboard: Applying date filter from ${startDate.toISOString()}`);
      }

      // Execute the signals query
      const { data: signals, error: signalsError } = await signalsQuery;

      if (signalsError) {
        console.error('Dashboard: Error fetching signals:', signalsError);
        throw signalsError;
      }

      console.log(`Dashboard: Found ${signals?.length || 0} trading signals`);
      
      // Get ALL trading rules count for all strategies of this user (no date filter for conditions count)
      const { data: rulesData, error: rulesError } = await supabase
        .from('trading_rules')
        .select(`
          id,
          rule_groups!inner(
            id,
            strategy_id,
            strategies!inner(
              id,
              user_id
            )
          )
        `)
        .eq('rule_groups.strategies.user_id', user.id);

      if (rulesError) {
        console.error('Dashboard: Error fetching rules:', rulesError);
        throw rulesError;
      }

      const totalSignalCount = signals?.length || 0;
      const totalRules = rulesData?.length || 0;
      const totalStrategies = userStrategies.length;
      const activeStrategies = userStrategies.filter(s => s.signal_notifications_enabled === true).length;

      console.log(`Dashboard Metrics:`, {
        totalStrategies,
        activeStrategies,
        totalSignalCount,
        totalRules,
        timeRange
      });

      // Format signals as recent trades
      const recentTrades: DashboardTrade[] = (signals || []).map(signal => {
        const signalData = (signal.signal_data as any) || {};
        const strategy = signal.strategies;
        
        return {
          id: signal.id,
          date: signal.created_at,
          type: signal.signal_type === 'entry' ? 'Buy' : 'Sell',
          signal: signalData.reason || signalData.message || `${signal.signal_type} signal`,
          price: signalData.price ? `$${Number(signalData.price).toFixed(2)}` : 
                 signalData.marketPrice ? `$${Number(signalData.marketPrice).toFixed(2)}` : 
                 '$0.00',
          contracts: signalData.contracts || 1,
          profit: signalData.profit !== null && signalData.profit !== undefined 
            ? `${signalData.profit >= 0 ? '+' : ''}$${Number(signalData.profit).toFixed(2)}` 
            : null,
          profitPercentage: signalData.profitPercentage !== null && signalData.profitPercentage !== undefined
            ? `${signalData.profitPercentage >= 0 ? '+' : ''}${Number(signalData.profitPercentage).toFixed(2)}%`
            : null,
          strategyId: signal.strategy_id,
          strategyName: strategy?.name || 'Unknown Strategy',
          targetAsset: strategy?.target_asset || signalData.targetAsset || 'Unknown Asset'
        };
      });

      console.log(`Dashboard: Formatted ${recentTrades.length} trades for display`);

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
    staleTime: 1 * 60 * 1000, // 1 minute for more frequent updates
    gcTime: 3 * 60 * 1000, // 3 minutes
  });
};

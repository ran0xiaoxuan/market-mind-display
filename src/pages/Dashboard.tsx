import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { MetricCard } from "@/components/MetricCard";
import { Navbar } from "@/components/Navbar";
import { StrategyList } from "@/components/StrategyList";
import { useState, useEffect } from "react";
import { TradeHistoryTable } from "@/components/strategy-detail/TradeHistoryTable";
import { TradeHistoryModal } from "@/components/TradeHistoryModal";
import { getStrategies } from "@/services/strategyService";
import { cleanupInvalidSignals } from "@/services/signalGenerationService";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";

type TimeRange = "7d" | "30d" | "all";

const Dashboard = () => {
  usePageTitle("Dashboard - StratAIge");
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [period, setPeriod] = useState<string>("Last Week");
  const [isTradeHistoryModalOpen, setIsTradeHistoryModalOpen] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    if (range === "7d") {
      setPeriod("Last Week");
    } else if (range === "30d") {
      setPeriod("Last Month");
    } else {
      setPeriod("All Time");
    }
  };

  // Simplified and consistent trade history fetching that matches StrategyDetail approach
  const fetchAllTradeHistory = async (strategies: any[]) => {
    try {
      const userStrategyIds = strategies.map(s => s.id);
      
      if (userStrategyIds.length === 0) {
        return [];
      }

      // Use the same query pattern as StrategyDetail for consistency
      let query = supabase
        .from("trading_signals")
        .select("*")
        .in("strategy_id", userStrategyIds)
        .order("created_at", { ascending: false });

      // Apply date filter based on timeRange
      if (timeRange === "7d") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query = query.gte("created_at", sevenDaysAgo.toISOString());
      } else if (timeRange === "30d") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = query.gte("created_at", thirtyDaysAgo.toISOString());
      }

      const { data: signals, error } = await query;

      if (error) {
        console.error('Error fetching trade history:', error);
        return [];
      }

      if (!signals || signals.length === 0) {
        console.log('No trading signals found for dashboard');
        return [];
      }

      console.log(`Dashboard: Found ${signals.length} trading signals for time range ${timeRange}`);

      // Create a map of strategy information for quick lookup
      const strategyMap = new Map();
      strategies.forEach(strategy => {
        strategyMap.set(strategy.id, {
          name: strategy.name,
          targetAsset: strategy.targetAsset
        });
      });

      // Format signals consistently with StrategyDetail approach
      const formattedTrades = signals.map(signal => {
        const signalData = (signal.signal_data as any) || {};
        const strategyInfo = strategyMap.get(signal.strategy_id);
        
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
          strategyName: strategyInfo?.name || 'Unknown Strategy',
          targetAsset: strategyInfo?.targetAsset || 'Unknown Asset'
        };
      });

      console.log(`Dashboard: Formatted ${formattedTrades.length} trades for display`);
      return formattedTrades;
    } catch (error) {
      console.error('Error in fetchAllTradeHistory:', error);
      return [];
    }
  };

  // Calculate metrics from user's strategies and signals
  const calculateMetrics = async (strategies: any[], allSignals: any[]) => {
    try {
      const userStrategyIds = strategies.map(s => s.id);
      
      // Calculate basic strategy metrics
      const totalStrategies = strategies.length;
      const activeStrategies = strategies.filter(s => s.signalNotificationsEnabled === true).length;

      // Get total signal count with time filter if needed
      let signalCountQuery = supabase
        .from("trading_signals")
        .select("id", { count: 'exact', head: true })
        .in("strategy_id", userStrategyIds.length > 0 ? userStrategyIds : ['']);

      if (timeRange === "7d") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        signalCountQuery = signalCountQuery.gte("created_at", sevenDaysAgo.toISOString());
      } else if (timeRange === "30d") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        signalCountQuery = signalCountQuery.gte("created_at", thirtyDaysAgo.toISOString());
      }

      const { count: totalSignalCount } = await signalCountQuery;

      // Calculate total conditions count
      let conditionsCount = 0;
      if (userStrategyIds.length > 0) {
        const { data: ruleGroups } = await supabase
          .from("rule_groups")
          .select("id")
          .in("strategy_id", userStrategyIds);

        if (ruleGroups && ruleGroups.length > 0) {
          const ruleGroupIds = ruleGroups.map(rg => rg.id);
          const { data: tradingRules } = await supabase
            .from("trading_rules")
            .select("id")
            .in("rule_group_id", ruleGroupIds);
          
          conditionsCount = tradingRules?.length || 0;
        }
      }

      console.log(`Dashboard metrics - Strategies: ${totalStrategies}, Active: ${activeStrategies}, Total Signals: ${totalSignalCount}, Conditions: ${conditionsCount}`);

      return {
        strategiesCount: totalStrategies.toString(),
        strategiesChange: { value: "+0", positive: false },
        activeStrategies: activeStrategies.toString(),
        activeChange: { value: "+0", positive: false },
        signalAmount: (totalSignalCount || 0).toString(),
        signalChange: { value: "+0", positive: false },
        conditionsCount: conditionsCount.toString(),
        conditionsChange: { value: "+0", positive: false }
      };
    } catch (error) {
      console.error("Error calculating metrics:", error);
      return {
        strategiesCount: "0",
        strategiesChange: { value: "+0", positive: false },
        activeStrategies: "0",
        activeChange: { value: "+0", positive: false },
        signalAmount: "0",
        signalChange: { value: "+0", positive: false },
        conditionsCount: "0",
        conditionsChange: { value: "+0", positive: false }
      };
    }
  };

  // Main data fetching function
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Clean up invalid signals first
      await cleanupInvalidSignals();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      console.log("Dashboard: Fetching strategies and signals");
      
      // Fetch user's strategies
      const strategies = await getStrategies();
      console.log(`Dashboard: Found ${strategies.length} strategies for user`);

      // Fetch trade history using the consistent approach
      const allTradeHistory = await fetchAllTradeHistory(strategies);
      
      // Calculate metrics
      const calculatedMetrics = await calculateMetrics(strategies, allTradeHistory);

      setMetrics(calculatedMetrics);
      setTradeHistory(allTradeHistory);
      
      console.log(`Dashboard: Successfully loaded ${allTradeHistory.length} trades`);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data", {
        description: "Using cached data. Please check your connection."
      });

      // Fallback metrics
      setMetrics({
        strategiesCount: "0",
        strategiesChange: { value: "+0", positive: false },
        activeStrategies: "0",
        activeChange: { value: "+0", positive: false },
        signalAmount: "0",
        signalChange: { value: "+0", positive: false },
        conditionsCount: "0",
        conditionsChange: { value: "+0", positive: false }
      });
      setTradeHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  // Fixed number of trades to show in the dashboard view
  const MAX_VISIBLE_TRADES = 5;

  const openTradeHistoryModal = () => {
    setIsTradeHistoryModalOpen(true);
  };

  const closeTradeHistoryModal = () => {
    setIsTradeHistoryModalOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1">
          <Container className="py-6">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <div className="flex items-center gap-2">
                <Button variant={timeRange === "7d" ? "default" : "outline"} onClick={() => handleTimeRangeChange("7d")}>
                  Last 7 Days
                </Button>
                <Button variant={timeRange === "30d" ? "default" : "outline"} onClick={() => handleTimeRangeChange("30d")}>
                  Last 30 Days
                </Button>
                <Button variant={timeRange === "all" ? "default" : "outline"} onClick={() => handleTimeRangeChange("all")}>
                  All Time
                </Button>
              </div>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-md border bg-card p-4 shadow-sm animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>

            <div className="grid gap-6 mt-6 lg:grid-cols-8">
              <div className="space-y-6 lg:col-span-5">
                <Card>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
              <div className="lg:col-span-3">
                <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </Container>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Container className="py-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-2">
              <Button variant={timeRange === "7d" ? "default" : "outline"} onClick={() => handleTimeRangeChange("7d")}>
                Last 7 Days
              </Button>
              <Button variant={timeRange === "30d" ? "default" : "outline"} onClick={() => handleTimeRangeChange("30d")}>
                Last 30 Days
              </Button>
              <Button variant={timeRange === "all" ? "default" : "outline"} onClick={() => handleTimeRangeChange("all")}>
                All Time
              </Button>
            </div>
          </div>
          
          {metrics && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard title="Total Strategies" value={metrics.strategiesCount} change={metrics.strategiesChange} />
              <MetricCard title="Active Strategies" value={metrics.activeStrategies} change={metrics.activeChange} />
              <MetricCard title="Signal Amount" value={metrics.signalAmount} change={metrics.signalChange} />
              <MetricCard title="Conditions" value={metrics.conditionsCount} change={metrics.conditionsChange} />
            </div>
          )}

          <div className="grid gap-6 mt-6 lg:grid-cols-8">
            <div className="space-y-6 lg:col-span-5">
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold">Trade History</h2>
                </div>

                <div className="px-6 pb-6">
                  <TradeHistoryTable 
                    trades={tradeHistory} 
                    maxRows={MAX_VISIBLE_TRADES} 
                    showViewAllButton={true} 
                    onViewAllClick={openTradeHistoryModal} 
                    enableRowClick={true} 
                  />
                </div>
              </Card>
            </div>
            <div className="lg:col-span-3">
              <StrategyList />
            </div>
          </div>

          {/* Recent Activities at the bottom */}
          <div className="mt-6">
            {/* Additional content can go here */}
          </div>
        </Container>
      </main>

      {/* Trade History Modal */}
      <TradeHistoryModal 
        isOpen={isTradeHistoryModalOpen} 
        onClose={closeTradeHistoryModal} 
        trades={tradeHistory} 
        title="All Trade History" 
      />
    </div>
  );
};

export default Dashboard;

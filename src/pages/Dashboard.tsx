import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { MetricCard } from "@/components/MetricCard";
import { Navbar } from "@/components/Navbar";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { StrategyList } from "@/components/StrategyList";
import { useState, useEffect } from "react";
import { TradeHistoryTable } from "@/components/strategy-detail/TradeHistoryTable";
import { TradeHistoryModal } from "@/components/TradeHistoryModal";
import { calculatePortfolioMetrics } from "@/services/marketDataService";
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

  // Fetch all trade history from trading_signals table
  const fetchAllTradeHistory = async (strategies: any[]) => {
    try {
      const userStrategyIds = strategies.map(s => s.id);
      
      if (userStrategyIds.length === 0) {
        return [];
      }

      // Get date range filter based on timeRange
      const now = new Date();
      let query = supabase
        .from("trading_signals")
        .select("*")
        .in("strategy_id", userStrategyIds)
        .eq("processed", true)
        .order("created_at", { ascending: false });

      // Apply date filter if not "all"
      if (timeRange === "7d") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = query.gte("created_at", sevenDaysAgo.toISOString());
      } else if (timeRange === "30d") {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        query = query.gte("created_at", thirtyDaysAgo.toISOString());
      }

      const { data: signals, error } = await query;

      if (error) {
        console.error('Error fetching trade history:', error);
        return [];
      }

      if (!signals || signals.length === 0) {
        return [];
      }

      // Create a map of strategy names for quick lookup
      const strategyMap = new Map();
      strategies.forEach(strategy => {
        strategyMap.set(strategy.id, {
          name: strategy.name,
          targetAsset: strategy.targetAsset
        });
      });

      // Format trading signals for display
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
          profit: signalData.profit !== null && signalData.profit !== undefined ? `${signalData.profit >= 0 ? '+' : ''}$${signalData.profit.toFixed(2)}` : null,
          profitPercentage: signalData.profitPercentage !== null && signalData.profitPercentage !== undefined ? `${signalData.profitPercentage >= 0 ? '+' : ''}${signalData.profitPercentage.toFixed(2)}%` : null,
          strategyId: signal.strategy_id,
          strategyName: strategyInfo?.name || 'Unknown Strategy',
          targetAsset: strategyInfo?.targetAsset || 'Unknown Asset'
        };
      });

      console.log(`Dashboard: Formatted ${formattedTrades.length} trades from trading_signals table`);
      return formattedTrades;
    } catch (error) {
      console.error('Error in fetchAllTradeHistory:', error);
      return [];
    }
  };

  // Calculate total conditions count from user's strategies
  const calculateConditionsCount = async (strategies: any[]) => {
    try {
      const userStrategyIds = strategies.map(s => s.id);
      
      if (userStrategyIds.length === 0) {
        return 0;
      }

      // Get all rule groups for user's strategies
      const { data: ruleGroups, error: ruleGroupsError } = await supabase
        .from("rule_groups")
        .select("id")
        .in("strategy_id", userStrategyIds);

      if (ruleGroupsError) {
        console.error('Error fetching rule groups:', ruleGroupsError);
        return 0;
      }

      if (!ruleGroups || ruleGroups.length === 0) {
        return 0;
      }

      const ruleGroupIds = ruleGroups.map(rg => rg.id);

      // Get all trading rules (conditions) for these rule groups
      const { data: tradingRules, error: tradingRulesError } = await supabase
        .from("trading_rules")
        .select("id")
        .in("rule_group_id", ruleGroupIds);

      if (tradingRulesError) {
        console.error('Error fetching trading rules:', tradingRulesError);
        return 0;
      }

      const conditionsCount = tradingRules?.length || 0;
      console.log(`Dashboard: Found ${conditionsCount} conditions across ${strategies.length} strategies`);
      
      return conditionsCount;
    } catch (error) {
      console.error('Error calculating conditions count:', error);
      return 0;
    }
  };

  // Fetch real-time data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // First clean up invalid signals
      await cleanupInvalidSignals();

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Fetch strategies and portfolio metrics in parallel
      const [strategies, portfolioMetrics] = await Promise.all([
        getStrategies(), 
        calculatePortfolioMetrics(timeRange)
      ]);

      // Calculate strategy metrics from actual user strategies
      const totalStrategies = strategies.length;
      const activeStrategies = strategies.filter(s => s.isActive).length;

      // Get ALL signals for the user's strategies (not just processed ones)
      const userStrategyIds = strategies.map(s => s.id);
      
      let totalSignalCount = 0;
      if (userStrategyIds.length > 0) {
        const { data: allSignals, error: signalsError } = await supabase
          .from("trading_signals")
          .select("id")
          .in("strategy_id", userStrategyIds);

        if (signalsError) {
          console.error("Error fetching total signals:", signalsError);
        } else {
          totalSignalCount = allSignals?.length || 0;
        }
      }

      console.log(`Dashboard metrics - Strategies: ${totalStrategies}, Active: ${activeStrategies}, Total Signals: ${totalSignalCount}`);

      // Fetch all trade history from trading_signals table
      const allTradeHistory = await fetchAllTradeHistory(strategies);

      // Calculate total conditions count
      const conditionsCount = await calculateConditionsCount(strategies);

      // Update metrics with real strategy counts and conditions count
      const updatedMetrics = {
        ...portfolioMetrics,
        strategiesCount: totalStrategies.toString(),
        strategiesChange: {
          value: "+0",
          positive: false
        },
        activeStrategies: activeStrategies.toString(),
        activeChange: {
          value: "+0",
          positive: false
        },
        signalAmount: totalSignalCount.toString(),
        signalChange: {
          value: "+0",
          positive: false
        },
        conditionsCount: conditionsCount.toString(),
        conditionsChange: {
          value: "+0",
          positive: false
        }
      };
      setMetrics(updatedMetrics);
      setTradeHistory(allTradeHistory);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data", {
        description: "Using cached data. Please check your connection."
      });

      // Fallback to zero metrics if API fails
      setMetrics({
        strategiesCount: "0",
        strategiesChange: {
          value: "+0",
          positive: false
        },
        activeStrategies: "0",
        activeChange: {
          value: "+0",
          positive: false
        },
        signalAmount: "0",
        signalChange: {
          value: "+0",
          positive: false
        },
        conditionsCount: "0",
        conditionsChange: {
          value: "+0",
          positive: false
        }
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

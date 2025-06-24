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
import { calculatePortfolioMetrics, getRealTradeHistory } from "@/services/marketDataService";
import { getStrategies } from "@/services/strategyService";
import { cleanupInvalidSignals, getCleanTradingSignals } from "@/services/signalCleanupService";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";

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

  // Fetch real-time data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // First clean up invalid signals
      await cleanupInvalidSignals();
      
      // Fetch strategies, portfolio metrics and real trade history in parallel
      const [strategies, portfolioMetrics, realTradeHistory] = await Promise.all([
        getStrategies(),
        calculatePortfolioMetrics(timeRange),
        getRealTradeHistory(timeRange)
      ]);

      // Calculate strategy metrics from actual user strategies
      const totalStrategies = strategies.length;
      const activeStrategies = strategies.filter(s => s.isActive).length;

      // Calculate signal amount and transaction amount from real trade history (not backtest data)
      const signalAmount = realTradeHistory.length;
      
      // Calculate total transaction amount as sum of (price × contracts) for each real trade
      const transactionAmount = realTradeHistory.reduce((total, trade) => {
        const price = parseFloat(trade.price.replace('$', '')) || 0;
        const contracts = parseInt(trade.contracts.toString()) || 0;
        const subtotal = price * contracts;
        console.log(`Real trade: price=${price}, contracts=${contracts}, subtotal=${subtotal}`);
        return total + subtotal;
      }, 0);

      console.log(`Total transaction amount from real trades: ${transactionAmount}`);
      console.log(`Real trade history data:`, realTradeHistory);

      // Update metrics with real strategy counts and real trading data
      const updatedMetrics = {
        ...portfolioMetrics,
        strategiesCount: totalStrategies.toString(),
        strategiesChange: { value: "+0", positive: false },
        activeStrategies: activeStrategies.toString(),
        activeChange: { value: "+0", positive: false },
        signalAmount: signalAmount.toString(),
        signalChange: { value: "+0", positive: false },
        transactionAmount: transactionAmount,
        transactionChange: { value: "+0", positive: false }
      };

      setMetrics(updatedMetrics);
      setTradeHistory(realTradeHistory);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data", {
        description: "Using cached data. Please check your connection."
      });
      
      // Fallback to zero metrics if API fails
      setMetrics({
        strategiesCount: "0",
        strategiesChange: { value: "+0", positive: false },
        activeStrategies: "0",
        activeChange: { value: "+0", positive: false },
        signalAmount: "0",
        signalChange: { value: "+0", positive: false },
        transactionAmount: 0,
        transactionChange: { value: "+0", positive: false }
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
              {[1, 2, 3, 4].map((i) => (
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
                      {[1, 2, 3].map((i) => (
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
              <MetricCard title="Transaction Amount of Signals" value={metrics.transactionAmount} change={metrics.transactionChange} trades={tradeHistory} />
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
            RecentActivities
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

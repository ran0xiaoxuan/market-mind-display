
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { MetricCard } from "@/components/MetricCard";
import { Navbar } from "@/components/Navbar";
import { StrategyList } from "@/components/StrategyList";
import { SubscriptionManagement } from "@/components/SubscriptionManagement";
import { useState } from "react";
import { TradeHistoryTable } from "@/components/strategy-detail/TradeHistoryTable";
import { TradeHistoryModal } from "@/components/TradeHistoryModal";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useOptimizedDashboard } from "@/hooks/useOptimizedDashboard";

type TimeRange = "7d" | "30d" | "all";

const Dashboard = () => {
  usePageTitle("Dashboard - StratAIge");
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [isTradeHistoryModalOpen, setIsTradeHistoryModalOpen] = useState(false);

  const { data: dashboardData, isLoading, error, refetch } = useOptimizedDashboard(timeRange);

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  // Fixed number of trades to show in the dashboard view
  const MAX_VISIBLE_TRADES = 5;

  const openTradeHistoryModal = () => {
    setIsTradeHistoryModalOpen(true);
  };

  const closeTradeHistoryModal = () => {
    setIsTradeHistoryModalOpen(false);
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
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
              <div className="lg:col-span-3 space-y-6">
                <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </Container>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1">
          <Container className="py-6">
            <div className="text-center py-12">
              <p className="text-destructive mb-4">Failed to load dashboard data</p>
              <Button onClick={handleRefresh}>Retry</Button>
            </div>
          </Container>
        </main>
      </div>
    );
  }

  const { metrics, recentTrades } = dashboardData || { metrics: null, recentTrades: [] };

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
              <Button variant="ghost" size="sm" onClick={handleRefresh}>
                🔄 Refresh
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
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Trade History</h2>
                    <span className="text-sm text-gray-500">
                      Showing {Math.min(recentTrades.length, MAX_VISIBLE_TRADES)} of {recentTrades.length} signals
                    </span>
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <TradeHistoryTable 
                    trades={recentTrades} 
                    maxRows={MAX_VISIBLE_TRADES} 
                    showViewAllButton={true} 
                    onViewAllClick={openTradeHistoryModal} 
                    enableRowClick={true} 
                  />
                </div>
              </Card>
            </div>
            <div className="lg:col-span-3 space-y-6">
              <SubscriptionManagement />
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
        trades={recentTrades} 
        title="All Trade History" 
      />
    </div>
  );
};

export default Dashboard;

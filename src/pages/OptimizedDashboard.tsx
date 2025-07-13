
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { MetricCard } from "@/components/MetricCard";
import { Navbar } from "@/components/Navbar";
import { OptimizedStrategyList } from "@/components/OptimizedStrategyList";
import { useState } from "react";
import { TradeHistoryModal } from "@/components/TradeHistoryModal";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/Badge";
import { useNavigate } from "react-router-dom";
import { useOptimizedDashboard } from "@/hooks/useOptimizedDashboard";

type TimeRange = "7d" | "30d" | "all";

const OptimizedDashboard = () => {
  usePageTitle("Dashboard - StratAIge");
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [isTradeHistoryModalOpen, setIsTradeHistoryModalOpen] = useState(false);
  const navigate = useNavigate();

  // Use the optimized dashboard hook
  const { data: dashboardData, isLoading, error } = useOptimizedDashboard(timeRange);

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  const MAX_VISIBLE_TRADES = 10;

  const openTradeHistoryModal = () => {
    setIsTradeHistoryModalOpen(true);
  };

  const closeTradeHistoryModal = () => {
    setIsTradeHistoryModalOpen(false);
  };

  const handleRowClick = (trade: any) => {
    if (trade.strategyId) {
      navigate(`/strategy/${trade.strategyId}`);
    }
  };

  // Format date to YYYY/MM/DD HH:MM format
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}/${month}/${day} ${hours}:${minutes}`;
    } catch (error) {
      return dateString;
    }
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
              <div className="lg:col-span-3">
                <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
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
              <p className="text-destructive mb-4">Failed to load dashboard data: {error.message}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </Container>
        </main>
      </div>
    );
  }

  const { metrics, recentTrades } = dashboardData || { metrics: null, recentTrades: [] };
  const displayTrades = recentTrades.slice(0, MAX_VISIBLE_TRADES);

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
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Trade History</h2>
                    <p className="text-sm text-muted-foreground">
                      Showing {Math.min(MAX_VISIBLE_TRADES, recentTrades.length)} of {recentTrades.length} signals
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/20">
                          <TableHead className="whitespace-nowrap font-medium">Asset</TableHead>
                          <TableHead className="whitespace-nowrap font-medium">Type</TableHead>
                          <TableHead className="whitespace-nowrap font-medium">Time</TableHead>
                          <TableHead className="whitespace-nowrap font-medium">Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayTrades.length > 0 ? (
                          displayTrades.map((trade) => {
                            const isBuy = trade.type.toLowerCase().includes('buy');
                            
                            return (
                              <TableRow 
                                key={trade.id} 
                                className="cursor-pointer hover:bg-muted/60"
                                onClick={() => handleRowClick(trade)}
                              >
                                <TableCell>
                                  <div className="max-w-[160px] truncate">
                                    {trade.targetAsset || "—"}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={isBuy ? "default" : "outline"}
                                    className={isBuy ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"}
                                  >
                                    {trade.type}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {formatDateTime(trade.date)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {trade.price}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                              {isLoading ? "Loading signals..." : "No trading signals found"}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {recentTrades.length > MAX_VISIBLE_TRADES && (
                    <div className="mt-4 flex justify-center">
                      <Button 
                        variant="outline" 
                        onClick={openTradeHistoryModal}
                        className="w-full"
                      >
                        View All Signals ({recentTrades.length})
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
            <div className="lg:col-span-3">
              <OptimizedStrategyList />
            </div>
          </div>

          <div className="mt-6">
            {/* Additional content can go here */}
          </div>
        </Container>
      </main>

      <TradeHistoryModal 
        isOpen={isTradeHistoryModalOpen} 
        onClose={closeTradeHistoryModal} 
        trades={recentTrades} 
        title="All Trading Signals" 
      />
    </div>
  );
};

export default OptimizedDashboard;

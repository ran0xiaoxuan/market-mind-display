import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { MetricSummary } from "@/components/MetricSummary";
import { AnalyticsTabs } from "@/components/AnalyticsTabs";
import { ChartPlaceholder } from "@/components/ChartPlaceholder";
import { Card } from "@/components/ui/card";
import { PerformanceChart } from "@/components/PerformanceChart";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { PerformanceMetricsGrid } from "@/components/PerformanceMetricsGrid";
import { ValueAtRisk } from "@/components/ValueAtRisk";
import { StrategyRankings } from "@/components/StrategyRankings";
import { StrategyComparisonTable } from "@/components/StrategyComparisonTable";
import { AssetCorrelation } from "@/components/AssetCorrelation";
import { RecentTrades } from "@/components/RecentTrades";
import { PeriodSelector } from "@/components/PeriodSelector";
import { FileDown } from "lucide-react";
const mainTabs = ["Performance", "Strategy Comparison", "Risk Analysis", "Market Correlation", "Trade Analysis"];
const Analytics = () => {
  const [currentTab, setCurrentTab] = useState("Performance");
  const [period, setPeriod] = useState("Last Month");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");
  const handleTimeRangeChange = (range: "7d" | "30d" | "all") => {
    setTimeRange(range);
  };
  return <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <div className="flex items-center gap-2">
            <Button variant={timeRange === "7d" ? "default" : "outline"} size="sm" onClick={() => handleTimeRangeChange("7d")}>
              7 Days
            </Button>
            
            <Button variant={timeRange === "30d" ? "default" : "outline"} size="sm" onClick={() => handleTimeRangeChange("30d")}>
              30 Days
            </Button>
            
            <Button variant={timeRange === "all" ? "default" : "outline"} size="sm" onClick={() => handleTimeRangeChange("all")}>
              All Time
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricSummary title="Total Return" value="+24.8%" changeValue="+2.5%" changePositive={true} valueColor="positive" />
          <MetricSummary title="Sharpe Ratio" value="1.85" changeValue="+0.12" changePositive={true} />
          <MetricSummary title="Win Rate" value="68.5%" changeValue="+1.2%" changePositive={true} />
          <MetricSummary title="Max Drawdown" value="-8.3%" changeValue="+0.7%" changePositive={true} valueColor="negative" />
        </div>

        <AnalyticsTabs tabs={mainTabs} activeTab={currentTab} onTabChange={setCurrentTab} />

        <div className="mt-6">
          {currentTab === "Performance" && <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Equity Curve</h3>
                      <p className="text-sm text-muted-foreground">Portfolio performance over time</p>
                    </div>
                  </div>
                  <PerformanceChart type="equity" timeRange={timeRange} />
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Returns Analysis</h3>
                      <p className="text-sm text-muted-foreground">Return Performance over time</p>
                    </div>
                  </div>
                  <PerformanceChart type="returns" timeRange={timeRange} />
                </Card>
              </div>

              <PerformanceMetricsGrid />
            </div>}

          {currentTab === "Strategy Comparison" && <div className="space-y-8">
              <div className="grid grid-cols-5 gap-8">
                <div className="col-span-2">
                  <StrategyRankings />
                </div>
                <div className="col-span-3">
                  <StrategyComparisonTable />
                </div>
              </div>
            </div>}

          {currentTab === "Risk Analysis" && <div className="space-y-8">
              
              
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Volatility Analysis</h3>
                  <p className="text-sm text-muted-foreground mb-4">Historical volatility compared to benchmark</p>
                  <PerformanceChart type="volatility" timeRange={timeRange} />
                </Card>
                
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Drawdown Analysis</h3>
                  <p className="text-sm text-muted-foreground mb-4">Historical drawdowns over time</p>
                  <PerformanceChart type="drawdown" timeRange={timeRange} />
                </Card>
              </div>

              <ValueAtRisk />
            </div>}

          {currentTab === "Market Correlation"}

          {currentTab === "Trade Analysis" && <div className="space-y-8">
              
              
              
              

              <RecentTrades />
            </div>}
        </div>
      </main>
    </div>;
};
export default Analytics;

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

const mainTabs = [
  "Performance",
  "Strategy Comparison",
  "Risk Analysis",
  "Market Correlation",
  "Trade Analysis"
];

const Analytics = () => {
  const [currentTab, setCurrentTab] = useState("Performance");
  const [period, setPeriod] = useState("Last Month");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");

  const handleTimeRangeChange = (range: "7d" | "30d" | "all") => {
    setTimeRange(range);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant={timeRange === "7d" ? "default" : "outline"} 
              size="sm"
              onClick={() => handleTimeRangeChange("7d")}
            >
              7 Days
            </Button>
            <Button 
              variant={timeRange === "30d" ? "default" : "outline"} 
              size="sm"
              onClick={() => handleTimeRangeChange("30d")}
            >
              30 Days
            </Button>
            <Button 
              variant={timeRange === "all" ? "default" : "outline"} 
              size="sm"
              onClick={() => handleTimeRangeChange("all")}
            >
              All Time
            </Button>
          </div>
        </div>

        {/* Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricSummary 
            title="Total Return" 
            value="+24.8%" 
            changeValue="+2.5%" 
            changePositive={true}
            valueColor="positive" 
          />
          <MetricSummary 
            title="Sharpe Ratio" 
            value="1.85" 
            changeValue="+0.12" 
            changePositive={true} 
          />
          <MetricSummary 
            title="Win Rate" 
            value="68.5%" 
            changeValue="+1.2%" 
            changePositive={true} 
          />
          <MetricSummary 
            title="Max Drawdown" 
            value="-8.3%" 
            changeValue="+0.7%" 
            changePositive={true}
            valueColor="negative" 
          />
        </div>

        {/* Navigation Tabs */}
        <AnalyticsTabs 
          tabs={mainTabs} 
          activeTab={currentTab} 
          onTabChange={setCurrentTab} 
        />

        {/* Tab Content */}
        <div className="mt-6">
          {/* Performance Tab */}
          {currentTab === "Performance" && (
            <div className="space-y-8">
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
                      <h3 className="text-lg font-semibold">Monthly Returns</h3>
                      <p className="text-sm text-muted-foreground">Performance by month</p>
                    </div>
                  </div>
                  <PerformanceChart type="returns" timeRange={timeRange} />
                </Card>
              </div>

              <PerformanceMetricsGrid />
            </div>
          )}

          {/* Strategy Comparison Tab */}
          {currentTab === "Strategy Comparison" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Strategy Comparison</h2>
                <Button variant="outline" size="sm">Total Return</Button>
              </div>
              <p className="text-sm text-muted-foreground -mt-6">Compare performance across different strategies</p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Performance Comparison</h3>
                  <p className="text-sm text-muted-foreground mb-4">Strategy returns over time</p>
                  <PerformanceChart type="equity" timeRange={timeRange} />
                </Card>
                
                <StrategyRankings />
              </div>

              <StrategyComparisonTable />
            </div>
          )}

          {/* Risk Analysis Tab */}
          {currentTab === "Risk Analysis" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Risk Analysis</h2>
                <Button variant="outline" size="sm">Export Report</Button>
              </div>
              <p className="text-sm text-muted-foreground -mt-6">Analyze portfolio risk metrics and exposure</p>
              
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
            </div>
          )}

          {/* Market Correlation Tab */}
          {currentTab === "Market Correlation" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Market Correlation</h2>
                <Button variant="outline" size="sm">All Markets</Button>
              </div>
              <p className="text-sm text-muted-foreground -mt-6">Analyze correlations between strategies and market indices</p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Correlation Matrix</h3>
                  <p className="text-sm text-muted-foreground mb-4">Correlation between strategies and indices</p>
                  <ChartPlaceholder title="Correlation matrix not available" />
                </Card>
                
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Sector Exposure</h3>
                  <p className="text-sm text-muted-foreground mb-4">Portfolio allocation by sector</p>
                  <ChartPlaceholder title="Sector exposure chart not available" />
                </Card>
              </div>

              <AssetCorrelation />
            </div>
          )}

          {/* Trade Analysis Tab */}
          {currentTab === "Trade Analysis" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Trade Analysis</h2>
                <Button variant="outline" size="sm">All Strategies</Button>
              </div>
              <p className="text-sm text-muted-foreground -mt-6">Analyze trading patterns and performance</p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Trade Distribution</h3>
                  <p className="text-sm text-muted-foreground mb-4">Distribution of trade profits and losses</p>
                  <PerformanceChart 
                    type="returns" 
                    timeRange={timeRange}
                    title="Trade P&L Distribution"
                    description="Distribution of profitable and unprofitable trades"
                  />
                </Card>
                
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Trade Timing</h3>
                  <p className="text-sm text-muted-foreground mb-4">Analysis of trade timing patterns</p>
                  <ChartPlaceholder title="Trade timing chart not available" />
                </Card>
              </div>

              <RecentTrades />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Analytics;

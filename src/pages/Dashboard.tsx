import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { Navbar } from "@/components/Navbar";
import { PerformanceChart } from "@/components/PerformanceChart";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { StrategyList } from "@/components/StrategyList";
import { useState } from "react";
type TimeRange = "7d" | "30d" | "all";
const Dashboard = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [period, setPeriod] = useState<string>("Last Week");
  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    // Update period selector based on time range
    if (range === "7d") {
      setPeriod("Last Week");
    } else if (range === "30d") {
      setPeriod("Last Month");
    } else {
      setPeriod("All Time");
    }
  };

  // Get metrics data based on time range
  const getMetricCardData = (timeRange: TimeRange) => {
    if (timeRange === "7d") {
      return {
        strategiesCount: "12",
        strategiesChange: {
          value: "+0",
          positive: false
        },
        activeStrategies: "8",
        activeChange: {
          value: "+0",
          positive: false
        },
        totalReturn: "+3.5%",
        returnChange: {
          value: "+1.2%",
          positive: true
        },
        sharpeRatio: "1.4",
        sharpeChange: {
          value: "+0.1",
          positive: true
        }
      };
    } else if (timeRange === "30d") {
      return {
        strategiesCount: "12",
        strategiesChange: {
          value: "+1",
          positive: true
        },
        activeStrategies: "8",
        activeChange: {
          value: "+1",
          positive: true
        },
        totalReturn: "+12.5%",
        returnChange: {
          value: "+1.8%",
          positive: true
        },
        sharpeRatio: "1.6",
        sharpeChange: {
          value: "+0.2",
          positive: true
        }
      };
    } else {
      return {
        strategiesCount: "12",
        strategiesChange: {
          value: "+2",
          positive: true
        },
        activeStrategies: "8",
        activeChange: {
          value: "+1",
          positive: true
        },
        totalReturn: "+50.0%",
        returnChange: {
          value: "+2.3%",
          positive: true
        },
        sharpeRatio: "1.8",
        sharpeChange: {
          value: "+0.2",
          positive: true
        }
      };
    }
  };
  const metrics = getMetricCardData(timeRange);
  return <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-4 md:p-6">
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
          <MetricCard title="Total Strategies" value={metrics.strategiesCount} change={metrics.strategiesChange} />
          <MetricCard title="Active Strategies" value={metrics.activeStrategies} change={metrics.activeChange} />
          <MetricCard title="Total Return" value={metrics.totalReturn} change={metrics.returnChange} direction="up" />
          <MetricCard title="Sharpe Ratio" value={metrics.sharpeRatio} change={metrics.sharpeChange} direction="up" />
        </div>

        <div className="grid gap-6 mt-6 md:grid-cols-3 lg:grid-cols-8">
          <div className="space-y-6 md:col-span-2 lg:col-span-5">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold">Performance Overview</h2>
                
              </div>

              <PerformanceChart type="equity" timeRange={timeRange} showBenchmark={true} />
              <div className="p-6">
                <PerformanceMetrics type="equity" timeRange={timeRange} />
              </div>
            </Card>
          </div>
          <div className="md:col-span-1 lg:col-span-3">
            <StrategyList />
          </div>
        </div>
      </main>
    </div>;
};
export default Dashboard;
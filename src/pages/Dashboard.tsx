import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { Navbar } from "@/components/Navbar";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { StrategyList } from "@/components/StrategyList";
import { useState } from "react";
import { TradeHistoryTable } from "@/components/strategy-detail/TradeHistoryTable";

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

  // Sample trade history data with strategyId included
  const getTradeHistoryData = (timeRange: TimeRange) => {
    if (timeRange === "7d") {
      return [{
        id: "T1001",
        date: "2025-05-20",
        type: "Buy",
        signal: "RSI Oversold",
        price: "$178.45",
        contracts: 100,
        profit: "+$320.50",
        profitPercentage: "+1.8%",
        strategyName: "Mean Reversion", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440000", // Added strategyId
        targetAsset: "AAPL"
      }, {
        id: "T1002",
        date: "2025-05-19",
        type: "Sell",
        signal: "MA Crossover",
        price: "$402.10",
        contracts: 50,
        profit: "-$145.20",
        profitPercentage: "-0.7%",
        strategyName: "Trend Following", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440001", // Added strategyId
        targetAsset: "TSLA"
      }, {
        id: "T1003",
        date: "2025-05-18",
        type: "Buy",
        signal: "Support Level",
        price: "$924.30",
        contracts: 25,
        profit: null,
        profitPercentage: null,
        strategyName: "Breakout", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440002", // Added strategyId
        targetAsset: "NVDA"
      }, {
        id: "T1004",
        date: "2025-05-17",
        type: "Sell",
        signal: "Resistance Break",
        price: "$185.60",
        contracts: 150,
        profit: "+$420.30",
        profitPercentage: "+1.5%",
        strategyName: "Range Trading", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440003", // Added strategyId
        targetAsset: "MSFT"
      }, {
        id: "T1005",
        date: "2025-05-15",
        type: "Buy",
        signal: "MACD Signal",
        price: "$345.25",
        contracts: 75,
        profit: null,
        profitPercentage: null,
        strategyName: "Momentum", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440004", // Added strategyId
        targetAsset: "AMZN"
      }];
    } else if (timeRange === "30d") {
      return [{
        id: "T1001",
        date: "2025-05-20",
        type: "Buy",
        signal: "RSI Oversold",
        price: "$178.45",
        contracts: 100,
        profit: null,
        profitPercentage: null,
        strategyName: "Mean Reversion", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440005", // Added strategyId
        targetAsset: "AAPL"
      }, {
        id: "T1002",
        date: "2025-05-19",
        type: "Sell",
        signal: "MA Crossover",
        price: "$402.10",
        contracts: 50,
        profit: "-$145.20",
        profitPercentage: "-0.7%",
        strategyName: "Trend Following", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440006", // Added strategyId
        targetAsset: "TSLA"
      }, {
        id: "T1003",
        date: "2025-05-18",
        type: "Buy",
        signal: "Support Level",
        price: "$924.30",
        contracts: 25,
        profit: null,
        profitPercentage: null,
        strategyName: "Breakout", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440007", // Added strategyId
        targetAsset: "NVDA"
      }, {
        id: "T1004",
        date: "2025-05-17",
        type: "Sell",
        signal: "Resistance Break",
        price: "$185.60",
        contracts: 150,
        profit: "+$420.30",
        profitPercentage: "+1.5%",
        strategyName: "Range Trading", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440008", // Added strategyId
        targetAsset: "MSFT"
      }, {
        id: "T1005",
        date: "2025-05-15",
        type: "Buy",
        signal: "MACD Signal",
        price: "$345.25",
        contracts: 75,
        profit: null,
        profitPercentage: null,
        strategyName: "Momentum", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440009", // Added strategyId
        targetAsset: "AMZN"
      }, {
        id: "T1006",
        date: "2025-05-10",
        type: "Sell",
        signal: "Bollinger Bands",
        price: "$532.75",
        contracts: 40,
        profit: "+$380.60",
        profitPercentage: "+1.8%",
        strategyName: "Bollinger Strategy", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440010", // Added strategyId
        targetAsset: "GOOG"
      }, {
        id: "T1007",
        date: "2025-05-05",
        type: "Buy",
        signal: "Fibonacci Level",
        price: "$125.40",
        contracts: 200,
        profit: null,
        profitPercentage: null,
        strategyName: "Fibonacci Strategy", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440011", // Added strategyId
        targetAsset: "GOOG"
      }, {
        id: "T1008",
        date: "2025-04-25",
        type: "Sell",
        signal: "Volume Spike",
        price: "$276.30",
        contracts: 80,
        profit: "-$320.15",
        profitPercentage: "-1.5%",
        strategyName: "Volume Analysis", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440012", // Added strategyId
        targetAsset: "META"
      }];
    } else {
      return [{
        id: "T1001",
        date: "2025-05-20",
        type: "Buy",
        signal: "RSI Oversold",
        price: "$178.45",
        contracts: 100,
        profit: null,
        profitPercentage: null,
        strategyName: "Mean Reversion", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440013", // Added strategyId
        targetAsset: "AAPL"
      }, {
        id: "T1002",
        date: "2025-05-19",
        type: "Sell",
        signal: "MA Crossover",
        price: "$402.10",
        contracts: 50,
        profit: "-$145.20",
        profitPercentage: "-0.7%",
        strategyName: "Trend Following", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440014", // Added strategyId
        targetAsset: "TSLA"
      }, {
        id: "T1003",
        date: "2025-05-18",
        type: "Buy",
        signal: "Support Level",
        price: "$924.30",
        contracts: 25,
        profit: null,
        profitPercentage: null,
        strategyName: "Breakout", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440015", // Added strategyId
        targetAsset: "NVDA"
      }, {
        id: "T1004",
        date: "2025-05-17",
        type: "Sell",
        signal: "Resistance Break",
        price: "$185.60",
        contracts: 150,
        profit: "+$420.30",
        profitPercentage: "+1.5%",
        strategyName: "Range Trading", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440016", // Added strategyId
        targetAsset: "MSFT"
      }, {
        id: "T1005",
        date: "2025-05-15",
        type: "Buy",
        signal: "MACD Signal",
        price: "$345.25",
        contracts: 75,
        profit: null,
        profitPercentage: null,
        strategyName: "Momentum", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440017", // Added strategyId
        targetAsset: "AMZN"
      }, {
        id: "T1006",
        date: "2025-05-10",
        type: "Sell",
        signal: "Bollinger Bands",
        price: "$532.75",
        contracts: 40,
        profit: "+$380.60",
        profitPercentage: "+1.8%",
        strategyName: "Bollinger Strategy", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440018", // Added strategyId
        targetAsset: "GOOG"
      }, {
        id: "T1007",
        date: "2025-05-05",
        type: "Buy",
        signal: "Fibonacci Level",
        price: "$125.40",
        contracts: 200,
        profit: null,
        profitPercentage: null,
        strategyName: "Fibonacci Strategy", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440019", // Added strategyId
        targetAsset: "GOOG"
      }, {
        id: "T1008",
        date: "2025-04-25",
        type: "Sell",
        signal: "Volume Spike",
        price: "$276.30",
        contracts: 80,
        profit: "-$320.15",
        profitPercentage: "-1.5%",
        strategyName: "Volume Analysis", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440020", // Added strategyId
        targetAsset: "META"
      }, {
        id: "T1009",
        date: "2025-04-10",
        type: "Buy",
        signal: "Trend Line Break",
        price: "$642.80",
        contracts: 35,
        profit: "+$425.50",
        profitPercentage: "+1.9%",
        strategyName: "Trend Breakout", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440021", // Added strategyId
        targetAsset: "AMD"
      }, {
        id: "T1010",
        date: "2025-03-20",
        type: "Sell",
        signal: "Head and Shoulders",
        price: "$185.30",
        contracts: 120,
        profit: "+$620.75",
        profitPercentage: "+2.8%",
        strategyName: "Head and Shoulders", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440022", // Added strategyId
        targetAsset: "AMD"
      }, {
        id: "T1011",
        date: "2025-02-15",
        type: "Buy",
        signal: "Golden Cross",
        price: "$358.45",
        contracts: 60,
        profit: null,
        profitPercentage: null,
        strategyName: "Cross Signals", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440023", // Added strategyId
        targetAsset: "AMD"
      }, {
        id: "T1012",
        date: "2025-01-05",
        type: "Sell",
        signal: "Divergence",
        price: "$476.90",
        contracts: 90,
        profit: "-$280.30",
        profitPercentage: "-0.6%",
        strategyName: "Divergence Strategy", // Fallback name
        strategyId: "550e8400-e29b-41d4-a716-446655440024", // Added strategyId
        targetAsset: "INTC"
      }];
    }
  };

  const metrics = getMetricCardData(timeRange);
  const tradeHistory = getTradeHistoryData(timeRange);
  
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
                <h2 className="text-xl font-bold">Trade History</h2>
              </div>

              <div className="px-6 pb-6">
                <TradeHistoryTable trades={tradeHistory} />
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

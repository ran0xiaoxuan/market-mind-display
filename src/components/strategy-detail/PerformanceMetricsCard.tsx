
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PerformanceMetricsProps {
  totalReturn: string;
  annualizedReturn: string;
  sharpeRatio: string;
  maxDrawdown: string;
  winRate: string;
}

interface TradeStatsProps {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgProfit: string;
  avgLoss: string;
}

interface PerformanceMetricsCardProps {
  strategyId: string;
}

export const PerformanceMetricsCard = ({
  strategyId
}: PerformanceMetricsCardProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetricsProps>({
    totalReturn: "0%",
    annualizedReturn: "0%",
    sharpeRatio: "0",
    maxDrawdown: "0%",
    winRate: "0%"
  });
  const [tradeStats, setTradeStats] = useState<TradeStatsProps>({
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    avgProfit: "$0",
    avgLoss: "$0"
  });

  useEffect(() => {
    const fetchBacktestData = async () => {
      try {
        setLoading(true);
        console.log("Fetching backtest data for strategy:", strategyId);

        // Get latest backtest for this strategy
        const { data: backtest, error: backtestError } = await supabase
          .from("backtests")
          .select("*")
          .eq("strategy_id", strategyId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (backtestError) {
          console.error("Error fetching backtest:", backtestError);
          throw backtestError;
        }

        console.log("Backtest data retrieved:", backtest);

        if (!backtest || backtest.length === 0) {
          console.log("No backtest data found for strategy");
          setLoading(false);
          return;
        }

        const latestBacktest = backtest[0];
        console.log("Latest backtest:", latestBacktest);
        
        // Helper function to safely format numbers
        const formatPercentage = (value: number | null): string => {
          if (value === null || value === undefined || isNaN(value)) {
            console.log("Invalid percentage value:", value);
            return "0.00%";
          }
          return `${value.toFixed(2)}%`;
        };

        const formatNumber = (value: number | null, decimals: number = 2): string => {
          if (value === null || value === undefined || isNaN(value)) {
            console.log("Invalid number value:", value);
            return "0.00";
          }
          return value.toFixed(decimals);
        };

        const formatCurrency = (value: number | null): string => {
          if (value === null || value === undefined || isNaN(value)) {
            console.log("Invalid currency value:", value);
            return "$0.00";
          }
          return `$${value.toFixed(2)}`;
        };

        // Format the metrics with proper null handling
        const formattedMetrics = {
          totalReturn: formatPercentage(latestBacktest.total_return_percentage),
          annualizedReturn: formatPercentage(latestBacktest.annualized_return),
          sharpeRatio: formatNumber(latestBacktest.sharpe_ratio),
          maxDrawdown: formatPercentage(latestBacktest.max_drawdown),
          winRate: formatPercentage(latestBacktest.win_rate)
        };

        const formattedTradeStats = {
          totalTrades: latestBacktest.total_trades || 0,
          winningTrades: latestBacktest.winning_trades || 0,
          losingTrades: latestBacktest.losing_trades || 0,
          avgProfit: formatCurrency(latestBacktest.avg_profit),
          avgLoss: formatCurrency(latestBacktest.avg_loss)
        };

        console.log("Formatted metrics:", formattedMetrics);
        console.log("Formatted trade stats:", formattedTradeStats);

        setPerformanceMetrics(formattedMetrics);
        setTradeStats(formattedTradeStats);
      } catch (err: any) {
        console.error("Error fetching backtest data:", err);
        setError("Failed to load performance metrics");
      } finally {
        setLoading(false);
      }
    };

    if (strategyId) {
      fetchBacktestData();
    }
  }, [strategyId]);

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-2">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-2">Performance Metrics</h2>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-2">Performance Metrics</h2>
      <p className="text-sm text-muted-foreground mb-4">Detailed performance analysis</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Total Return</span>
              <span className="text-sm font-medium text-green-500">
                {performanceMetrics.totalReturn}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Annualized Return</span>
              <span className="text-sm font-medium text-green-500">
                {performanceMetrics.annualizedReturn}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Sharpe Ratio</span>
              <span className="text-sm font-medium">
                {performanceMetrics.sharpeRatio}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Max Drawdown</span>
              <span className="text-sm font-medium text-red-500">
                {performanceMetrics.maxDrawdown}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Win Rate</span>
              <span className="text-sm font-medium">
                {performanceMetrics.winRate}
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Total Trades</span>
              <span className="text-sm font-medium">
                {tradeStats.totalTrades}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Winning Trades</span>
              <span className="text-sm font-medium">
                {tradeStats.winningTrades}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Losing Trades</span>
              <span className="text-sm font-medium">
                {tradeStats.losingTrades}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Avg. Profit</span>
              <span className="text-sm font-medium text-green-500">
                {tradeStats.avgProfit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Avg. Loss</span>
              <span className="text-sm font-medium text-red-500">
                {tradeStats.avgLoss}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

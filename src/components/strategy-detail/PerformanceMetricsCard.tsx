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
    const fetchAndCalculateMetrics = async () => {
      try {
        setLoading(true);
        console.log("Fetching trade data for strategy:", strategyId);

        // Get latest backtest for this strategy to get trades
        const { data: backtest, error: backtestError } = await supabase
          .from("backtests")
          .select("id, initial_capital")
          .eq("strategy_id", strategyId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (backtestError) {
          console.error("Error fetching backtest:", backtestError);
          throw backtestError;
        }

        if (!backtest || backtest.length === 0) {
          console.log("No backtest data found for strategy");
          setLoading(false);
          return;
        }

        const latestBacktest = backtest[0];
        console.log("Latest backtest:", latestBacktest);

        // Fetch actual trade data
        const { data: trades, error: tradesError } = await supabase
          .from("backtest_trades")
          .select("*")
          .eq("backtest_id", latestBacktest.id)
          .order("date", { ascending: true });

        if (tradesError) {
          console.error("Error fetching trades:", tradesError);
          throw tradesError;
        }

        console.log("Trades data retrieved:", trades);

        if (!trades || trades.length === 0) {
          console.log("No trades found for backtest");
          setLoading(false);
          return;
        }

        // Calculate metrics from trade data
        const initialCapital = latestBacktest.initial_capital || 10000;
        let totalProfit = 0;
        let winningTrades = 0;
        let losingTrades = 0;
        let totalWinningProfit = 0;
        let totalLosingProfit = 0;
        let runningBalance = initialCapital;
        let peak = initialCapital;
        let maxDrawdown = 0;
        const returns: number[] = [];

        // Process trades to calculate metrics
        trades.forEach((trade) => {
          const profit = trade.profit || 0;
          totalProfit += profit;
          runningBalance += profit;

          // Track peak and drawdown
          if (runningBalance > peak) {
            peak = runningBalance;
          }
          const currentDrawdown = ((peak - runningBalance) / peak) * 100;
          if (currentDrawdown > maxDrawdown) {
            maxDrawdown = currentDrawdown;
          }

          // Count winning/losing trades and track profits/losses
          if (profit > 0) {
            winningTrades++;
            totalWinningProfit += profit;
          } else if (profit < 0) {
            losingTrades++;
            totalLosingProfit += Math.abs(profit);
          }

          // Calculate return for this trade
          if (trade.profit_percentage) {
            returns.push(trade.profit_percentage);
          }
        });

        // Calculate total return percentage
        const totalReturnPercentage = ((runningBalance - initialCapital) / initialCapital) * 100;

        // Calculate annualized return (simplified - assumes 1 year period)
        const annualizedReturn = totalReturnPercentage;

        // Calculate win rate
        const totalTradesCount = winningTrades + losingTrades;
        const winRate = totalTradesCount > 0 ? (winningTrades / totalTradesCount) * 100 : 0;

        // Calculate average profit and loss
        const avgProfit = winningTrades > 0 ? totalWinningProfit / winningTrades : 0;
        const avgLoss = losingTrades > 0 ? totalLosingProfit / losingTrades : 0;

        // Calculate Sharpe ratio (simplified)
        let sharpeRatio = 0;
        if (returns.length > 0) {
          const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
          const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
          const stdDev = Math.sqrt(variance);
          if (stdDev > 0) {
            sharpeRatio = (avgReturn - 2) / stdDev; // Assuming 2% risk-free rate
          }
        }

        // Format the calculated metrics
        const formattedMetrics = {
          totalReturn: `${totalReturnPercentage >= 0 ? '+' : ''}${totalReturnPercentage.toFixed(2)}%`,
          annualizedReturn: `${annualizedReturn >= 0 ? '+' : ''}${annualizedReturn.toFixed(2)}%`,
          sharpeRatio: sharpeRatio.toFixed(2),
          maxDrawdown: `-${maxDrawdown.toFixed(2)}%`,
          winRate: `${winRate.toFixed(2)}%`
        };

        const formattedTradeStats = {
          totalTrades: trades.length,
          winningTrades,
          losingTrades,
          avgProfit: `$${avgProfit.toFixed(2)}`,
          avgLoss: `$${avgLoss.toFixed(2)}`
        };

        console.log("Calculated metrics:", formattedMetrics);
        console.log("Calculated trade stats:", formattedTradeStats);

        setPerformanceMetrics(formattedMetrics);
        setTradeStats(formattedTradeStats);
      } catch (err: any) {
        console.error("Error calculating performance metrics:", err);
        setError("Failed to load performance metrics");
      } finally {
        setLoading(false);
      }
    };

    if (strategyId) {
      fetchAndCalculateMetrics();
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

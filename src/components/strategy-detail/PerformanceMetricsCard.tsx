
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";

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
  const [performanceMetrics] = useState<PerformanceMetricsProps>({
    totalReturn: "0%",
    annualizedReturn: "0%",
    sharpeRatio: "0",
    maxDrawdown: "0%",
    winRate: "0%"
  });
  const [tradeStats] = useState<TradeStatsProps>({
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    avgProfit: "$0",
    avgLoss: "$0"
  });

  useEffect(() => {
    // Simulate loading and then show empty state
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
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

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-2">Performance Metrics</h2>
      <p className="text-sm text-muted-foreground mb-4">Detailed performance analysis</p>
      
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertDescription>
          No backtest data available yet. Run a backtest to see performance metrics.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Total Return</span>
              <span className="text-sm font-medium text-muted-foreground">
                {performanceMetrics.totalReturn}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Annualized Return</span>
              <span className="text-sm font-medium text-muted-foreground">
                {performanceMetrics.annualizedReturn}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Sharpe Ratio</span>
              <span className="text-sm font-medium text-muted-foreground">
                {performanceMetrics.sharpeRatio}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Max Drawdown</span>
              <span className="text-sm font-medium text-muted-foreground">
                {performanceMetrics.maxDrawdown}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Win Rate</span>
              <span className="text-sm font-medium text-muted-foreground">
                {performanceMetrics.winRate}
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Total Trades</span>
              <span className="text-sm font-medium text-muted-foreground">
                {tradeStats.totalTrades}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Winning Trades</span>
              <span className="text-sm font-medium text-muted-foreground">
                {tradeStats.winningTrades}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Losing Trades</span>
              <span className="text-sm font-medium text-muted-foreground">
                {tradeStats.losingTrades}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Avg. Profit</span>
              <span className="text-sm font-medium text-muted-foreground">
                {tradeStats.avgProfit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Avg. Loss</span>
              <span className="text-sm font-medium text-muted-foreground">
                {tradeStats.avgLoss}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

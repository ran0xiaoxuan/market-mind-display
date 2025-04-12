
import { Card } from "@/components/ui/card";

interface PerformanceMetricsCardProps {
  performanceMetrics: {
    totalReturn: string;
    annualizedReturn: string;
    sharpeRatio: string;
    maxDrawdown: string;
    winRate: string;
  };
  tradeStats: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    avgProfit: string;
    avgLoss: string;
  };
}

export const PerformanceMetricsCard = ({ 
  performanceMetrics, 
  tradeStats 
}: PerformanceMetricsCardProps) => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-2">Performance Metrics</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Detailed performance analysis (Only trades that generated trading signals are included.)
      </p>
      
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


interface MetricsProps {
  metrics: {
    totalReturn: string;
    totalReturnValue: number;
    sharpeRatio: number;
    winRate: string;
    maxDrawdown: string;
    maxDrawdownValue: number;
    trades: number;
  };
}

export function BacktestMetrics({ metrics }: MetricsProps) {
  return (
    <div className="grid grid-cols-5 gap-6">
      <div>
        <div className="text-sm text-muted-foreground">Total Return</div>
        <div className={`text-xl font-medium ${metrics.totalReturnValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {metrics.totalReturn}
        </div>
      </div>
      
      <div>
        <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
        <div className="text-xl font-medium">
          {metrics.sharpeRatio}
        </div>
      </div>
      
      <div>
        <div className="text-sm text-muted-foreground">Win Rate</div>
        <div className="text-xl font-medium">
          {metrics.winRate}
        </div>
      </div>
      
      <div>
        <div className="text-sm text-muted-foreground">Max Drawdown</div>
        <div className="text-xl font-medium text-red-500">
          {metrics.maxDrawdown}
        </div>
      </div>
      
      <div>
        <div className="text-sm text-muted-foreground">Trades</div>
        <div className="text-xl font-medium">
          {metrics.trades}
        </div>
      </div>
    </div>
  );
}

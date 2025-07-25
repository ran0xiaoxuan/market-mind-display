import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
export function PerformanceMetricsGrid() {
  return <Card className="p-6">
      <h3 className="text-lg font-semibold mb-2">Performance Metrics</h3>
      <p className="text-sm text-muted-foreground mb-6">Key performance in details</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Returns Section */}
        <div className="space-y-4 px-0">
          <h4 className="font-medium">Returns</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Total Return</div>
              <div className="text-sm font-medium text-right text-green-600">+24.8%</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Annualized</div>
              <div className="text-sm font-medium text-right text-green-600">+18.2%</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">YTD</div>
              <div className="text-sm font-medium text-right text-green-600">+8.5%</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Monthly Avg</div>
              <div className="text-sm font-medium text-right text-green-600">+1.8%</div>
            </div>
          </div>
        </div>

        

        {/* Risk Metrics Section */}
        <div className="space-y-4 px-0">
          <h4 className="font-medium">Risk Metrics</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
              <div className="text-sm font-medium text-right">1.85</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Sortino Ratio</div>
              <div className="text-sm font-medium text-right">2.12</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Max Drawdown</div>
              <div className="text-sm font-medium text-right text-red-600">-8.3%</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Volatility</div>
              <div className="text-sm font-medium text-right">12.4%</div>
            </div>
          </div>
        </div>

        

        {/* Trading Stats Section */}
        <div className="space-y-4 px-0">
          <h4 className="font-medium">Trading Stats</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Win Rate</div>
              <div className="text-sm font-medium text-right">68.5%</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Profit Factor</div>
              <div className="text-sm font-medium text-right">2.3</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Avg Win</div>
              <div className="text-sm font-medium text-right text-green-600">+3.2%</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Avg Loss</div>
              <div className="text-sm font-medium text-right text-red-600">-1.4%</div>
            </div>
          </div>
        </div>
      </div>
    </Card>;
}
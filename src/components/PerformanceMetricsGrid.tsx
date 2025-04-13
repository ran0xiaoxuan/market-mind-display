
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Activity, Percent } from "lucide-react";

export function PerformanceMetricsGrid() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg">Performance Metrics</CardTitle>
        <CardDescription>Key performance indicators</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Returns Section */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <h4 className="font-medium">Returns</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center px-3 py-2 rounded-md bg-background/50 hover:bg-background duration-200">
                <div className="text-sm text-muted-foreground">Total Return</div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-positive">+24.8%</span>
                  <ArrowUpRight className="h-3 w-3 text-positive" />
                </div>
              </div>
              <div className="flex justify-between items-center px-3 py-2 rounded-md bg-background/50 hover:bg-background duration-200">
                <div className="text-sm text-muted-foreground">Annualized</div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-positive">+18.2%</span>
                  <ArrowUpRight className="h-3 w-3 text-positive" />
                </div>
              </div>
              <div className="flex justify-between items-center px-3 py-2 rounded-md bg-background/50 hover:bg-background duration-200">
                <div className="text-sm text-muted-foreground">YTD</div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-positive">+8.5%</span>
                  <ArrowUpRight className="h-3 w-3 text-positive" />
                </div>
              </div>
              <div className="flex justify-between items-center px-3 py-2 rounded-md bg-background/50 hover:bg-background duration-200">
                <div className="text-sm text-muted-foreground">Monthly Avg</div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-positive">+1.8%</span>
                  <ArrowUpRight className="h-3 w-3 text-positive" />
                </div>
              </div>
            </div>
          </div>

          <Separator orientation="vertical" className="hidden md:block" />

          {/* Risk Metrics Section */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <h4 className="font-medium">Risk Metrics</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center px-3 py-2 rounded-md bg-background/50 hover:bg-background duration-200">
                <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                <div className="text-sm font-medium">1.85</div>
              </div>
              <div className="flex justify-between items-center px-3 py-2 rounded-md bg-background/50 hover:bg-background duration-200">
                <div className="text-sm text-muted-foreground">Sortino Ratio</div>
                <div className="text-sm font-medium">2.12</div>
              </div>
              <div className="flex justify-between items-center px-3 py-2 rounded-md bg-background/50 hover:bg-background duration-200">
                <div className="text-sm text-muted-foreground">Max Drawdown</div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-negative">-8.3%</span>
                  <ArrowDownRight className="h-3 w-3 text-negative" />
                </div>
              </div>
              <div className="flex justify-between items-center px-3 py-2 rounded-md bg-background/50 hover:bg-background duration-200">
                <div className="text-sm text-muted-foreground">Volatility</div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">12.4%</span>
                  <Percent className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>

          <Separator orientation="vertical" className="hidden md:block" />

          {/* Trading Stats Section */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-muted-foreground" />
              <h4 className="font-medium">Trading Stats</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center px-3 py-2 rounded-md bg-background/50 hover:bg-background duration-200">
                <div className="text-sm text-muted-foreground">Win Rate</div>
                <div className="text-sm font-medium">68.5%</div>
              </div>
              <div className="flex justify-between items-center px-3 py-2 rounded-md bg-background/50 hover:bg-background duration-200">
                <div className="text-sm text-muted-foreground">Profit Factor</div>
                <div className="text-sm font-medium">2.3</div>
              </div>
              <div className="flex justify-between items-center px-3 py-2 rounded-md bg-background/50 hover:bg-background duration-200">
                <div className="text-sm text-muted-foreground">Avg Win</div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-positive">+3.2%</span>
                  <ArrowUpRight className="h-3 w-3 text-positive" />
                </div>
              </div>
              <div className="flex justify-between items-center px-3 py-2 rounded-md bg-background/50 hover:bg-background duration-200">
                <div className="text-sm text-muted-foreground">Avg Loss</div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-negative">-1.4%</span>
                  <ArrowDownRight className="h-3 w-3 text-negative" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

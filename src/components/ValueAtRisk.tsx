
import { Card } from "@/components/ui/card";

export function ValueAtRisk() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-2">Value at Risk (VaR)</h3>
      <p className="text-sm text-muted-foreground mb-6">Potential loss at different confidence levels</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Daily VaR */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Daily VaR (95%)</h4>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Amount at Risk:</div>
              <div className="text-sm font-medium text-right">$1,250</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Percentage:</div>
              <div className="text-sm font-medium text-right text-red-600">-1.25%</div>
            </div>
          </div>
        </div>

        {/* Weekly VaR */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Weekly VaR (95%)</h4>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Amount at Risk:</div>
              <div className="text-sm font-medium text-right">$2,850</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Percentage:</div>
              <div className="text-sm font-medium text-right text-red-600">-2.85%</div>
            </div>
          </div>
        </div>

        {/* Monthly VaR */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Monthly VaR (95%)</h4>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Amount at Risk:</div>
              <div className="text-sm font-medium text-right">$5,200</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Percentage:</div>
              <div className="text-sm font-medium text-right text-red-600">-5.20%</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

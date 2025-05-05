import { Card } from "@/components/ui/card";
type Strategy = {
  name: string;
  return: string;
  color: string;
};
const strategies: Strategy[] = [{
  name: "RSI Strategy",
  return: "+12.5%",
  color: "bg-blue-500"
}, {
  name: "Ichimoku Cloud",
  return: "+9.8%",
  color: "bg-indigo-500"
}, {
  name: "Moving Average Crossover",
  return: "+8.2%",
  color: "bg-green-500"
}, {
  name: "Bollinger Bands",
  return: "+5.7%",
  color: "bg-amber-500"
}, {
  name: "MACD Strategy",
  return: "+3.2%",
  color: "bg-orange-500"
}];
export function StrategyRankings() {
  return <Card className="p-6 px-[24px]">
      <h3 className="text-lg font-semibold mb-4">Strategy Rankings</h3>
      <p className="text-sm text-muted-foreground mb-6">Strategies ranked by performance</p>
      
      <div className="space-y-4">
        {strategies.map(strategy => <div key={strategy.name} className="flex items-center justify-between">
            <div className="flex items-center">
              
              <span className="text-sm font-medium">{strategy.name}</span>
            </div>
            <span className={`text-sm font-semibold ${strategy.return.startsWith("+") ? "text-green-600" : strategy.return.startsWith("-") ? "text-red-600" : ""}`}>
              {strategy.return}
            </span>
          </div>)}
      </div>
    </Card>;
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Strategy = {
  id: number;
  name: string;
  return?: string;
  returnValue?: number;
  active: boolean;
};

const strategies: Strategy[] = [
  { id: 1, name: "RSI Strategy", active: true },
  { id: 2, name: "Moving Average Crossover", active: true },
  { id: 3, name: "Bollinger Bands", active: true },
  { id: 4, name: "Ichimoku Cloud", active: true },
];

export function StrategyList() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">Top Strategies</CardTitle>
        <p className="text-sm text-muted-foreground">Your best performing strategies.</p>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <div className="divide-y">
          {strategies.map((strategy) => (
            <div key={strategy.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <div className="flex items-center">
                  <p className="font-medium">{strategy.name}</p>
                  {strategy.active && (
                    <Badge variant="outline" className="ml-2 bg-muted">
                      Active
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-6">
        <Button variant="outline" className="w-full">
          View All Strategies
        </Button>
      </CardFooter>
    </Card>
  );
}

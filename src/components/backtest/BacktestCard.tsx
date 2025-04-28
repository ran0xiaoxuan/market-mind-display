
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { BacktestData } from "@/types/backtest";
import { BacktestDetails } from "./BacktestDetails";

interface BacktestCardProps {
  backtest: BacktestData;
  isOpen: boolean;
  onToggle: (backtestId: number) => void;
}

export function BacktestCard({ backtest, isOpen, onToggle }: BacktestCardProps) {
  return (
    <Card key={backtest.id} className="overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">
              Backtest {backtest.id} <span className="text-base font-medium">{backtest.version}</span>
            </h2>
            {backtest.isLatest && <Badge variant="outline" className="text-xs">Latest</Badge>}
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground mb-4">
          {backtest.date}, {backtest.time}
        </div>
        
        <Button 
          variant="outline" 
          className="flex justify-between items-center py-2 w-full md:w-auto" 
          onClick={() => onToggle(backtest.id)}
        >
          <div className="font-medium">
            {isOpen ? "Close Backtest Details" : "View Backtest Details"}
          </div>
          <div>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </Button>
        
        {isOpen && <BacktestDetails backtest={backtest} />}
      </div>
    </Card>
  );
}

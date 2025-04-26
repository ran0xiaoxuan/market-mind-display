
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Timer, Clock, TrendingUp } from "lucide-react";

interface StrategyParametersProps {
  riskLevel: number;
  timeHorizon: "short" | "medium" | "long";
  strategyType: string;
  onRiskLevelChange: (value: number) => void;
  onTimeHorizonChange: (value: "short" | "medium" | "long") => void;
  onStrategyTypeChange: (value: string) => void;
}

export const StrategyParameters = ({
  riskLevel,
  timeHorizon,
  strategyType,
  onRiskLevelChange,
  onTimeHorizonChange,
  onStrategyTypeChange
}: StrategyParametersProps) => {
  return (
    <Card className="p-6 mb-10 border">
      <h2 className="text-xl font-semibold mb-2">Strategy Parameters</h2>
      <p className="text-sm text-muted-foreground mb-4">Customize your trading strategy parameters</p>
      
      <div className="space-y-8">
        {/* Risk Level Slider */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Risk Level</h3>
          </div>
          <div className="mb-1">
            <Slider 
              value={[riskLevel]} 
              min={0} 
              max={100} 
              step={1}
              onValueChange={(values) => onRiskLevelChange(values[0])}
              className="my-6"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Conservative</span>
              <span>Balanced</span>
              <span>Aggressive</span>
            </div>
          </div>
        </div>
        
        {/* Time Horizon */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Time Horizon</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button 
              className={`p-3 text-center rounded-md border ${timeHorizon === 'short' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/50'}`}
              onClick={() => onTimeHorizonChange('short')}
            >
              Short Term
              <div className="text-xs mt-1 opacity-70">Days to weeks</div>
            </button>
            <button 
              className={`p-3 text-center rounded-md border ${timeHorizon === 'medium' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/50'}`}
              onClick={() => onTimeHorizonChange('medium')}
            >
              Medium Term
              <div className="text-xs mt-1 opacity-70">Weeks to months</div>
            </button>
            <button 
              className={`p-3 text-center rounded-md border ${timeHorizon === 'long' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/50'}`}
              onClick={() => onTimeHorizonChange('long')}
            >
              Long Term
              <div className="text-xs mt-1 opacity-70">Months to years</div>
            </button>
          </div>
        </div>
        
        {/* Strategy Type */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Strategy Type</h3>
          </div>
          <Input 
            placeholder="e.g., Trend following, Mean reversion, Breakout" 
            value={strategyType}
            onChange={(e) => onStrategyTypeChange(e.target.value)}
          />
        </div>
      </div>
    </Card>
  );
};

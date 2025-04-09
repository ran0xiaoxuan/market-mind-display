
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Timer, Clock, TrendingUp, AlertTriangle, Target, DollarSign, Maximize } from "lucide-react";
import { Label } from "@/components/ui/label";

interface StrategyParametersProps {
  riskLevel: number;
  timeHorizon: "short" | "medium" | "long";
  strategyType: string;
  stopLoss?: number;
  takeProfit?: number;
  singleBuyVolume?: number;
  maxBuyVolume?: number;
  onRiskLevelChange: (value: number) => void;
  onTimeHorizonChange: (value: "short" | "medium" | "long") => void;
  onStrategyTypeChange: (value: string) => void;
  onStopLossChange?: (value: number) => void;
  onTakeProfitChange?: (value: number) => void;
  onSingleBuyVolumeChange?: (value: number) => void;
  onMaxBuyVolumeChange?: (value: number) => void;
}

export const StrategyParameters = ({
  riskLevel,
  timeHorizon,
  strategyType,
  stopLoss = 5,
  takeProfit = 10,
  singleBuyVolume = 1000,
  maxBuyVolume = 10000,
  onRiskLevelChange,
  onTimeHorizonChange,
  onStrategyTypeChange,
  onStopLossChange,
  onTakeProfitChange,
  onSingleBuyVolumeChange,
  onMaxBuyVolumeChange,
}: StrategyParametersProps) => {
  return (
    <Card className="p-6 mb-10 border">
      <h2 className="text-xl font-semibold mb-2">Strategy Parameters</h2>
      <p className="text-sm text-muted-foreground mb-6">Define your strategy preferences</p>
      
      <div className="mb-8">
        <h3 className="text-md font-medium mb-3">Risk Level</h3>
        <div className="mb-2">
          <Slider 
            value={[riskLevel]}
            onValueChange={(value) => onRiskLevelChange(value[0])}
            max={100}
            step={1}
          />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Conservative</span>
          <span>Moderate</span>
          <span>Aggressive</span>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-md font-medium mb-3">Time Horizon</h3>
        <div className="grid grid-cols-3 gap-4">
          <Card 
            className={`p-4 cursor-pointer flex flex-col items-center ${timeHorizon === "short" ? "border-primary" : ""}`}
            onClick={() => onTimeHorizonChange("short")}
          >
            <Timer className="h-6 w-6 mb-2" />
            <span className="font-medium">Short-term</span>
            <span className="text-xs text-muted-foreground">Several times a day</span>
          </Card>
          <Card 
            className={`p-4 cursor-pointer flex flex-col items-center ${timeHorizon === "medium" ? "border-primary" : ""}`}
            onClick={() => onTimeHorizonChange("medium")}
          >
            <Clock className="h-6 w-6 mb-2" />
            <span className="font-medium">Medium-term</span>
            <span className="text-xs text-muted-foreground">Several times a week</span>
          </Card>
          <Card 
            className={`p-4 cursor-pointer flex flex-col items-center ${timeHorizon === "long" ? "border-primary" : ""}`}
            onClick={() => onTimeHorizonChange("long")}
          >
            <TrendingUp className="h-6 w-6 mb-2" />
            <span className="font-medium">Long-term</span>
            <span className="text-xs text-muted-foreground">Several times a month</span>
          </Card>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-md font-medium mb-3">Strategy Type</h3>
        <Input
          placeholder="Select a strategy type below"
          value={strategyType}
          onChange={(e) => onStrategyTypeChange(e.target.value)}
          className="mb-4"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card 
            className={`p-4 cursor-pointer hover:bg-accent ${strategyType === "Single-indicator Strategy" ? "border-primary" : ""}`}
            onClick={() => onStrategyTypeChange("Single-indicator Strategy")}
          >
            <h4 className="font-medium text-center">Single-indicator Strategy</h4>
          </Card>
          <Card 
            className={`p-4 cursor-pointer hover:bg-accent ${strategyType === "Double-indicator Strategy" ? "border-primary" : ""}`}
            onClick={() => onStrategyTypeChange("Double-indicator Strategy")}
          >
            <h4 className="font-medium text-center">Double-indicator Strategy</h4>
          </Card>
          <Card 
            className={`p-4 cursor-pointer hover:bg-accent ${strategyType === "Multi-indicator Strategy" ? "border-primary" : ""}`}
            onClick={() => onStrategyTypeChange("Multi-indicator Strategy")}
          >
            <h4 className="font-medium text-center">Multi-indicator Strategy</h4>
          </Card>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-md font-medium mb-5">Risk Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <Label htmlFor="stop-loss" className="font-medium">Stop Loss (%)</Label>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  id="stop-loss"
                  type="number"
                  value={stopLoss}
                  min={0}
                  max={100}
                  onChange={(e) => onStopLossChange && onStopLossChange(Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">Exit position when losses reach this percentage</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                <Label htmlFor="take-profit" className="font-medium">Take Profit (%)</Label>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  id="take-profit"
                  type="number"
                  value={takeProfit}
                  min={0}
                  max={1000}
                  onChange={(e) => onTakeProfitChange && onTakeProfitChange(Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">Exit position when profits reach this percentage</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-500" />
                <Label htmlFor="single-buy" className="font-medium">Single Buy Volume ($)</Label>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  id="single-buy"
                  type="number"
                  value={singleBuyVolume}
                  min={0}
                  onChange={(e) => onSingleBuyVolumeChange && onSingleBuyVolumeChange(Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-sm text-muted-foreground">$</span>
              </div>
              <p className="text-xs text-muted-foreground">Amount to invest for each buy signal</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Maximize className="h-4 w-4 text-purple-500" />
                <Label htmlFor="max-buy" className="font-medium">Max Buy Volume ($)</Label>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  id="max-buy"
                  type="number"
                  value={maxBuyVolume}
                  min={0}
                  onChange={(e) => onMaxBuyVolumeChange && onMaxBuyVolumeChange(Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-sm text-muted-foreground">$</span>
              </div>
              <p className="text-xs text-muted-foreground">Maximum total investment for this strategy</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

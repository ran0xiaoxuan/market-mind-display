
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
  onStrategyTypeChange,
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
    </Card>
  );
};

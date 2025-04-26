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
  return;
};
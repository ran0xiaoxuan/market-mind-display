
import { BacktestData } from "@/types/backtest";
import { BacktestMetrics } from "./BacktestMetrics";
import { BacktestParameters } from "./BacktestParameters";
import { BacktestRiskManagement } from "./BacktestRiskManagement";
import { BacktestRules } from "./BacktestRules";
import { BacktestResults } from "./BacktestResults";
import { useState } from "react";

interface BacktestDetailsProps {
  backtest: BacktestData;
}

export function BacktestDetails({ backtest }: BacktestDetailsProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "trades">("summary");
  
  return (
    <div className="mt-4 space-y-6">
      <BacktestMetrics metrics={backtest.metrics} />
      <BacktestParameters parameters={backtest.parameters} />
      <BacktestRiskManagement parameters={backtest.parameters} />
      <BacktestRules entryRules={backtest.entryRules} exitRules={backtest.exitRules} />
      <BacktestResults 
        activeTab={activeTab} 
        onTabChange={tab => setActiveTab(tab)} 
      />
    </div>
  );
}

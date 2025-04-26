
import { TradingRules } from "@/components/strategy-detail/TradingRules";
import { RuleGroupData } from "@/components/strategy-detail/types";

interface BacktestRulesProps {
  entryRules: RuleGroupData[];
  exitRules: RuleGroupData[];
}

export function BacktestRules({ entryRules, exitRules }: BacktestRulesProps) {
  // Ensure OR groups have at least 2 conditions
  const processedEntryRules = [...entryRules];
  const processedExitRules = [...exitRules];
  
  // Process entry rules
  if (processedEntryRules.length > 1 && processedEntryRules[1]?.logic === "OR") {
    if (!processedEntryRules[1].inequalities || processedEntryRules[1].inequalities.length < 2) {
      // Add default inequalities if needed
      const currentInequalities = processedEntryRules[1].inequalities || [];
      while (currentInequalities.length < 2) {
        const newId = currentInequalities.length > 0 
          ? Math.max(...currentInequalities.map(ineq => ineq.id)) + 1 
          : 1;
        
        currentInequalities.push({
          id: newId,
          left: {
            type: "indicator",
            indicator: "RSI",
            parameters: {
              period: "14"
            }
          },
          condition: "Less Than",
          right: {
            type: "value",
            value: "30"
          }
        });
      }
      processedEntryRules[1].inequalities = currentInequalities;
    }
  }
  
  // Process exit rules
  if (processedExitRules.length > 1 && processedExitRules[1]?.logic === "OR") {
    if (!processedExitRules[1].inequalities || processedExitRules[1].inequalities.length < 2) {
      // Add default inequalities if needed
      const currentInequalities = processedExitRules[1].inequalities || [];
      while (currentInequalities.length < 2) {
        const newId = currentInequalities.length > 0 
          ? Math.max(...currentInequalities.map(ineq => ineq.id)) + 1 
          : 1;
        
        currentInequalities.push({
          id: newId,
          left: {
            type: currentInequalities.length === 0 ? "indicator" : "price",
            indicator: currentInequalities.length === 0 ? "RSI" : undefined,
            parameters: currentInequalities.length === 0 ? { period: "14" } : undefined,
            value: currentInequalities.length === 0 ? undefined : "Close"
          },
          condition: currentInequalities.length === 0 ? "Greater Than" : "Less Than",
          right: {
            type: "value",
            value: currentInequalities.length === 0 ? "70" : "Stop Loss"
          }
        });
      }
      processedExitRules[1].inequalities = currentInequalities;
    }
  }

  return (
    <>
      <div className="border-t pt-4">
        <h4 className="text-sm text-muted-foreground mb-3 flex items-center gap-2">Entry Rules</h4>
        <TradingRules
          entryRules={[
            {
              id: 1,
              logic: "AND",
              inequalities: processedEntryRules[0].inequalities
            },
            {
              id: 2,
              logic: "OR",
              inequalities: processedEntryRules[1]?.inequalities || [],
              requiredConditions: 1
            }
          ]}
          exitRules={[]}
          editable={false}
        />
      </div>

      <div className="border-t pt-4">
        <h4 className="text-sm text-muted-foreground mb-3 flex items-center gap-2">Exit Rules</h4>
        <TradingRules
          entryRules={[]}
          exitRules={[
            {
              id: 1,
              logic: "AND",
              inequalities: processedExitRules[0].inequalities
            },
            {
              id: 2,
              logic: "OR",
              inequalities: processedExitRules[1]?.inequalities || [],
              requiredConditions: 1
            }
          ]}
          editable={false}
        />
      </div>
    </>
  );
}

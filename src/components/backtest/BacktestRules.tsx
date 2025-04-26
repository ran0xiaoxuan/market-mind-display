
import { TradingRules } from "@/components/strategy-detail/TradingRules";
import { RuleGroupData } from "@/components/strategy-detail/types";

interface BacktestRulesProps {
  entryRules: RuleGroupData[];
  exitRules: RuleGroupData[];
}

export function BacktestRules({ entryRules, exitRules }: BacktestRulesProps) {
  return (
    <>
      <div className="border-t pt-4">
        <h4 className="text-sm text-muted-foreground mb-3 flex items-center gap-2">Entry Rules</h4>
        <TradingRules
          entryRules={[
            {
              id: 1,
              logic: "AND",
              inequalities: entryRules[0].inequalities
            },
            {
              id: 2,
              logic: "OR",
              inequalities: entryRules[1]?.inequalities || [],
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
              inequalities: exitRules[0].inequalities
            },
            {
              id: 2,
              logic: "OR",
              inequalities: exitRules[1]?.inequalities || [],
              requiredConditions: 1
            }
          ]}
          editable={false}
        />
      </div>
    </>
  );
}

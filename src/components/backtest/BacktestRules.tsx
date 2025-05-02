
import { TradingRules } from "@/components/strategy-detail/TradingRules";
import { RuleGroupData } from "@/components/strategy-detail/types";
import { Card } from "@/components/ui/card";

interface BacktestRulesProps {
  entryRules: RuleGroupData[];
  exitRules: RuleGroupData[];
}

export function BacktestRules({ entryRules, exitRules }: BacktestRulesProps) {
  // Create deep copies of the arrays to avoid modifying the original data
  const processedEntryRules = JSON.parse(JSON.stringify(entryRules));
  const processedExitRules = JSON.parse(JSON.stringify(exitRules));
  
  // Process entry rules - ensure OR groups have at least 2 conditions
  if (processedEntryRules.length > 1 && processedEntryRules[1]?.logic === "OR") {
    // Initialize inequalities array if it doesn't exist
    if (!processedEntryRules[1].inequalities) {
      processedEntryRules[1].inequalities = [];
    }
    
    // Add default conditions if there are fewer than 2
    while (processedEntryRules[1].inequalities.length < 2) {
      const newId = processedEntryRules[1].inequalities.length > 0 
        ? Math.max(...processedEntryRules[1].inequalities.map(ineq => ineq.id)) + 1 
        : 1;
      
      // Add appropriate condition based on current length
      if (processedEntryRules[1].inequalities.length === 0) {
        processedEntryRules[1].inequalities.push({
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
          },
          explanation: "RSI below 30 indicates an oversold condition, suggesting a potential buying opportunity."
        });
      } else {
        processedEntryRules[1].inequalities.push({
          id: newId,
          left: {
            type: "indicator",
            indicator: "MACD",
            parameters: {
              fast: "12",
              slow: "26",
              signal: "9"
            }
          },
          condition: "Crosses Above",
          right: {
            type: "value",
            value: "0"
          },
          explanation: "MACD crossing above zero indicates increasing upward momentum."
        });
      }
    }
    
    // Ensure requiredConditions is set
    if (processedEntryRules[1].requiredConditions === undefined) {
      processedEntryRules[1].requiredConditions = 1;
    }
  }
  
  // Process exit rules - ensure OR groups have at least 2 conditions
  if (processedExitRules.length > 1 && processedExitRules[1]?.logic === "OR") {
    // Initialize inequalities array if it doesn't exist
    if (!processedExitRules[1].inequalities) {
      processedExitRules[1].inequalities = [];
    }
    
    // Add default conditions if there are fewer than 2
    while (processedExitRules[1].inequalities.length < 2) {
      const newId = processedExitRules[1].inequalities.length > 0 
        ? Math.max(...processedExitRules[1].inequalities.map(ineq => ineq.id)) + 1 
        : 1;
      
      // Add appropriate condition based on current length
      if (processedExitRules[1].inequalities.length === 0) {
        processedExitRules[1].inequalities.push({
          id: newId,
          left: {
            type: "indicator",
            indicator: "RSI",
            parameters: {
              period: "14"
            }
          },
          condition: "Greater Than",
          right: {
            type: "value",
            value: "70"
          },
          explanation: "RSI above 70 indicates an overbought condition, suggesting it's time to take profits."
        });
      } else {
        processedExitRules[1].inequalities.push({
          id: newId,
          left: {
            type: "price",
            value: "Close"
          },
          condition: "Less Than",
          right: {
            type: "value",
            value: "Stop Loss"
          },
          explanation: "Price falling below stop loss level protects capital from further losses."
        });
      }
    }
    
    // Ensure requiredConditions is set
    if (processedExitRules[1].requiredConditions === undefined) {
      processedExitRules[1].requiredConditions = 1;
    }
  }

  return (
    <div className="space-y-6">
      <TradingRules
        entryRules={processedEntryRules}
        exitRules={processedExitRules}
        editable={false}
      />
    </div>
  );
}

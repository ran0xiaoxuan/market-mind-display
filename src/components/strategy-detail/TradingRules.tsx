
import { Card } from "@/components/ui/card";
import { RuleGroup } from "./RuleGroup";
import { RuleGroupData, Inequality } from "./types";

interface TradingRulesProps {
  entryRules: RuleGroupData[];
  exitRules: RuleGroupData[];
  onEntryRulesChange?: (rules: RuleGroupData[]) => void;
  onExitRulesChange?: (rules: RuleGroupData[]) => void;
  editable?: boolean;
}

export const TradingRules = ({
  entryRules,
  exitRules,
  onEntryRulesChange,
  onExitRulesChange,
  editable = false
}: TradingRulesProps) => {
  const handleEntryRuleChange = (groupIndex: number, updatedInequalities: Inequality[]) => {
    if (!onEntryRulesChange) return;
    const updatedRules = [...entryRules];
    updatedRules[groupIndex] = {
      ...updatedRules[groupIndex],
      inequalities: updatedInequalities
    };
    onEntryRulesChange(updatedRules);
  };

  const handleEntryRequiredConditionsChange = (groupIndex: number, count: number) => {
    if (!onEntryRulesChange) return;
    const updatedRules = [...entryRules];
    updatedRules[groupIndex] = {
      ...updatedRules[groupIndex],
      requiredConditions: count
    };
    onEntryRulesChange(updatedRules);
  };

  const handleExitRuleChange = (groupIndex: number, updatedInequalities: Inequality[]) => {
    if (!onExitRulesChange) return;
    const updatedRules = [...exitRules];
    updatedRules[groupIndex] = {
      ...updatedRules[groupIndex],
      inequalities: updatedInequalities
    };
    onExitRulesChange(updatedRules);
  };

  const handleExitRequiredConditionsChange = (groupIndex: number, count: number) => {
    if (!onExitRulesChange) return;
    const updatedRules = [...exitRules];
    updatedRules[groupIndex] = {
      ...updatedRules[groupIndex],
      requiredConditions: count
    };
    onExitRulesChange(updatedRules);
  };

  const handleAddEntryRuleAND = () => {
    if (!onEntryRulesChange || entryRules.length === 0) return;
    const updatedRules = [...entryRules];
    const andGroup = updatedRules[0];
    const newRuleId = andGroup.inequalities.length > 0 ? Math.max(...andGroup.inequalities.map(rule => rule.id)) + 1 : 1;
    const newRule: Inequality = {
      id: newRuleId,
      left: {
        type: "indicator",
        indicator: "SMA",
        parameters: {
          period: "20"
        }
      },
      condition: "Crosses Above",
      right: {
        type: "indicator",
        indicator: "SMA",
        parameters: {
          period: "50"
        }
      }
    };
    updatedRules[0] = {
      ...andGroup,
      inequalities: [...andGroup.inequalities, newRule]
    };
    onEntryRulesChange(updatedRules);
  };

  const handleAddEntryRuleOR = () => {
    if (!onEntryRulesChange || entryRules.length < 2) return;
    const updatedRules = [...entryRules];
    const orGroup = updatedRules[1];
    const newRuleId = orGroup.inequalities.length > 0 ? Math.max(...orGroup.inequalities.map(rule => rule.id)) + 1 : 1;
    const newRule: Inequality = {
      id: newRuleId,
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
    };
    updatedRules[1] = {
      ...orGroup,
      inequalities: [...orGroup.inequalities, newRule]
    };
    onEntryRulesChange(updatedRules);
  };

  const handleAddExitRuleAND = () => {
    if (!onExitRulesChange || exitRules.length === 0) return;
    const updatedRules = [...exitRules];
    const andGroup = updatedRules[0];
    const newRuleId = andGroup.inequalities.length > 0 ? Math.max(...andGroup.inequalities.map(rule => rule.id)) + 1 : 1;
    const newRule: Inequality = {
      id: newRuleId,
      left: {
        type: "indicator",
        indicator: "SMA",
        parameters: {
          period: "20"
        }
      },
      condition: "Crosses Below",
      right: {
        type: "indicator",
        indicator: "SMA",
        parameters: {
          period: "50"
        }
      }
    };
    updatedRules[0] = {
      ...andGroup,
      inequalities: [...andGroup.inequalities, newRule]
    };
    onExitRulesChange(updatedRules);
  };

  const handleAddExitRuleOR = () => {
    if (!onExitRulesChange || exitRules.length < 2) return;
    const updatedRules = [...exitRules];
    const orGroup = updatedRules[1];
    const newRuleId = orGroup.inequalities.length > 0 ? Math.max(...orGroup.inequalities.map(rule => rule.id)) + 1 : 1;
    const newRule: Inequality = {
      id: newRuleId,
      left: {
        type: "price",
        value: "Close"
      },
      condition: "Less Than",
      right: {
        type: "value",
        value: "0"
      }
    };
    updatedRules[1] = {
      ...orGroup,
      inequalities: [...orGroup.inequalities, newRule]
    };
    onExitRulesChange(updatedRules);
  };

  return <Card className="p-6 mb-6">
      <div className="mb-8 min-h-[200px] flex flex-col justify-center">
        {entryRules.length > 0 && <>
            {entryRules[0] && <RuleGroup 
              title="AND Group" 
              color="blue" 
              description="All conditions must be met." 
              inequalities={entryRules[0].inequalities || []} 
              editable={editable} 
              onInequitiesChange={inequalities => handleEntryRuleChange(0, inequalities)} 
              onAddRule={editable ? handleAddEntryRuleAND : undefined} 
              className="bg-blue-50/50 border border-blue-100" 
            />}
            
            {entryRules.length > 1 && entryRules[1] && <RuleGroup 
              title="OR Group" 
              color="amber" 
              description="At least 1 of 2 conditions must be met." 
              inequalities={entryRules[1].inequalities || []} 
              editable={editable} 
              onInequitiesChange={inequalities => handleEntryRuleChange(1, inequalities)} 
              requiredConditions={entryRules[1].requiredConditions || 1} 
              onRequiredConditionsChange={count => handleEntryRequiredConditionsChange(1, count)} 
              onAddRule={editable ? handleAddEntryRuleOR : undefined} 
              className="bg-amber-50/50 border border-amber-100" 
            />}
          </>}
      </div>
      
      <div className="mb-6 min-h-[200px] flex flex-col justify-center">
        {exitRules.length > 0 && <>
            {exitRules[0] && <RuleGroup 
              title="AND Group" 
              color="blue" 
              description="All conditions must be met." 
              inequalities={exitRules[0].inequalities || []} 
              editable={editable} 
              onInequitiesChange={inequalities => handleExitRuleChange(0, inequalities)} 
              onAddRule={editable ? handleAddExitRuleAND : undefined} 
              className="bg-blue-50/50 border border-blue-100" 
            />}
            
            {exitRules.length > 1 && exitRules[1] && <RuleGroup 
              title="OR Group" 
              color="amber" 
              description="At least 1 of 2 conditions must be met." 
              inequalities={exitRules[1].inequalities || []} 
              editable={editable} 
              onInequitiesChange={inequalities => handleExitRuleChange(1, inequalities)} 
              requiredConditions={exitRules[1].requiredConditions || 1} 
              onRequiredConditionsChange={count => handleExitRequiredConditionsChange(1, count)} 
              onAddRule={editable ? handleAddExitRuleOR : undefined} 
              className="bg-amber-50/50 border border-amber-100" 
            />}
          </>}
      </div>
    </Card>;
};

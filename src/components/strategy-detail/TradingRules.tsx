
import { Card } from "@/components/ui/card";
import { RuleGroup } from "./RuleGroup";
import { RuleGroupData, Inequality } from "./types";
import { useState } from "react";

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

  return <Card className="p-6 mb-6">
      
      
      
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Entry Rules</h3>
        
        {entryRules.length > 0 && <>
            {/* AND Group */}
            <RuleGroup 
              title="AND Group" 
              color="blue" 
              description="All conditions must be met." 
              inequalities={entryRules[0].inequalities}
              editable={editable}
              onInequitiesChange={(inequalities) => handleEntryRuleChange(0, inequalities)}
            />
            
            {/* OR Group */}
            {entryRules.length > 1 && <RuleGroup 
              title="OR Group" 
              color="amber" 
              description={`At least one of ${entryRules[1].inequalities.length} conditions must be met.`} 
              inequalities={entryRules[1].inequalities}
              editable={editable}
              onInequitiesChange={(inequalities) => handleEntryRuleChange(1, inequalities)}
              requiredConditions={entryRules[1].requiredConditions || 1}
              onRequiredConditionsChange={(count) => handleEntryRequiredConditionsChange(1, count)}
            />}
          </>}
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">Exit Rules</h3>
        
        {exitRules.length > 0 && <>
            {/* AND Group */}
            <RuleGroup 
              title="AND Group" 
              color="blue" 
              description="All conditions must be met." 
              inequalities={exitRules[0].inequalities}
              editable={editable}
              onInequitiesChange={(inequalities) => handleExitRuleChange(0, inequalities)}
            />
            
            {/* OR Group */}
            {exitRules.length > 1 && <RuleGroup 
              title="OR Group" 
              color="amber" 
              description={`At least one of ${exitRules[1].inequalities.length} conditions must be met.`} 
              inequalities={exitRules[1].inequalities}
              editable={editable}
              onInequitiesChange={(inequalities) => handleExitRuleChange(1, inequalities)}
              requiredConditions={exitRules[1].requiredConditions || 1}
              onRequiredConditionsChange={(count) => handleExitRequiredConditionsChange(1, count)}
            />}
          </>}
      </div>
    </Card>;
};

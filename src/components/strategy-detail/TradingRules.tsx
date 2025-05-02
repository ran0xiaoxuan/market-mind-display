import { Card } from "@/components/ui/card";
import { RuleGroup } from "./RuleGroup";
import { RuleGroupData, Inequality } from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AvailableIndicators } from "./AvailableIndicators";

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
  const [activeTab, setActiveTab] = useState<string>("entry");
  
  // Count total rules for badges
  const entryRuleCount = entryRules.reduce((total, group) => total + group.inequalities.length, 0);
  const exitRuleCount = exitRules.reduce((total, group) => total + group.inequalities.length, 0);

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
      },
      explanation: "When a faster moving average crosses above a slower one, it indicates a potential uptrend beginning."
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
      },
      explanation: "RSI below 30 indicates an oversold condition, suggesting a potential buying opportunity as the asset may be undervalued."
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
      },
      explanation: "When a faster moving average crosses below a slower one, it indicates a potential downtrend beginning and signals time to exit long positions."
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
        value: "Stop Loss"
      },
      explanation: "Price falling below the stop loss level protects capital by exiting the position before further losses occur."
    };
    updatedRules[1] = {
      ...orGroup,
      inequalities: [...orGroup.inequalities, newRule]
    };
    onExitRulesChange(updatedRules);
  };

  return (
    <Card className="p-6 mb-6">
      <Tabs defaultValue="entry" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Trading Rules</h2>
          <TabsList>
            <TabsTrigger value="entry" className="relative">
              Entry Rules
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                {entryRuleCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="exit">
              Exit Rules
              <Badge variant="secondary" className="ml-2 bg-red-100 text-red-700">
                {exitRuleCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <Separator className="mb-6" />
        
        <TabsContent value="entry" className="mt-0">
          <div className="space-y-6">
            {entryRules.length > 0 && (
              <>
                <RuleGroup 
                  title="AND Group" 
                  color="blue" 
                  description="All conditions must be met." 
                  inequalities={entryRules[0].inequalities} 
                  editable={editable} 
                  onInequitiesChange={inequalities => handleEntryRuleChange(0, inequalities)} 
                  onAddRule={editable ? handleAddEntryRuleAND : undefined} 
                  className="bg-blue-50/50 border border-blue-100" 
                />
                
                {entryRules.length > 1 && (
                  <RuleGroup 
                    title="OR Group" 
                    color="amber" 
                    description={`At least ${entryRules[1].requiredConditions || 1} of ${Math.max(2, entryRules[1].inequalities.length)} conditions must be met.`}
                    inequalities={entryRules[1].inequalities} 
                    editable={editable} 
                    onInequitiesChange={inequalities => handleEntryRuleChange(1, inequalities)} 
                    requiredConditions={entryRules[1].requiredConditions} 
                    onRequiredConditionsChange={count => handleEntryRequiredConditionsChange(1, count)} 
                    onAddRule={editable ? handleAddEntryRuleOR : undefined} 
                    className="bg-amber-50/50 border border-amber-100" 
                  />
                )}
              </>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="exit" className="mt-0">
          <div className="space-y-6">
            {exitRules.length > 0 && (
              <>
                <RuleGroup 
                  title="AND Group" 
                  color="blue" 
                  description="All conditions must be met." 
                  inequalities={exitRules[0].inequalities} 
                  editable={editable} 
                  onInequitiesChange={inequalities => handleExitRuleChange(0, inequalities)} 
                  onAddRule={editable ? handleAddExitRuleAND : undefined} 
                  className="bg-blue-50/50 border border-blue-100" 
                />
                
                {exitRules.length > 1 && (
                  <RuleGroup 
                    title="OR Group" 
                    color="amber" 
                    description={`At least ${exitRules[1].requiredConditions || 1} of ${Math.max(2, exitRules[1].inequalities.length)} conditions must be met.`}
                    inequalities={exitRules[1].inequalities} 
                    editable={editable} 
                    onInequitiesChange={inequalities => handleExitRuleChange(1, inequalities)} 
                    requiredConditions={exitRules[1].requiredConditions} 
                    onRequiredConditionsChange={count => handleExitRequiredConditionsChange(1, count)} 
                    onAddRule={editable ? handleAddExitRuleOR : undefined} 
                    className="bg-amber-50/50 border border-amber-100" 
                  />
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

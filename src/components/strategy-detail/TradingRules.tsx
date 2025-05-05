
import { Card } from "@/components/ui/card";
import { RuleGroup } from "./RuleGroup";
import { RuleGroupData, Inequality } from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AvailableIndicators } from "./AvailableIndicators";
import { Button } from "@/components/ui/button";
import { PlusCircle, Plus } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
    if (!onEntryRulesChange) return;
    const updatedRules = [...entryRules];
    
    // If OR group doesn't exist, create it
    let orGroupIndex = updatedRules.findIndex(group => group.logic === 'OR');
    
    if (orGroupIndex === -1) {
      // Create new OR group
      const newOrGroup: RuleGroupData = {
        id: updatedRules.length > 0 ? Math.max(...updatedRules.map(rule => rule.id)) + 1 : 2,
        logic: 'OR',
        requiredConditions: 1,
        inequalities: []
      };
      updatedRules.push(newOrGroup);
      orGroupIndex = updatedRules.length - 1;
    }
    
    // Add new rule to OR group
    const orGroup = updatedRules[orGroupIndex];
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
    updatedRules[orGroupIndex] = {
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
    if (!onExitRulesChange) return;
    const updatedRules = [...exitRules];
    
    // If OR group doesn't exist, create it
    let orGroupIndex = updatedRules.findIndex(group => group.logic === 'OR');
    
    if (orGroupIndex === -1) {
      // Create new OR group
      const newOrGroup: RuleGroupData = {
        id: updatedRules.length > 0 ? Math.max(...updatedRules.map(rule => rule.id)) + 1 : 2,
        logic: 'OR',
        requiredConditions: 1,
        inequalities: []
      };
      updatedRules.push(newOrGroup);
      orGroupIndex = updatedRules.length - 1;
    }
    
    // Add new rule to OR group
    const orGroup = updatedRules[orGroupIndex];
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
    updatedRules[orGroupIndex] = {
      ...orGroup,
      inequalities: [...orGroup.inequalities, newRule]
    };
    onExitRulesChange(updatedRules);
  };

  const handleAddRuleGroup = (ruleType: "entry" | "exit", logic: "AND" | "OR") => {
    const onRulesChange = ruleType === "entry" ? onEntryRulesChange : onExitRulesChange;
    const currentRules = ruleType === "entry" ? entryRules : exitRules;
    
    if (!onRulesChange) return;
    
    const updatedRules = [...currentRules];
    const newGroupId = updatedRules.length > 0 ? Math.max(...updatedRules.map(group => group.id)) + 1 : 1;
    
    const newGroup: RuleGroupData = {
      id: newGroupId,
      logic: logic,
      requiredConditions: logic === "OR" ? 1 : undefined,
      inequalities: []
    };
    
    updatedRules.push(newGroup);
    onRulesChange(updatedRules);
  };

  return (
    <Card className="mb-6">
      <Tabs defaultValue="entry" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between p-6">
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
        
        <Separator />
        
        <div className="p-6 pt-0">
          <TabsContent value="entry" className="mt-6 space-y-6">
            {editable && (
              <div className="mb-4 flex flex-wrap gap-2">
                <ToggleGroup type="single" value={activeTab === "entry" ? "entry" : "exit"}>
                  <ToggleGroupItem value="entry" aria-label="Add Group">
                    <div className="flex items-center gap-1 font-medium">Add Rule Group:</div>
                  </ToggleGroupItem>
                </ToggleGroup>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
                  onClick={() => handleAddRuleGroup("entry", "AND")}
                >
                  <Plus className="mr-1 h-4 w-4" /> AND Group
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-700"
                  onClick={() => handleAddRuleGroup("entry", "OR")}
                >
                  <Plus className="mr-1 h-4 w-4" /> OR Group
                </Button>
              </div>
            )}
            
            <div className="space-y-6">
              {entryRules.map((group, index) => (
                <RuleGroup
                  key={`entry-group-${index}`}
                  title={group.logic === "AND" ? "AND Group" : "OR Group"}
                  color={group.logic === "AND" ? "blue" : "amber"}
                  description={group.logic === "AND" ? "All conditions must be met." : `At least ${group.requiredConditions || 1} of ${Math.max(2, group.inequalities.length)} conditions must be met.`}
                  inequalities={group.inequalities}
                  editable={editable}
                  onInequitiesChange={inequalities => handleEntryRuleChange(index, inequalities)}
                  requiredConditions={group.requiredConditions}
                  onRequiredConditionsChange={count => handleEntryRequiredConditionsChange(index, count)}
                  onAddRule={() => {
                    if (group.logic === "AND") {
                      handleAddEntryRuleAND();
                    } else {
                      handleAddEntryRuleOR();
                    }
                  }}
                  className={`bg-${group.logic === "AND" ? "blue" : "amber"}-50/50 border border-${group.logic === "AND" ? "blue" : "amber"}-100`}
                />
              ))}
              
              {entryRules.length === 0 && (
                <div className="text-center p-6 bg-gray-50 rounded-md">
                  <p className="text-muted-foreground">No entry rules defined</p>
                  {editable && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => handleAddRuleGroup("entry", "AND")}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Add your first rule group
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="exit" className="mt-6 space-y-6">
            {editable && (
              <div className="mb-4 flex flex-wrap gap-2">
                <ToggleGroup type="single" value={activeTab === "entry" ? "entry" : "exit"}>
                  <ToggleGroupItem value="exit" aria-label="Add Group">
                    <div className="flex items-center gap-1 font-medium">Add Rule Group:</div>
                  </ToggleGroupItem>
                </ToggleGroup>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
                  onClick={() => handleAddRuleGroup("exit", "AND")}
                >
                  <Plus className="mr-1 h-4 w-4" /> AND Group
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-700"
                  onClick={() => handleAddRuleGroup("exit", "OR")}
                >
                  <Plus className="mr-1 h-4 w-4" /> OR Group
                </Button>
              </div>
            )}
            
            <div className="space-y-6">
              {exitRules.map((group, index) => (
                <RuleGroup
                  key={`exit-group-${index}`}
                  title={group.logic === "AND" ? "AND Group" : "OR Group"}
                  color={group.logic === "AND" ? "blue" : "amber"}
                  description={group.logic === "AND" ? "All conditions must be met." : `At least ${group.requiredConditions || 1} of ${Math.max(2, group.inequalities.length)} conditions must be met.`}
                  inequalities={group.inequalities}
                  editable={editable}
                  onInequitiesChange={inequalities => handleExitRuleChange(index, inequalities)}
                  requiredConditions={group.requiredConditions}
                  onRequiredConditionsChange={count => handleExitRequiredConditionsChange(index, count)}
                  onAddRule={() => {
                    if (group.logic === "AND") {
                      handleAddExitRuleAND();
                    } else {
                      handleAddExitRuleOR();
                    }
                  }}
                  className={`bg-${group.logic === "AND" ? "blue" : "amber"}-50/50 border border-${group.logic === "AND" ? "blue" : "amber"}-100`}
                />
              ))}
              
              {exitRules.length === 0 && (
                <div className="text-center p-6 bg-gray-50 rounded-md">
                  <p className="text-muted-foreground">No exit rules defined</p>
                  {editable && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => handleAddRuleGroup("exit", "AND")}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Add your first rule group
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
};

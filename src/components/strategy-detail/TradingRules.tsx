
import { Card } from "@/components/ui/card";
import { RuleGroup } from "./RuleGroup";
import { RuleGroupData, Inequality } from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AvailableIndicators } from "./AvailableIndicators";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TradingRulesProps {
  entryRules: RuleGroupData[];
  exitRules: RuleGroupData[];
  onEntryRulesChange?: (rules: RuleGroupData[]) => void;
  onExitRulesChange?: (rules: RuleGroupData[]) => void;
  editable?: boolean;
}

export const TradingRules = ({
  entryRules = [],
  exitRules = [],
  onEntryRulesChange,
  onExitRulesChange,
  editable = false
}: TradingRulesProps) => {
  const [activeTab, setActiveTab] = useState<string>("entry");
  
  // Count total rules for badges, with null checks
  const entryRuleCount = Array.isArray(entryRules) 
    ? entryRules.reduce((total, group) => total + (Array.isArray(group.inequalities) ? group.inequalities.length : 0), 0)
    : 0;
  
  const exitRuleCount = Array.isArray(exitRules)
    ? exitRules.reduce((total, group) => total + (Array.isArray(group.inequalities) ? group.inequalities.length : 0), 0)
    : 0;

  const handleEntryRuleChange = (groupIndex: number, updatedInequalities: Inequality[]) => {
    if (!onEntryRulesChange || !Array.isArray(entryRules)) return;
    const updatedRules = [...entryRules];
    updatedRules[groupIndex] = {
      ...updatedRules[groupIndex],
      inequalities: updatedInequalities
    };
    onEntryRulesChange(updatedRules);
  };

  const handleEntryRequiredConditionsChange = (groupIndex: number, count: number) => {
    if (!onEntryRulesChange || !Array.isArray(entryRules)) return;
    const updatedRules = [...entryRules];
    updatedRules[groupIndex] = {
      ...updatedRules[groupIndex],
      requiredConditions: count
    };
    onEntryRulesChange(updatedRules);
  };

  const handleExitRuleChange = (groupIndex: number, updatedInequalities: Inequality[]) => {
    if (!onExitRulesChange || !Array.isArray(exitRules)) return;
    const updatedRules = [...exitRules];
    updatedRules[groupIndex] = {
      ...updatedRules[groupIndex],
      inequalities: updatedInequalities
    };
    onExitRulesChange(updatedRules);
  };

  const handleExitRequiredConditionsChange = (groupIndex: number, count: number) => {
    if (!onExitRulesChange || !Array.isArray(exitRules)) return;
    const updatedRules = [...exitRules];
    updatedRules[groupIndex] = {
      ...updatedRules[groupIndex],
      requiredConditions: count
    };
    onExitRulesChange(updatedRules);
  };

  // Create rule group if none exists
  const ensureRuleGroups = (isEntryRules: boolean) => {
    if (isEntryRules && onEntryRulesChange) {
      if (entryRules.length === 0) {
        onEntryRulesChange([
          { id: 1, logic: "AND", inequalities: [] },
          { id: 2, logic: "OR", requiredConditions: 1, inequalities: [] }
        ]);
      }
    } else if (!isEntryRules && onExitRulesChange) {
      if (exitRules.length === 0) {
        onExitRulesChange([
          { id: 1, logic: "AND", inequalities: [] },
          { id: 2, logic: "OR", requiredConditions: 1, inequalities: [] }
        ]);
      }
    }
  };

  const handleAddEntryRuleAND = () => {
    if (!onEntryRulesChange) return;
    
    // Ensure we have rule groups first
    ensureRuleGroups(true);
    
    const updatedRules = [...entryRules];
    const andGroup = updatedRules[0] || { id: 1, logic: "AND", inequalities: [] };
    const newRuleId = andGroup.inequalities.length > 0 ? 
      Math.max(...andGroup.inequalities.map(rule => typeof rule.id === 'string' ? parseInt(rule.id) : rule.id as number)) + 1 : 1;
    
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
    
    if (updatedRules.length === 0) {
      updatedRules.push({ id: 1, logic: "AND", inequalities: [newRule] });
    } else {
      updatedRules[0] = {
        ...andGroup,
        inequalities: [...andGroup.inequalities, newRule]
      };
    }
    
    onEntryRulesChange(updatedRules);
  };

  const handleAddEntryRuleOR = () => {
    if (!onEntryRulesChange) return;
    
    // Ensure we have rule groups first
    ensureRuleGroups(true);
    
    const updatedRules = [...entryRules];
    const orGroupIndex = updatedRules.findIndex(group => group.logic === "OR") || 1;
    const orGroup = updatedRules[orGroupIndex] || { id: 2, logic: "OR", requiredConditions: 1, inequalities: [] };
    const newRuleId = orGroup.inequalities.length > 0 ? 
      Math.max(...orGroup.inequalities.map(rule => typeof rule.id === 'string' ? parseInt(rule.id) : rule.id as number)) + 1 : 1;
    
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
    
    if (orGroupIndex === -1 || updatedRules.length <= orGroupIndex) {
      updatedRules.push({ id: 2, logic: "OR", requiredConditions: 1, inequalities: [newRule] });
    } else {
      updatedRules[orGroupIndex] = {
        ...orGroup,
        inequalities: [...orGroup.inequalities, newRule]
      };
    }
    
    onEntryRulesChange(updatedRules);
  };

  const handleAddExitRuleAND = () => {
    if (!onExitRulesChange) return;
    
    // Ensure we have rule groups first
    ensureRuleGroups(false);
    
    const updatedRules = [...exitRules];
    const andGroup = updatedRules[0] || { id: 1, logic: "AND", inequalities: [] };
    const newRuleId = andGroup.inequalities.length > 0 ? 
      Math.max(...andGroup.inequalities.map(rule => typeof rule.id === 'string' ? parseInt(rule.id) : rule.id as number)) + 1 : 1;
    
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
    
    if (updatedRules.length === 0) {
      updatedRules.push({ id: 1, logic: "AND", inequalities: [newRule] });
    } else {
      updatedRules[0] = {
        ...andGroup,
        inequalities: [...andGroup.inequalities, newRule]
      };
    }
    
    onExitRulesChange(updatedRules);
  };

  const handleAddExitRuleOR = () => {
    if (!onExitRulesChange) return;
    
    // Ensure we have rule groups first
    ensureRuleGroups(false);
    
    const updatedRules = [...exitRules];
    const orGroupIndex = updatedRules.findIndex(group => group.logic === "OR") || 1;
    const orGroup = updatedRules[orGroupIndex] || { id: 2, logic: "OR", requiredConditions: 1, inequalities: [] };
    const newRuleId = orGroup.inequalities.length > 0 ? 
      Math.max(...orGroup.inequalities.map(rule => typeof rule.id === 'string' ? parseInt(rule.id) : rule.id as number)) + 1 : 1;
    
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
    
    if (orGroupIndex === -1 || updatedRules.length <= orGroupIndex) {
      updatedRules.push({ id: 2, logic: "OR", requiredConditions: 1, inequalities: [newRule] });
    } else {
      updatedRules[orGroupIndex] = {
        ...orGroup,
        inequalities: [...orGroup.inequalities, newRule]
      };
    }
    
    onExitRulesChange(updatedRules);
  };

  // Functions to handle adding the first rule group
  const handleAddFirstEntryRuleGroup = () => {
    if (!onEntryRulesChange) return;
    onEntryRulesChange([
      { id: 1, logic: "AND", inequalities: [] },
      { id: 2, logic: "OR", requiredConditions: 1, inequalities: [] }
    ]);
  };

  const handleAddFirstExitRuleGroup = () => {
    if (!onExitRulesChange) return;
    onExitRulesChange([
      { id: 1, logic: "AND", inequalities: [] },
      { id: 2, logic: "OR", requiredConditions: 1, inequalities: [] }
    ]);
  };

  // Create safely iterable arrays if the inputs are null or undefined
  const safeEntryRules = Array.isArray(entryRules) ? entryRules : [];
  const safeExitRules = Array.isArray(exitRules) ? exitRules : [];

  const hasNoRules = safeEntryRules.length === 0 && safeExitRules.length === 0;

  return (
    <Card className="p-6 mb-6">
      {hasNoRules && !editable && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No trading rules have been defined for this strategy yet.
          </AlertDescription>
        </Alert>
      )}
      
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
            {safeEntryRules.length > 0 ? (
              <>
                <RuleGroup 
                  title="AND Group" 
                  color="blue" 
                  description="All conditions must be met." 
                  inequalities={safeEntryRules[0]?.inequalities || []} 
                  editable={editable} 
                  onInequitiesChange={inequalities => handleEntryRuleChange(0, inequalities)} 
                  onAddRule={editable ? handleAddEntryRuleAND : undefined} 
                  className="bg-blue-50/50 border border-blue-100" 
                />
                
                {safeEntryRules.length > 1 && (
                  <RuleGroup 
                    title="OR Group" 
                    color="amber" 
                    description={`At least ${safeEntryRules[1]?.requiredConditions || 1} of ${Math.max(2, (safeEntryRules[1]?.inequalities || []).length)} conditions must be met.`}
                    inequalities={safeEntryRules[1]?.inequalities || []} 
                    editable={editable} 
                    onInequitiesChange={inequalities => handleEntryRuleChange(1, inequalities)} 
                    requiredConditions={safeEntryRules[1]?.requiredConditions} 
                    onRequiredConditionsChange={count => handleEntryRequiredConditionsChange(1, count)} 
                    onAddRule={editable ? handleAddEntryRuleOR : undefined} 
                    className="bg-amber-50/50 border border-amber-100" 
                  />
                )}
              </>
            ) : editable ? (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg border-gray-300 bg-gray-50">
                <p className="text-muted-foreground mb-4">No entry rules defined yet</p>
                <Button onClick={handleAddFirstEntryRuleGroup}>
                  <Plus className="h-4 w-4 mr-2" /> Create Rule Groups
                </Button>
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No entry rules defined
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="exit" className="mt-0">
          <div className="space-y-6">
            {safeExitRules.length > 0 ? (
              <>
                <RuleGroup 
                  title="AND Group" 
                  color="blue" 
                  description="All conditions must be met." 
                  inequalities={safeExitRules[0]?.inequalities || []} 
                  editable={editable} 
                  onInequitiesChange={inequalities => handleExitRuleChange(0, inequalities)} 
                  onAddRule={editable ? handleAddExitRuleAND : undefined} 
                  className="bg-blue-50/50 border border-blue-100" 
                />
                
                {safeExitRules.length > 1 && (
                  <RuleGroup 
                    title="OR Group" 
                    color="amber" 
                    description={`At least ${safeExitRules[1]?.requiredConditions || 1} of ${Math.max(2, (safeExitRules[1]?.inequalities || []).length)} conditions must be met.`}
                    inequalities={safeExitRules[1]?.inequalities || []} 
                    editable={editable} 
                    onInequitiesChange={inequalities => handleExitRuleChange(1, inequalities)} 
                    requiredConditions={safeExitRules[1]?.requiredConditions} 
                    onRequiredConditionsChange={count => handleExitRequiredConditionsChange(1, count)} 
                    onAddRule={editable ? handleAddExitRuleOR : undefined} 
                    className="bg-amber-50/50 border border-amber-100" 
                  />
                )}
              </>
            ) : editable ? (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg border-gray-300 bg-gray-50">
                <p className="text-muted-foreground mb-4">No exit rules defined yet</p>
                <Button onClick={handleAddFirstExitRuleGroup}>
                  <Plus className="h-4 w-4 mr-2" /> Create Rule Groups
                </Button>
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No exit rules defined
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};


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
import { v4 as uuidv4 } from "uuid";

interface TradingRulesProps {
  entryRules: RuleGroupData[];
  exitRules: RuleGroupData[];
  onEntryRulesChange?: (rules: RuleGroupData[]) => void;
  onExitRulesChange?: (rules: RuleGroupData[]) => void;
  editable?: boolean;
  showValidation?: boolean;
}

export const TradingRules = ({
  entryRules = [],
  exitRules = [],
  onEntryRulesChange,
  onExitRulesChange,
  editable = false,
  showValidation = false
}: TradingRulesProps) => {
  const [activeTab, setActiveTab] = useState<string>("entry");
  const [newlyAddedConditionId, setNewlyAddedConditionId] = useState<string | null>(null);
  
  // Ensure we work with valid arrays
  const safeEntryRules = Array.isArray(entryRules) ? entryRules : [];
  const safeExitRules = Array.isArray(exitRules) ? exitRules : [];
  
  // Count total rules for badges
  const entryRuleCount = safeEntryRules.reduce(
    (total, group) => total + (Array.isArray(group.inequalities) ? group.inequalities.length : 0), 
    0
  );
  
  const exitRuleCount = safeExitRules.reduce(
    (total, group) => total + (Array.isArray(group.inequalities) ? group.inequalities.length : 0), 
    0
  );

  const handleEntryRuleChange = (groupIndex: number, updatedInequalities: Inequality[]) => {
    if (!onEntryRulesChange) return;
    const updatedRules = [...safeEntryRules];
    updatedRules[groupIndex] = {
      ...updatedRules[groupIndex],
      inequalities: updatedInequalities
    };
    onEntryRulesChange(updatedRules);
  };

  const handleEntryRequiredConditionsChange = (groupIndex: number, count: number) => {
    if (!onEntryRulesChange) return;
    const updatedRules = [...safeEntryRules];
    updatedRules[groupIndex] = {
      ...updatedRules[groupIndex],
      requiredConditions: count
    };
    onEntryRulesChange(updatedRules);
  };

  const handleExitRuleChange = (groupIndex: number, updatedInequalities: Inequality[]) => {
    if (!onExitRulesChange) return;
    const updatedRules = [...safeExitRules];
    updatedRules[groupIndex] = {
      ...updatedRules[groupIndex],
      inequalities: updatedInequalities
    };
    onExitRulesChange(updatedRules);
  };

  const handleExitRequiredConditionsChange = (groupIndex: number, count: number) => {
    if (!onExitRulesChange) return;
    const updatedRules = [...safeExitRules];
    updatedRules[groupIndex] = {
      ...updatedRules[groupIndex],
      requiredConditions: count
    };
    onExitRulesChange(updatedRules);
  };

  // Create rule group if none exists
  const ensureRuleGroups = (isEntryRules: boolean) => {
    if (isEntryRules && onEntryRulesChange) {
      if (safeEntryRules.length === 0) {
        onEntryRulesChange([
          { id: 1, logic: "AND", inequalities: [] },
          { id: 2, logic: "OR", inequalities: [] }
        ]);
      }
    } else if (!isEntryRules && onExitRulesChange) {
      if (safeExitRules.length === 0) {
        onExitRulesChange([
          { id: 1, logic: "AND", inequalities: [] },
          { id: 2, logic: "OR", inequalities: [] }
        ]);
      }
    }
  };

  // Add new condition to a rule group without validation toast
  const handleAddCondition = (isEntryRule: boolean, groupIndex: number) => {
    const newInequalityId = uuidv4();
    
    if (isEntryRule && onEntryRulesChange) {
      const updatedRules = [...safeEntryRules];
      const newInequality: Inequality = {
        id: newInequalityId,
        left: { type: '', indicator: '', parameters: {} },
        condition: '',
        right: { type: '', indicator: '', parameters: {} }
      };

      updatedRules[groupIndex] = {
        ...updatedRules[groupIndex],
        inequalities: [...(updatedRules[groupIndex].inequalities || []), newInequality]
      };
      
      onEntryRulesChange(updatedRules);
      setNewlyAddedConditionId(newInequalityId);
      // Removed toast notification when adding new condition
    } else if (!isEntryRule && onExitRulesChange) {
      const updatedRules = [...safeExitRules];
      const newInequality: Inequality = {
        id: newInequalityId,
        left: { type: '', indicator: '', parameters: {} },
        condition: '',
        right: { type: '', indicator: '', parameters: {} }
      };

      updatedRules[groupIndex] = {
        ...updatedRules[groupIndex],
        inequalities: [...(updatedRules[groupIndex].inequalities || []), newInequality]
      };
      
      onExitRulesChange(updatedRules);
      setNewlyAddedConditionId(newInequalityId);
      // Removed toast notification when adding new condition
    }
  };

  const handleAddFirstEntryRuleGroup = () => {
    if (!onEntryRulesChange) return;
    onEntryRulesChange([
      { id: 1, logic: "AND", inequalities: [] },
      { id: 2, logic: "OR", inequalities: [] }
    ]);
  };

  const handleAddFirstExitRuleGroup = () => {
    if (!onExitRulesChange) return;
    onExitRulesChange([
      { id: 1, logic: "AND", inequalities: [] },
      { id: 2, logic: "OR", inequalities: [] }
    ]);
  };

  const hasNoRules = safeEntryRules.length === 0 && safeExitRules.length === 0;

  // Clear newly added condition ID after it's been used
  const handleClearNewlyAddedCondition = () => {
    setNewlyAddedConditionId(null);
  };

  return (
    <Card className="p-6 mb-6">
      {hasNoRules && !editable && (
        <Alert variant="default" className="mb-4">
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
                  className="bg-blue-50/50 border border-blue-100" 
                  onAddRule={() => handleAddCondition(true, 0)}
                  showValidation={showValidation}
                  newlyAddedConditionId={newlyAddedConditionId}
                  onClearNewlyAddedCondition={handleClearNewlyAddedCondition}
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
                    className="bg-amber-50/50 border border-amber-100"
                    onAddRule={() => handleAddCondition(true, 1)}
                    showValidation={showValidation}
                    newlyAddedConditionId={newlyAddedConditionId}
                    onClearNewlyAddedCondition={handleClearNewlyAddedCondition}
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
                  className="bg-blue-50/50 border border-blue-100"
                  onAddRule={() => handleAddCondition(false, 0)}
                  showValidation={showValidation}
                  newlyAddedConditionId={newlyAddedConditionId}
                  onClearNewlyAddedCondition={handleClearNewlyAddedCondition}
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
                    className="bg-amber-50/50 border border-amber-100"
                    onAddRule={() => handleAddCondition(false, 1)}
                    showValidation={showValidation}
                    newlyAddedConditionId={newlyAddedConditionId}
                    onClearNewlyAddedCondition={handleClearNewlyAddedCondition}
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

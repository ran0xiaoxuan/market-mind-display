
import { Card } from "@/components/ui/card";
import { RuleGroup } from "./RuleGroup";
import { RuleGroupData, Inequality } from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AvailableIndicators } from "./AvailableIndicators";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { v4 as uuidv4 } from "uuid";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { validateTradingRules } from "@/services/ruleValidationService";
import { RuleValidationDisplay } from "./RuleValidationDisplay";

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

  // Validate rule structure and fix any issues
  const validateRuleGroups = (rules: RuleGroupData[]): RuleGroupData[] => {
    return rules.map(group => {
      // Ensure inequalities array exists and is properly formed
      const validInequalities = Array.isArray(group.inequalities) ? group.inequalities.map(ineq => {
        // Fix any missing or incorrect types
        return {
          ...ineq,
          left: {
            ...ineq.left,
            type: ineq.left?.type || "INDICATOR"
          },
          right: {
            ...ineq.right,
            type: ineq.right?.type || "VALUE"
          }
        };
      }) : [];
      return {
        ...group,
        logic: group.logic || (rules.indexOf(group) === 0 ? 'AND' : 'OR'),
        requiredConditions: group.requiredConditions || 1,
        inequalities: validInequalities
      };
    });
  };

  // Apply validation to both rule sets
  const validatedEntryRules = validateRuleGroups(safeEntryRules);
  const validatedExitRules = validateRuleGroups(safeExitRules);

  // Validate rules for logical consistency
  const ruleValidation = validateTradingRules(validatedEntryRules, validatedExitRules);

  // Count total rules for badges
  const entryRuleCount = validatedEntryRules.reduce((total, group) => total + (Array.isArray(group.inequalities) ? group.inequalities.length : 0), 0);
  const exitRuleCount = validatedExitRules.reduce((total, group) => total + (Array.isArray(group.inequalities) ? group.inequalities.length : 0), 0);

  const handleEntryRuleChange = (groupIndex: number, updatedInequalities: Inequality[]) => {
    if (!onEntryRulesChange) return;
    const updatedRules = [...validatedEntryRules];
    updatedRules[groupIndex] = {
      ...updatedRules[groupIndex],
      inequalities: updatedInequalities
    };
    onEntryRulesChange(updatedRules);
  };

  const handleEntryRequiredConditionsChange = (groupIndex: number, count: number) => {
    if (!onEntryRulesChange) return;
    const updatedRules = [...validatedEntryRules];
    updatedRules[groupIndex] = {
      ...updatedRules[groupIndex],
      requiredConditions: count
    };
    onEntryRulesChange(updatedRules);
  };

  const handleExitRuleChange = (groupIndex: number, updatedInequalities: Inequality[]) => {
    if (!onExitRulesChange) return;
    const updatedRules = [...validatedExitRules];
    updatedRules[groupIndex] = {
      ...updatedRules[groupIndex],
      inequalities: updatedInequalities
    };
    onExitRulesChange(updatedRules);
  };

  const handleExitRequiredConditionsChange = (groupIndex: number, count: number) => {
    if (!onExitRulesChange) return;
    const updatedRules = [...validatedExitRules];
    updatedRules[groupIndex] = {
      ...updatedRules[groupIndex],
      requiredConditions: count
    };
    onExitRulesChange(updatedRules);
  };

  // Add new condition to a rule group
  const handleAddCondition = (isEntryRule: boolean, groupIndex: number) => {
    const newInequalityId = uuidv4();
    if (isEntryRule && onEntryRulesChange) {
      const updatedRules = [...validatedEntryRules];
      const newInequality: Inequality = {
        id: newInequalityId,
        left: {
          type: 'INDICATOR',
          indicator: '',
          parameters: {}
        },
        condition: '',
        right: {
          type: 'VALUE',
          value: '',
          indicator: '',
          parameters: {}
        }
      };
      updatedRules[groupIndex] = {
        ...updatedRules[groupIndex],
        inequalities: [...(updatedRules[groupIndex].inequalities || []), newInequality]
      };
      onEntryRulesChange(updatedRules);
      setNewlyAddedConditionId(newInequalityId);
    } else if (!isEntryRule && onExitRulesChange) {
      const updatedRules = [...validatedExitRules];
      const newInequality: Inequality = {
        id: newInequalityId,
        left: {
          type: 'INDICATOR',
          indicator: '',
          parameters: {}
        },
        condition: '',
        right: {
          type: 'VALUE',
          value: '',
          indicator: '',
          parameters: {}
        }
      };
      updatedRules[groupIndex] = {
        ...updatedRules[groupIndex],
        inequalities: [...(updatedRules[groupIndex].inequalities || []), newInequality]
      };
      onExitRulesChange(updatedRules);
      setNewlyAddedConditionId(newInequalityId);
    }
  };

  // Add OR group when it doesn't exist
  const handleAddOrGroup = (isEntryRule: boolean) => {
    if (isEntryRule && onEntryRulesChange) {
      const updatedRules = [...validatedEntryRules];
      // Add OR group if it doesn't exist (should be at index 1)
      if (updatedRules.length < 2) {
        updatedRules.push({
          id: Date.now(), // Simple ID generation
          logic: "OR",
          inequalities: [],
          requiredConditions: 1
        });
        onEntryRulesChange(updatedRules);
      }
    } else if (!isEntryRule && onExitRulesChange) {
      const updatedRules = [...validatedExitRules];
      // Add OR group if it doesn't exist (should be at index 1)
      if (updatedRules.length < 2) {
        updatedRules.push({
          id: Date.now(), // Simple ID generation
          logic: "OR",
          inequalities: [],
          requiredConditions: 1
        });
        onExitRulesChange(updatedRules);
      }
    }
  };

  const handleAddFirstEntryRuleGroup = () => {
    if (!onEntryRulesChange) return;
    onEntryRulesChange([{
      id: 1,
      logic: "AND",
      inequalities: []
    }, {
      id: 2,
      logic: "OR",
      inequalities: [],
      requiredConditions: 1
    }]);
  };

  const handleAddFirstExitRuleGroup = () => {
    if (!onExitRulesChange) return;
    onExitRulesChange([{
      id: 1,
      logic: "AND",
      inequalities: []
    }, {
      id: 2,
      logic: "OR",
      inequalities: [],
      requiredConditions: 1
    }]);
  };

  // Check if no rules exist
  const hasNoRules = (validatedEntryRules.length === 0 || validatedEntryRules.every(group => !group.inequalities || group.inequalities.length === 0)) && (validatedExitRules.length === 0 || validatedExitRules.every(group => !group.inequalities || group.inequalities.length === 0));

  // Clear newly added condition ID after it's been used
  const handleClearNewlyAddedCondition = () => {
    setNewlyAddedConditionId(null);
  };

  return (
    <Card className="p-6">
      {hasNoRules && !editable && (
        <Alert variant="default" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No trading rules have been defined for this strategy yet.
          </AlertDescription>
        </Alert>
      )}

      {/* Rule Validation Display */}
      {(showValidation || editable) && !hasNoRules && (
        <div className="mb-6">
          <RuleValidationDisplay validationResult={ruleValidation} />
        </div>
      )}
      
      <Tabs defaultValue="entry" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
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
          
          {editable && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm p-4">
                  <p className="text-sm mb-2 font-medium">Trading Rule Structure:</p>
                  <ul className="space-y-2 list-disc pl-4 text-sm">
                    <li><span className="font-medium">AND Group:</span> All conditions must be met simultaneously for a valid signal.</li>
                    <li><span className="font-medium">OR Group:</span> Should contain at least 2 conditions. Only the specified number of conditions need to be true for confirmation.</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        <Separator className="mb-6" />
        
        <TabsContent value="entry" className="mt-0">
          <div className="space-y-6">
            {validatedEntryRules.length > 0 ? (
              <>
                <RuleGroup 
                  title="AND Group" 
                  color="blue" 
                  description="All conditions in this group must be met simultaneously for a valid entry signal." 
                  inequalities={validatedEntryRules[0]?.inequalities || []} 
                  editable={editable} 
                  onInequitiesChange={inequalities => handleEntryRuleChange(0, inequalities)} 
                  className="bg-blue-50/50 border border-blue-100" 
                  onAddRule={() => handleAddCondition(true, 0)} 
                  showValidation={showValidation} 
                  newlyAddedConditionId={newlyAddedConditionId} 
                  onClearNewlyAddedCondition={handleClearNewlyAddedCondition} 
                />
                
                {validatedEntryRules.length > 1 ? (
                  <RuleGroup 
                    title="OR Group" 
                    color="amber" 
                    description={`At least ${validatedEntryRules[1]?.requiredConditions || 1} of ${Math.max(1, (validatedEntryRules[1]?.inequalities || []).length)} conditions must be met to confirm the entry signal.`} 
                    inequalities={validatedEntryRules[1]?.inequalities || []} 
                    editable={editable} 
                    onInequitiesChange={inequalities => handleEntryRuleChange(1, inequalities)} 
                    requiredConditions={validatedEntryRules[1]?.requiredConditions} 
                    onRequiredConditionsChange={count => handleEntryRequiredConditionsChange(1, count)} 
                    className="bg-amber-50/50 border border-amber-100" 
                    onAddRule={() => handleAddCondition(true, 1)} 
                    showValidation={showValidation} 
                    newlyAddedConditionId={newlyAddedConditionId} 
                    onClearNewlyAddedCondition={handleClearNewlyAddedCondition} 
                  />
                ) : editable ? (
                  <div className="p-4 border border-dashed border-amber-200 rounded-lg bg-amber-50/30">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-3">
                        Add an OR group to create alternative entry conditions
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleAddOrGroup(true)}
                        className="border-amber-300 text-amber-700 hover:bg-amber-100"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add OR Group
                      </Button>
                    </div>
                  </div>
                ) : null}
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
            {validatedExitRules.length > 0 ? (
              <>
                <RuleGroup 
                  title="AND Group" 
                  color="blue" 
                  description="All conditions in this group must be met simultaneously for a valid exit signal." 
                  inequalities={validatedExitRules[0]?.inequalities || []} 
                  editable={editable} 
                  onInequitiesChange={inequalities => handleExitRuleChange(0, inequalities)} 
                  className="bg-blue-50/50 border border-blue-100" 
                  onAddRule={() => handleAddCondition(false, 0)} 
                  showValidation={showValidation} 
                  newlyAddedConditionId={newlyAddedConditionId} 
                  onClearNewlyAddedCondition={handleClearNewlyAddedCondition} 
                />
                
                {validatedExitRules.length > 1 ? (
                  <RuleGroup 
                    title="OR Group" 
                    color="amber" 
                    description={`At least ${validatedExitRules[1]?.requiredConditions || 1} of ${Math.max(1, (validatedExitRules[1]?.inequalities || []).length)} conditions must be met to confirm the exit signal.`} 
                    inequalities={validatedExitRules[1]?.inequalities || []} 
                    editable={editable} 
                    onInequitiesChange={inequalities => handleExitRuleChange(1, inequalities)} 
                    requiredConditions={validatedExitRules[1]?.requiredConditions} 
                    onRequiredConditionsChange={count => handleExitRequiredConditionsChange(1, count)} 
                    className="bg-amber-50/50 border border-amber-100" 
                    onAddRule={() => handleAddCondition(false, 1)} 
                    showValidation={showValidation} 
                    newlyAddedConditionId={newlyAddedConditionId} 
                    onClearNewlyAddedCondition={handleClearNewlyAddedCondition} 
                  />
                ) : editable ? (
                  <div className="p-4 border border-dashed border-amber-200 rounded-lg bg-amber-50/30">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-3">
                        Add an OR group to create alternative exit conditions
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleAddOrGroup(false)}
                        className="border-amber-300 text-amber-700 hover:bg-amber-100"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add OR Group
                      </Button>
                    </div>
                  </div>
                ) : null}
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

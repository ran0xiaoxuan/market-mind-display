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

  // Ensure we work with valid arrays and properly validate structure
  const safeEntryRules = Array.isArray(entryRules) ? entryRules : [];
  const safeExitRules = Array.isArray(exitRules) ? exitRules : [];

  // Validate and fix rule group structure - ensure proper grouping by logic type
  const validateAndFixRuleGroups = (rules: RuleGroupData[]): RuleGroupData[] => {
    if (!rules || rules.length === 0) return [];

    // Sort rules by their actual logic and group order to ensure proper display
    const sortedRules = [...rules].sort((a, b) => {
      // AND groups should come first (group_order 0), then OR groups (group_order 1)
      const aLogic = a.logic === 'AND' ? 0 : 1;
      const bLogic = b.logic === 'AND' ? 0 : 1;
      return aLogic - bLogic;
    });

    return sortedRules.map(group => {
      // Ensure inequalities array exists and is properly formed
      const validInequalities = Array.isArray(group.inequalities) ? group.inequalities.map(ineq => {
        // Clean up any malformed data in inequalities
        return {
          ...ineq,
          left: {
            type: ineq.left?.type || "INDICATOR",
            indicator: ineq.left?.indicator,
            parameters: cleanParametersObject(ineq.left?.parameters),
            value: ineq.left?.value,
            valueType: ineq.left?.valueType
          },
          right: {
            type: ineq.right?.type || "VALUE",
            indicator: ineq.right?.indicator,
            parameters: cleanParametersObject(ineq.right?.parameters),
            value: ineq.right?.value,
            valueType: ineq.right?.valueType
          }
        };
      }) : [];

      return {
        ...group,
        logic: group.logic || 'AND',
        requiredConditions: group.logic === 'OR' ? (group.requiredConditions || 1) : undefined,
        inequalities: validInequalities
      };
    });
  };

  // Helper function to clean parameters object
  const cleanParametersObject = (params: any): any => {
    if (!params || typeof params !== 'object') return {};
    
    const cleaned: any = {};
    Object.keys(params).forEach(key => {
      const value = params[key];
      // Skip malformed values
      if (value && typeof value === 'object' && (value._type === 'undefined' || value._type === 'MaxDepthReached')) {
        return;
      }
      if (typeof value === 'string' || typeof value === 'number') {
        cleaned[key] = value;
      }
    });
    return cleaned;
  };

  // Apply validation and proper grouping to both rule sets
  const validatedEntryRules = validateAndFixRuleGroups(safeEntryRules);
  const validatedExitRules = validateAndFixRuleGroups(safeExitRules);

  // Debug logging to verify proper grouping
  useEffect(() => {
    console.log("Entry rules after validation:", validatedEntryRules.map(r => ({ id: r.id, logic: r.logic, inequalityCount: r.inequalities?.length })));
    console.log("Exit rules after validation:", validatedExitRules.map(r => ({ id: r.id, logic: r.logic, inequalityCount: r.inequalities?.length })));
  }, [validatedEntryRules, validatedExitRules]);

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

  // Find AND and OR groups specifically by logic type
  const entryAndGroup = validatedEntryRules.find(group => group.logic === 'AND');
  const entryOrGroup = validatedEntryRules.find(group => group.logic === 'OR');
  const exitAndGroup = validatedExitRules.find(group => group.logic === 'AND');
  const exitOrGroup = validatedExitRules.find(group => group.logic === 'OR');

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
                {entryAndGroup && (
                  <RuleGroup 
                    title="AND Group" 
                    color="blue" 
                    description="All conditions in this group must be met simultaneously for a valid entry signal." 
                    inequalities={entryAndGroup.inequalities || []} 
                    editable={editable} 
                    onInequitiesChange={inequalities => {
                      const groupIndex = validatedEntryRules.findIndex(g => g.id === entryAndGroup.id);
                      if (groupIndex !== -1) handleEntryRuleChange(groupIndex, inequalities);
                    }} 
                    className="bg-blue-50/50 border border-blue-100" 
                    onAddRule={() => {
                      const groupIndex = validatedEntryRules.findIndex(g => g.id === entryAndGroup.id);
                      if (groupIndex !== -1) handleAddCondition(true, groupIndex);
                    }} 
                    showValidation={showValidation} 
                    newlyAddedConditionId={newlyAddedConditionId} 
                    onClearNewlyAddedCondition={handleClearNewlyAddedCondition} 
                  />
                )}
                
                {entryOrGroup ? (
                  <RuleGroup 
                    title="OR Group" 
                    color="amber" 
                    description={`At least ${entryOrGroup.requiredConditions || 1} of ${Math.max(1, (entryOrGroup.inequalities || []).length)} conditions must be met to confirm the entry signal.`} 
                    inequalities={entryOrGroup.inequalities || []} 
                    editable={editable} 
                    onInequitiesChange={inequalities => {
                      const groupIndex = validatedEntryRules.findIndex(g => g.id === entryOrGroup.id);
                      if (groupIndex !== -1) handleEntryRuleChange(groupIndex, inequalities);
                    }} 
                    requiredConditions={entryOrGroup.requiredConditions} 
                    onRequiredConditionsChange={count => {
                      const groupIndex = validatedEntryRules.findIndex(g => g.id === entryOrGroup.id);
                      if (groupIndex !== -1) handleEntryRequiredConditionsChange(groupIndex, count);
                    }} 
                    className="bg-amber-50/50 border border-amber-100" 
                    onAddRule={() => {
                      const groupIndex = validatedEntryRules.findIndex(g => g.id === entryOrGroup.id);
                      if (groupIndex !== -1) handleAddCondition(true, groupIndex);
                    }} 
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
                {exitAndGroup && (
                  <RuleGroup 
                    title="AND Group" 
                    color="blue" 
                    description="All conditions in this group must be met simultaneously for a valid exit signal." 
                    inequalities={exitAndGroup.inequalities || []} 
                    editable={editable} 
                    onInequitiesChange={inequalities => {
                      const groupIndex = validatedExitRules.findIndex(g => g.id === exitAndGroup.id);
                      if (groupIndex !== -1) handleExitRuleChange(groupIndex, inequalities);
                    }} 
                    className="bg-blue-50/50 border border-blue-100" 
                    onAddRule={() => {
                      const groupIndex = validatedExitRules.findIndex(g => g.id === exitAndGroup.id);
                      if (groupIndex !== -1) handleAddCondition(false, groupIndex);
                    }} 
                    showValidation={showValidation} 
                    newlyAddedConditionId={newlyAddedConditionId} 
                    onClearNewlyAddedCondition={handleClearNewlyAddedCondition} 
                  />
                )}
                
                {exitOrGroup ? (
                  <RuleGroup 
                    title="OR Group" 
                    color="amber" 
                    description={`At least ${exitOrGroup.requiredConditions || 1} of ${Math.max(1, (exitOrGroup.inequalities || []).length)} conditions must be met to confirm the exit signal.`} 
                    inequalities={exitOrGroup.inequalities || []} 
                    editable={editable} 
                    onInequitiesChange={inequalities => {
                      const groupIndex = validatedExitRules.findIndex(g => g.id === exitOrGroup.id);
                      if (groupIndex !== -1) handleExitRuleChange(groupIndex, inequalities);
                    }} 
                    requiredConditions={exitOrGroup.requiredConditions} 
                    onRequiredConditionsChange={count => {
                      const groupIndex = validatedExitRules.findIndex(g => g.id === exitOrGroup.id);
                      if (groupIndex !== -1) handleExitRequiredConditionsChange(groupIndex, count);
                    }} 
                    className="bg-amber-50/50 border border-amber-100" 
                    onAddRule={() => {
                      const groupIndex = validatedExitRules.findIndex(g => g.id === exitOrGroup.id);
                      if (groupIndex !== -1) handleAddCondition(false, groupIndex);
                    }} 
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


import { useState } from "react";
import { Inequality } from "./types";
import { RuleInequality } from "./RuleInequality";
import { Button } from "@/components/ui/button";
import { Plus, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { v4 as uuidv4 } from "uuid";

interface RuleGroupProps {
  title: string;
  color: string;
  description: string;
  inequalities: Inequality[];
  editable?: boolean;
  onInequitiesChange?: (inequalities: Inequality[]) => void;
  requiredConditions?: number;
  onRequiredConditionsChange?: (count: number) => void;
  className?: string;
  onAddRule?: () => void;
  showValidation?: boolean;
  newlyAddedConditionId?: string | null;
  onClearNewlyAddedCondition?: () => void;
}

export const RuleGroup = ({
  title,
  color,
  description,
  inequalities = [],
  editable = false,
  onInequitiesChange,
  requiredConditions,
  onRequiredConditionsChange,
  className = "",
  onAddRule: externalOnAddRule,
  showValidation = false,
  newlyAddedConditionId = null,
  onClearNewlyAddedCondition
}: RuleGroupProps) => {
  const isOrGroup = title.includes("OR");
  
  const handleAddRule = () => {
    if (!onInequitiesChange) return;
    
    // Create a new empty inequality with a unique ID
    const newInequality: Inequality = {
      id: uuidv4(), // Generate a unique ID for the new inequality
      left: {
        type: "",
        valueType: "number"
      },
      condition: "",
      right: {
        type: "",
        valueType: "number"
      },
      explanation: ""
    };
    
    // Add the new inequality to the list
    const updatedInequalities = [...inequalities, newInequality];
    onInequitiesChange(updatedInequalities);
    
    // If there's an external add rule handler, call it
    if (externalOnAddRule) {
      externalOnAddRule();
    }
  };
  
  const handleDeleteInequality = (index: number) => {
    if (!onInequitiesChange) return;
    const updatedInequalities = [...inequalities];
    updatedInequalities.splice(index, 1);
    onInequitiesChange(updatedInequalities);
    
    // If we're deleting the newly added condition, clear that state
    if (inequalities[index].id === newlyAddedConditionId && onClearNewlyAddedCondition) {
      onClearNewlyAddedCondition();
    }
  };
  
  const handleInequalityChange = (index: number, updatedInequality: Inequality) => {
    if (!onInequitiesChange) return;
    const updatedInequalities = [...inequalities];
    updatedInequalities[index] = updatedInequality;
    onInequitiesChange(updatedInequalities);
  };
  
  const handleRequiredConditionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onRequiredConditionsChange) return;
    const value = parseInt(e.target.value);
    if (isNaN(value)) return;

    // Ensure value is at least 1 and at most the number of inequalities
    const validValue = Math.max(1, Math.min(value, inequalities.length));
    onRequiredConditionsChange(validValue);
  };

  // Check if there are missing required fields in the inequalities - only show when showValidation is true
  const hasIncompleteRules = showValidation && editable && inequalities.some(inequality => !inequality.left?.type || !inequality.condition || !inequality.right?.type || inequality.left?.type === 'INDICATOR' && !inequality.left?.indicator || inequality.right?.type === 'INDICATOR' && !inequality.right?.indicator || inequality.right?.type === 'VALUE' && inequality.right?.value === undefined);

  // Check if OR group has fewer than 2 conditions
  const shouldHaveMoreConditions = isOrGroup && inequalities.length < 2 && editable;
  
  return (
    <div className={`rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold">{title}</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                
              </TooltipTrigger>
              <TooltipContent className="w-80 p-4">
                <p className="text-sm">
                  {isOrGroup ? "In the OR group, only a subset of conditions need to be met. This is useful for confirmatory signals where any one of several indicators can validate your trading decision. For reliability, it's recommended to have at least 2 conditions in this group." : "In the AND group, all conditions must be met simultaneously. Use this for essential criteria that form the foundation of your trading strategy."}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {editable && isOrGroup && <div className="flex items-center space-x-2">
            <Label htmlFor="requiredConditions">Required conditions:</Label>
            <Input id="requiredConditions" type="number" min="1" max={Math.max(1, inequalities.length)} value={requiredConditions === undefined ? "1" : requiredConditions} onChange={handleRequiredConditionsChange} className="w-16 h-8" placeholder="1" />
          </div>}
      </div>

      {hasIncompleteRules && showValidation && <div className="text-sm text-red-500 mb-2">
          Some conditions are incomplete
        </div>}
      
      {shouldHaveMoreConditions}
      
      {inequalities.length > 0 ? <div className="space-y-3 mt-4">
          {inequalities.map((inequality, index) => <RuleInequality 
            key={inequality.id} 
            inequality={inequality} 
            editable={editable} 
            onChange={updatedInequality => handleInequalityChange(index, updatedInequality)} 
            onDelete={() => handleDeleteInequality(index)} 
            showValidation={showValidation} 
            isNewlyAdded={newlyAddedConditionId === inequality.id} 
            onEditingComplete={onClearNewlyAddedCondition} 
          />)}
        </div> : <div className="bg-white p-4 rounded-md border text-center text-muted-foreground mt-4">
          No conditions defined yet
        </div>}
      
      {editable && <div className="mt-4">
          <Button variant="outline" size="sm" onClick={handleAddRule} className={`border-${color}-400 text-${color}-700`}>
            <Plus className="h-4 w-4 mr-2" /> Add Condition
          </Button>
        </div>}
    </div>
  );
};

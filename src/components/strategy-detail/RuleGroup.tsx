import { useState } from "react";
import { Inequality } from "./types";
import { RuleInequality } from "./RuleInequality";
import { Button } from "@/components/ui/button";
import { Plus, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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
  onAddRule,
  showValidation = false,
  newlyAddedConditionId = null,
  onClearNewlyAddedCondition
}: RuleGroupProps) => {
  const isOrGroup = title.includes("OR");
  
  const handleDeleteInequality = (index: number) => {
    if (!onInequitiesChange) return;
    
    const updatedInequalities = [...inequalities];
    updatedInequalities.splice(index, 1);
    
    onInequitiesChange(updatedInequalities);
    toast.success("Condition removed");
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
  
  // Check if there are missing required fields in the inequalities
  const hasIncompleteRules = showValidation && editable && inequalities.some(inequality => 
    !inequality.left?.type || !inequality.condition || !inequality.right?.type ||
    (inequality.left?.type === 'indicator' && !inequality.left?.indicator) ||
    (inequality.right?.type === 'indicator' && !inequality.right?.indicator) ||
    (inequality.right?.type === 'value' && !inequality.right?.value)
  );

  return (
    <div className={`rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold">{title}</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" className="h-6 w-6 p-1 ml-1" aria-label="Rule info">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {editable && isOrGroup && (
          <div className="flex items-center space-x-2">
            <Label htmlFor="requiredConditions">Required conditions:</Label>
            <Input
              id="requiredConditions"
              type="number"
              min="1"
              max={Math.max(1, inequalities.length)}
              value={requiredConditions}
              onChange={handleRequiredConditionsChange}
              className="w-16 h-8"
            />
          </div>
        )}
      </div>

      {hasIncompleteRules && (
        <div className="mb-4 p-2 bg-red-50 text-red-700 rounded-md text-sm">
          Some conditions are incomplete. Please fill in all required fields.
        </div>
      )}
      
      {inequalities.length > 0 ? (
        <div className="space-y-3 mt-4">
          {inequalities.map((inequality, index) => (
            <RuleInequality 
              key={inequality.id} 
              inequality={inequality}
              editable={editable}
              onChange={(updatedInequality) => handleInequalityChange(index, updatedInequality)}
              onDelete={() => handleDeleteInequality(index)}
              showValidation={showValidation}
              isNewlyAdded={newlyAddedConditionId === inequality.id}
              onEditingComplete={onClearNewlyAddedCondition}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white p-4 rounded-md border text-center text-muted-foreground mt-4">
          No conditions defined yet
        </div>
      )}
      
      {editable && (
        <div className="mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onAddRule}
            className={`border-${color}-400 text-${color}-700`}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Condition
          </Button>
        </div>
      )}
    </div>
  );
};

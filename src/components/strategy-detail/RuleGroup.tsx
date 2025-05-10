
import { RuleInequality } from "./RuleInequality";
import { Inequality } from "./types";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";

interface RuleGroupProps {
  title: "AND Group" | "OR Group";
  color: "blue" | "amber";
  description: string;
  inequalities: Inequality[];
  editable?: boolean;
  onInequitiesChange?: (inequalities: Inequality[]) => void;
  requiredConditions?: number;
  onRequiredConditionsChange?: (count: number) => void;
  onAddRule?: () => void;
  className?: string;
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
  onAddRule,
  className
}: RuleGroupProps) => {
  const [conditionsCount, setConditionsCount] = useState<number>(requiredConditions || 1);
  const [showSlider, setShowSlider] = useState<boolean>(false);

  // Ensure inequalities is always an array
  const safeInequalities = Array.isArray(inequalities) ? inequalities : [];

  useEffect(() => {
    if (requiredConditions !== undefined) {
      setConditionsCount(requiredConditions);
    }
  }, [requiredConditions]);

  const handleConditionsCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= safeInequalities.length) {
      setConditionsCount(value);
      if (onRequiredConditionsChange) {
        onRequiredConditionsChange(value);
      }
    }
  };

  const handleSliderChange = (value: number[]) => {
    if (value.length > 0) {
      const newValue = value[0];
      setConditionsCount(newValue);
      if (onRequiredConditionsChange) {
        onRequiredConditionsChange(newValue);
      }
    }
  };

  const handleInequalityChange = (updatedInequality: Inequality) => {
    if (!onInequitiesChange) return;
    const updatedInequalities = safeInequalities.map(inequality => 
      inequality.id === updatedInequality.id ? updatedInequality : inequality
    );
    onInequitiesChange(updatedInequalities);
  };

  const handleInequalityDelete = (id: string | number) => {
    if (!onInequitiesChange) return;
    const updatedInequalities = safeInequalities.filter(inequality => inequality.id !== id);
    onInequitiesChange(updatedInequalities);

    // Adjust required conditions if needed
    if (title === "OR Group" && conditionsCount > updatedInequalities.length) {
      const newCount = Math.max(1, updatedInequalities.length);
      setConditionsCount(newCount);
      if (onRequiredConditionsChange) {
        onRequiredConditionsChange(newCount);
      }
    }
  };

  // When extracting OR group description, ensure we use requiredConditions property
  const effectiveInequalitiesCount = Math.max(2, safeInequalities?.length || 0);
  const orGroupDescription = title === "OR Group" 
    ? `At least ${requiredConditions || 1} of ${effectiveInequalitiesCount} conditions must be met.` 
    : description;

  // Calculate max possible required conditions based on available inequalities
  const maxRequiredConditions = safeInequalities?.length || 1;

  return (
    <div className={`mb-6 ${className || ''}`}>
      <div className={`${color === "blue" ? "bg-blue-50" : "bg-amber-50"} p-3 rounded-md mb-3`}>
        <h4 className={`text-sm font-semibold mb-1 ${color === "blue" ? "text-blue-800" : "text-amber-800"}`}>
          {title}
        </h4>
        {title === "OR Group" && editable ? (
          <div className="text-xs text-muted-foreground mb-2 flex items-center flex-wrap gap-2">
            <span>At least</span> 
            <div className="flex items-center">
              <Input 
                type="number" 
                min={1} 
                max={maxRequiredConditions} 
                value={conditionsCount} 
                onChange={handleConditionsCountChange} 
                className="w-16 h-6 px-2 py-0 inline-block mx-1 text-xs" 
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground ml-1 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Specify how many conditions from the OR group must be true for the rule to trigger.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span>of {effectiveInequalitiesCount} conditions must be met.</span>
            
            {showSlider && safeInequalities.length > 0}
          </div>
        ) : title === "OR Group" ? (
          <p className="text-xs text-muted-foreground mb-2">
            {orGroupDescription}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mb-2">{description}</p>
        )}
      </div>
      
      <div className="space-y-3">
        {safeInequalities && safeInequalities.length > 0 ? (
          safeInequalities.map(inequality => (
            <div key={`${title.toLowerCase().split(' ')[0]}-${inequality.id}`}>
              <RuleInequality 
                inequality={inequality} 
                editable={editable} 
                onChange={handleInequalityChange} 
                onDelete={editable ? () => handleInequalityDelete(inequality.id) : undefined} 
              />
            </div>
          ))
        ) : (
          <div className="p-3 bg-gray-100 rounded text-center text-gray-500">
            No conditions defined
          </div>
        )}
      </div>
      
      {editable && (
        <div className="mt-3">
          <Button variant="outline" size="sm" className="w-full border-dashed" onClick={onAddRule}>
            <Plus className="mr-1 h-4 w-4" /> Add Condition
          </Button>
        </div>
      )}
    </div>
  );
};

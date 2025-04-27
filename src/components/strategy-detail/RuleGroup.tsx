
import { RuleInequality } from "./RuleInequality";
import { Inequality } from "./types";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
  inequalities,
  editable = false,
  onInequitiesChange,
  requiredConditions,
  onRequiredConditionsChange,
  onAddRule,
  className
}: RuleGroupProps) => {
  
  const [conditionsCount, setConditionsCount] = useState<number>(requiredConditions || 1);

  useEffect(() => {
    if (requiredConditions !== undefined) {
      setConditionsCount(requiredConditions);
    }
  }, [requiredConditions]);

  const handleConditionsCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= inequalities.length) {
      setConditionsCount(value);
      if (onRequiredConditionsChange) {
        onRequiredConditionsChange(value);
      }
    }
  };
  
  const handleInequalityChange = (updatedInequality: Inequality) => {
    if (!onInequitiesChange) return;
    
    const updatedInequalities = inequalities.map(inequality => 
      inequality.id === updatedInequality.id ? updatedInequality : inequality
    );
    
    onInequitiesChange(updatedInequalities);
  };
  
  const handleInequalityDelete = (id: number) => {
    if (!onInequitiesChange) return;
    
    const updatedInequalities = inequalities.filter(inequality => inequality.id !== id);
    onInequitiesChange(updatedInequalities);
  };
  
  // Ensure we show "At least 1 of X conditions must be met." for OR groups
  // where X is the actual number of inequalities (minimum 2)
  const effectiveInequalitiesCount = Math.max(2, inequalities?.length || 0);
  const orGroupDescription = title === "OR Group"
    ? `At least ${requiredConditions || 1} of ${effectiveInequalitiesCount} conditions must be met.`
    : description;
  
  return (
    <div className={`mb-6 ${className || ''}`}>
      <div className={`${color === "blue" ? "bg-blue-50" : "bg-amber-50"} p-2 rounded-md mb-3`}>
        <h4 className={`text-sm font-semibold mb-1 ${color === "blue" ? "text-blue-800" : "text-amber-800"}`}>
          {title}
        </h4>
        {title === "OR Group" && editable ? (
          <p className="text-xs text-muted-foreground mb-2">
            At least <Input 
              type="number" 
              min={1} 
              max={inequalities.length}
              value={conditionsCount} 
              onChange={handleConditionsCountChange}
              className="w-16 h-6 px-2 py-0 inline-block mx-1 text-xs" 
            /> of {effectiveInequalitiesCount} conditions must be met.
          </p>
        ) : title === "OR Group" ? (
          <p className="text-xs text-muted-foreground mb-2">
            {orGroupDescription}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mb-2">{description}</p>
        )}
      </div>
      
      <div className="space-y-3">
        {inequalities && inequalities.length > 0 ? (
          inequalities.map((inequality) => (
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
      
      {editable && onAddRule && (
        <div className="mt-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full border-dashed"
            onClick={onAddRule}
          >
            <Plus className="mr-1 h-4 w-4" /> Add Rule
          </Button>
        </div>
      )}
    </div>
  );
};

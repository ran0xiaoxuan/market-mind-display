
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

  const groupTitle = title === "AND Group" ? "AND Group" : "OR Group";
  const groupColor = color === "blue" ? "bg-blue-50 border-blue-100" : "bg-amber-50 border-amber-100";
  const textColor = color === "blue" ? "text-blue-800" : "text-amber-800";
  
  return (
    <div className={`mb-6 ${className || ''}`}>
      <div className={`${groupColor} border rounded-lg p-4 mb-4`}>
        <h4 className={`text-sm font-semibold ${textColor}`}>
          {groupTitle}
        </h4>
        {title === "OR Group" && editable ? (
          <p className="text-sm text-muted-foreground mt-1">
            At least <Input 
              type="number" 
              min={1} 
              max={inequalities.length}
              value={conditionsCount} 
              onChange={handleConditionsCountChange}
              className="w-16 h-6 px-2 py-0 inline-block mx-1 text-xs" 
            /> of {inequalities.length} conditions must be met.
          </p>
        ) : title === "OR Group" ? (
          <p className="text-sm text-muted-foreground mt-1">
            At least {requiredConditions || 1} of {inequalities.length} conditions must be met.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      
      <div className="space-y-4">
        {inequalities.map((inequality) => (
          <div key={`${title.toLowerCase().split(' ')[0]}-${inequality.id}`}
               className="bg-white rounded-lg border border-gray-100 p-4 hover:border-gray-200 transition-colors">
            <RuleInequality 
              inequality={inequality} 
              editable={editable}
              onChange={handleInequalityChange}
              onDelete={editable ? () => handleInequalityDelete(inequality.id) : undefined}
            />
          </div>
        ))}
      </div>
      
      {editable && onAddRule && (
        <div className="mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full border-dashed hover:border-gray-400"
            onClick={onAddRule}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Rule
          </Button>
        </div>
      )}
    </div>
  );
};

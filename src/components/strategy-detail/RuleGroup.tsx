
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
  
  const handleAddDefaultInequalities = () => {
    if (!onInequitiesChange || inequalities.length !== 0) return;
    
    // Always add 2 default inequalities for OR groups
    const defaultInequalities: Inequality[] = [
      {
        id: 1,
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
        }
      },
      {
        id: 2,
        left: {
          type: "indicator",
          indicator: "Volume",
          parameters: {
            period: "5"
          }
        },
        condition: "Greater Than",
        right: {
          type: "indicator",
          indicator: "Volume MA",
          parameters: {
            period: "20"
          }
        }
      }
    ];
    
    onInequitiesChange(defaultInequalities);
  };

  useEffect(() => {
    if (title === "OR Group" && inequalities.length === 0) {
      handleAddDefaultInequalities();
    }
  }, [title, inequalities.length]);
  
  // Ensure we show "At least 1 of 2 conditions must be met." for OR groups
  const orGroupDescription = inequalities.length >= 2 
    ? `At least ${requiredConditions || 1} of ${inequalities.length} conditions must be met.`
    : "At least 1 of 2 conditions must be met.";
  
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
            /> of {inequalities.length} conditions must be met.
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
        {inequalities.map((inequality) => (
          <div key={`${title.toLowerCase().split(' ')[0]}-${inequality.id}`}>
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

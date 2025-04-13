
import { RuleInequality } from "./RuleInequality";
import { Inequality } from "./types";

interface RuleGroupProps {
  title: "AND Group" | "OR Group";
  color: "blue" | "amber";
  description: string;
  inequalities: Inequality[];
  editable?: boolean;
  onInequitiesChange?: (inequalities: Inequality[]) => void;
}

export const RuleGroup = ({ 
  title, 
  color, 
  description, 
  inequalities,
  editable = false,
  onInequitiesChange
}: RuleGroupProps) => {
  
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
  
  return (
    <div className="mb-6">
      <div className={`${color === "blue" ? "bg-blue-50" : "bg-amber-50"} p-2 rounded-md mb-3`}>
        <h4 className={`text-sm font-semibold mb-1 ${color === "blue" ? "text-blue-800" : "text-amber-800"}`}>
          {title}
        </h4>
        <p className="text-xs text-muted-foreground mb-2">{description}</p>
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
    </div>
  );
};

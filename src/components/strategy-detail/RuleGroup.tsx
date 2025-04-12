
import { RuleInequality } from "./RuleInequality";

interface RuleGroupProps {
  title: "AND Group" | "OR Group";
  color: "blue" | "amber";
  description: string;
  inequalities: any[];
}

export const RuleGroup = ({ 
  title, 
  color, 
  description, 
  inequalities 
}: RuleGroupProps) => {
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
            <RuleInequality inequality={inequality} />
          </div>
        ))}
      </div>
    </div>
  );
};

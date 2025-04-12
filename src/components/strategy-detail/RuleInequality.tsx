
import { Badge } from "@/components/Badge";
import { IndicatorParameter } from "./IndicatorParameter";
import { Inequality } from "./types";

interface RuleInequalityProps {
  inequality: Inequality;
}

export const RuleInequality = ({ inequality }: RuleInequalityProps) => {
  const renderSide = (side: any) => {
    if (side.type === "indicator") {
      return (
        <IndicatorParameter 
          indicator={side.indicator || ""} 
          parameters={side.parameters || {}} 
        />
      );
    } else if (side.type === "price") {
      return (
        <div className="flex flex-col">
          <span className="font-medium">{side.value}</span>
          <span className="text-xs text-muted-foreground">
            Price value
          </span>
        </div>
      );
    } else if (side.type === "value") {
      return (
        <div className="flex flex-col">
          <span className="font-medium">{side.value}</span>
          <span className="text-xs text-muted-foreground">
            Constant value
          </span>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col">
        <span className="font-medium">Unknown type</span>
      </div>
    );
  };
  
  return (
    <div className="bg-slate-50 p-3 rounded-lg">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
        <div className="p-2 bg-white rounded border">
          {renderSide(inequality.left)}
        </div>
        <div className="flex justify-center">
          <Badge variant="outline" className="bg-white font-medium text-center">
            {inequality.condition}
          </Badge>
        </div>
        <div className="p-2 bg-white rounded border">
          {renderSide(inequality.right)}
        </div>
      </div>
    </div>
  );
};

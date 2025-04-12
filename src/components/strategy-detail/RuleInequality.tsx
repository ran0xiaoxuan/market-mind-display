
import { Badge } from "@/components/Badge";
import { IndicatorParameter } from "./IndicatorParameter";

interface InequalitySide {
  type: string;
  indicator?: string;
  parameters?: Record<string, string>;
  value?: string;
}

interface RuleInequalityProps {
  inequality: {
    id: number;
    left: InequalitySide;
    condition: string;
    right: InequalitySide;
  };
}

export const RuleInequality = ({ inequality }: RuleInequalityProps) => {
  const renderSide = (side: InequalitySide) => {
    if (side.type === "indicator") {
      return <IndicatorParameter indicator={side.indicator!} parameters={side.parameters!} />;
    } else if (side.type === "price") {
      return <span className="font-medium">{side.value} Price</span>;
    } else {
      return <span className="font-medium">{side.value}</span>;
    }
  };

  // Special case for Volume MA
  if (inequality.right && 
      inequality.right.indicator === "Volume MA") {
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
            <span className="font-medium">20-day MA</span>
          </div>
        </div>
      </div>
    );
  }

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

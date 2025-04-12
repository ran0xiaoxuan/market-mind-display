
import { Badge } from "@/components/Badge";

interface RuleInequalityProps {
  inequality: {
    id: number;
    indicator: string;
    condition: string;
    value: string;
    indicatorPeriod: string;
    valuePeriod: string;
  };
}

export const RuleInequality = ({ inequality }: RuleInequalityProps) => {
  return (
    <div className="bg-slate-50 p-3 rounded-lg">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
        <div className="p-2 bg-white rounded border">
          <div className="flex flex-col">
            <span className="font-medium">{inequality.indicator}</span>
            <span className="text-xs text-muted-foreground">
              period: {inequality.indicatorPeriod}
            </span>
          </div>
        </div>
        <div className="flex justify-center">
          <Badge variant="outline" className="bg-white font-medium text-center">
            {inequality.condition}
          </Badge>
        </div>
        <div className="p-2 bg-white rounded border">
          <div className="flex flex-col">
            <span className="font-medium">{inequality.value}</span>
            <span className="text-xs text-muted-foreground">
              period: {inequality.valuePeriod}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

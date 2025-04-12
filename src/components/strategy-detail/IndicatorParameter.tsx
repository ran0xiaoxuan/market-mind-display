
import { Badge } from "@/components/Badge";

interface IndicatorParameterProps {
  indicator: string;
  parameters: Record<string, string>;
}

export const IndicatorParameter = ({
  indicator,
  parameters
}: IndicatorParameterProps) => {
  if (indicator === "MACD") {
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-medium">{indicator}</span>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5">
            MACD line
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">
          fast: {parameters.fast || '12'}, 
          slow: {parameters.slow || '26'},
          signal: {parameters.signal || '9'}
        </span>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col">
      <span className="font-medium">{indicator}</span>
      <span className="text-xs text-muted-foreground">
        {Object.entries(parameters).map(([key, value]) => `${key}: ${value}`).join(', ')}
      </span>
    </div>
  );
};

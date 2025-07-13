
import { Badge } from "@/components/ui/badge";
import { getIndicatorSource, getSourceColor, IndicatorSource as IndicatorSourceType } from "@/lib/indicatorSources";

interface IndicatorSourceProps {
  indicator?: string;
  className?: string;
}

export const IndicatorSource = ({ indicator, className = "" }: IndicatorSourceProps) => {
  if (!indicator) return null;
  
  const source = getIndicatorSource(indicator);
  const colorClass = getSourceColor(source);
  
  return (
    <Badge 
      variant="outline" 
      className={`text-xs ${colorClass} ${className}`}
    >
      {source}
    </Badge>
  );
};

interface DataSourcesSummaryProps {
  indicators: string[];
  className?: string;
}

export const DataSourcesSummary = ({ indicators, className = "" }: DataSourcesSummaryProps) => {
  const uniqueSources = Array.from(new Set(indicators.map(getIndicatorSource)));
  
  if (uniqueSources.length === 0) return null;
  
  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-sm font-medium text-muted-foreground">Data Sources</h4>
      <div className="flex flex-wrap gap-2">
        {uniqueSources.map((source) => (
          <Badge 
            key={source}
            variant="outline" 
            className={`text-xs ${getSourceColor(source)}`}
          >
            {source}
          </Badge>
        ))}
      </div>
    </div>
  );
};

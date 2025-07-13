
import { Badge } from "@/components/ui/badge";
import { getIndicatorSource, getSourceBadgeColor } from "@/lib/indicatorSources";

interface IndicatorSourceProps {
  indicator?: string;
  type?: string;
  className?: string;
}

export const IndicatorSource = ({ indicator, type, className = "" }: IndicatorSourceProps) => {
  const source = getIndicatorSource(indicator, type);
  const badgeColor = getSourceBadgeColor(source);
  
  return (
    <Badge 
      variant="outline" 
      className={`text-xs ${badgeColor} ${className}`}
    >
      {source}
    </Badge>
  );
};

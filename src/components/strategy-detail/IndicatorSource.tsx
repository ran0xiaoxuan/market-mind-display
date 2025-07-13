
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getIndicatorSource, getSourceBadgeColor } from '@/lib/indicatorSources';

interface IndicatorSourceProps {
  indicator: string;
  className?: string;
}

export const IndicatorSource: React.FC<IndicatorSourceProps> = ({ 
  indicator, 
  className = "" 
}) => {
  const source = getIndicatorSource(indicator);
  const colorClass = getSourceBadgeColor(source);
  
  return (
    <Badge 
      variant="outline" 
      className={`text-xs ${colorClass} ${className}`}
    >
      {source}
    </Badge>
  );
};

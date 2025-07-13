
import { Inequality } from "../types";
import { IndicatorSource } from "../IndicatorSource";

interface CompactInequalityDisplayProps {
  inequality: Inequality;
}

const formatSideDisplay = (side: Inequality['left'] | Inequality['right']) => {
  if (side.type === "INDICATOR") {
    const valueType = side.valueType && side.valueType !== 'Value' ? ` (${side.valueType})` : '';
    return `${side.indicator}${valueType}`;
  } else if (side.type === "PRICE") {
    return side.value || "Price";
  } else if (side.type === "VALUE") {
    return side.value || "0";
  }
  return "Unknown";
};

const formatCondition = (condition: string) => {
  const conditionMap: { [key: string]: string } = {
    'GREATER_THAN': '>',
    'LESS_THAN': '<',
    'GREATER_THAN_OR_EQUAL': '≥',
    'LESS_THAN_OR_EQUAL': '≤',
    'EQUAL': '=',
    'NOT_EQUAL': '≠',
    'CROSSES_ABOVE': 'crosses above',
    'CROSSES_BELOW': 'crosses below'
  };
  
  return conditionMap[condition] || condition;
};

export const CompactInequalityDisplay = ({ inequality }: CompactInequalityDisplayProps) => {
  return (
    <div className="p-2 bg-muted/20 rounded border text-xs">
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="font-medium text-xs">
            {formatSideDisplay(inequality.left)}
          </span>
          {inequality.left.type === "INDICATOR" && (
            <IndicatorSource 
              indicator={inequality.left.indicator} 
              type={inequality.left.type}
              className="text-[10px] px-1 py-0"
            />
          )}
        </div>
        
        <span className="px-1 py-0.5 bg-background rounded text-[10px] font-mono">
          {formatCondition(inequality.condition)}
        </span>
        
        <div className="flex items-center gap-1">
          <span className="font-medium text-xs">
            {formatSideDisplay(inequality.right)}
          </span>
          {inequality.right.type === "INDICATOR" && (
            <IndicatorSource 
              indicator={inequality.right.indicator} 
              type={inequality.right.type}
              className="text-[10px] px-1 py-0"
            />
          )}
          {inequality.right.type === "PRICE" && (
            <IndicatorSource 
              type={inequality.right.type}
              className="text-[10px] px-1 py-0"
            />
          )}
        </div>
      </div>
      
      {inequality.explanation && (
        <p className="text-[10px] text-muted-foreground mt-1 italic">
          {inequality.explanation}
        </p>
      )}
    </div>
  );
};

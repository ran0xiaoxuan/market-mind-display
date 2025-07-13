
import React from "react";
import { Inequality } from "./types";
import { IndicatorSource } from "./IndicatorSource";

interface RuleInequalityProps {
  inequality: Inequality;
  className?: string;
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

export const RuleInequality: React.FC<RuleInequalityProps> = ({ 
  inequality, 
  className = "" 
}) => {
  return (
    <div className={`p-3 bg-muted/30 rounded-md border ${className}`}>
      <div className="flex items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {formatSideDisplay(inequality.left)}
          </span>
          {inequality.left.type === "INDICATOR" && (
            <IndicatorSource 
              indicator={inequality.left.indicator} 
              type={inequality.left.type}
            />
          )}
        </div>
        
        <span className="px-2 py-1 bg-background rounded text-xs font-mono">
          {formatCondition(inequality.condition)}
        </span>
        
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {formatSideDisplay(inequality.right)}
          </span>
          {inequality.right.type === "INDICATOR" && (
            <IndicatorSource 
              indicator={inequality.right.indicator} 
              type={inequality.right.type}
            />
          )}
          {inequality.right.type === "PRICE" && (
            <IndicatorSource 
              type={inequality.right.type}
            />
          )}
        </div>
      </div>
      
      {inequality.explanation && (
        <p className="text-xs text-muted-foreground mt-2 italic">
          {inequality.explanation}
        </p>
      )}
    </div>
  );
};

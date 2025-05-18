
import React from "react";
import { Inequality } from "../types";
import { Button } from "@/components/ui/button";
import { Trash2, Equal, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CompactInequalityDisplayProps {
  inequality: Inequality;
  editable?: boolean;
  isIncomplete?: boolean;
  showValidation?: boolean;
  onEdit: () => void;
  onDelete?: () => void;
}

export const CompactInequalityDisplay: React.FC<CompactInequalityDisplayProps> = ({
  inequality,
  editable = false,
  isIncomplete = false,
  showValidation = false,
  onEdit,
  onDelete
}) => {
  // Format the inequality side for display
  const formatSideForDisplay = (side: any) => {
    if (!side || !side.type) {
      return "Unknown";
    }
    if (side.type === "INDICATOR") {
      // Display indicator with key parameters if available
      if (side.indicator) {
        let displayText = side.indicator;
        
        // Show valueType if available (e.g., MACD Line, Signal, etc)
        if (side.valueType && side.valueType !== "number") {
          displayText += ` (${side.valueType})`;
        }

        return (
          <div className="flex flex-col">
            <span className="font-medium">{displayText}</span>
            {renderIndicatorParameters(side)}
          </div>
        );
      }
      return "Unknown indicator";
    } else if (side.type === "PRICE") {
      return side.value || "Price";
    } else if (side.type === "VALUE") {
      return side.value || "0";
    } else {
      return "Unknown type";
    }
  };
  
  // Render indicator parameters based on indicator type
  const renderIndicatorParameters = (side: any) => {
    if (!side.indicator || !side.parameters) {
      return null;
    }
    
    const params = [];
    const indicator = side.indicator.toUpperCase();
    
    switch (indicator) {
      case "MACD":
        if (side.parameters.fast) params.push(`Fast: ${side.parameters.fast}`);
        if (side.parameters.slow) params.push(`Slow: ${side.parameters.slow}`);
        if (side.parameters.signal) params.push(`Signal: ${side.parameters.signal}`);
        break;
        
      case "RSI":
      case "CCI":
      case "STOCHASTIC":
      case "STOCHRSI":
        if (side.parameters.period) params.push(`Period: ${side.parameters.period}`);
        if (indicator === "STOCHASTIC" || indicator === "STOCHRSI") {
          if (side.parameters.k) params.push(`K: ${side.parameters.k}`);
          if (side.parameters.d) params.push(`D: ${side.parameters.d}`);
          if (side.parameters.slowing) params.push(`Slowing: ${side.parameters.slowing}`);
        }
        break;
        
      case "BOLLINGER BANDS":
        if (side.parameters.period) params.push(`Period: ${side.parameters.period}`);
        if (side.parameters.deviation) params.push(`Dev: ${side.parameters.deviation}`);
        break;
        
      case "ICHIMOKU CLOUD":
        if (side.parameters.conversionPeriod) params.push(`Conv: ${side.parameters.conversionPeriod}`);
        if (side.parameters.basePeriod) params.push(`Base: ${side.parameters.basePeriod}`);
        if (side.parameters.laggingSpan) params.push(`Lag: ${side.parameters.laggingSpan}`);
        break;
      
      case "SMA":
      case "EMA":
      case "WMA":
      case "VWMA":
        if (side.parameters.period) params.push(`Period: ${side.parameters.period}`);
        break;
        
      case "ATR":
      case "SUPERTREND":
      case "CHANDELIER EXIT":
        if (side.parameters.period || side.parameters.atrPeriod) {
          params.push(`Period: ${side.parameters.period || side.parameters.atrPeriod}`);
        }
        if (side.parameters.multiplier) params.push(`Mult: ${side.parameters.multiplier}`);
        break;
        
      case "AWESOME OSCILLATOR":
        if (side.parameters.fast || side.parameters.fastLength) {
          params.push(`Fast: ${side.parameters.fast || side.parameters.fastLength}`);
        }
        if (side.parameters.slow || side.parameters.slowLength) {
          params.push(`Slow: ${side.parameters.slow || side.parameters.slowLength}`);
        }
        break;
        
      default:
        // For indicators with just a period
        if (side.parameters.period) params.push(`Period: ${side.parameters.period}`);
        break;
    }
    
    if (side.parameters.source) params.push(`Source: ${side.parameters.source}`);
    
    if (params.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {params.map((param, index) => (
          <Badge key={index} variant="outline" className="text-xs bg-gray-50">
            {param}
          </Badge>
        ))}
      </div>
    );
  };

  // Get the human-readable condition symbol and icon
  const getConditionSymbol = (condition: string) => {
    switch (condition) {
      case 'CROSSES_ABOVE':
        return {
          text: 'crosses above',
          icon: <ArrowUpRight className="h-4 w-4 text-green-600" />
        };
      case 'CROSSES_BELOW':
        return {
          text: 'crosses below',
          icon: <ArrowDownRight className="h-4 w-4 text-red-600" />
        };
      case 'GREATER_THAN':
        return {
          text: '>',
          icon: null
        };
      case 'LESS_THAN':
        return {
          text: '<',
          icon: null
        };
      case 'EQUAL':
        return {
          text: '=',
          icon: <Equal className="h-4 w-4" />
        };
      case 'GREATER_THAN_OR_EQUAL':
        return {
          text: '≥',
          icon: null
        };
      case 'LESS_THAN_OR_EQUAL':
        return {
          text: '≤',
          icon: null
        };
      default:
        return {
          text: condition || 'unknown',
          icon: null
        };
    }
  };

  const conditionSymbol = getConditionSymbol(inequality.condition);
  
  return (
    <div className={`p-4 rounded-lg bg-white border ${isIncomplete && showValidation ? 'border-red-300' : 'border-gray-200'}`}>
      <div className="flex flex-col gap-2">
        <div className="flex justify-end items-center">
          {editable && (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 px-3 text-xs">
                Edit
              </Button>
              {onDelete && (
                <Button variant="ghost" size="sm" onClick={onDelete} className="h-7 px-2 text-xs text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-center gap-3 py-3">
          <div className="px-4 py-2 rounded-md bg-gray-50 border border-gray-200 text-sm font-medium min-w-[120px] text-center">
            {formatSideForDisplay(inequality.left)}
          </div>
          
          <div className="flex items-center justify-center px-3 py-2 rounded-md bg-gray-100 border border-gray-200 font-bold text-lg min-w-[50px] text-center">
            {conditionSymbol.icon || conditionSymbol.text}
          </div>
          
          <div className="px-4 py-2 rounded-md bg-gray-50 border border-gray-200 text-sm font-medium min-w-[120px] text-center">
            {formatSideForDisplay(inequality.right)}
          </div>
        </div>
        
        {inequality.explanation && (
          <p className="text-xs text-muted-foreground mt-1 bg-gray-50 p-2 rounded border border-gray-100">
            {inequality.explanation}
          </p>
        )}
      </div>
    </div>
  );
};

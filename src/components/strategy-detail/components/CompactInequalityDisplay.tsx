
import React from "react";
import { Inequality } from "../types";
import { Button } from "@/components/ui/button";
import { Trash2, Equal } from "lucide-react";

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

        // Add important parameters in parentheses if they exist
        const params = [];
        if (side.parameters?.period) params.push(`period: ${side.parameters.period}`);
        if (side.parameters?.fast) params.push(`fast: ${side.parameters.fast}`);
        if (side.parameters?.slow) params.push(`slow: ${side.parameters.slow}`);
        if (side.parameters?.signal) params.push(`signal: ${side.parameters.signal}`);
        if (params.length > 0) {
          displayText += ` (${params.join(", ")})`;
        }
        return displayText;
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

  // Get the human-readable condition symbol and icon
  const getConditionSymbol = (condition: string) => {
    switch (condition) {
      case 'CROSSES_ABOVE':
        return {
          text: 'crosses above',
        };
      case 'CROSSES_BELOW':
        return {
          text: 'crosses below',
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
          <div className="px-4 py-2 rounded-md bg-blue-50 border border-blue-100 text-sm font-medium min-w-[100px] text-center">
            {formatSideForDisplay(inequality.left)}
          </div>
          
          <div className="flex items-center justify-center px-3 py-2 rounded-md bg-gray-100 border border-gray-200 font-bold text-lg min-w-[50px] text-center">
            {conditionSymbol.icon || conditionSymbol.text}
          </div>
          
          <div className="px-4 py-2 rounded-md bg-amber-50 border border-amber-100 text-sm font-medium min-w-[100px] text-center">
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

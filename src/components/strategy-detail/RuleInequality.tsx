
import { useState, useEffect } from "react";
import { Inequality } from "./types";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { IndicatorParameter } from "./IndicatorParameter";
import { AvailableIndicators } from "./AvailableIndicators";

interface RuleInequalityProps {
  inequality: Inequality;
  editable?: boolean;
  onChange?: (updatedInequality: Inequality) => void;
  onDelete?: () => void;
  showValidation?: boolean;
  isNewlyAdded?: boolean;
  onEditingComplete?: () => void;
}

// Main Rule Inequality component
export const RuleInequality = ({
  inequality,
  editable = false,
  onChange,
  onDelete,
  showValidation = false,
  isNewlyAdded = false,
  onEditingComplete
}: RuleInequalityProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(isNewlyAdded);
  const [localInequality, setLocalInequality] = useState<Inequality>(inequality);
  
  useEffect(() => {
    setLocalInequality(inequality);
  }, [inequality]);

  useEffect(() => {
    // When newly added, auto-open the editor
    if (isNewlyAdded) {
      setIsOpen(true);
    }
  }, [isNewlyAdded]);

  const handleSaveChanges = () => {
    if (onChange) {
      onChange(localInequality);
    }
    setIsOpen(false);
    if (onEditingComplete) {
      onEditingComplete();
    }
  };

  const handleCancelChanges = () => {
    setLocalInequality(inequality);
    setIsOpen(false);
    if (onEditingComplete) {
      onEditingComplete();
    }
  };

  // Check if the inequality has empty/missing required fields
  const hasEmptyRequiredFields = (side: 'left' | 'right') => {
    const sideObj = side === 'left' ? localInequality.left : localInequality.right;
    
    if (!sideObj.type) {
      return true;
    }
    
    if (sideObj.type === 'INDICATOR' && !sideObj.indicator) {
      return true;
    }
    
    if (sideObj.type === 'VALUE' && sideObj.value === undefined) {
      return true;
    }
    
    return false;
  };

  const isIncomplete = !localInequality.condition || 
                       hasEmptyRequiredFields('left') || 
                       hasEmptyRequiredFields('right');

  // Format the inequality for display
  const formatSideForDisplay = (side: any) => {
    if (!side || !side.type) {
      return "Unknown";
    }
    
    if (side.type === "INDICATOR") {
      return side.indicator || "Unknown indicator";
    } else if (side.type === "VALUE") {
      return side.value || "0";
    } else {
      return "Unknown type";
    }
  };

  const getConditionSymbol = (condition: string) => {
    switch (condition) {
      case 'CROSSES_ABOVE': return 'crosses above';
      case 'CROSSES_BELOW': return 'crosses below';
      case 'GREATER_THAN': return '>';
      case 'LESS_THAN': return '<';
      case 'EQUAL': return '=';
      case 'GREATER_THAN_OR_EQUAL': return '≥';
      case 'LESS_THAN_OR_EQUAL': return '≤';
      default: return condition || 'unknown';
    }
  };

  // Compact display when not in edit mode
  const renderCompactDisplay = () => {
    return (
      <div className={`p-3 rounded-lg bg-white border ${isIncomplete && showValidation ? 'border-red-300' : 'border-gray-200'}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1 overflow-hidden">
            <span className="text-sm font-medium truncate">{formatSideForDisplay(localInequality.left)}</span>
            <span className="text-xs text-gray-500 px-1">{getConditionSymbol(localInequality.condition)}</span>
            <span className="text-sm font-medium truncate">{formatSideForDisplay(localInequality.right)}</span>
            
            {isIncomplete && showValidation && (
              <Badge variant="destructive" className="ml-2">Incomplete</Badge>
            )}
          </div>
          
          {editable && (
            <div className="flex gap-1 ml-2">
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)} className="h-7 px-2 text-xs">
                Edit
              </Button>
              {onDelete && (
                <Button variant="ghost" size="sm" onClick={onDelete} className="h-7 px-2 text-xs text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
        
        {localInequality.explanation && (
          <p className="text-xs text-muted-foreground mt-1">{localInequality.explanation}</p>
        )}
      </div>
    );
  };

  // Expanded edit mode display
  const renderEditMode = () => {
    const updateInequality = (
      side: 'left' | 'right', 
      field: string, 
      value: any
    ) => {
      const updatedInequality = { 
        ...localInequality,
        [side]: { 
          ...localInequality[side], 
          [field]: value 
        }
      };
      setLocalInequality(updatedInequality);
    };
    
    const updateParameters = (
      side: 'left' | 'right', 
      paramName: string, 
      paramValue: string
    ) => {
      const currentParams = localInequality[side].parameters || {};
      const updatedParams = { ...currentParams, [paramName]: paramValue };
      
      const updatedInequality = {
        ...localInequality,
        [side]: {
          ...localInequality[side],
          parameters: updatedParams
        }
      };
      
      setLocalInequality(updatedInequality);
    };
    
    return (
      <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/50 space-y-4">
        {/* Left side configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
          <div className="space-y-2">
            <label className="text-sm font-medium">Left Side</label>
            <Select 
              value={localInequality.left.type} 
              onValueChange={(value) => updateInequality('left', 'type', value)}
            >
              <SelectTrigger className={`${!localInequality.left.type && showValidation ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="INDICATOR">Indicator</SelectItem>
                  <SelectItem value="VALUE">Value</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            
            {localInequality.left.type === 'INDICATOR' ? (
              <div className="space-y-2">
                <AvailableIndicators
                  selectedIndicator={localInequality.left.indicator || ''}
                  onSelectIndicator={(indicator) => updateInequality('left', 'indicator', indicator)}
                  className={`${!localInequality.left.indicator && showValidation ? 'border-red-500' : ''}`}
                />
                
                {localInequality.left.indicator && (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Parameters</label>
                    <div className="grid grid-cols-2 gap-1">
                      <IndicatorParameter
                        name="period"
                        value={(localInequality.left.parameters?.period || '14')}
                        onChange={(value) => updateParameters('left', 'period', value)}
                      />
                      
                      {/* Add more parameters as needed based on indicator type */}
                      {localInequality.left.indicator === 'MACD' && (
                        <>
                          <IndicatorParameter
                            name="fast"
                            value={(localInequality.left.parameters?.fast || '12')}
                            onChange={(value) => updateParameters('left', 'fast', value)}
                          />
                          <IndicatorParameter
                            name="slow"
                            value={(localInequality.left.parameters?.slow || '26')}
                            onChange={(value) => updateParameters('left', 'slow', value)}
                          />
                          <IndicatorParameter
                            name="signal"
                            value={(localInequality.left.parameters?.signal || '9')}
                            onChange={(value) => updateParameters('left', 'signal', value)}
                          />
                        </>
                      )}
                      
                      {/* Optional source parameter for most indicators */}
                      <IndicatorParameter
                        name="source"
                        value={(localInequality.left.parameters?.source || 'close')}
                        onChange={(value) => updateParameters('left', 'source', value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : localInequality.left.type === 'VALUE' ? (
              <Input 
                type="text"
                value={localInequality.left.value || ''}
                onChange={(e) => updateInequality('left', 'value', e.target.value)}
                placeholder="Enter value"
                className={`${!localInequality.left.value && showValidation ? 'border-red-500' : ''}`}
              />
            ) : null}
          </div>
          
          {/* Condition */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Condition</label>
            <Select 
              value={localInequality.condition} 
              onValueChange={(value) => setLocalInequality({...localInequality, condition: value})}
            >
              <SelectTrigger className={`${!localInequality.condition && showValidation ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="CROSSES_ABOVE">Crosses Above</SelectItem>
                  <SelectItem value="CROSSES_BELOW">Crosses Below</SelectItem>
                  <SelectItem value="GREATER_THAN">Greater Than</SelectItem>
                  <SelectItem value="LESS_THAN">Less Than</SelectItem>
                  <SelectItem value="EQUAL">Equal</SelectItem>
                  <SelectItem value="GREATER_THAN_OR_EQUAL">Greater Than or Equal</SelectItem>
                  <SelectItem value="LESS_THAN_OR_EQUAL">Less Than or Equal</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          {/* Right side configuration */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Right Side</label>
            <Select 
              value={localInequality.right.type} 
              onValueChange={(value) => updateInequality('right', 'type', value)}
            >
              <SelectTrigger className={`${!localInequality.right.type && showValidation ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="INDICATOR">Indicator</SelectItem>
                  <SelectItem value="VALUE">Value</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            
            {localInequality.right.type === 'INDICATOR' ? (
              <div className="space-y-2">
                <AvailableIndicators
                  selectedIndicator={localInequality.right.indicator || ''}
                  onSelectIndicator={(indicator) => updateInequality('right', 'indicator', indicator)}
                  className={`${!localInequality.right.indicator && showValidation ? 'border-red-500' : ''}`}
                />
                
                {localInequality.right.indicator && (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Parameters</label>
                    <div className="grid grid-cols-2 gap-1">
                      <IndicatorParameter
                        name="period"
                        value={(localInequality.right.parameters?.period || '14')}
                        onChange={(value) => updateParameters('right', 'period', value)}
                      />
                      
                      {/* Add more parameters as needed based on indicator type */}
                      {localInequality.right.indicator === 'MACD' && (
                        <>
                          <IndicatorParameter
                            name="fast"
                            value={(localInequality.right.parameters?.fast || '12')}
                            onChange={(value) => updateParameters('right', 'fast', value)}
                          />
                          <IndicatorParameter
                            name="slow"
                            value={(localInequality.right.parameters?.slow || '26')}
                            onChange={(value) => updateParameters('right', 'slow', value)}
                          />
                          <IndicatorParameter
                            name="signal"
                            value={(localInequality.right.parameters?.signal || '9')}
                            onChange={(value) => updateParameters('right', 'signal', value)}
                          />
                        </>
                      )}
                      
                      {/* Optional source parameter for most indicators */}
                      <IndicatorParameter
                        name="source"
                        value={(localInequality.right.parameters?.source || 'close')}
                        onChange={(value) => updateParameters('right', 'source', value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : localInequality.right.type === 'VALUE' ? (
              <Input 
                type="text"
                value={localInequality.right.value || ''}
                onChange={(e) => updateInequality('right', 'value', e.target.value)}
                placeholder="Enter value"
                className={`${!localInequality.right.value && showValidation ? 'border-red-500' : ''}`}
              />
            ) : null}
          </div>
        </div>
        
        {/* Explanation field */}
        <div>
          <label className="text-sm font-medium">Explanation (optional)</label>
          <Input 
            type="text"
            value={localInequality.explanation || ''}
            onChange={(e) => setLocalInequality({...localInequality, explanation: e.target.value})}
            placeholder="Explain this rule (optional)"
          />
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleCancelChanges}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSaveChanges} disabled={isIncomplete && showValidation}>
            Save
          </Button>
        </div>
      </div>
    );
  };

  return isOpen && editable ? renderEditMode() : renderCompactDisplay();
};

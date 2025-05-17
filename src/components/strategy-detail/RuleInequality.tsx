import { useState, useEffect } from "react";
import { Inequality } from "./types";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowRight, ChevronRight, ChevronLeft, Equal } from "lucide-react";
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
    if (sideObj.type === 'PRICE' && !sideObj.value) {
      return true;
    }
    if (sideObj.type === 'VALUE' && sideObj.value === undefined) {
      return true;
    }
    return false;
  };
  const isIncomplete = !localInequality.condition || hasEmptyRequiredFields('left') || hasEmptyRequiredFields('right');

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
          icon: <ChevronRight className="h-4 w-4" />
        };
      case 'CROSSES_BELOW':
        return {
          text: 'crosses below',
          icon: <ChevronLeft className="h-4 w-4" />
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

  // Get color based on condition type
  const getConditionColor = () => {
    switch (localInequality.condition) {
      case 'CROSSES_ABOVE':
      case 'GREATER_THAN':
      case 'GREATER_THAN_OR_EQUAL':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CROSSES_BELOW':
      case 'LESS_THAN':
      case 'LESS_THAN_OR_EQUAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'EQUAL':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Compact display when not in edit mode
  const renderCompactDisplay = () => {
    const conditionColor = getConditionColor();
    const conditionSymbol = getConditionSymbol(localInequality.condition);
    return <div className={`p-4 rounded-lg bg-white border ${isIncomplete && showValidation ? 'border-red-300' : 'border-gray-200'}`}>
        <div className="flex flex-col gap-2">
          <div className="flex justify-end items-center">
            {/* Moved buttons to the top-right by changing justify-between to justify-end */}
            {editable && <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)} className="h-7 px-3 text-xs">
                  Edit
                </Button>
                {onDelete && <Button variant="ghost" size="sm" onClick={onDelete} className="h-7 px-2 text-xs text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>}
              </div>}
          </div>
          
          {/* New mathematical inequality display */}
          <div className="flex items-center justify-center gap-3 py-3">
            <div className="px-4 py-2 rounded-md bg-blue-50 border border-blue-100 text-sm font-medium min-w-[100px] text-center">
              {formatSideForDisplay(localInequality.left)}
            </div>
            
            <div className={`flex items-center justify-center px-3 py-2 rounded-md ${conditionColor} font-bold text-lg min-w-[50px] text-center`}>
              {conditionSymbol.icon || conditionSymbol.text}
            </div>
            
            <div className="px-4 py-2 rounded-md bg-amber-50 border border-amber-100 text-sm font-medium min-w-[100px] text-center">
              {formatSideForDisplay(localInequality.right)}
            </div>
          </div>
          
          {localInequality.explanation && <p className="text-xs text-muted-foreground mt-1 bg-gray-50 p-2 rounded border border-gray-100">
              {localInequality.explanation}
            </p>}
        </div>
      </div>;
  };

  // Expanded edit mode display
  const renderEditMode = () => {
    const updateInequality = (side: 'left' | 'right', field: string, value: any) => {
      const updatedInequality = {
        ...localInequality,
        [side]: {
          ...localInequality[side],
          [field]: value
        }
      };
      setLocalInequality(updatedInequality);
    };
    const updateParameters = (side: 'left' | 'right', paramName: string, paramValue: string) => {
      const currentParams = localInequality[side].parameters || {};
      const updatedParams = {
        ...currentParams,
        [paramName]: paramValue
      };
      const updatedInequality = {
        ...localInequality,
        [side]: {
          ...localInequality[side],
          parameters: updatedParams
        }
      };
      setLocalInequality(updatedInequality);
    };
    
    // Function to render the appropriate input based on type
    const renderSideInputs = (side: 'left' | 'right') => {
      const sideObj = side === 'left' ? localInequality.left : localInequality.right;
      
      if (sideObj.type === 'INDICATOR') {
        return (
          <div className="mt-2">
            <AvailableIndicators 
              selectedIndicator={sideObj.indicator || ''} 
              onSelectIndicator={indicator => updateInequality(side, 'indicator', indicator)} 
              className={`${!sideObj.indicator && showValidation ? 'border-red-500' : ''}`} 
            />
            
            {sideObj.indicator && (
              <div className="mt-2 space-y-1">
                <label className="text-xs text-muted-foreground">Parameters</label>
                <div className="grid grid-cols-2 gap-1">
                  <IndicatorParameter 
                    name="period" 
                    value={sideObj.parameters?.period || '14'} 
                    onChange={value => updateParameters(side, 'period', value)} 
                  />
                  
                  {sideObj.indicator === 'MACD' && (
                    <>
                      <IndicatorParameter 
                        name="fast" 
                        value={sideObj.parameters?.fast || '12'} 
                        onChange={value => updateParameters(side, 'fast', value)} 
                      />
                      <IndicatorParameter 
                        name="slow" 
                        value={sideObj.parameters?.slow || '26'} 
                        onChange={value => updateParameters(side, 'slow', value)} 
                      />
                      <IndicatorParameter 
                        name="signal" 
                        value={sideObj.parameters?.signal || '9'} 
                        onChange={value => updateParameters(side, 'signal', value)} 
                      />
                    </>
                  )}
                  
                  <IndicatorParameter 
                    name="source" 
                    value={sideObj.parameters?.source || 'close'} 
                    onChange={value => updateParameters(side, 'source', value)} 
                  />
                </div>
              </div>
            )}
          </div>
        );
      } else if (sideObj.type === 'PRICE') {
        return (
          <div className="mt-2">
            <Select 
              value={sideObj.value || 'close'} 
              onValueChange={value => updateInequality(side, 'value', value)}
            >
              <SelectTrigger className={`${!sideObj.value && showValidation ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Select price field" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="close">Close</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        );
      } else if (sideObj.type === 'VALUE') {
        return (
          <Input 
            type="text" 
            value={sideObj.value || ''} 
            onChange={e => updateInequality(side, 'value', e.target.value)} 
            placeholder="Enter value" 
            className={`mt-2 ${!sideObj.value && showValidation ? 'border-red-500' : ''}`} 
          />
        );
      }
      
      return null;
    };
    
    return <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/50 space-y-4">
        <h3 className="text-lg font-semibold text-center mb-2">Define Inequality Condition</h3>
        
        {/* Visual equation builder - Changed items-center to items-start to align contents to the top */}
        <div className="flex flex-col md:flex-row items-start justify-start gap-4 p-3 bg-white rounded-lg border border-gray-100">
          {/* Left side */}
          <div className="w-full md:w-1/3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="text-center mb-2 font-medium text-sm text-blue-700">Left Side</div>
            <Select value={localInequality.left.type} onValueChange={value => updateInequality('left', 'type', value)}>
              <SelectTrigger className={`${!localInequality.left.type && showValidation ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="INDICATOR">Indicator</SelectItem>
                  <SelectItem value="PRICE">Price</SelectItem>
                  {/* Removed "VALUE" option for left side */}
                </SelectGroup>
              </SelectContent>
            </Select>
            
            {renderSideInputs('left')}
          </div>
          
          {/* Condition operator - Updated to only show the four required operators */}
          <div className="w-full md:w-1/5">
            <div className="text-center mb-2 font-medium text-sm">Operator</div>
            <Select value={localInequality.condition} onValueChange={value => setLocalInequality({
              ...localInequality,
              condition: value
            })}>
              <SelectTrigger className={`${!localInequality.condition && showValidation ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Select operator" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="CROSSES_ABOVE">
                    <div className="flex items-center">
                      <span>Crosses Above</span>
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </div>
                  </SelectItem>
                  <SelectItem value="CROSSES_BELOW">
                    <div className="flex items-center">
                      <span>Crosses Below</span>
                      <ChevronLeft className="ml-2 h-4 w-4" />
                    </div>
                  </SelectItem>
                  <SelectItem value="GREATER_THAN">{`>`}</SelectItem>
                  <SelectItem value="LESS_THAN">{`<`}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          {/* Right side */}
          <div className="w-full md:w-1/3 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <div className="text-center mb-2 font-medium text-sm text-amber-700">Right Side</div>
            <Select value={localInequality.right.type} onValueChange={value => updateInequality('right', 'type', value)}>
              <SelectTrigger className={`${!localInequality.right.type && showValidation ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="INDICATOR">Indicator</SelectItem>
                  <SelectItem value="PRICE">Price</SelectItem>
                  <SelectItem value="VALUE">Value</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            
            {renderSideInputs('right')}
          </div>
        </div>
        
        {/* Explanation field */}
        <div>
          <label className="text-sm font-medium">Explanation (optional)</label>
          <Input type="text" value={localInequality.explanation || ''} onChange={e => setLocalInequality({
          ...localInequality,
          explanation: e.target.value
        })} placeholder="Explain this rule (optional)" />
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
      </div>;
  };
  return isOpen && editable ? renderEditMode() : renderCompactDisplay();
};

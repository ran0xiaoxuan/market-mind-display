import { useState, useEffect } from "react";
import { Inequality } from "./types";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowRight } from "lucide-react";
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
    } else if (side.type === "VALUE") {
      return side.value || "0";
    } else {
      return "Unknown type";
    }
  };

  // Get the human-readable condition symbol
  const getConditionSymbol = (condition: string) => {
    switch (condition) {
      case 'CROSSES_ABOVE':
        return 'crosses above';
      case 'CROSSES_BELOW':
        return 'crosses below';
      case 'GREATER_THAN':
        return 'is greater than';
      case 'LESS_THAN':
        return 'is less than';
      case 'EQUAL':
        return 'equals';
      case 'GREATER_THAN_OR_EQUAL':
        return 'is greater than or equal to';
      case 'LESS_THAN_OR_EQUAL':
        return 'is less than or equal to';
      default:
        return condition || 'unknown';
    }
  };

  // Generate a human-readable description of the inequality
  const getReadableCondition = () => {
    if (!localInequality.condition || !localInequality.left.type || !localInequality.right.type) {
      return "Incomplete condition";
    }
    const leftSide = formatSideForDisplay(localInequality.left);
    const rightSide = formatSideForDisplay(localInequality.right);
    const conditionText = getConditionSymbol(localInequality.condition);
    return `${leftSide} ${conditionText} ${rightSide}`;
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
    return <div className={`p-4 rounded-lg bg-white border ${isIncomplete && showValidation ? 'border-red-300' : 'border-gray-200'}`}>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {isIncomplete && showValidation && <Badge variant="destructive" className="h-6">Incomplete</Badge>}
              
              {!isIncomplete && !showValidation && localInequality.explanation}
            </div>
            
            {editable && <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)} className="h-7 px-3 text-xs">
                  Edit
                </Button>
                {onDelete && <Button variant="ghost" size="sm" onClick={onDelete} className="h-7 px-2 text-xs text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>}
              </div>}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-md bg-blue-50 border border-blue-100 text-sm">
              {formatSideForDisplay(localInequality.left)}
            </div>
            
            <div className={`px-3 py-1.5 rounded-md ${conditionColor} font-medium text-sm flex items-center`}>
              {getConditionSymbol(localInequality.condition)}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </div>
            
            <div className="px-3 py-1.5 rounded-md bg-amber-50 border border-amber-100 text-sm">
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
    return <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/50 space-y-4">
        {/* Left side configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
          <div className="space-y-2">
            <label className="text-sm font-medium">Left Side</label>
            <Select value={localInequality.left.type} onValueChange={value => updateInequality('left', 'type', value)}>
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
            
            {localInequality.left.type === 'INDICATOR' ? <div className="space-y-2">
                <AvailableIndicators selectedIndicator={localInequality.left.indicator || ''} onSelectIndicator={indicator => updateInequality('left', 'indicator', indicator)} className={`${!localInequality.left.indicator && showValidation ? 'border-red-500' : ''}`} />
                
                {localInequality.left.indicator && <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Parameters</label>
                    <div className="grid grid-cols-2 gap-1">
                      <IndicatorParameter name="period" value={localInequality.left.parameters?.period || '14'} onChange={value => updateParameters('left', 'period', value)} />
                      
                      {/* Add more parameters as needed based on indicator type */}
                      {localInequality.left.indicator === 'MACD' && <>
                          <IndicatorParameter name="fast" value={localInequality.left.parameters?.fast || '12'} onChange={value => updateParameters('left', 'fast', value)} />
                          <IndicatorParameter name="slow" value={localInequality.left.parameters?.slow || '26'} onChange={value => updateParameters('left', 'slow', value)} />
                          <IndicatorParameter name="signal" value={localInequality.left.parameters?.signal || '9'} onChange={value => updateParameters('left', 'signal', value)} />
                        </>}
                      
                      {/* Optional source parameter for most indicators */}
                      <IndicatorParameter name="source" value={localInequality.left.parameters?.source || 'close'} onChange={value => updateParameters('left', 'source', value)} />
                    </div>
                  </div>}
              </div> : localInequality.left.type === 'VALUE' ? <Input type="text" value={localInequality.left.value || ''} onChange={e => updateInequality('left', 'value', e.target.value)} placeholder="Enter value" className={`${!localInequality.left.value && showValidation ? 'border-red-500' : ''}`} /> : null}
          </div>
          
          {/* Condition */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Condition</label>
            <Select value={localInequality.condition} onValueChange={value => setLocalInequality({
            ...localInequality,
            condition: value
          })}>
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
            <Select value={localInequality.right.type} onValueChange={value => updateInequality('right', 'type', value)}>
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
            
            {localInequality.right.type === 'INDICATOR' ? <div className="space-y-2">
                <AvailableIndicators selectedIndicator={localInequality.right.indicator || ''} onSelectIndicator={indicator => updateInequality('right', 'indicator', indicator)} className={`${!localInequality.right.indicator && showValidation ? 'border-red-500' : ''}`} />
                
                {localInequality.right.indicator && <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Parameters</label>
                    <div className="grid grid-cols-2 gap-1">
                      <IndicatorParameter name="period" value={localInequality.right.parameters?.period || '14'} onChange={value => updateParameters('right', 'period', value)} />
                      
                      {/* Add more parameters as needed based on indicator type */}
                      {localInequality.right.indicator === 'MACD' && <>
                          <IndicatorParameter name="fast" value={localInequality.right.parameters?.fast || '12'} onChange={value => updateParameters('right', 'fast', value)} />
                          <IndicatorParameter name="slow" value={localInequality.right.parameters?.slow || '26'} onChange={value => updateParameters('right', 'slow', value)} />
                          <IndicatorParameter name="signal" value={localInequality.right.parameters?.signal || '9'} onChange={value => updateParameters('right', 'signal', value)} />
                        </>}
                      
                      {/* Optional source parameter for most indicators */}
                      <IndicatorParameter name="source" value={localInequality.right.parameters?.source || 'close'} onChange={value => updateParameters('right', 'source', value)} />
                    </div>
                  </div>}
              </div> : localInequality.right.type === 'VALUE' ? <Input type="text" value={localInequality.right.value || ''} onChange={e => updateInequality('right', 'value', e.target.value)} placeholder="Enter value" className={`${!localInequality.right.value && showValidation ? 'border-red-500' : ''}`} /> : null}
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
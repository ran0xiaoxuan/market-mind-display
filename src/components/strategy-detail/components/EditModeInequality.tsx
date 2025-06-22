
import React from "react";
import { Inequality } from "../types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { InequalitySide } from "./InequalitySide";

interface EditModeInequalityProps {
  localInequality: Inequality;
  setLocalInequality: React.Dispatch<React.SetStateAction<Inequality>>;
  isIncomplete: boolean;
  showValidation: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export const EditModeInequality: React.FC<EditModeInequalityProps> = ({
  localInequality,
  setLocalInequality,
  isIncomplete,
  showValidation,
  onSave,
  onCancel
}) => {
  // Helper function to get default parameters for an indicator
  const getDefaultParameters = (indicator: string) => {
    const normalizedIndicator = indicator.toLowerCase().replace(/\s+/g, '');
    
    switch (normalizedIndicator) {
      case 'macd':
        return { fast: '12', slow: '26', signal: '9', source: 'close' };
      case 'bollingerbands':
        return { period: '20', deviation: '2', source: 'close' };
      case 'stochastic':
        return { k: '14', d: '3', slowing: '3' };
      case 'stochrsi':
        return { rsiPeriod: '14', stochasticLength: '14', k: '14', d: '3' };
      case 'ichimokucloud':
        return { conversionPeriod: '9', basePeriod: '26', laggingSpan: '52', displacement: '26' };
      case 'supertrend':
        return { atrPeriod: '10', multiplier: '3' };
      case 'keltnerchannel':
        return { period: '20', atrPeriod: '20', multiplier: '2' };
      case 'psar':
        return { start: '0.02', increment: '0.02', maximum: '0.2' };
      case 'ultimateoscillator':
        return { fastLineLength: '7', middleLineLength: '14', slowLineLength: '28' };
      case 'adx':
      case 'dmi':
        return { adxSmoothing: '14', diLength: '14' };
      case 'volumeoscillator':
        return { shortLength: '5', longLength: '10' };
      case 'heikinashi':
        return { emaSource: 'close', fastLength: '9', slowLength: '21' };
      case 'kama':
        return { period: '14', fastEmaLength: '2', slowEmaLength: '30' };
      case 'chandelierexit':
        return { atrPeriod: '22', multiplier: '3' };
      case 'volume':
      case 'awesomeoscillator':
        return {}; // No parameters needed
      default:
        return { period: '14', source: 'close' };
    }
  };

  // Helper function to check if an indicator needs parameters
  const indicatorNeedsParameters = (indicator: string) => {
    const normalizedIndicator = indicator.toLowerCase().replace(/\s+/g, '');
    const noParamIndicators = ['volume', 'awesomeoscillator'];
    return !noParamIndicators.includes(normalizedIndicator);
  };

  const updateInequality = (side: 'left' | 'right', field: string, value: any) => {
    console.log(`EditModeInequality: Updating ${side} ${field} to:`, value);
    
    setLocalInequality(prev => {
      const updatedSide = { ...prev[side] };
      
      if (field === 'indicator') {
        // When indicator changes, reset parameters and valueType appropriately
        updatedSide.indicator = value;
        
        // Reset parameters based on the new indicator
        if (indicatorNeedsParameters(value)) {
          updatedSide.parameters = getDefaultParameters(value);
        } else {
          updatedSide.parameters = {}; // Clear parameters for indicators that don't need them
        }
        
        // Reset valueType - will be handled by IndicatorValueSelector
        updatedSide.valueType = undefined;
      } else {
        updatedSide[field] = value;
      }
      
      const updated = {
        ...prev,
        [side]: updatedSide
      };
      
      console.log(`EditModeInequality: Updated inequality:`, updated);
      return updated;
    });
  };

  const updateParameters = (side: 'left' | 'right', paramName: string, paramValue: string) => {
    setLocalInequality(prev => ({
      ...prev,
      [side]: {
        ...prev[side],
        parameters: {
          ...prev[side].parameters,
          [paramName]: paramValue
        }
      }
    }));
  };

  const updateCondition = (value: string) => {
    setLocalInequality(prev => ({
      ...prev,
      condition: value
    }));
  };

  return (
    <div className="p-4 rounded-lg bg-white border border-gray-300 shadow-sm">
      <div className="space-y-4">
        {/* Left Side */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Left Side</label>
          <Select 
            value={localInequality.left?.type || ''} 
            onValueChange={value => updateInequality('left', 'type', value)}
          >
            <SelectTrigger className={`${!localInequality.left?.type && showValidation ? 'border-red-500' : ''}`}>
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
          
          <InequalitySide
            side="left"
            sideObj={localInequality.left}
            updateInequality={updateInequality}
            updateParameters={updateParameters}
            showValidation={showValidation}
          />
        </div>

        {/* Condition */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Condition</label>
          <Select 
            value={localInequality.condition || ''} 
            onValueChange={updateCondition}
          >
            <SelectTrigger className={`${!localInequality.condition && showValidation ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="GREATER_THAN">Greater than (&gt;)</SelectItem>
                <SelectItem value="LESS_THAN">Less than (&lt;)</SelectItem>
                <SelectItem value="EQUAL">Equal (=)</SelectItem>
                <SelectItem value="GREATER_THAN_OR_EQUAL">Greater than or equal (≥)</SelectItem>
                <SelectItem value="LESS_THAN_OR_EQUAL">Less than or equal (≤)</SelectItem>
                <SelectItem value="CROSSES_ABOVE">Crosses above</SelectItem>
                <SelectItem value="CROSSES_BELOW">Crosses below</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Right Side */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Right Side</label>
          <Select 
            value={localInequality.right?.type || ''} 
            onValueChange={value => updateInequality('right', 'type', value)}
          >
            <SelectTrigger className={`${!localInequality.right?.type && showValidation ? 'border-red-500' : ''}`}>
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
          
          <InequalitySide
            side="right"
            sideObj={localInequality.right}
            updateInequality={updateInequality}
            updateParameters={updateParameters}
            showValidation={showValidation}
          />
        </div>

        {/* Explanation */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Explanation (Optional)</label>
          <Textarea
            value={localInequality.explanation || ''}
            onChange={e => setLocalInequality(prev => ({ ...prev, explanation: e.target.value }))}
            placeholder="Add an explanation for this condition..."
            className="text-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel} size="sm">
            Cancel
          </Button>
          <Button 
            onClick={onSave} 
            disabled={isIncomplete && showValidation}
            size="sm"
          >
            Save
          </Button>
        </div>
        
        {isIncomplete && showValidation && (
          <p className="text-sm text-red-600 mt-2">
            Please fill in all required fields before saving.
          </p>
        )}
      </div>
    </div>
  );
};

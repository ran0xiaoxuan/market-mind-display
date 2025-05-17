
import React from "react";
import { InequalitySide as InequalitySideType } from "../types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { IndicatorParameter } from "../IndicatorParameter";
import { AvailableIndicators } from "../AvailableIndicators";

interface InequalitySideProps {
  side: 'left' | 'right';
  sideObj: InequalitySideType;
  updateInequality: (side: 'left' | 'right', field: string, value: any) => void;
  updateParameters: (side: 'left' | 'right', paramName: string, paramValue: string) => void;
  showValidation?: boolean;
}

export const InequalitySide: React.FC<InequalitySideProps> = ({
  side,
  sideObj,
  updateInequality,
  updateParameters,
  showValidation = false
}) => {
  
  // Render side inputs based on type
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

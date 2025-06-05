
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
  
  // Helper function to render parameters based on indicator type
  const renderIndicatorParameters = (indicator: string) => {
    const normalizedIndicator = indicator.toLowerCase().replace(/\s+/g, '');
    
    switch (normalizedIndicator) {
      case 'macd':
        return (
          <div className="grid grid-cols-2 gap-2">
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
            <IndicatorParameter 
              name="source" 
              value={sideObj.parameters?.source || 'close'} 
              onChange={value => updateParameters(side, 'source', value)} 
            />
          </div>
        );
        
      case 'bollingerbands':
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="period" 
              value={sideObj.parameters?.period || '20'} 
              onChange={value => updateParameters(side, 'period', value)} 
            />
            <IndicatorParameter 
              name="deviation" 
              value={sideObj.parameters?.deviation || '2'} 
              onChange={value => updateParameters(side, 'deviation', value)} 
            />
            <IndicatorParameter 
              name="source" 
              value={sideObj.parameters?.source || 'close'} 
              onChange={value => updateParameters(side, 'source', value)} 
            />
          </div>
        );
        
      case 'stochastic':
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="k" 
              value={sideObj.parameters?.k || '14'} 
              onChange={value => updateParameters(side, 'k', value)} 
            />
            <IndicatorParameter 
              name="d" 
              value={sideObj.parameters?.d || '3'} 
              onChange={value => updateParameters(side, 'd', value)} 
            />
            <IndicatorParameter 
              name="slowing" 
              value={sideObj.parameters?.slowing || '3'} 
              onChange={value => updateParameters(side, 'slowing', value)} 
            />
            <IndicatorParameter 
              name="source" 
              value={sideObj.parameters?.source || 'close'} 
              onChange={value => updateParameters(side, 'source', value)} 
            />
          </div>
        );
        
      case 'stochrsi':
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="rsiPeriod" 
              value={sideObj.parameters?.rsiPeriod || '14'} 
              onChange={value => updateParameters(side, 'rsiPeriod', value)} 
            />
            <IndicatorParameter 
              name="k" 
              value={sideObj.parameters?.k || '14'} 
              onChange={value => updateParameters(side, 'k', value)} 
            />
            <IndicatorParameter 
              name="d" 
              value={sideObj.parameters?.d || '3'} 
              onChange={value => updateParameters(side, 'd', value)} 
            />
            <IndicatorParameter 
              name="source" 
              value={sideObj.parameters?.source || 'close'} 
              onChange={value => updateParameters(side, 'source', value)} 
            />
          </div>
        );
        
      case 'ichimokucloud':
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="conversionPeriod" 
              value={sideObj.parameters?.conversionPeriod || '9'} 
              onChange={value => updateParameters(side, 'conversionPeriod', value)} 
            />
            <IndicatorParameter 
              name="basePeriod" 
              value={sideObj.parameters?.basePeriod || '26'} 
              onChange={value => updateParameters(side, 'basePeriod', value)} 
            />
            <IndicatorParameter 
              name="laggingSpan" 
              value={sideObj.parameters?.laggingSpan || '52'} 
              onChange={value => updateParameters(side, 'laggingSpan', value)} 
            />
            <IndicatorParameter 
              name="displacement" 
              value={sideObj.parameters?.displacement || '26'} 
              onChange={value => updateParameters(side, 'displacement', value)} 
            />
          </div>
        );
        
      case 'supertrend':
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="atrPeriod" 
              value={sideObj.parameters?.atrPeriod || '10'} 
              onChange={value => updateParameters(side, 'atrPeriod', value)} 
            />
            <IndicatorParameter 
              name="multiplier" 
              value={sideObj.parameters?.multiplier || '3'} 
              onChange={value => updateParameters(side, 'multiplier', value)} 
            />
            <IndicatorParameter 
              name="source" 
              value={sideObj.parameters?.source || 'close'} 
              onChange={value => updateParameters(side, 'source', value)} 
            />
          </div>
        );
        
      case 'chandelierexit':
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="atrPeriod" 
              value={sideObj.parameters?.atrPeriod || '22'} 
              onChange={value => updateParameters(side, 'atrPeriod', value)} 
            />
            <IndicatorParameter 
              name="multiplier" 
              value={sideObj.parameters?.multiplier || '3'} 
              onChange={value => updateParameters(side, 'multiplier', value)} 
            />
            <IndicatorParameter 
              name="source" 
              value={sideObj.parameters?.source || 'close'} 
              onChange={value => updateParameters(side, 'source', value)} 
            />
          </div>
        );
        
      case 'keltnerchannel':
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="period" 
              value={sideObj.parameters?.period || '20'} 
              onChange={value => updateParameters(side, 'period', value)} 
            />
            <IndicatorParameter 
              name="atrPeriod" 
              value={sideObj.parameters?.atrPeriod || '20'} 
              onChange={value => updateParameters(side, 'atrPeriod', value)} 
            />
            <IndicatorParameter 
              name="multiplier" 
              value={sideObj.parameters?.multiplier || '2'} 
              onChange={value => updateParameters(side, 'multiplier', value)} 
            />
            <IndicatorParameter 
              name="source" 
              value={sideObj.parameters?.source || 'close'} 
              onChange={value => updateParameters(side, 'source', value)} 
            />
          </div>
        );
        
      case 'awesomeoscillator':
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="fastLength" 
              value={sideObj.parameters?.fastLength || '5'} 
              onChange={value => updateParameters(side, 'fastLength', value)} 
            />
            <IndicatorParameter 
              name="slowLength" 
              value={sideObj.parameters?.slowLength || '34'} 
              onChange={value => updateParameters(side, 'slowLength', value)} 
            />
            <IndicatorParameter 
              name="source" 
              value={sideObj.parameters?.source || 'close'} 
              onChange={value => updateParameters(side, 'source', value)} 
            />
          </div>
        );
        
      case 'ultimateoscillator':
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="fastPeriod" 
              value={sideObj.parameters?.fastPeriod || '7'} 
              onChange={value => updateParameters(side, 'fastPeriod', value)} 
            />
            <IndicatorParameter 
              name="slowPeriod" 
              value={sideObj.parameters?.slowPeriod || '14'} 
              onChange={value => updateParameters(side, 'slowPeriod', value)} 
            />
            <IndicatorParameter 
              name="signalLength" 
              value={sideObj.parameters?.signalLength || '28'} 
              onChange={value => updateParameters(side, 'signalLength', value)} 
            />
          </div>
        );
        
      case 'ttmsqueeze':
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="period" 
              value={sideObj.parameters?.period || '20'} 
              onChange={value => updateParameters(side, 'period', value)} 
            />
            <IndicatorParameter 
              name="multiplier" 
              value={sideObj.parameters?.multiplier || '2'} 
              onChange={value => updateParameters(side, 'multiplier', value)} 
            />
            <IndicatorParameter 
              name="atrPeriod" 
              value={sideObj.parameters?.atrPeriod || '20'} 
              onChange={value => updateParameters(side, 'atrPeriod', value)} 
            />
          </div>
        );
        
      default:
        // For simple indicators with basic parameters
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="period" 
              value={sideObj.parameters?.period || '14'} 
              onChange={value => updateParameters(side, 'period', value)} 
            />
            <IndicatorParameter 
              name="source" 
              value={sideObj.parameters?.source || 'close'} 
              onChange={value => updateParameters(side, 'source', value)} 
            />
          </div>
        );
    }
  };
  
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
            {renderIndicatorParameters(sideObj.indicator)}
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

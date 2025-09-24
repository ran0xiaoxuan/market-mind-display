
import React from "react";
import { InequalitySide as InequalitySideType } from "../types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { IndicatorParameter } from "../IndicatorParameter";
import { AvailableIndicators } from "../AvailableIndicators";
import { IndicatorValueSelector } from "../IndicatorValueSelector";

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
      case 'kama':
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="period" 
              value={sideObj.parameters?.period ?? ''} 
              placeholder="14"
              onChange={value => updateParameters(side, 'period', value)} 
            />
            <IndicatorParameter 
              name="fastEmaLength" 
              value={sideObj.parameters?.fastEmaLength ?? ''} 
              placeholder="2"
              onChange={value => updateParameters(side, 'fastEmaLength', value)} 
            />
            <IndicatorParameter 
              name="slowEmaLength" 
              value={sideObj.parameters?.slowEmaLength ?? ''} 
              placeholder="30"
              onChange={value => updateParameters(side, 'slowEmaLength', value)} 
            />
          </div>
        );
        
      case 'macd':
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="fast" 
              value={sideObj.parameters?.fast ?? ''} 
              placeholder="12"
              onChange={value => updateParameters(side, 'fast', value)} 
            />
            <IndicatorParameter 
              name="slow" 
              value={sideObj.parameters?.slow ?? ''} 
              placeholder="26"
              onChange={value => updateParameters(side, 'slow', value)} 
            />
            <IndicatorParameter 
              name="signal" 
              value={sideObj.parameters?.signal ?? ''} 
              placeholder="9"
              onChange={value => updateParameters(side, 'signal', value)} 
            />
            <IndicatorParameter 
              name="source" 
              value={sideObj.parameters?.source ?? ''} 
              onChange={value => updateParameters(side, 'source', value)} 
            />
          </div>
        );
        
      case 'bollingerbands':
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="period" 
              value={sideObj.parameters?.period ?? ''} 
              placeholder="20"
              onChange={value => updateParameters(side, 'period', value)} 
            />
            <IndicatorParameter 
              name="deviation" 
              value={sideObj.parameters?.deviation ?? ''} 
              placeholder="2"
              onChange={value => updateParameters(side, 'deviation', value)} 
            />
            <IndicatorParameter 
              name="source" 
              value={sideObj.parameters?.source ?? ''} 
              onChange={value => updateParameters(side, 'source', value)} 
            />
          </div>
        );
        
      case 'stochastic':
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="k" 
              value={sideObj.parameters?.k ?? ''} 
              placeholder="14"
              onChange={value => updateParameters(side, 'k', value)} 
            />
            <IndicatorParameter 
              name="d" 
              value={sideObj.parameters?.d ?? ''} 
              placeholder="3"
              onChange={value => updateParameters(side, 'd', value)} 
            />
            <IndicatorParameter 
              name="slowing" 
              value={sideObj.parameters?.slowing ?? ''} 
              placeholder="3"
              onChange={value => updateParameters(side, 'slowing', value)} 
            />
          </div>
        );
        
      case 'stochrsi':
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="rsiPeriod" 
              value={sideObj.parameters?.rsiPeriod ?? ''} 
              placeholder="14"
              onChange={value => updateParameters(side, 'rsiPeriod', value)} 
            />
            <IndicatorParameter 
              name="stochasticLength" 
              value={sideObj.parameters?.stochasticLength ?? ''} 
              placeholder="14"
              onChange={value => updateParameters(side, 'stochasticLength', value)} 
            />
            <IndicatorParameter 
              name="k" 
              value={sideObj.parameters?.k ?? ''} 
              placeholder="14"
              onChange={value => updateParameters(side, 'k', value)} 
            />
            <IndicatorParameter 
              name="d" 
              value={sideObj.parameters?.d ?? ''} 
              placeholder="3"
              onChange={value => updateParameters(side, 'd', value)} 
            />
          </div>
        );
        
      case 'ultimateoscillator':
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="fastLineLength" 
              value={sideObj.parameters?.fastLineLength ?? ''} 
              placeholder="7"
              onChange={value => updateParameters(side, 'fastLineLength', value)} 
            />
            <IndicatorParameter 
              name="middleLineLength" 
              value={sideObj.parameters?.middleLineLength ?? ''} 
              placeholder="14"
              onChange={value => updateParameters(side, 'middleLineLength', value)} 
            />
            <IndicatorParameter 
              name="slowLineLength" 
              value={sideObj.parameters?.slowLineLength ?? ''} 
              placeholder="28"
              onChange={value => updateParameters(side, 'slowLineLength', value)} 
            />
          </div>
        );
        
      case 'adx':
      case 'dmi':
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="adxSmoothing" 
              value={sideObj.parameters?.adxSmoothing ?? ''} 
              placeholder="14"
              onChange={value => updateParameters(side, 'adxSmoothing', value)} 
            />
            <IndicatorParameter 
              name="diLength" 
              value={sideObj.parameters?.diLength ?? ''} 
              placeholder="14"
              onChange={value => updateParameters(side, 'diLength', value)} 
            />
          </div>
        );
        
      case 'psar':
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="start" 
              value={sideObj.parameters?.start ?? ''} 
              placeholder="0.02"
              onChange={value => updateParameters(side, 'start', value)} 
            />
            <IndicatorParameter 
              name="increment" 
              value={sideObj.parameters?.increment ?? ''} 
              placeholder="0.02"
              onChange={value => updateParameters(side, 'increment', value)} 
            />
            <IndicatorParameter 
              name="maximum" 
              value={sideObj.parameters?.maximum ?? ''} 
              placeholder="0.2"
              onChange={value => updateParameters(side, 'maximum', value)} 
            />
          </div>
        );
        
      case 'vwap':
        return (
          <div className="grid grid-cols-1 gap-2">
            <IndicatorParameter 
              name="source" 
              value={sideObj.parameters?.source ?? ''} 
              onChange={value => updateParameters(side, 'source', value)} 
            />
          </div>
        );
        
      case 'supertrend':
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="atrPeriod" 
              value={sideObj.parameters?.atrPeriod ?? ''} 
              placeholder="10"
              onChange={value => updateParameters(side, 'atrPeriod', value)} 
            />
            <IndicatorParameter 
              name="multiplier" 
              value={sideObj.parameters?.multiplier ?? ''} 
              placeholder="3"
              onChange={value => updateParameters(side, 'multiplier', value)} 
            />
          </div>
        );
        
      case 'ttmsqueeze':
        return (
          <div className="grid grid-cols-1 gap-2">
            <IndicatorParameter 
              name="period" 
              value={sideObj.parameters?.period ?? ''} 
              placeholder="20"
              onChange={value => updateParameters(side, 'period', value)} 
            />
          </div>
        );
        
      case 'atr':
        return (
          <div className="grid grid-cols-1 gap-2">
            <IndicatorParameter 
              name="period" 
              value={sideObj.parameters?.period ?? ''} 
              placeholder="14"
              onChange={value => updateParameters(side, 'period', value)} 
            />
          </div>
        );
        
      case 'keltnerchannel':
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="period" 
              value={sideObj.parameters?.period ?? ''} 
              placeholder="20"
              onChange={value => updateParameters(side, 'period', value)} 
            />
            <IndicatorParameter 
              name="atrPeriod" 
              value={sideObj.parameters?.atrPeriod ?? ''} 
              placeholder="20"
              onChange={value => updateParameters(side, 'atrPeriod', value)} 
            />
            <IndicatorParameter 
              name="multiplier" 
              value={sideObj.parameters?.multiplier ?? ''} 
              placeholder="2"
              onChange={value => updateParameters(side, 'multiplier', value)} 
            />
          </div>
        );
        
      case 'donchianchannel':
        return (
          <div className="grid grid-cols-1 gap-2">
            <IndicatorParameter 
              name="period" 
              value={sideObj.parameters?.period ?? ''} 
              placeholder="20"
              onChange={value => updateParameters(side, 'period', value)} 
            />
          </div>
        );
        
      case 'chandelierexit':
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="atrPeriod" 
              value={sideObj.parameters?.atrPeriod ?? ''} 
              placeholder="22"
              onChange={value => updateParameters(side, 'atrPeriod', value)} 
            />
            <IndicatorParameter 
              name="multiplier" 
              value={sideObj.parameters?.multiplier ?? ''} 
              placeholder="3"
              onChange={value => updateParameters(side, 'multiplier', value)} 
            />
          </div>
        );
        
      case 'volume':
        return null; // No parameters for Volume
        
      case 'chaikinmoneyflow':
        return (
          <div className="grid grid-cols-1 gap-2">
            <IndicatorParameter 
              name="period" 
              value={sideObj.parameters?.period ?? ''} 
              placeholder="20"
              onChange={value => updateParameters(side, 'period', value)} 
            />
          </div>
        );
        
      case 'volumeoscillator':
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="shortLength" 
              value={sideObj.parameters?.shortLength ?? ''} 
              placeholder="5"
              onChange={value => updateParameters(side, 'shortLength', value)} 
            />
            <IndicatorParameter 
              name="longLength" 
              value={sideObj.parameters?.longLength ?? ''} 
              placeholder="10"
              onChange={value => updateParameters(side, 'longLength', value)} 
            />
          </div>
        );
        
      case 'heikinashi':
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="emaSource" 
              value={sideObj.parameters?.emaSource ?? ''} 
              onChange={value => updateParameters(side, 'emaSource', value)} 
            />
            <IndicatorParameter 
              name="fastLength" 
              value={sideObj.parameters?.fastLength ?? ''} 
              placeholder="9"
              onChange={value => updateParameters(side, 'fastLength', value)} 
            />
            <IndicatorParameter 
              name="slowLength" 
              value={sideObj.parameters?.slowLength ?? ''} 
              placeholder="21"
              onChange={value => updateParameters(side, 'slowLength', value)} 
            />
          </div>
        );
        
      case 'awesomeoscillator':
        return null; // No parameters for Awesome Oscillator
        
      case 'mfi':
        return (
          <div className="grid grid-cols-1 gap-2">
            <IndicatorParameter 
              name="period" 
              value={sideObj.parameters?.period ?? ''} 
              placeholder="14"
              onChange={value => updateParameters(side, 'period', value)} 
            />
          </div>
        );
        
      case 'ichimokucloud':
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="conversionPeriod" 
              value={sideObj.parameters?.conversionPeriod ?? ''} 
              placeholder="9"
              onChange={value => updateParameters(side, 'conversionPeriod', value)} 
            />
            <IndicatorParameter 
              name="basePeriod" 
              value={sideObj.parameters?.basePeriod ?? ''} 
              placeholder="26"
              onChange={value => updateParameters(side, 'basePeriod', value)} 
            />
            <IndicatorParameter 
              name="laggingSpan" 
              value={sideObj.parameters?.laggingSpan ?? ''} 
              placeholder="52"
              onChange={value => updateParameters(side, 'laggingSpan', value)} 
            />
            <IndicatorParameter 
              name="displacement" 
              value={sideObj.parameters?.displacement ?? ''} 
              placeholder="26"
              onChange={value => updateParameters(side, 'displacement', value)} 
            />
          </div>
        );
        
      default:
        // For simple indicators with basic parameters
        return (
          <div className="grid grid-cols-2 gap-2">
            <IndicatorParameter 
              name="period" 
              value={sideObj.parameters?.period ?? ''} 
              placeholder="14"
              onChange={value => updateParameters(side, 'period', value)} 
            />
            <IndicatorParameter 
              name="source" 
              value={sideObj.parameters?.source ?? ''} 
              onChange={value => updateParameters(side, 'source', value)} 
            />
          </div>
        );
    }
  };
  
  // Helper function to normalize price value for consistent display
  const normalizePriceValue = (value: string | undefined): string => {
    if (!value) return '';
    
    // Convert to lowercase and handle common variations
    const normalized = value.toLowerCase().trim();
    
    // Map common variations to standard values
    switch (normalized) {
      case 'open':
      case 'opening':
        return 'open';
      case 'high':
      case 'highest':
        return 'high';
      case 'low':
      case 'lowest':
        return 'low';
      case 'close':
      case 'closing':
      case 'last':
      default:
        return 'close';
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
          <div className="mt-2 space-y-2">
            <div>
              <label className="text-xs text-muted-foreground">Parameters</label>
              {renderIndicatorParameters(sideObj.indicator)}
            </div>
            
            <IndicatorValueSelector
              indicator={sideObj.indicator}
              selectedValue={sideObj.valueType || ''}
              onValueChange={value => updateInequality(side, 'valueType', value)}
            />
          </div>
        )}
      </div>
    );
  } else if (sideObj.type === 'PRICE') {
    const currentPriceValue = normalizePriceValue(sideObj.value);
    
    return (
      <div className="mt-2">
        <Select 
          value={sideObj.value ? currentPriceValue : undefined}
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

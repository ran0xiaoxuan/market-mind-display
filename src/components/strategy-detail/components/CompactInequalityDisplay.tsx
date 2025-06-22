import React from "react";
import { Inequality } from "../types";
import { Button } from "@/components/ui/button";
import { Trash2, Equal } from "lucide-react";
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
        return (
          <div className="flex flex-col">
            <div className="flex flex-col items-center">
              <span className="font-medium text-center">{side.indicator}</span>
              {side.valueType && side.valueType !== "Value" && (
                <span className="text-xs text-muted-foreground">({side.valueType})</span>
              )}
            </div>
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
    
    console.log('Rendering parameters for:', side.indicator, 'Parameters:', side.parameters);
    
    const params = [];
    const indicator = side.indicator.toUpperCase();
    const parameters = side.parameters;
    
    // Helper function to safely get parameter value
    const getParam = (key: string) => {
      const value = parameters[key];
      return value !== undefined && value !== null && value !== '' ? value : null;
    };
    
    switch (indicator) {
      case "MACD":
        if (getParam('fast') || getParam('fastPeriod')) params.push(`Fast: ${getParam('fast') || getParam('fastPeriod')}`);
        if (getParam('slow') || getParam('slowPeriod')) params.push(`Slow: ${getParam('slow') || getParam('slowPeriod')}`);
        if (getParam('signal') || getParam('signalPeriod')) params.push(`Signal: ${getParam('signal') || getParam('signalPeriod')}`);
        break;
        
      case "RSI":
      case "CCI":
        if (getParam('period') || getParam('rsiPeriod')) params.push(`Period: ${getParam('period') || getParam('rsiPeriod')}`);
        break;
        
      case "STOCHASTIC":
      case "STOCHRSI":
        if (getParam('period')) params.push(`Period: ${getParam('period')}`);
        if (getParam('k') || getParam('kPeriod')) params.push(`K: ${getParam('k') || getParam('kPeriod')}`);
        if (getParam('d') || getParam('dPeriod')) params.push(`D: ${getParam('d') || getParam('dPeriod')}`);
        if (getParam('slowing')) params.push(`Slowing: ${getParam('slowing')}`);
        break;
        
      case "BOLLINGER BANDS":
      case "BBANDS":
        if (getParam('period')) params.push(`Period: ${getParam('period')}`);
        if (getParam('deviation') || getParam('stdDev')) params.push(`Dev: ${getParam('deviation') || getParam('stdDev')}`);
        break;
        
      case "ICHIMOKU CLOUD":
      case "ICHIMOKU":
        if (getParam('conversionPeriod')) params.push(`Conv: ${getParam('conversionPeriod')}`);
        if (getParam('basePeriod')) params.push(`Base: ${getParam('basePeriod')}`);
        if (getParam('laggingSpan')) params.push(`Lag: ${getParam('laggingSpan')}`);
        break;
      
      case "SMA":
      case "EMA":
      case "WMA":
      case "VWMA":
      case "VWAP":
        if (getParam('period')) params.push(`Period: ${getParam('period')}`);
        break;
        
      case "ATR":
      case "SUPERTREND":
      case "CHANDELIER EXIT":
      case "CHANDELIER":
        if (getParam('period') || getParam('atrPeriod')) {
          params.push(`Period: ${getParam('period') || getParam('atrPeriod')}`);
        }
        if (getParam('multiplier')) params.push(`Mult: ${getParam('multiplier')}`);
        break;
        
      case "AWESOME OSCILLATOR":
      case "AO":
        if (getParam('fast') || getParam('fastLength')) {
          params.push(`Fast: ${getParam('fast') || getParam('fastLength')}`);
        }
        if (getParam('slow') || getParam('slowLength')) {
          params.push(`Slow: ${getParam('slow') || getParam('slowLength')}`);
        }
        break;
        
      case "KELTNER CHANNELS":
      case "KELTNERCHANNELS":
      case "DONCHIAN CHANNEL":
      case "DONCHIANCHANNEL":
      case "DONCHIAN":
        if (getParam('period') || getParam('channelPeriod')) {
          params.push(`Period: ${getParam('period') || getParam('channelPeriod')}`);
        }
        if (getParam('multiplier')) params.push(`Mult: ${getParam('multiplier')}`);
        if (getParam('atrPeriod')) params.push(`ATR: ${getParam('atrPeriod')}`);
        break;
        
      case "HEIKINASHI":
      case "HEIKIN ASHI":
        if (getParam('fastLength')) params.push(`Fast: ${getParam('fastLength')}`);
        if (getParam('slowLength')) params.push(`Slow: ${getParam('slowLength')}`);
        if (getParam('emaSource')) params.push(`EMA Source: ${getParam('emaSource')}`);
        break;
        
      case "MFI":
        if (getParam('period')) params.push(`Period: ${getParam('period')}`);
        break;
        
      case "WILLIAMS %R":
      case "WILLR":
        if (getParam('period')) params.push(`Period: ${getParam('period')}`);
        break;
        
      case "MOMENTUM":
      case "MOM":
      case "ROC":
        if (getParam('period')) params.push(`Period: ${getParam('period')}`);
        break;
        
      case "ADX":
      case "DMI":
        if (getParam('period') || getParam('adxSmoothing')) params.push(`Period: ${getParam('period') || getParam('adxSmoothing')}`);
        if (getParam('diLength')) params.push(`DI: ${getParam('diLength')}`);
        break;
        
      case "PARABOLIC SAR":
      case "PSAR":
        if (getParam('start')) params.push(`Start: ${getParam('start')}`);
        if (getParam('increment')) params.push(`Inc: ${getParam('increment')}`);
        if (getParam('maximum')) params.push(`Max: ${getParam('maximum')}`);
        break;
        
      default:
        // For indicators with just a period or other common parameters
        if (getParam('period')) params.push(`Period: ${getParam('period')}`);
        if (getParam('length')) params.push(`Length: ${getParam('length')}`);
        if (getParam('timeperiod')) params.push(`Period: ${getParam('timeperiod')}`);
        break;
    }
    
    // Add source parameter if available
    if (getParam('source')) params.push(`Source: ${getParam('source')}`);
    
    console.log('Generated params for display:', params);
    
    if (params.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-1 justify-center">
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
          icon: null
        };
      case 'CROSSES_BELOW':
        return {
          text: 'crosses below',
          icon: null
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

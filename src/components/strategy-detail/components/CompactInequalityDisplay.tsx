
import React from "react";
import { Inequality } from "../types";
import { Button } from "@/components/ui/button";
import { Trash2, Equal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { IndicatorSource } from "../IndicatorSource";
import { formatPriceSource } from "@/lib/indicatorSources";

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
              <IndicatorSource indicator={side.indicator} className="mt-1" />
            </div>
            {renderIndicatorParameters(side)}
          </div>
        );
      }
      return "Unknown indicator";
    } else if (side.type === "PRICE") {
      // Fixed price display to show the actual selected price option
      const priceOption = side.value; // This should be 'open', 'high', 'low', or 'close'
      
      if (!priceOption) {
        return (
          <div className="flex flex-col items-center">
            <span className="font-medium text-center">Price</span>
            <span className="text-xs text-muted-foreground">(Not specified)</span>
          </div>
        );
      }
      
      // Format the price option for display
      const formattedPriceOption = formatPriceSource(priceOption);
      
      return (
        <div className="flex flex-col items-center">
          <span className="font-medium text-center">Price</span>
          <span className="text-xs text-muted-foreground">({formattedPriceOption})</span>
          <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 border-purple-200 mt-1">
            Market Data
          </Badge>
        </div>
      );
    } else if (side.type === "VALUE") {
      return (
        <div className="flex flex-col items-center">
          <span className="font-medium text-center">{side.value || "0"}</span>
          <Badge variant="outline" className="text-xs bg-gray-100 text-gray-800 border-gray-200 mt-1">
            User Input
          </Badge>
        </div>
      );
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
      // Moving Averages
      case "SMA":
      case "EMA":
      case "WMA":
      case "TRIMA":
        if (getParam('period')) params.push(`Period: ${getParam('period')}`);
        if (getParam('source')) params.push(`Source: ${getParam('source')}`);
        break;
        
      case "KAMA":
        if (getParam('period')) params.push(`Period: ${getParam('period')}`);
        if (getParam('fastEmaLength')) params.push(`Fast: ${getParam('fastEmaLength')}`);
        if (getParam('slowEmaLength')) params.push(`Slow: ${getParam('slowEmaLength')}`);
        if (getParam('source')) params.push(`Source: ${getParam('source')}`);
        break;
        
      case "VWAP":
        // VWAP typically has no parameters
        break;
        
      // Oscillators
      case "RSI":
      case "CCI":
        if (getParam('period')) params.push(`Period: ${getParam('period')}`);
        if (getParam('source')) params.push(`Source: ${getParam('source')}`);
        break;
        
      case "WILLIAMS %R":
      case "WILLR":
      case "MOMENTUM":
      case "MOM":
      case "ROC":
        if (getParam('period')) params.push(`Period: ${getParam('period')}`);
        break;
        
      case "CMO":
        if (getParam('period')) params.push(`Period: ${getParam('period')}`);
        if (getParam('source')) params.push(`Source: ${getParam('source')}`);
        break;
        
      case "MFI":
        if (getParam('period')) params.push(`Period: ${getParam('period')}`);
        break;
        
      case "MACD":
        if (getParam('fast')) params.push(`Fast: ${getParam('fast')}`);
        if (getParam('slow')) params.push(`Slow: ${getParam('slow')}`);
        if (getParam('signal')) params.push(`Signal: ${getParam('signal')}`);
        if (getParam('source')) params.push(`Source: ${getParam('source')}`);
        break;
        
      case "STOCHASTIC":
        if (getParam('k')) params.push(`K: ${getParam('k')}`);
        if (getParam('d')) params.push(`D: ${getParam('d')}`);
        if (getParam('slowing')) params.push(`Slowing: ${getParam('slowing')}`);
        break;
        
      case "STOCHRSI":
        if (getParam('rsiPeriod')) params.push(`RSI: ${getParam('rsiPeriod')}`);
        if (getParam('stochasticLength')) params.push(`Stoch: ${getParam('stochasticLength')}`);
        if (getParam('k')) params.push(`K: ${getParam('k')}`);
        if (getParam('d')) params.push(`D: ${getParam('d')}`);
        break;
        
      case "ULTIMATE OSCILLATOR":
        if (getParam('fastLineLength')) params.push(`Fast: ${getParam('fastLineLength')}`);
        if (getParam('middleLineLength')) params.push(`Mid: ${getParam('middleLineLength')}`);
        if (getParam('slowLineLength')) params.push(`Slow: ${getParam('slowLineLength')}`);
        break;
        
      case "AWESOME OSCILLATOR":
        // AO doesn't need parameters
        break;
        
      // Trend Indicators
      case "ADX":
      case "DMI":
        if (getParam('adxSmoothing')) params.push(`ADX: ${getParam('adxSmoothing')}`);
        if (getParam('diLength')) params.push(`DI: ${getParam('diLength')}`);
        break;
        
      case "ICHIMOKU CLOUD":
      case "ICHIMOKU":
        if (getParam('conversionPeriod')) params.push(`Conv: ${getParam('conversionPeriod')}`);
        if (getParam('basePeriod')) params.push(`Base: ${getParam('basePeriod')}`);
        if (getParam('laggingSpan')) params.push(`Lag: ${getParam('laggingSpan')}`);
        if (getParam('displacement')) params.push(`Disp: ${getParam('displacement')}`);
        break;
      
      case "PARABOLIC SAR":
      case "PSAR":
        if (getParam('start')) params.push(`Start: ${getParam('start')}`);
        if (getParam('increment')) params.push(`Inc: ${getParam('increment')}`);
        if (getParam('maximum')) params.push(`Max: ${getParam('maximum')}`);
        break;
        
      case "SUPERTREND":
        if (getParam('atrPeriod')) params.push(`ATR: ${getParam('atrPeriod')}`);
        if (getParam('multiplier')) params.push(`Mult: ${getParam('multiplier')}`);
        break;
        
      case "TTM SQUEEZE":
        if (getParam('period')) params.push(`Period: ${getParam('period')}`);
        if (getParam('multiplier')) params.push(`Mult: ${getParam('multiplier')}`);
        break;
        
      // Volatility Indicators
      case "BOLLINGER BANDS":
      case "BBANDS":
        if (getParam('period')) params.push(`Period: ${getParam('period')}`);
        if (getParam('deviation')) params.push(`Dev: ${getParam('deviation')}`);
        if (getParam('source')) params.push(`Source: ${getParam('source')}`);
        break;
        
      case "ATR":
        if (getParam('period')) params.push(`Period: ${getParam('period')}`);
        break;
        
      case "KELTNER CHANNEL":
      case "KELTNER CHANNELS":
        if (getParam('period')) params.push(`Period: ${getParam('period')}`);
        if (getParam('atrPeriod')) params.push(`ATR: ${getParam('atrPeriod')}`);
        if (getParam('multiplier')) params.push(`Mult: ${getParam('multiplier')}`);
        break;
        
      case "DONCHIAN CHANNEL":
      case "DONCHIAN":
        if (getParam('period')) params.push(`Period: ${getParam('period')}`);
        break;
        
      case "CHANDELIER EXIT":
      case "CHANDELIER":
        if (getParam('atrPeriod')) params.push(`ATR: ${getParam('atrPeriod')}`);
        if (getParam('multiplier')) params.push(`Mult: ${getParam('multiplier')}`);
        break;
        
      // Volume Indicators
      case "VOLUME":
        // Volume doesn't need parameters
        break;
        
      case "CHAIKIN MONEY FLOW":
        if (getParam('period')) params.push(`Period: ${getParam('period')}`);
        // Note: No source parameter for Chaikin Money Flow
        break;
        
      case "VOLUME OSCILLATOR":
        if (getParam('shortLength')) params.push(`Short: ${getParam('shortLength')}`);
        if (getParam('longLength')) params.push(`Long: ${getParam('longLength')}`);
        break;
        
      // Price Patterns
      case "HEIKIN ASHI":
        if (getParam('fastLength')) params.push(`Fast: ${getParam('fastLength')}`);
        if (getParam('slowLength')) params.push(`Slow: ${getParam('slowLength')}`);
        if (getParam('emaSource')) params.push(`EMA Source: ${getParam('emaSource')}`);
        break;
        
      default:
        // For indicators with just a period or other common parameters
        if (getParam('period')) params.push(`Period: ${getParam('period')}`);
        if (getParam('length')) params.push(`Length: ${getParam('length')}`);
        if (getParam('timeperiod')) params.push(`Period: ${getParam('timeperiod')}`);
        if (getParam('source')) params.push(`Source: ${getParam('source')}`);
        break;
    }
    
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
  
  // Create a unique key based on the inequality data to force re-render when data changes
  const inequalityKey = JSON.stringify({
    left: inequality.left,
    right: inequality.right,
    condition: inequality.condition
  });
  
  return (
    <div key={inequalityKey} className={`p-4 rounded-lg bg-white border ${isIncomplete && showValidation ? 'border-red-300' : 'border-gray-200'}`}>
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

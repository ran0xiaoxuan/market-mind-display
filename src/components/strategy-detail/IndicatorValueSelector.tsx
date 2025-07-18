import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";

interface IndicatorValueSelectorProps {
  indicator: string;
  selectedValue: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export const IndicatorValueSelector = ({ 
  indicator, 
  selectedValue, 
  onValueChange,
  className = "" 
}: IndicatorValueSelectorProps) => {
  const getValueOptions = (indicatorName: string): string[] => {
    const normalizedIndicator = indicatorName.toLowerCase().replace(/\s+/g, '');
    
    switch (normalizedIndicator) {
      case 'macd':
        return ['MACD Value', 'Signal Value', 'Histogram Value'];
      
      case 'stochastic':
      case 'stochrsi':
        return ['K Value', 'D Value'];
      
      case 'bollingerbands':
        return ['Upper Band', 'Middle Band', 'Lower Band'];
      
      case 'ichimokucloud':
        return ['Conversion Line', 'Base Line', 'Lagging Band', 'Leading Band A', 'Leading Band B'];
      
      case 'keltnerchannel':
      case 'donchianchannel':
        return ['Upper Band', 'Middle Band', 'Lower Band'];
      
      case 'heikinashi':
        return ['Open', 'High', 'Low', 'Close', 'FastEMA', 'SlowEMA'];
      
      default:
        return ['Value']; // Default single value for most indicators
    }
  };

  const getDefaultValue = (indicatorName: string): string => {
    const normalizedIndicator = indicatorName.toLowerCase().replace(/\s+/g, '');
    
    switch (normalizedIndicator) {
      case 'macd':
        return 'MACD Value'; // Most commonly used MACD line
      
      case 'stochastic':
      case 'stochrsi':
        return 'K Value'; // K line is more commonly used than D line
      
      case 'bollingerbands':
        return 'Middle Band'; // SMA/EMA line is most commonly used
      
      case 'ichimokucloud':
        return 'Conversion Line'; // Most commonly used Ichimoku line
      
      case 'keltnerchannel':
      case 'donchianchannel':
        return 'Middle Band'; // Middle line is most commonly used
      
      case 'heikinashi':
        return 'Close'; // Close price is most commonly used
      
      default:
        return 'Value';
    }
  };

  const valueOptions = getValueOptions(indicator);
  
  // Set default value when indicator changes
  useEffect(() => {
    if (indicator) {
      const defaultValue = getDefaultValue(indicator);
      
      // Always update the value when the indicator changes
      // This ensures we don't keep old valueType from previous indicators
      if (valueOptions.length === 1) {
        // For single-value indicators, always set to 'Value'
        if (selectedValue !== 'Value') {
          onValueChange('Value');
        }
      } else {
        // For multi-value indicators, check if current selection is valid
        const hasValidSelection = selectedValue && valueOptions.includes(selectedValue);
        if (!hasValidSelection) {
          onValueChange(defaultValue);
        }
      }
    }
  }, [indicator, valueOptions, selectedValue, onValueChange]);
  
  // If there's only one option, don't show the selector but ensure the value is set correctly
  if (valueOptions.length === 1) {
    return null;
  }

  return (
    <div className="mt-2">
      <label className="text-xs text-muted-foreground mb-1 block">Value Type</label>
      <Select
        value={selectedValue}
        onValueChange={onValueChange}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder="Select value type" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {valueOptions.map(option => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};


import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  const valueOptions = getValueOptions(indicator);
  
  // If there's only one option, don't show the selector
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

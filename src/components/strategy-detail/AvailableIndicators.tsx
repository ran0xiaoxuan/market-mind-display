
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AvailableIndicatorsProps {
  selectedIndicator: string;
  onSelectIndicator: (indicator: string) => void;
  className?: string;
}

export const AvailableIndicators = ({ 
  selectedIndicator, 
  onSelectIndicator,
  className = "" 
}: AvailableIndicatorsProps) => {
  // Updated to reflect locally supported indicators
  const indicatorGroups = {
    "Moving Averages": [
      "SMA", 
      "EMA"
    ],
    "Oscillators": [
      "RSI", 
      "Stochastic",
      "CCI", 
      "MACD",
      "MFI"
    ],
    "Volatility Indicators": [
      "Bollinger Bands", 
      "ATR"
    ]
  };

  return (
    <Select
      value={selectedIndicator}
      onValueChange={onSelectIndicator}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select indicator" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(indicatorGroups).map(([groupName, indicators]) => (
          <SelectGroup key={groupName}>
            <SelectLabel>{groupName}</SelectLabel>
            {indicators.map(indicator => (
              <SelectItem key={indicator} value={indicator}>
                {indicator}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
};

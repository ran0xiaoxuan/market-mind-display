
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
  const indicatorGroups = {
    "Moving Averages": [
      "SMA", 
      "EMA", 
      "WMA", 
      "TRIMA", 
      "KAMA"
    ],
    "Oscillators": [
      "RSI", 
      "Stochastic", 
      "StochRSI", 
      "CCI", 
      "Williams %R", 
      "Ultimate Oscillator", 
      "MACD", 
      "Awesome Oscillator", 
      "Momentum", 
      "CMO", 
      "MFI"
    ],
    "Trend Indicators": [
      "ADX", 
      "DMI", 
      "Ichimoku Cloud", 
      "PSAR", 
      "VWAP", 
      "Supertrend", 
      "TTM Squeeze"
    ],
    "Volatility Indicators": [
      "Bollinger Bands", 
      "ATR", 
      "Keltner Channel", 
      "Donchian Channel", 
      "Chandelier Exit"
    ],
    "Volume Indicators": [
      "Volume", 
      "Chaikin Money Flow", 
      "Volume Oscillator"
    ],
    "Price Patterns": [
      "Heikin Ashi"
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


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
  // Extended TAAPI indicator support - expanded from 10 to 25 indicators
  const indicatorGroups = {
    "Moving Averages": [
      "SMA",
      "EMA",
      "WMA",
      "DEMA",
      "TEMA",
      "HMA",
      "VWAP"
    ],
    "Oscillators": [
      "RSI",
      "Stochastic",
      "Stochastic RSI",
      "CCI",
      "MACD",
      "MFI",
      "ROC",
      "Williams %R",
      "CMO"
    ],
    "Trend Indicators": [
      "ADX",
      "SuperTrend"
    ],
    "Volatility Indicators": [
      "Bollinger Bands",
      "ATR",
      "NATR",
      "Keltner Channel",
      "Donchian Channel"
    ],
    "Volume Indicators": [
      "OBV",
      "CMF"
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


import { IndicatorParameters } from "./types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface IndicatorParameterProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const IndicatorParameter = ({ 
  name, 
  value, 
  onChange,
  placeholder
}: IndicatorParameterProps) => {
  // Provide a gentle default placeholder for common params
  const getDefaultPlaceholder = (paramName: string) => {
    const map: Record<string, string> = {
      period: "14",
      fast: "12",
      slow: "26",
      signal: "9",
      deviation: "2",
      k: "14",
      d: "3",
      slowing: "3",
      rsiPeriod: "14",
      stochasticLength: "14",
      fastEmaLength: "2",
      slowEmaLength: "30",
      fastLineLength: "7",
      middleLineLength: "14",
      slowLineLength: "28",
      adxSmoothing: "14",
      diLength: "14",
      start: "0.02",
      increment: "0.02",
      maximum: "0.2",
      atrPeriod: "10",
      multiplier: "3",
      conversionPeriod: "9",
      basePeriod: "26",
      laggingSpan: "52",
      displacement: "26",
      shortLength: "5",
      longLength: "10",
      fastLength: "9",
      slowLength: "21"
    };
    return map[paramName] ?? `Enter ${paramName.toLowerCase()}`;
  };

  const effectivePlaceholder = placeholder ?? getDefaultPlaceholder(name);

  // Special handling for the source parameter - use a select component
  if (name.toLowerCase() === "source" || name.toLowerCase() === "emasource") {
    return (
      <div className="flex flex-col w-full">
        <label className="text-xs text-muted-foreground mb-1">{name}</label>
        <Select value={value || undefined} onValueChange={onChange}>
          <SelectTrigger className="text-xs p-1 h-8 w-full">
            <SelectValue placeholder={`Select ${name.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="close">Close</SelectItem>
              <SelectItem value="hl2">HL2 (High+Low)/2</SelectItem>
              <SelectItem value="hlc3">HLC3 (High+Low+Close)/3</SelectItem>
              <SelectItem value="ohlc4">OHLC4 (Open+High+Low+Close)/4</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    );
  }
  
  // For all other parameters, use the regular input
  return (
    <div className="flex flex-col w-full">
      <label className="text-xs text-muted-foreground mb-1">{name}</label>
      <input 
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs p-1 h-8 border rounded w-full"
        placeholder={effectivePlaceholder}
      />
    </div>
  );
};

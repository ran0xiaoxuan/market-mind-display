
import { IndicatorParameters } from "./types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface IndicatorParameterProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
}

export const IndicatorParameter = ({ 
  name, 
  value, 
  onChange
}: IndicatorParameterProps) => {
  // Special handling for the source parameter - use a select component
  if (name.toLowerCase() === "source" || name.toLowerCase() === "emasource") {
    return (
      <div className="flex flex-col w-full">
        <label className="text-xs text-muted-foreground mb-1">{name}</label>
        <Select value={value} onValueChange={onChange}>
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
        placeholder={`Enter ${name.toLowerCase()}`}
      />
    </div>
  );
};

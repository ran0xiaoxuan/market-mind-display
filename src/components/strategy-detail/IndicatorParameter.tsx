import { IndicatorParameters } from "./types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface IndicatorParameterProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  // Keep the original props for backward compatibility
  indicator?: string;
  parameters?: any;
  valueType?: string;
}

export const IndicatorParameter = ({ 
  name, 
  value, 
  onChange,
  indicator,
  parameters,
  valueType
}: IndicatorParameterProps) => {
  // If being used in the new way (with name/value/onChange)
  if (name && onChange) {
    // Special handling for the source parameter - use a select component
    if (name.toLowerCase() === "source") {
      return (
        <div className="flex flex-col">
          <label className="text-xs text-muted-foreground mb-1">{name}</label>
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="text-xs p-1 h-8">
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
      <div className="flex flex-col">
        <label className="text-xs text-muted-foreground mb-1">{name}</label>
        <input 
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs p-1 border rounded w-full"
          placeholder={`Enter ${name.toLowerCase()}`}
        />
      </div>
    );
  }
  
  // Original rendering logic for backward compatibility
  const renderParameter = (paramName: string, paramValue?: string) => {
    if (!paramValue) return null;
    
    return (
      <span className="text-xs text-muted-foreground">
        {paramName}: {paramValue}
      </span>
    );
  };
  
  const renderParameters = () => {
    if (!parameters || !indicator) return null;

    // Handle common parameters
    const commonParams = [];
    if (parameters.source) {
      commonParams.push(renderParameter("Source", parameters.source));
    }
    if (parameters.interval) {
      commonParams.push(renderParameter("Interval", parameters.interval));
    }
    
    // Specific indicator parameters
    switch (indicator.toLowerCase()) {
      case "macd":
        return (
          <>
            {renderParameter("Fast", parameters.fast || parameters.fastPeriod)}
            {renderParameter("Slow", parameters.slow || parameters.slowPeriod)}
            {renderParameter("Signal", parameters.signal || parameters.signalPeriod)}
          </>
        );
      case "bollinger bands":
        return (
          <>
            {renderParameter("Period", parameters.period || parameters.optInTimePeriod)}
            {renderParameter("Deviation", parameters.deviation)}
            {renderParameter("Up Dev", parameters.nbDevUp)}
            {renderParameter("Down Dev", parameters.nbDevDn)}
            {parameters.maType && renderParameter("MA Type", parameters.maType)}
          </>
        );
      case "stochastic":
        return (
          <>
            {renderParameter("K", parameters.k || parameters.kPeriod || parameters.fastK)}
            {renderParameter("D", parameters.d || parameters.dPeriod || parameters.slowD)}
            {parameters.slowing && renderParameter("Slowing", parameters.slowing)}
            {parameters.smoothK && renderParameter("Smooth K", parameters.smoothK)}
            {parameters.smoothD && renderParameter("Smooth D", parameters.smoothD)}
          </>
        );
      case "stochrsi":
        return (
          <>
            {renderParameter("Period", parameters.period || parameters.rsiPeriod)}
            {renderParameter("K", parameters.k || parameters.fastK)}
            {renderParameter("D", parameters.d || parameters.fastD)}
          </>
        );
      case "ichimoku cloud":
        return (
          <>
            {renderParameter("Conv", parameters.conversionPeriod)}
            {renderParameter("Base", parameters.basePeriod)}
            {parameters.laggingSpan && renderParameter("Lagging", parameters.laggingSpan)}
            {parameters.displacement && renderParameter("Displ", parameters.displacement)}
          </>
        );
      case "atr":
        return renderParameter("Period", parameters.period || parameters.atrPeriod);
      case "supertrend":
        return (
          <>
            {renderParameter("Period", parameters.period || parameters.atrPeriod)}
            {parameters.multiplier && renderParameter("Mult", parameters.multiplier)}
          </>
        );
      case "chandelier exit":
        return (
          <>
            {renderParameter("Period", parameters.period || parameters.atrPeriod)}
            {parameters.multiplier && renderParameter("Mult", parameters.multiplier)}
          </>
        );
      case "donchian channel":
        return renderParameter("Period", parameters.period || parameters.channelPeriod);
      case "keltner channel":
        return (
          <>
            {renderParameter("Period", parameters.period || parameters.channelPeriod)}
            {parameters.atrPeriod && renderParameter("ATR", parameters.atrPeriod)}
            {parameters.multiplier && renderParameter("Mult", parameters.multiplier)}
          </>
        );
      case "rsi":
      case "cci":
      case "cmo":
      case "mfi":
        return renderParameter("Period", parameters.period || parameters.rsiPeriod);
      case "adx":
      case "dmi":
      case "di+":
      case "di-":
        return renderParameter("Period", parameters.period);
      case "awesome oscillator":
      case "accelerator oscillator":
        return (
          <>
            {renderParameter("Fast", parameters.fast || parameters.fastLength)}
            {renderParameter("Slow", parameters.slow || parameters.slowLength)}
          </>
        );
      case "vwap":
      case "vwma":
        return renderParameter("Period", parameters.period);
      case "heikin ashi":
        return parameters.wicks && renderParameter("Wicks", parameters.wicks);
      default:
        // For simple moving averages and most indicators with just a period
        return renderParameter("Period", parameters.period || parameters.length || parameters.optInTimePeriod);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <span className="font-medium">{indicator}</span>
        {valueType && <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full">{valueType}</span>}
      </div>
      <div className="flex flex-wrap gap-2 mt-1">
        {renderParameters()}
      </div>
    </div>
  );
};

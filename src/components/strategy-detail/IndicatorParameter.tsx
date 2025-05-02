
import { IndicatorParameters } from "./types";

interface IndicatorParameterProps {
  indicator: string;
  parameters?: IndicatorParameters;
  valueType?: string;
}

export const IndicatorParameter = ({ indicator, parameters, valueType }: IndicatorParameterProps) => {
  const renderParameter = (name: string, value?: string) => {
    if (!value) return null;
    
    return (
      <span className="text-xs text-muted-foreground">
        {name}: {value}
      </span>
    );
  };
  
  const renderParameters = () => {
    if (!parameters) return null;

    // Handle common parameters
    const commonParams = [];
    if (parameters.source) {
      commonParams.push(renderParameter("Source", parameters.source));
    }
    
    // Specific indicator parameters
    switch (indicator) {
      case "MACD":
        return (
          <>
            {renderParameter("Fast", parameters.fast)}
            {renderParameter("Slow", parameters.slow)}
            {renderParameter("Signal", parameters.signal)}
          </>
        );
      case "Bollinger Bands":
        return (
          <>
            {renderParameter("Period", parameters.period)}
            {renderParameter("Deviation", parameters.deviation)}
            {parameters.maType && renderParameter("MA Type", parameters.maType)}
          </>
        );
      case "Stochastic":
      case "StochRSI":
        return (
          <>
            {renderParameter("K", parameters.k || parameters.fastK)}
            {renderParameter("D", parameters.d || parameters.slowD)}
            {parameters.smoothK && renderParameter("Smooth K", parameters.smoothK)}
            {parameters.smoothD && renderParameter("Smooth D", parameters.smoothD)}
          </>
        );
      case "Ichimoku Cloud":
        return (
          <>
            {renderParameter("Conv", parameters.conversionPeriod)}
            {renderParameter("Base", parameters.basePeriod)}
            {parameters.laggingSpan && renderParameter("Lagging", parameters.laggingSpan)}
            {parameters.displacement && renderParameter("Displ", parameters.displacement)}
          </>
        );
      case "ATR":
      case "SuperTrend":
      case "Chandelier Exit":
        return (
          <>
            {renderParameter("Period", parameters.period || parameters.length)}
            {parameters.multiplier && renderParameter("Mult", parameters.multiplier)}
          </>
        );
      case "Donchian Channel":
      case "Keltner Channel":
        return (
          <>
            {renderParameter("Period", parameters.period || parameters.channelPeriod)}
            {parameters.atrPeriod && renderParameter("ATR", parameters.atrPeriod)}
            {parameters.multiplier && renderParameter("Mult", parameters.multiplier)}
          </>
        );
      case "RSI":
      case "CCI":
      case "CMO":
      case "MFI":
        return renderParameter("Period", parameters.period);
      case "ADX":
      case "DMI":
      case "DI+":
      case "DI-":
        return renderParameter("Period", parameters.period);
      case "Awesome Oscillator":
      case "Accelerator Oscillator":
        return (
          <>
            {renderParameter("Fast", parameters.fast || parameters.fastLength)}
            {renderParameter("Slow", parameters.slow || parameters.slowLength)}
          </>
        );
      case "VWAP":
      case "VWMA":
        return renderParameter("Period", parameters.period);
      default:
        // For simple moving averages and most indicators with just a period
        return renderParameter("Period", parameters.period || parameters.length);
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

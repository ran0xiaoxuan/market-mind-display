
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


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
          </>
        );
      case "Stochastic":
        return (
          <>
            {renderParameter("K", parameters.k)}
            {renderParameter("D", parameters.d)}
          </>
        );
      case "Ichimoku Cloud":
        return (
          <>
            {renderParameter("Conv", parameters.conversionPeriod)}
            {renderParameter("Base", parameters.basePeriod)}
          </>
        );
      default:
        return renderParameter("Period", parameters.period);
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

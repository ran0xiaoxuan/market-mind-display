
import { supabase } from "@/integrations/supabase/client";

// Define TAAPI indicator parameters interface
export interface TaapiIndicatorParams {
  symbol?: string;
  exchange?: string;
  interval?: string;
  optInTimePeriod?: number;
  optInFastPeriod?: number;
  optInSlowPeriod?: number;
  optInSignalPeriod?: number;
  optInStdDev?: number;
  optInFastK_Period?: number;
  optInFastD_Period?: number;
  optInSlowK_Period?: number;
  optInSlowD_Period?: number;
  optInMAType?: number;
  backtracks?: number;
  chart?: boolean;
}

// Define TAAPI indicator response interface
export interface TaapiIndicatorResponse {
  value?: number | number[];
  values?: number[];
  valueUpperBand?: number;
  valueMiddleBand?: number;
  valueLowerBand?: number;
  valueMACD?: number;
  valueSignal?: number;
  valueHistogram?: number;
  valueK?: number;
  valueD?: number;
  valueBaseLine?: number;
  valueConversionLine?: number;
  valueSpanA?: number;
  valueSpanB?: number;
  valueLaggingSpan?: number;
  timestamp?: number;
  backtracks?: any[];
}

// Get TAAPI API key from Supabase secrets
export const getTaapiApiKey = async (): Promise<string | null> => {
  try {
    const { data } = await supabase.functions.invoke('get-taapi-key');
    return data?.key || null;
  } catch (error) {
    console.error("Error fetching TAAPI API key:", error);
    return null;
  }
};

// Get indicator data from TAAPI
export const getIndicatorData = async (
  indicator: string,
  params: TaapiIndicatorParams
): Promise<TaapiIndicatorResponse | null> => {
  try {
    const apiKey = await getTaapiApiKey();
    
    if (!apiKey) {
      console.error("No TAAPI API key available");
      return null;
    }
    
    const baseUrl = "https://api.taapi.io";
    const url = new URL(`/${indicator}`, baseUrl);
    
    // Add API key
    url.searchParams.append("secret", apiKey);
    
    // Add all parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TAAPI API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching ${indicator} indicator data:`, error);
    return null;
  }
};

// Get all supported indicators from TAAPI
export const getSupportedIndicators = async (): Promise<string[]> => {
  // This is a static list of TAAPI supported indicators
  // We can later replace this with an actual API call if TAAPI provides such an endpoint
  return [
    // Trend indicators
    "sma", "ema", "wma", "dema", "tema", "trima", "kama", "mama", "t3", "vwap", 
    "supertrend", "hma", "wilders", "zlema",
    
    // Momentum indicators
    "rsi", "macd", "adx", "cci", "mfi", "mom", "roc", "stoch", "stochRsi", "trix",
    "ultosc", "willr", "ao", "bop", "cmo", "ppo", "pvo", "rvi", "apo",
    
    // Volatility indicators
    "bbands", "atr", "natr", "keltnerchannels", "standarddeviation", "chandelier", "donchian",
    
    // Volume indicators
    "obv", "ad", "adosc", "cmf", 
    
    // Oscillator indicators
    "stoch", "stochRsi", "rsi", "cci", "macd", "willr", "ao", 
    
    // Ichimoku indicators
    "ichimoku",
    
    // Support/Resistance indicators
    "fibonacciretracement", "pivotpoints", "zigzag",
    
    // Price action indicators
    "candles", "heikinashi", "renko", "linebreak",
    
    // Custom indicators
    "fibonaccipivots", "rvi", "vi", "vwmacd", "lwma"
  ];
};

// Helper function to map our platform's parameter names to TAAPI parameter names
export const mapParametersToTaapi = (
  indicator: string,
  parameters: Record<string, string> = {}
): TaapiIndicatorParams => {
  const params: TaapiIndicatorParams = {};
  
  // Default symbol and interval if not provided
  params.symbol = "BTC/USDT"; // Default symbol
  params.exchange = "binance"; // Default exchange
  params.interval = "1h";      // Default interval
  
  // Map common parameters
  if (parameters.period) {
    params.optInTimePeriod = parseInt(parameters.period);
  }
  
  // Map specific indicator parameters
  switch (indicator.toLowerCase()) {
    case "sma":
    case "ema":
    case "wma":
    case "dema":
    case "tema":
    case "trima":
    case "kama":
    case "t3":
    case "rsi":
    case "willr":
    case "cci":
    case "roc":
    case "mom":
      params.optInTimePeriod = parseInt(parameters.period || "14");
      break;
      
    case "bbands": // Bollinger Bands
      params.optInTimePeriod = parseInt(parameters.period || "20");
      params.optInStdDev = parseFloat(parameters.deviation || "2");
      params.optInMAType = 0; // SMA by default
      break;
      
    case "macd":
      params.optInFastPeriod = parseInt(parameters.fast || "12");
      params.optInSlowPeriod = parseInt(parameters.slow || "26");
      params.optInSignalPeriod = parseInt(parameters.signal || "9");
      break;
      
    case "stoch": // Stochastic
      params.optInFastK_Period = parseInt(parameters.k || "14");
      params.optInSlowK_Period = parseInt(parameters.k || "14");
      params.optInSlowD_Period = parseInt(parameters.d || "3");
      break;
      
    case "stochrsi": // Stochastic RSI
      params.optInTimePeriod = parseInt(parameters.period || "14");
      params.optInFastK_Period = parseInt(parameters.k || "14");
      params.optInFastD_Period = parseInt(parameters.d || "3");
      break;
      
    case "ichimoku":
      // Ichimoku has different naming in our system vs TAAPI
      const conversionPeriod = parseInt(parameters.conversionPeriod || "9");
      const basePeriod = parseInt(parameters.basePeriod || "26");
      const laggingSpanPeriod = parseInt(parameters.laggingSpan || "52");
      params.optInTimePeriod = basePeriod; // Base period as the main period
      break;
  }
  
  return params;
};

// Get a specific type of value from indicator response based on valueType
export const getIndicatorValue = (
  indicator: string,
  data: TaapiIndicatorResponse | null,
  valueType?: string
): number | null => {
  if (!data) return null;
  
  switch (indicator.toLowerCase()) {
    case "macd":
      if (valueType === "MACD Line") return data.valueMACD || null;
      if (valueType === "Signal") return data.valueSignal || null;
      if (valueType === "Histogram") return data.valueHistogram || null;
      return data.valueMACD || null; // Default to MACD line
      
    case "bbands":
      if (valueType === "Upper Band") return data.valueUpperBand || null;
      if (valueType === "Middle Band") return data.valueMiddleBand || null;
      if (valueType === "Lower Band") return data.valueLowerBand || null;
      return data.valueMiddleBand || null; // Default to middle band
      
    case "stoch":
    case "stochrsi":
      if (valueType === "K Line") return data.valueK || null;
      if (valueType === "D Line") return data.valueD || null;
      return data.valueK || null; // Default to K line
      
    case "ichimoku":
      if (valueType === "Conversion Line") return data.valueConversionLine || null;
      if (valueType === "Base Line") return data.valueBaseLine || null;
      if (valueType === "Leading Span A") return data.valueSpanA || null;
      if (valueType === "Leading Span B") return data.valueSpanB || null;
      if (valueType === "Lagging Span") return data.valueLaggingSpan || null;
      return data.valueConversionLine || null; // Default to conversion line
      
    default:
      // For simple indicators that return a single value
      if (typeof data.value === 'number') {
        return data.value;
      }
      return null;
  }
};

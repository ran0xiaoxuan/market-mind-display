
import { fetchMarketData, getCurrentPrice, extractIndicatorData } from "./marketDataService";
import { calculateIndicator, mapIndicatorName, getSupportedIndicators } from "./technicalIndicators";
import { IndicatorParameters } from "@/types/backtest";

export interface LocalIndicatorParams {
  symbol: string;
  timeframe: string;
  period?: number;
  fastPeriod?: number;
  slowPeriod?: number;
  signalPeriod?: number;
  deviation?: number;
  multiplier?: number;
  kPeriod?: number;
  dPeriod?: number;
  [key: string]: any;
}

export interface LocalIndicatorResponse {
  value?: number;
  values?: number[];
  upper?: number;
  middle?: number;
  lower?: number;
  macd?: number;
  signal?: number;
  histogram?: number;
  k?: number;
  d?: number;
  [key: string]: any;
}

// Cache for indicator results
const indicatorCache = new Map<string, { data: LocalIndicatorResponse; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for indicator results

// Get cached indicator result
const getCachedIndicator = (cacheKey: string): LocalIndicatorResponse | null => {
  const cached = indicatorCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[LocalIndicator] Cache hit for: ${cacheKey}`);
    return cached.data;
  }
  return null;
};

// Set indicator result in cache
const setCachedIndicator = (cacheKey: string, data: LocalIndicatorResponse): void => {
  indicatorCache.set(cacheKey, { data, timestamp: Date.now() });
  console.log(`[LocalIndicator] Cached indicator result for: ${cacheKey}`);
};

// Main function to calculate indicators locally
export const getLocalIndicator = async (
  indicator: string,
  params: LocalIndicatorParams
): Promise<LocalIndicatorResponse | null> => {
  try {
    const { symbol, timeframe, ...config } = params;
    const cacheKey = `${indicator}_${symbol}_${timeframe}_${JSON.stringify(config)}`;
    
    // Check cache first
    const cached = getCachedIndicator(cacheKey);
    if (cached) {
      return cached;
    }

    console.log(`[LocalIndicator] Calculating ${indicator} for ${symbol} with timeframe ${timeframe}`);

    // Map indicator name to internal format
    const mappedIndicator = mapIndicatorName(indicator);
    
    // Fetch market data
    const marketData = await fetchMarketData({
      symbol,
      timeframe,
      limit: Math.max(200, (config.period || 50) * 3) // Ensure enough data points
    });

    if (marketData.length === 0) {
      console.error(`[LocalIndicator] No market data available for ${symbol}`);
      return null;
    }

    // Extract data arrays for calculations
    const indicatorInput = extractIndicatorData(marketData);
    
    // Calculate the indicator
    const result = calculateIndicator(mappedIndicator, indicatorInput, config);
    
    // Cache the result
    setCachedIndicator(cacheKey, result);
    
    console.log(`[LocalIndicator] Successfully calculated ${indicator} for ${symbol}`);
    return result;

  } catch (error) {
    console.error(`[LocalIndicator] Error calculating ${indicator} for ${params.symbol}:`, error);
    return null;
  }
};

// Helper function to map parameters from our platform format to local format
export const mapParametersToLocal = (
  indicator: string,
  parameters: IndicatorParameters = {}
): LocalIndicatorParams => {
  const params: LocalIndicatorParams = {
    symbol: parameters.symbol || "AAPL",
    timeframe: parameters.interval || "Daily"
  };
  
  // Map common parameters
  if (parameters.period) {
    params.period = parseInt(parameters.period);
  }
  
  // Map specific indicator parameters
  switch (indicator.toLowerCase()) {
    case "sma":
    case "ema":
      params.period = parseInt(parameters.period || parameters.optInTimePeriod || "14");
      break;
      
    case "macd":
      params.fastPeriod = parseInt(parameters.fast || parameters.fastPeriod || "12");
      params.slowPeriod = parseInt(parameters.slow || parameters.slowPeriod || "26");
      params.signalPeriod = parseInt(parameters.signal || parameters.signalPeriod || "9");
      break;
      
    case "bollinger bands":
    case "bbands":
      params.period = parseInt(parameters.period || parameters.optInTimePeriod || "20");
      params.deviation = parseFloat(parameters.deviation || parameters.nbDevUp || "2");
      break;
      
    case "stochastic":
      params.kPeriod = parseInt(parameters.k || parameters.kPeriod || parameters.fastK || "14");
      params.dPeriod = parseInt(parameters.d || parameters.dPeriod || parameters.fastD || "3");
      break;
      
    case "rsi":
    case "cci":
    case "williams %r":
    case "mfi":
    case "atr":
      params.period = parseInt(parameters.period || parameters.rsiPeriod || "14");
      break;
  }
  
  return params;
};

// Get indicator value based on value type (similar to TAAPI service)
export const getLocalIndicatorValue = (
  indicator: string,
  data: LocalIndicatorResponse | null,
  valueType?: string
): number | null => {
  if (!data) return null;
  
  switch (indicator.toLowerCase()) {
    case "macd":
      if (valueType === "MACD Value") return data.macd || null;
      if (valueType === "Signal Value") return data.signal || null;
      if (valueType === "Histogram Value") return data.histogram || null;
      return data.macd || null;
      
    case "bollinger bands":
    case "bbands":
      if (valueType === "Upper Band") return data.upper || null;
      if (valueType === "Middle Band") return data.middle || null;
      if (valueType === "Lower Band") return data.lower || null;
      return data.middle || null;
      
    case "stochastic":
      if (valueType === "K Value") return data.k || null;
      if (valueType === "D Value") return data.d || null;
      return data.k || null;
      
    default:
      return data.value || null;
  }
};

// Export supported indicators list
export { getSupportedIndicators };

// Current price function (re-export from market data service)
export { getCurrentPrice };


import { supabase } from "@/integrations/supabase/client";
import { IndicatorParameters } from "@/types/backtest";

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
  optInPenetration?: number;
  backtracks?: number;
  chart?: boolean;
  wicks?: boolean;
  period?: number;
  fastPeriod?: number;
  slowPeriod?: number;
  signalPeriod?: number;
  nbDevUp?: number;
  nbDevDn?: number;
  atrPeriod?: number;
  multiplier?: number;
  kPeriod?: number;
  dPeriod?: number;
  slowing?: number;
  source?: string;
  [key: string]: string | number | boolean | undefined;
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
  open?: number;
  high?: number;
  low?: number;
  close?: number;
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
  // This is an expanded list of TAAPI supported indicators
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
    
    // Pattern Recognition
    "cdl2crows", "cdl3blackcrows", "cdl3inside", "cdl3linestrike", "cdl3outside",
    "cdl3starsinsouth", "cdl3whitesoldiers", "cdlabandonedbaby", "cdladvanceblock",
    "cdlbelthold", "cdlbreakaway", "cdlclosingmarubozu", "cdlconcealbabyswall",
    "cdlcounterattack", "cdldarkcloudcover", "cdldoji", "cdldojistar",
    "cdldragonflydoji", "cdlengulfing", "cdleveningdojistar", "cdleveningstar",
    "cdlgapsidesidewhite", "cdlgravestonedoji", "cdlhammer", "cdlhangingman",
    "cdlharami", "cdlharamicross", "cdlhighwave", "cdlhikkake", "cdlhikkakemod",
    "cdlhomingpigeon", "cdlidentical3crows", "cdlinneck", "cdlinvertedhammer",
    "cdlkicking", "cdlkickingbylength", "cdlladderbottom", "cdllongleggeddoji",
    "cdllongline", "cdlmarubozu", "cdlmatchinglow", "cdlmathold", "cdlmorningdojistar",
    "cdlmorningstar", "cdlonneck", "cdlpiercing", "cdlrickshawman", "cdlrisefall3methods",
    "cdlseparatinglines", "cdlshootingstar", "cdlshortline", "cdlspinningtop",
    "cdlstalledpattern", "cdlsticksandwich", "cdltakuri", "cdltasukigap",
    "cdlthrusting", "cdltristar", "cdlunique3river", "cdlupsidegap2crows",
    "cdlxsidegap3methods",
    
    // Custom indicators
    "fibonaccipivots", "rvi", "vi", "vwmacd", "lwma"
  ];
};

// Helper function to map our platform's parameter names to TAAPI parameter names
export const mapParametersToTaapi = (
  indicator: string,
  parameters: IndicatorParameters = {}
): TaapiIndicatorParams => {
  const params: TaapiIndicatorParams = {};
  
  // Default symbol and interval if not provided
  params.symbol = parameters.symbol || "BTC/USDT"; 
  params.exchange = parameters.exchange || "binance";
  params.interval = parameters.interval || "1h";
  
  // Map common parameters
  if (parameters.period) {
    params.optInTimePeriod = parseInt(parameters.period);
  }
  
  if (parameters.backtracks) {
    params.backtracks = parseInt(parameters.backtracks);
  }
  
  if (parameters.source) {
    params.source = parameters.source;
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
    case "hma":
    case "wilders":
    case "zlema":
      params.period = parseInt(parameters.period || parameters.optInTimePeriod || "14");
      break;
      
    case "bbands": // Bollinger Bands
      params.period = parseInt(parameters.period || parameters.optInTimePeriod || "20");
      if (parameters.deviation) params.stdDev = parseFloat(parameters.deviation);
      if (parameters.nbDevUp) params.nbDevUp = parseFloat(parameters.nbDevUp);
      if (parameters.nbDevDn) params.nbDevDn = parseFloat(parameters.nbDevDn);
      if (parameters.maType) params.optInMAType = parseInt(parameters.maType);
      break;
      
    case "macd":
      params.fastPeriod = parseInt(parameters.fast || parameters.fastPeriod || "12");
      params.slowPeriod = parseInt(parameters.slow || parameters.slowPeriod || "26");
      params.signalPeriod = parseInt(parameters.signal || parameters.signalPeriod || "9");
      break;
      
    case "stoch": // Stochastic
      params.kPeriod = parseInt(parameters.k || parameters.kPeriod || parameters.fastK || "14");
      params.dPeriod = parseInt(parameters.d || parameters.dPeriod || parameters.fastD || "3");
      if (parameters.slowing) params.slowing = parseInt(parameters.slowing);
      break;
      
    case "stochrsi": // Stochastic RSI
      params.rsiPeriod = parseInt(parameters.period || parameters.rsiPeriod || "14");
      params.kPeriod = parseInt(parameters.k || parameters.kPeriod || parameters.fastK || "14");
      params.dPeriod = parseInt(parameters.d || parameters.dPeriod || parameters.fastD || "3");
      break;
      
    case "ichimoku":
      params.conversionPeriod = parseInt(parameters.conversionPeriod || "9");
      params.basePeriod = parseInt(parameters.basePeriod || "26");
      params.laggingSpanPeriod = parseInt(parameters.laggingSpan || "52");
      params.displacement = parseInt(parameters.displacement || "26");
      break;
      
    case "atr":
      params.period = parseInt(parameters.period || parameters.atrPeriod || "14");
      break;
      
    case "supertrend":
      params.period = parseInt(parameters.period || parameters.atrPeriod || "10");
      params.multiplier = parseFloat(parameters.multiplier || "3");
      break;
      
    case "chandelier":
      params.period = parseInt(parameters.period || parameters.atrPeriod || "22");
      params.multiplier = parseFloat(parameters.multiplier || "3");
      break;
      
    case "keltnerchannels":
      params.period = parseInt(parameters.period || parameters.channelPeriod || "20");
      if (parameters.atrPeriod) params.atrPeriod = parseInt(parameters.atrPeriod);
      params.multiplier = parseFloat(parameters.multiplier || "2");
      break;
      
    case "donchian":
      params.period = parseInt(parameters.period || parameters.channelPeriod || "20");
      break;
      
    case "rsi":
    case "cci":
    case "cmo":
    case "mfi":
    case "willr":
    case "roc":
      params.period = parseInt(parameters.period || parameters.rsiPeriod || "14");
      break;
      
    case "adx":
    case "dmi":
    case "di+":
    case "di-":
      params.period = parseInt(parameters.period || "14");
      break;
      
    case "ao": // Awesome Oscillator
      params.fastPeriod = parseInt(parameters.fast || parameters.fastLength || "5");
      params.slowPeriod = parseInt(parameters.slow || parameters.slowLength || "34");
      break;
      
    case "heikinashi":
      if (parameters.wicks === "true") params.wicks = true;
      if (parameters.wicks === "false") params.wicks = false;
      break;
      
    case "mom": // Momentum
    case "ultosc": // Ultimate Oscillator
    case "bop": // Balance of Power
    case "obv": // On Balance Volume
    case "ad": // Accumulation/Distribution Line
    case "adosc": // Chaikin Oscillator
    case "cmf": // Chaikin Money Flow
    case "vwap": // Volume Weighted Average Price
      params.period = parseInt(parameters.period || "14");
      break;
      
    // Pattern recognition indicators use optInPenetration
    case "cdldarkcloudcover":
    case "cdlengulfing":
    case "cdlhammer":
    case "cdlhangingman":
    case "cdlharami":
    case "cdlharamicross":
    case "cdlmorningstar":
    case "cdlpiercing":
      if (parameters.optInPenetration) {
        params.optInPenetration = parseFloat(parameters.optInPenetration);
      }
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
    case "keltnerchannels":
    case "donchian":
      if (valueType === "Upper Band") return data.valueUpperBand || null;
      if (valueType === "Middle Band" || valueType === "Middle Line") return data.valueMiddleBand || null;
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
      
    case "heikinashi":
      if (valueType === "Open") return data.open || null;
      if (valueType === "High") return data.high || null;
      if (valueType === "Low") return data.low || null;
      if (valueType === "Close") return data.close || null;
      return data.close || null; // Default to close
      
    default:
      // For simple indicators that return a single value
      if (typeof data.value === 'number') {
        return data.value;
      }
      return null;
  }
};

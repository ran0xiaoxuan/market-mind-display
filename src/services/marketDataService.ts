
import { supabase } from "@/integrations/supabase/client";

export interface MarketData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketDataOptions {
  symbol: string;
  timeframe: string;
  limit?: number;
  from?: string;
  to?: string;
}

// Get FMP API key from Supabase secrets
const getFmpApiKey = async (): Promise<string | null> => {
  try {
    const { data } = await supabase.functions.invoke('get-fmp-key');
    return data?.key || null;
  } catch (error) {
    console.error("Error fetching FMP API key:", error);
    return null;
  }
};

// Map timeframe to FMP API intervals
const mapTimeframeToFmpInterval = (timeframe: string): string => {
  const timeframeMap: { [key: string]: string } = {
    '1m': '1min',
    '5m': '5min',
    '15m': '15min',
    '30m': '30min',
    '1h': '1hour',
    '4h': '4hour',
    'Daily': '1day',
    'Weekly': '1week',
    'Monthly': '1month'
  };
  
  return timeframeMap[timeframe] || '1day';
};

// Cache for market data
const marketDataCache = new Map<string, { data: MarketData[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get cached data if available and not expired
const getCachedData = (cacheKey: string): MarketData[] | null => {
  const cached = marketDataCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[MarketData] Cache hit for: ${cacheKey}`);
    return cached.data;
  }
  return null;
};

// Set data in cache
const setCachedData = (cacheKey: string, data: MarketData[]): void => {
  marketDataCache.set(cacheKey, { data, timestamp: Date.now() });
  console.log(`[MarketData] Cached data for: ${cacheKey}`);
};

// Fetch historical market data from FMP
export const fetchMarketData = async (options: MarketDataOptions): Promise<MarketData[]> => {
  const { symbol, timeframe, limit = 100 } = options;
  const cacheKey = `${symbol}_${timeframe}_${limit}`;
  
  // Check cache first
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const apiKey = await getFmpApiKey();
    if (!apiKey) {
      throw new Error('FMP API key not available');
    }

    const fmpInterval = mapTimeframeToFmpInterval(timeframe);
    let endpoint: string;
    
    // Choose the appropriate FMP endpoint based on timeframe
    if (['1min', '5min', '15min', '30min', '1hour', '4hour'].includes(fmpInterval)) {
      // Intraday data
      endpoint = `https://financialmodelingprep.com/api/v3/historical-chart/${fmpInterval}/${symbol}?apikey=${apiKey}`;
    } else {
      // Daily, weekly, monthly data
      endpoint = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${apiKey}`;
    }

    console.log(`[MarketData] Fetching data for ${symbol} with timeframe ${timeframe}`);
    
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    let marketData: MarketData[] = [];
    
    if (fmpInterval === '1day' || fmpInterval === '1week' || fmpInterval === '1month') {
      // Daily/weekly/monthly data format
      if (data.historical && Array.isArray(data.historical)) {
        marketData = data.historical
          .slice(0, limit)
          .map((item: any) => ({
            date: item.date,
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
            volume: parseInt(item.volume || 0)
          }))
          .reverse(); // FMP returns newest first, we want oldest first
      }
    } else {
      // Intraday data format
      if (Array.isArray(data)) {
        marketData = data
          .slice(0, limit)
          .map((item: any) => ({
            date: item.date,
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
            volume: parseInt(item.volume || 0)
          }))
          .reverse(); // FMP returns newest first, we want oldest first
      }
    }

    if (marketData.length === 0) {
      throw new Error(`No market data found for ${symbol}`);
    }

    // Cache the data
    setCachedData(cacheKey, marketData);
    
    console.log(`[MarketData] Successfully fetched ${marketData.length} data points for ${symbol}`);
    return marketData;

  } catch (error) {
    console.error(`[MarketData] Error fetching data for ${symbol}:`, error);
    throw error;
  }
};

// Get current market price
export const getCurrentPrice = async (symbol: string): Promise<number | null> => {
  try {
    const apiKey = await getFmpApiKey();
    if (!apiKey) {
      console.error('[MarketData] FMP API key not available');
      return null;
    }

    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`
    );

    if (!response.ok) {
      console.error(`[MarketData] FMP API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error(`[MarketData] No price data for ${symbol}`);
      return null;
    }

    const price = data[0].price;
    console.log(`[MarketData] Current price for ${symbol}: $${price}`);
    return price;
  } catch (error) {
    console.error(`[MarketData] Error fetching price for ${symbol}:`, error);
    return null;
  }
};

// Alias for backward compatibility
export const getStockPrice = async (symbol: string): Promise<{ price: number } | null> => {
  const price = await getCurrentPrice(symbol);
  if (price === null) return null;
  return { price };
};

// Extract arrays from market data for indicator calculations
export const extractIndicatorData = (marketData: MarketData[]) => {
  return {
    open: marketData.map(d => d.open),
    high: marketData.map(d => d.high),
    low: marketData.map(d => d.low),
    close: marketData.map(d => d.close),
    volume: marketData.map(d => d.volume)
  };
};

// Calculate portfolio metrics for dashboard
export const calculatePortfolioMetrics = async (timeRange: string = '7d') => {
  try {
    console.log(`[Portfolio] Calculating metrics for timeRange: ${timeRange}`);
    
    // Return basic metrics structure for now
    // This can be enhanced with real portfolio calculations later
    return {
      totalValue: "$0.00",
      totalChange: {
        value: "+$0.00",
        positive: true
      },
      winRate: "0%",
      winRateChange: {
        value: "+0%",
        positive: true
      },
      avgReturn: "0%",
      avgReturnChange: {
        value: "+0%",
        positive: true
      },
      sharpeRatio: "0.00",
      sharpeChange: {
        value: "+0.00",
        positive: true
      }
    };
  } catch (error) {
    console.error('[Portfolio] Error calculating metrics:', error);
    // Return default metrics on error
    return {
      totalValue: "$0.00",
      totalChange: {
        value: "+$0.00",
        positive: true
      },
      winRate: "0%",
      winRateChange: {
        value: "+0%",
        positive: true
      },
      avgReturn: "0%",
      avgReturnChange: {
        value: "+0%",
        positive: true
      },
      sharpeRatio: "0.00",
      sharpeChange: {
        value: "+0.00",
        positive: true
      }
    };
  }
};


import { supabase } from "@/integrations/supabase/client";

export interface OptimizedMarketData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number; // For real-time tracking
}

export interface BatchMarketDataRequest {
  symbols: string[];
  timeframe: string;
  limit?: number;
}

// Multi-level caching with different TTLs
const priceCache = new Map<string, { price: number; timestamp: number }>();
const dataCache = new Map<string, { data: OptimizedMarketData[]; timestamp: number }>();

const PRICE_CACHE_TTL = 15000; // 15 seconds for current prices
const DATA_CACHE_TTL = 30000; // 30 seconds for historical data

// Get FMP API key with caching
let cachedApiKey: string | null = null;
let apiKeyTimestamp = 0;
const API_KEY_CACHE_TTL = 300000; // 5 minutes

const getOptimizedFmpApiKey = async (): Promise<string | null> => {
  const now = Date.now();
  
  if (cachedApiKey && (now - apiKeyTimestamp) < API_KEY_CACHE_TTL) {
    return cachedApiKey;
  }

  try {
    const { data } = await supabase.functions.invoke('get-fmp-key');
    cachedApiKey = data?.key || null;
    apiKeyTimestamp = now;
    return cachedApiKey;
  } catch (error) {
    console.error("Error fetching FMP API key:", error);
    return null;
  }
};

// Batch fetch current prices for multiple symbols
export const batchGetCurrentPrices = async (symbols: string[]): Promise<Map<string, number>> => {
  const startTime = Date.now();
  const results = new Map<string, number>();
  const uncachedSymbols: string[] = [];

  // Check cache first
  symbols.forEach(symbol => {
    const cached = priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < PRICE_CACHE_TTL) {
      results.set(symbol, cached.price);
    } else {
      uncachedSymbols.push(symbol);
    }
  });

  console.log(`[BatchPrices] Cache hits: ${results.size}, Cache misses: ${uncachedSymbols.length}`);

  // Fetch uncached symbols
  if (uncachedSymbols.length > 0) {
    try {
      const apiKey = await getOptimizedFmpApiKey();
      if (!apiKey) {
        throw new Error('FMP API key not available');
      }

      // Batch request - FMP supports multiple symbols in one call
      const symbolsQuery = uncachedSymbols.join(',');
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/quote/${symbolsQuery}?apikey=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`FMP API error: ${response.status}`);
      }

      const data = await response.json();
      const now = Date.now();

      if (Array.isArray(data)) {
        data.forEach((quote: any) => {
          if (quote.symbol && quote.price) {
            const price = parseFloat(quote.price);
            results.set(quote.symbol, price);
            priceCache.set(quote.symbol, { price, timestamp: now });
          }
        });
      }

      console.log(`[BatchPrices] Fetched ${data.length} prices in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('[BatchPrices] Error fetching batch prices:', error);
    }
  }

  return results;
};

// Optimized single price fetch with intelligent caching
export const getOptimizedCurrentPrice = async (symbol: string): Promise<number | null> => {
  const cached = priceCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < PRICE_CACHE_TTL) {
    return cached.price;
  }

  try {
    const prices = await batchGetCurrentPrices([symbol]);
    return prices.get(symbol) || null;
  } catch (error) {
    console.error(`[OptimizedPrice] Error fetching price for ${symbol}:`, error);
    return null;
  }
};

// Parallel market data fetching with enhanced caching
export const fetchOptimizedMarketData = async (
  symbol: string, 
  timeframe: string, 
  limit: number = 100
): Promise<OptimizedMarketData[]> => {
  const cacheKey = `${symbol}_${timeframe}_${limit}`;
  const cached = dataCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < DATA_CACHE_TTL) {
    console.log(`[OptimizedData] Cache hit for ${cacheKey}`);
    return cached.data;
  }

  const startTime = Date.now();

  try {
    const apiKey = await getOptimizedFmpApiKey();
    if (!apiKey) {
      throw new Error('FMP API key not available');
    }

    const fmpInterval = mapTimeframeToFmpInterval(timeframe);
    let endpoint: string;
    
    if (['1min', '5min', '15min', '30min', '1hour', '4hour'].includes(fmpInterval)) {
      endpoint = `https://financialmodelingprep.com/api/v3/historical-chart/${fmpInterval}/${symbol}?apikey=${apiKey}`;
    } else {
      endpoint = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${apiKey}`;
    }

    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let marketData: OptimizedMarketData[] = [];
    const now = Date.now();
    
    if (fmpInterval === '1day' || fmpInterval === '1week' || fmpInterval === '1month') {
      if (data.historical && Array.isArray(data.historical)) {
        marketData = data.historical
          .slice(0, limit)
          .map((item: any) => ({
            date: item.date,
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
            volume: parseInt(item.volume || 0),
            timestamp: new Date(item.date).getTime()
          }))
          .reverse();
      }
    } else {
      if (Array.isArray(data)) {
        marketData = data
          .slice(0, limit)
          .map((item: any) => ({
            date: item.date,
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
            volume: parseInt(item.volume || 0),
            timestamp: new Date(item.date).getTime()
          }))
          .reverse();
      }
    }

    if (marketData.length === 0) {
      throw new Error(`No market data found for ${symbol}`);
    }

    // Cache the result
    dataCache.set(cacheKey, { data: marketData, timestamp: now });
    
    const processingTime = Date.now() - startTime;
    console.log(`[OptimizedData] Fetched ${marketData.length} points for ${symbol} in ${processingTime}ms`);
    
    return marketData;
  } catch (error) {
    console.error(`[OptimizedData] Error fetching data for ${symbol}:`, error);
    throw error;
  }
};

// Helper function for timeframe mapping
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

// Batch market data fetching for multiple symbols
export const batchFetchMarketData = async (
  requests: BatchMarketDataRequest[]
): Promise<Map<string, OptimizedMarketData[]>> => {
  const startTime = Date.now();
  const results = new Map<string, OptimizedMarketData[]>();

  try {
    // Group requests by timeframe for potential optimization
    const groupedRequests = new Map<string, string[]>();
    requests.forEach(req => {
      if (!groupedRequests.has(req.timeframe)) {
        groupedRequests.set(req.timeframe, []);
      }
      groupedRequests.get(req.timeframe)?.push(...req.symbols);
    });

    // Process all requests in parallel
    const fetchPromises = requests.flatMap(req => 
      req.symbols.map(symbol => 
        fetchOptimizedMarketData(symbol, req.timeframe, req.limit)
          .then(data => ({ symbol, data }))
          .catch(error => ({ symbol, data: null, error }))
      )
    );

    const fetchResults = await Promise.all(fetchPromises);
    
    fetchResults.forEach(({ symbol, data }) => {
      if (data) {
        results.set(symbol, data);
      }
    });

    const processingTime = Date.now() - startTime;
    console.log(`[BatchMarketData] Processed ${requests.length} requests in ${processingTime}ms`);

  } catch (error) {
    console.error('[BatchMarketData] Error in batch fetch:', error);
  }

  return results;
};

// Cache management and performance monitoring
export const getOptimizedCacheStats = () => {
  return {
    priceCache: {
      size: priceCache.size,
      entries: Array.from(priceCache.keys())
    },
    dataCache: {
      size: dataCache.size,
      entries: Array.from(dataCache.keys())
    },
    apiKeyCache: {
      isValid: cachedApiKey !== null,
      age: Date.now() - apiKeyTimestamp
    }
  };
};

export const cleanupOptimizedCaches = () => {
  const now = Date.now();
  let cleanedPrices = 0;
  let cleanedData = 0;

  // Clean price cache
  for (const [key, value] of priceCache.entries()) {
    if (now - value.timestamp > PRICE_CACHE_TTL) {
      priceCache.delete(key);
      cleanedPrices++;
    }
  }

  // Clean data cache
  for (const [key, value] of dataCache.entries()) {
    if (now - value.timestamp > DATA_CACHE_TTL) {
      dataCache.delete(key);
      cleanedData++;
    }
  }

  console.log(`[CacheCleanup] Cleaned ${cleanedPrices} price entries, ${cleanedData} data entries`);
  return { cleanedPrices, cleanedData };
};

// Warm up cache for commonly requested symbols
export const warmUpCache = async (symbols: string[], timeframes: string[]) => {
  console.log(`[CacheWarmup] Warming cache for ${symbols.length} symbols, ${timeframes.length} timeframes`);
  
  try {
    // Warm up current prices
    await batchGetCurrentPrices(symbols);
    
    // Warm up historical data for common timeframes
    const requests: BatchMarketDataRequest[] = timeframes.map(timeframe => ({
      symbols,
      timeframe,
      limit: 50 // Smaller limit for warmup
    }));
    
    await batchFetchMarketData(requests);
    
    console.log('[CacheWarmup] Cache warmup completed');
  } catch (error) {
    console.error('[CacheWarmup] Error during cache warmup:', error);
  }
};

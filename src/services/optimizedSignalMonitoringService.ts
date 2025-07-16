
import { supabase } from "@/integrations/supabase/client";

export interface OptimizedSignalMonitoringStatus {
  isActive: boolean;
  lastCheck: string | null;
  signalsGenerated: number;
  strategiesMonitored: number;
  processingTime: number;
  error?: string;
}

// Enhanced cache with TTL for real-time data
const marketDataCache = new Map<string, { 
  data: any; 
  timestamp: number; 
  ttl: number;
}>();

// Reduced cache duration for more real-time data
const CACHE_DURATION = 30000; // 30 seconds for real-time performance
const PRICE_CACHE_DURATION = 15000; // 15 seconds for current prices

export const getOptimizedSignalMonitoringStatus = async (): Promise<OptimizedSignalMonitoringStatus> => {
  const startTime = Date.now();
  
  try {
    // Parallel fetch of recent signals and strategies
    const [signalsResult, strategiesResult] = await Promise.all([
      supabase
        .from('trading_signals')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      
      supabase
        .from('strategies')
        .select('id')
        .eq('is_active', true)
    ]);

    const processingTime = Date.now() - startTime;

    if (signalsResult.error || strategiesResult.error) {
      return {
        isActive: false,
        lastCheck: null,
        signalsGenerated: 0,
        strategiesMonitored: 0,
        processingTime,
        error: signalsResult.error?.message || strategiesResult.error?.message
      };
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentSignalsCount = signalsResult.data?.filter(signal => 
      new Date(signal.created_at) > oneHourAgo
    ).length || 0;

    return {
      isActive: true,
      lastCheck: signalsResult.data?.[0]?.created_at || null,
      signalsGenerated: recentSignalsCount,
      strategiesMonitored: strategiesResult.data?.length || 0,
      processingTime,
      error: undefined
    };
  } catch (error: any) {
    return {
      isActive: false,
      lastCheck: null,
      signalsGenerated: 0,
      strategiesMonitored: 0,
      processingTime: Date.now() - startTime,
      error: error.message
    };
  }
};

// Optimized manual trigger with performance tracking
export const triggerOptimizedSignalCheck = async () => {
  const startTime = Date.now();
  
  try {
    console.log('[OptimizedMonitor] Triggering optimized signal monitoring...');
    
    const { data, error } = await supabase.functions.invoke('monitor-trading-signals', {
      body: { 
        manual: true,
        source: 'optimized_trigger',
        timestamp: new Date().toISOString(),
        optimized: true,
        performance_tracking: true
      }
    });

    const processingTime = Date.now() - startTime;

    if (error) {
      console.error('[OptimizedMonitor] Error:', error);
      throw error;
    }

    console.log(`[OptimizedMonitor] Completed in ${processingTime}ms:`, data);
    return { ...data, processingTime };
  } catch (error) {
    console.error('[OptimizedMonitor] Error in optimized monitoring:', error);
    throw error;
  }
};

// Enhanced market hours with caching
let marketHoursCache: { isOpen: boolean; timestamp: number } | null = null;
const MARKET_HOURS_CACHE_TTL = 60000; // 1 minute cache for market hours

export const isMarketOpenOptimized = (): boolean => {
  const now = Date.now();
  
  // Use cached result if available and fresh
  if (marketHoursCache && (now - marketHoursCache.timestamp) < MARKET_HOURS_CACHE_TTL) {
    return marketHoursCache.isOpen;
  }

  const currentTime = new Date();
  const est = new Date(currentTime.toLocaleString("en-US", {timeZone: "America/New_York"}));
  
  const dayOfWeek = est.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    marketHoursCache = { isOpen: false, timestamp: now };
    return false;
  }
  
  const hour = est.getHours();
  const minute = est.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  
  const isOpen = timeInMinutes >= 570 && timeInMinutes < 960;
  
  // Cache the result
  marketHoursCache = { isOpen, timestamp: now };
  return isOpen;
};

// Optimized cache management with TTL support
export const getCachedMarketDataOptimized = (symbol: string, ttl: number = CACHE_DURATION) => {
  const cached = marketDataCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  return null;
};

export const setCachedMarketDataOptimized = (symbol: string, data: any, ttl: number = CACHE_DURATION) => {
  marketDataCache.set(symbol, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

// Batch market data fetching for multiple symbols
export const batchFetchMarketData = async (symbols: string[]) => {
  const startTime = Date.now();
  const results = new Map<string, any>();
  const uncachedSymbols: string[] = [];

  // Check cache first
  symbols.forEach(symbol => {
    const cached = getCachedMarketDataOptimized(symbol, PRICE_CACHE_DURATION);
    if (cached) {
      results.set(symbol, cached);
    } else {
      uncachedSymbols.push(symbol);
    }
  });

  // Fetch uncached symbols in parallel
  if (uncachedSymbols.length > 0) {
    try {
      const fetchPromises = uncachedSymbols.map(async (symbol) => {
        const { data, error } = await supabase.functions.invoke('get-market-data', {
          body: { symbol, optimized: true }
        });
        
        if (!error && data) {
          setCachedMarketDataOptimized(symbol, data, PRICE_CACHE_DURATION);
          return { symbol, data };
        }
        return { symbol, data: null };
      });

      const fetchResults = await Promise.all(fetchPromises);
      fetchResults.forEach(({ symbol, data }) => {
        if (data) {
          results.set(symbol, data);
        }
      });
    } catch (error) {
      console.error('[BatchFetch] Error fetching market data:', error);
    }
  }

  const processingTime = Date.now() - startTime;
  console.log(`[BatchFetch] Fetched ${symbols.length} symbols in ${processingTime}ms`);

  return results;
};

// Performance monitoring utilities
export const getOptimizedMonitoringStats = () => {
  return {
    cacheSize: marketDataCache.size,
    cachedSymbols: Array.from(marketDataCache.keys()),
    marketHoursCache: marketHoursCache,
    lastCacheCleanup: Date.now(),
    cacheHitRate: calculateCacheHitRate(),
    avgProcessingTime: getAverageProcessingTime()
  };
};

let cacheHits = 0;
let cacheMisses = 0;
let processingTimes: number[] = [];

const calculateCacheHitRate = () => {
  const total = cacheHits + cacheMisses;
  return total > 0 ? (cacheHits / total * 100).toFixed(2) + '%' : '0%';
};

const getAverageProcessingTime = () => {
  if (processingTimes.length === 0) return 0;
  const avg = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
  return Math.round(avg);
};

// Enhanced cache cleanup with TTL awareness
export const cleanupOptimizedCache = () => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, value] of marketDataCache.entries()) {
    if (now - value.timestamp > value.ttl) {
      marketDataCache.delete(key);
      cleanedCount++;
    }
  }
  
  console.log(`[CacheCleanup] Removed ${cleanedCount} expired entries`);
  return cleanedCount;
};

// Intelligent cache warming for active strategies
export const warmCacheForActiveStrategies = async () => {
  try {
    const { data: strategies } = await supabase
      .from('strategies')
      .select('target_asset')
      .eq('is_active', true);

    if (strategies) {
      const uniqueAssets = [...new Set(strategies.map(s => s.target_asset))];
      console.log(`[CacheWarm] Warming cache for ${uniqueAssets.length} assets`);
      
      await batchFetchMarketData(uniqueAssets);
    }
  } catch (error) {
    console.error('[CacheWarm] Error warming cache:', error);
  }
};

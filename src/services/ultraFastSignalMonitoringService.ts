import { supabase } from "@/integrations/supabase/client";

export interface UltraFastMonitoringStatus {
  isActive: boolean;
  lastCheck: string | null;
  signalsGenerated: number;
  strategiesMonitored: number;
  processingTime: number;
  avgTimePerStrategy: number;
  cacheHitRate: string;
  optimizationLevel: string;
  error?: string;
}

// High-performance cache with intelligent TTL
const ultraFastCache = new Map<string, { 
  data: any; 
  timestamp: number; 
  ttl: number;
  accessCount: number;
}>();

const ULTRA_FAST_CACHE_CONFIG = {
  MARKET_DATA: 15000, // 15 seconds
  INDICATORS: 30000, // 30 seconds
  STRATEGY_RESULTS: 45000, // 45 seconds
  PRICE_DATA: 10000, // 10 seconds for ultra-fresh prices
};

export const getUltraFastMonitoringStatus = async (): Promise<UltraFastMonitoringStatus> => {
  const startTime = Date.now();
  
  try {
    // Parallel fetch of recent data
    const [signalsResult, strategiesResult] = await Promise.all([
      supabase
        .from('trading_signals')
        .select('id, created_at, signal_type, strategy_id')
        .order('created_at', { ascending: false })
        .limit(20),
      
      supabase
        .from('strategies')
        .select('id, name, is_active, target_asset')
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
        avgTimePerStrategy: 0,
        cacheHitRate: '0%',
        optimizationLevel: 'error',
        error: signalsResult.error?.message || strategiesResult.error?.message
      };
    }

    // Calculate recent signals (last 1 hour)
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentSignalsCount = signalsResult.data?.filter(signal => 
      new Date(signal.created_at) > oneHourAgo
    ).length || 0;

    const strategiesCount = strategiesResult.data?.length || 0;
    const avgTimePerStrategy = strategiesCount > 0 ? Math.round(processingTime / strategiesCount) : 0;

    return {
      isActive: true,
      lastCheck: signalsResult.data?.[0]?.created_at || null,
      signalsGenerated: recentSignalsCount,
      strategiesMonitored: strategiesCount,
      processingTime,
      avgTimePerStrategy,
      cacheHitRate: getCacheHitRate(),
      optimizationLevel: 'ultra_fast',
      error: undefined
    };
  } catch (error: any) {
    return {
      isActive: false,
      lastCheck: null,
      signalsGenerated: 0,
      strategiesMonitored: 0,
      processingTime: Date.now() - startTime,
      avgTimePerStrategy: 0,
      cacheHitRate: '0%',
      optimizationLevel: 'error',
      error: error.message
    };
  }
};

export const triggerUltraFastSignalCheck = async () => {
  const startTime = Date.now();
  
  try {
    console.log('[UltraFast] Triggering ultra-fast signal monitoring...');
    
    const { data, error } = await supabase.functions.invoke('monitor-trading-signals', {
      body: { 
        manual: true,
        source: 'ultra_fast_trigger',
        timestamp: new Date().toISOString(),
        optimized: true,
        ultra_fast: true,
        parallel_processing: true,
        performance_tracking: true,
        target_time: '15_seconds'
      }
    });

    const processingTime = Date.now() - startTime;

    if (error) {
      console.error('[UltraFast] Error:', error);
      throw error;
    }

    console.log(`[UltraFast] Completed in ${processingTime}ms:`, data);
    return { ...data, processingTime };
  } catch (error) {
    console.error('[UltraFast] Error in ultra-fast monitoring:', error);
    throw error;
  }
};

// Ultra-fast market hours checking with intelligent caching
let marketHoursCache: { isOpen: boolean; timestamp: number; confidence: number } | null = null;
const MARKET_HOURS_CACHE_TTL = 30000; // 30 seconds cache

export const isMarketOpenUltraFast = (): boolean => {
  const now = Date.now();
  
  // Use cached result if available and fresh
  if (marketHoursCache && (now - marketHoursCache.timestamp) < MARKET_HOURS_CACHE_TTL) {
    return marketHoursCache.isOpen;
  }

  const currentTime = new Date();
  const est = new Date(currentTime.toLocaleString("en-US", {timeZone: "America/New_York"}));
  
  const dayOfWeek = est.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    marketHoursCache = { isOpen: false, timestamp: now, confidence: 100 };
    return false;
  }
  
  const hour = est.getHours();
  const minute = est.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  
  const isOpen = timeInMinutes >= 570 && timeInMinutes < 960; // 9:30 AM to 4:00 PM
  const confidence = Math.abs(timeInMinutes - 570) > 30 && Math.abs(timeInMinutes - 960) > 30 ? 100 : 90;
  
  marketHoursCache = { isOpen, timestamp: now, confidence };
  return isOpen;
};

// Ultra-fast cache management
export const getCachedDataUltraFast = (key: string, category: keyof typeof ULTRA_FAST_CACHE_CONFIG = 'MARKET_DATA') => {
  const cached = ultraFastCache.get(key);
  const ttl = ULTRA_FAST_CACHE_CONFIG[category];
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    cached.accessCount++;
    return cached.data;
  }
  
  if (cached) {
    ultraFastCache.delete(key); // Remove expired entries immediately
  }
  
  return null;
};

export const setCachedDataUltraFast = (key: string, data: any, category: keyof typeof ULTRA_FAST_CACHE_CONFIG = 'MARKET_DATA') => {
  const ttl = ULTRA_FAST_CACHE_CONFIG[category];
  ultraFastCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
    accessCount: 1
  });
};

// Intelligent cache hit rate calculation
let totalRequests = 0;
let cacheHits = 0;

const getCacheHitRate = (): string => {
  if (totalRequests === 0) return '0%';
  return ((cacheHits / totalRequests) * 100).toFixed(1) + '%';
};

export const recordCacheAccess = (wasHit: boolean) => {
  totalRequests++;
  if (wasHit) cacheHits++;
};

// Ultra-fast cache cleanup with intelligent retention
export const cleanupUltraFastCache = () => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, value] of ultraFastCache.entries()) {
    // Keep frequently accessed items longer
    const adjustedTTL = value.accessCount > 5 ? value.ttl * 1.5 : value.ttl;
    
    if (now - value.timestamp > adjustedTTL) {
      ultraFastCache.delete(key);
      cleanedCount++;
    }
  }
  
  console.log(`[UltraFastCache] Cleaned ${cleanedCount} expired entries, ${ultraFastCache.size} remain`);
  return cleanedCount;
};

// Batch market data fetching with ultra-fast caching
export const batchFetchMarketDataUltraFast = async (symbols: string[]) => {
  const startTime = Date.now();
  const results = new Map<string, any>();
  const uncachedSymbols: string[] = [];

  // Check cache first
  symbols.forEach(symbol => {
    const cached = getCachedDataUltraFast(`market_${symbol}`, 'MARKET_DATA');
    if (cached) {
      results.set(symbol, cached);
      recordCacheAccess(true);
    } else {
      uncachedSymbols.push(symbol);
      recordCacheAccess(false);
    }
  });

  // Fetch uncached symbols with optimized batch size
  if (uncachedSymbols.length > 0) {
    try {
      const batchSize = 10; // Optimal batch size for FMP API
      const batches = [];
      
      for (let i = 0; i < uncachedSymbols.length; i += batchSize) {
        batches.push(uncachedSymbols.slice(i, i + batchSize));
      }

      const batchPromises = batches.map(async (batch) => {
        const { data, error } = await supabase.functions.invoke('get-market-data', {
          body: { 
            symbols: batch, 
            ultra_fast: true,
            cache_enabled: true
          }
        });
        
        if (!error && data) {
          batch.forEach(symbol => {
            if (data[symbol]) {
              setCachedDataUltraFast(`market_${symbol}`, data[symbol], 'MARKET_DATA');
              results.set(symbol, data[symbol]);
            }
          });
        }
        return { batch, data, error };
      });

      await Promise.all(batchPromises);
    } catch (error) {
      console.error('[UltraFastBatch] Error fetching market data:', error);
    }
  }

  const processingTime = Date.now() - startTime;
  console.log(`[UltraFastBatch] Processed ${symbols.length} symbols in ${processingTime}ms`);

  return results;
};

// Performance monitoring utilities
export const getUltraFastPerformanceStats = () => {
  return {
    cacheSize: ultraFastCache.size,
    cacheHitRate: getCacheHitRate(),
    totalRequests,
    cacheHits,
    marketHoursCache: marketHoursCache,
    lastCleanup: Date.now(),
    optimizationLevel: 'ultra_fast',
    averageResponseTime: getAverageResponseTime()
  };
};

let responseTimes: number[] = [];
const MAX_RESPONSE_TIME_SAMPLES = 100;

export const recordResponseTime = (time: number) => {
  responseTimes.push(time);
  if (responseTimes.length > MAX_RESPONSE_TIME_SAMPLES) {
    responseTimes = responseTimes.slice(-MAX_RESPONSE_TIME_SAMPLES);
  }
};

const getAverageResponseTime = () => {
  if (responseTimes.length === 0) return 0;
  const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  return Math.round(avg);
};

// Initialize ultra-fast monitoring with warm-up
export const initializeUltraFastMonitoring = async () => {
  console.log('[UltraFast] Initializing ultra-fast monitoring system...');
  
  try {
    // Warm up cache with active strategies
    const { data: strategies } = await supabase
      .from('strategies')
      .select('target_asset')
      .eq('is_active', true);

    if (strategies && strategies.length > 0) {
      const uniqueAssets = [...new Set(strategies.map(s => s.target_asset).filter(Boolean))];
      console.log(`[UltraFast] Pre-warming cache for ${uniqueAssets.length} assets`);
      
      await batchFetchMarketDataUltraFast(uniqueAssets);
    }
    
    // Set up ultra-fast cache cleanup
    setInterval(() => {
      cleanupUltraFastCache();
    }, 30000); // Clean up every 30 seconds
    
    console.log('[UltraFast] Ultra-fast monitoring initialized successfully');
  } catch (error) {
    console.error('[UltraFast] Error initializing ultra-fast monitoring:', error);
  }
};

// Real-time performance monitoring
export const monitorUltraFastPerformance = async () => {
  const startTime = Date.now();
  
  try {
    console.log('[UltraFastPerformance] Starting performance monitoring...');
    
    const result = await triggerUltraFastSignalCheck();
    const totalTime = Date.now() - startTime;
    
    recordResponseTime(totalTime);
    
    console.log(`[UltraFastPerformance] Total time: ${totalTime}ms`);
    console.log(`[UltraFastPerformance] Signals generated: ${result.signals_generated || 0}`);
    
    return {
      ...result,
      totalProcessingTime: totalTime,
      performance_grade: totalTime < 15000 ? 'A+' : totalTime < 30000 ? 'A' : 'B',
      optimization_effective: totalTime < 30000
    };
  } catch (error) {
    console.error('[UltraFastPerformance] Error in performance monitoring:', error);
    throw error;
  }
};

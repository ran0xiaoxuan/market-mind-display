
import { supabase } from "@/integrations/supabase/client";

export interface SignalMonitoringStatus {
  isActive: boolean;
  lastCheck: string | null;
  signalsGenerated: number;
  strategiesMonitored: number;
  error?: string;
}

// Cache for market data and API responses
const marketDataCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds cache for market data

export const getSignalMonitoringStatus = async (): Promise<SignalMonitoringStatus> => {
  try {
    // In a real implementation, this would check a monitoring status table
    // For now, we'll return basic status information
    
    const { data: recentSignals, error } = await supabase
      .from('trading_signals')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return {
        isActive: false,
        lastCheck: null,
        signalsGenerated: 0,
        strategiesMonitored: 0,
        error: error.message
      };
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentSignalsCount = recentSignals?.filter(signal => 
      new Date(signal.created_at) > oneHourAgo
    ).length || 0;

    return {
      isActive: true,
      lastCheck: recentSignals?.[0]?.created_at || null,
      signalsGenerated: recentSignalsCount,
      strategiesMonitored: 0, // This would be tracked in monitoring
      error: undefined
    };
  } catch (error: any) {
    return {
      isActive: false,
      lastCheck: null,
      signalsGenerated: 0,
      strategiesMonitored: 0,
      error: error.message
    };
  }
};

export const triggerManualSignalCheck = async () => {
  try {
    console.log('Triggering manual signal monitoring check...');
    
    const { data, error } = await supabase.functions.invoke('monitor-trading-signals', {
      body: { 
        manual: true,
        source: 'manual_trigger',
        timestamp: new Date().toISOString()
      }
    });

    if (error) {
      console.error('Error triggering manual signal check:', error);
      throw error;
    }

    console.log('Manual signal check completed:', data);
    return data;
  } catch (error) {
    console.error('Error in manual signal check:', error);
    throw error;
  }
};

// Enhanced market hours checking with timezone handling
export const isMarketOpen = (): boolean => {
  const now = new Date();
  const est = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  
  // Check if it's a weekday (Monday = 1, Friday = 5)
  const dayOfWeek = est.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday = 0, Saturday = 6
    return false;
  }
  
  const hour = est.getHours();
  const minute = est.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  
  // Market hours: 9:30 AM (570 minutes) to 4:00 PM (960 minutes) EST
  return timeInMinutes >= 570 && timeInMinutes < 960;
};

export const getNextMarketOpen = (): Date => {
  const now = new Date();
  const est = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  
  // If it's currently market hours, return next day
  if (isMarketOpen()) {
    const tomorrow = new Date(est);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 30, 0, 0);
    return tomorrow;
  }
  
  // If it's before market open today, return today's market open
  const today = new Date(est);
  today.setHours(9, 30, 0, 0);
  
  if (est.getTime() < today.getTime() && est.getDay() >= 1 && est.getDay() <= 5) {
    return today;
  }
  
  // Find next weekday
  let nextMarketDay = new Date(est);
  do {
    nextMarketDay.setDate(nextMarketDay.getDate() + 1);
  } while (nextMarketDay.getDay() === 0 || nextMarketDay.getDay() === 6);
  
  nextMarketDay.setHours(9, 30, 0, 0);
  return nextMarketDay;
};

// Cache management utilities
export const getCachedMarketData = (symbol: string) => {
  const cached = marketDataCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

export const setCachedMarketData = (symbol: string, data: any) => {
  marketDataCache.set(symbol, {
    data,
    timestamp: Date.now()
  });
};

// Performance monitoring
export const getMonitoringStats = () => {
  return {
    cacheSize: marketDataCache.size,
    cachedSymbols: Array.from(marketDataCache.keys()),
    lastCacheCleanup: Date.now()
  };
};

// Clean up old cache entries
export const cleanupCache = () => {
  const now = Date.now();
  for (const [key, value] of marketDataCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      marketDataCache.delete(key);
    }
  }
};

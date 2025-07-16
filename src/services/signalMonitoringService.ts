
import { supabase } from "@/integrations/supabase/client";
import { 
  getOptimizedSignalMonitoringStatus, 
  triggerOptimizedSignalCheck,
  isMarketOpenOptimized,
  cleanupOptimizedCache,
  warmCacheForActiveStrategies
} from "./optimizedSignalMonitoringService";

export interface SignalMonitoringStatus {
  isActive: boolean;
  lastCheck: string | null;
  signalsGenerated: number;
  strategiesMonitored: number;
  processingTime?: number;
  error?: string;
}

// Use optimized implementation as the main implementation
export const getSignalMonitoringStatus = async (): Promise<SignalMonitoringStatus> => {
  return await getOptimizedSignalMonitoringStatus();
};

export const triggerManualSignalCheck = async () => {
  return await triggerOptimizedSignalCheck();
};

export const isMarketOpen = (): boolean => {
  return isMarketOpenOptimized();
};

export const getNextMarketOpen = (): Date => {
  const now = new Date();
  const est = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  
  if (isMarketOpen()) {
    const tomorrow = new Date(est);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 30, 0, 0);
    return tomorrow;
  }
  
  const today = new Date(est);
  today.setHours(9, 30, 0, 0);
  
  if (est.getTime() < today.getTime() && est.getDay() >= 1 && est.getDay() <= 5) {
    return today;
  }
  
  let nextMarketDay = new Date(est);
  do {
    nextMarketDay.setDate(nextMarketDay.getDate() + 1);
  } while (nextMarketDay.getDay() === 0 || nextMarketDay.getDay() === 6);
  
  nextMarketDay.setHours(9, 30, 0, 0);
  return nextMarketDay;
};

export const cleanupCache = () => {
  return cleanupOptimizedCache();
};

// Initialize cache warming for better performance
export const initializeOptimizedMonitoring = async () => {
  console.log('[SignalMonitoring] Initializing optimized monitoring...');
  
  try {
    // Warm up cache with active strategies
    await warmCacheForActiveStrategies();
    
    // Set up periodic cache cleanup
    setInterval(() => {
      cleanupOptimizedCache();
    }, 60000); // Clean up every minute
    
    console.log('[SignalMonitoring] Optimized monitoring initialized');
  } catch (error) {
    console.error('[SignalMonitoring] Error initializing optimized monitoring:', error);
  }
};

// Performance monitoring
export const getMonitoringStats = () => {
  return {
    optimizedCacheStats: cleanupOptimizedCache(),
    lastCleanup: Date.now(),
    marketOpen: isMarketOpen()
  };
};

// Enhanced signal monitoring with performance tracking
export const monitorSignalsWithPerformance = async () => {
  const startTime = Date.now();
  
  try {
    console.log('[PerformanceMonitor] Starting signal monitoring with performance tracking...');
    
    const result = await triggerOptimizedSignalCheck();
    const totalTime = Date.now() - startTime;
    
    console.log(`[PerformanceMonitor] Total monitoring time: ${totalTime}ms`);
    console.log(`[PerformanceMonitor] Signals generated: ${result.signals_generated || 0}`);
    
    return {
      ...result,
      totalProcessingTime: totalTime,
      averageTimePerStrategy: result.processed_strategies?.length 
        ? Math.round(totalTime / result.processed_strategies.length)
        : 0
    };
  } catch (error) {
    console.error('[PerformanceMonitor] Error in performance monitoring:', error);
    throw error;
  }
};

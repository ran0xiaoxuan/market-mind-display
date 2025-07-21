
import { supabase } from "@/integrations/supabase/client";
import { 
  getUltraFastMonitoringStatus, 
  triggerUltraFastSignalCheck,
  isMarketOpenUltraFast,
  cleanupUltraFastCache,
  initializeUltraFastMonitoring,
  monitorUltraFastPerformance,
  getUltraFastPerformanceStats
} from "./ultraFastSignalMonitoringService";

export interface SignalMonitoringStatus {
  isActive: boolean;
  lastCheck: string | null;
  signalsGenerated: number;
  strategiesMonitored: number;
  processingTime?: number;
  avgTimePerStrategy?: number;
  cacheHitRate?: string;
  optimizationLevel?: string;
  error?: string;
}

// Use ultra-fast implementation as the main implementation
export const getSignalMonitoringStatus = async (): Promise<SignalMonitoringStatus> => {
  return await getUltraFastMonitoringStatus();
};

export const triggerManualSignalCheck = async () => {
  return await triggerUltraFastSignalCheck();
};

export const isMarketOpen = (): boolean => {
  return isMarketOpenUltraFast();
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
  return cleanupUltraFastCache();
};

// Initialize ultra-fast monitoring for maximum performance
export const initializeOptimizedMonitoring = async () => {
  console.log('[SignalMonitoring] Initializing ultra-fast monitoring...');
  
  try {
    await initializeUltraFastMonitoring();
    
    // Set up periodic performance monitoring
    setInterval(() => {
      cleanupUltraFastCache();
    }, 30000); // Clean up every 30 seconds
    
    // Performance monitoring every 5 minutes
    setInterval(() => {
      monitorUltraFastPerformance().catch(error => {
        console.error('[SignalMonitoring] Performance monitoring error:', error);
      });
    }, 300000); // Every 5 minutes
    
    console.log('[SignalMonitoring] Ultra-fast monitoring initialized');
  } catch (error) {
    console.error('[SignalMonitoring] Error initializing ultra-fast monitoring:', error);
  }
};

// Enhanced monitoring statistics
export const getMonitoringStats = () => {
  return {
    ultraFastStats: getUltraFastPerformanceStats(),
    lastCleanup: Date.now(),
    marketOpen: isMarketOpen(),
    optimizationLevel: 'ultra_fast'
  };
};

// Ultra-fast signal monitoring with advanced performance tracking
export const monitorSignalsWithPerformance = async () => {
  const startTime = Date.now();
  
  try {
    console.log('[UltraFastMonitor] Starting ultra-fast signal monitoring...');
    
    const result = await monitorUltraFastPerformance();
    const totalTime = Date.now() - startTime;
    
    console.log(`[UltraFastMonitor] Total monitoring time: ${totalTime}ms`);
    console.log(`[UltraFastMonitor] Performance grade: ${result.performance_grade}`);
    console.log(`[UltraFastMonitor] Signals generated: ${result.signals_generated || 0}`);
    
    return {
      ...result,
      totalProcessingTime: totalTime,
      performance_metrics: {
        response_time: totalTime,
        efficiency_score: Math.max(0, 100 - (totalTime / 100)), // Score out of 100
        optimization_level: 'ultra_fast',
        target_met: totalTime < 30000 // Target: under 30 seconds
      }
    };
  } catch (error) {
    console.error('[UltraFastMonitor] Error in ultra-fast monitoring:', error);
    throw error;
  }
};

// Real-time performance tracking
export const startRealTimePerformanceTracking = () => {
  console.log('[RealTimeTracking] Starting real-time performance tracking...');
  
  // Track performance every minute during market hours
  const trackingInterval = setInterval(() => {
    if (isMarketOpen()) {
      monitorSignalsWithPerformance().catch(error => {
        console.error('[RealTimeTracking] Tracking error:', error);
      });
    }
  }, 60000); // Every minute
  
  // Clean up tracking when market closes
  const marketCloseCheck = setInterval(() => {
    if (!isMarketOpen()) {
      clearInterval(trackingInterval);
      clearInterval(marketCloseCheck);
      console.log('[RealTimeTracking] Market closed, stopping real-time tracking');
    }
  }, 300000); // Check every 5 minutes
  
  return () => {
    clearInterval(trackingInterval);
    clearInterval(marketCloseCheck);
  };
};


import { supabase } from "@/integrations/supabase/client";
import { 
  generateSignalForStrategy as generateOptimizedSignalForStrategy,
  generateSignalsInBatch as generateSignalsForStrategiesBatch,
  triggerOptimizedSignalMonitoring,
  getSignalGenerationPerformance 
} from "./optimizedSignalGenerationService";

export interface SignalGenerationResult {
  signalGenerated: boolean;
  signalId?: string;
  reason?: string;
  matchedConditions?: string[];
  evaluationDetails?: string[];
  processingTime?: number;
}

// Use optimized implementation as the main implementation
export const generateSignalForStrategy = async (
  strategyId: string,
  userId: string
): Promise<SignalGenerationResult> => {
  const result = await generateOptimizedSignalForStrategy(strategyId, userId);
  
  // Convert to expected format
  return {
    signalGenerated: result.signalGenerated,
    signalId: result.signalId,
    reason: result.reason,
    matchedConditions: result.matchedConditions,
    evaluationDetails: result.evaluationDetails,
    processingTime: result.processingTime
  };
};

// Enhanced batch processing for multiple strategies
export const generateSignalsForMultipleStrategies = async (
  strategyIds: string[],
  userId: string
): Promise<Map<string, SignalGenerationResult>> => {
  const results = await generateSignalsForStrategiesBatch(strategyIds, userId);
  const convertedResults = new Map<string, SignalGenerationResult>();
  
  results.forEach((result, strategyId) => {
    convertedResults.set(strategyId, {
      signalGenerated: result.signalGenerated,
      signalId: result.signalId,
      reason: result.reason,
      matchedConditions: result.matchedConditions,
      evaluationDetails: result.evaluationDetails,
      processingTime: result.processingTime
    });
  });
  
  return convertedResults;
};

// Enhanced test signal generation with performance tracking
export const testSignalGeneration = async (strategyId: string) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    console.log(`[TestSignal] Testing OPTIMIZED signal generation for strategy: ${strategyId}`);
    
    const startTime = Date.now();
    const result = await generateOptimizedSignalForStrategy(strategyId, user.user.id);
    const testTime = Date.now() - startTime;
    
    console.log(`[TestSignal] Test completed in ${testTime}ms:`, result);
    
    // Verify signal accessibility if generated
    if (result.signalGenerated && result.signalId) {
      console.log(`[TestSignal] Verifying signal accessibility...`);
      
      const { data: signals, error: queryError } = await supabase
        .from('trading_signals')
        .select('*')
        .eq('strategy_id', strategyId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (queryError) {
        console.error('[TestSignal] Error querying signals:', queryError);
      } else if (signals && signals.length > 0) {
        console.log('[TestSignal] ✓ Signal is accessible via dashboard queries');
      } else {
        console.error('[TestSignal] ⚠️ Signal not found in dashboard queries');
      }
    }
    
    return {
      ...result,
      testProcessingTime: testTime
    };
  } catch (error) {
    console.error('[TestSignal] Error testing signal generation:', error);
    return {
      signalGenerated: false,
      reason: `Test error: ${error.message}`,
      processingTime: 0
    };
  }
};

// Use optimized monitoring trigger
export const triggerSignalMonitoring = async () => {
  return await triggerOptimizedSignalMonitoring();
};

// Enhanced performance monitoring
export const getSignalPerformanceMetrics = async (timeRange: string = '1h') => {
  return await getSignalGenerationPerformance(timeRange);
};

export const cleanupInvalidSignals = async () => {
  try {
    console.log('[SignalGen] Starting cleanup of invalid signals...');
    
    const { data: invalidSignals, error: fetchError } = await supabase
      .from('trading_signals')
      .select('id, strategy_id, signal_data')
      .is('signal_data->strategyId', null);

    if (fetchError) {
      console.error('[SignalGen] Error fetching invalid signals:', fetchError);
      return;
    }

    if (!invalidSignals || invalidSignals.length === 0) {
      console.log('[SignalGen] No invalid signals found');
      return;
    }

    console.log(`[SignalGen] Found ${invalidSignals.length} invalid signals to clean up`);

    const { error: deleteError } = await supabase
      .from('trading_signals')
      .delete()
      .in('id', invalidSignals.map(s => s.id));

    if (deleteError) {
      console.error('[SignalGen] Error deleting invalid signals:', deleteError);
      return;
    }

    console.log(`[SignalGen] Successfully cleaned up ${invalidSignals.length} invalid signals`);
  } catch (error) {
    console.error('[SignalGen] Error during signal cleanup:', error);
  }
};

// Add a function to force refresh dashboard data
export const refreshDashboardData = async () => {
  try {
    console.log('[RefreshDashboard] Forcing dashboard data refresh...');
    
    // Clean up any invalid signals first
    await cleanupInvalidSignals();
    
    // Trigger a fresh data fetch
    window.location.reload();
    
  } catch (error) {
    console.error('[RefreshDashboard] Error refreshing dashboard:', error);
  }
};


import { supabase } from "@/integrations/supabase/client";
import { getTradingRulesForStrategy } from "./strategyService";
import { batchGetCurrentPrices } from "./optimizedMarketDataService";
import { evaluateTradingRules } from "./tradingRuleEvaluationService";

export interface OptimizedSignalGenerationResult {
  signalGenerated: boolean;
  signalId?: string;
  reason?: string;
  matchedConditions?: string[];
  evaluationDetails?: string[];
  processingTime: number;
  cacheHits: number;
}

export interface StrategyBatch {
  strategies: any[];
  assets: string[];
  processingTime: number;
}

// Parallel signal generation for multiple strategies
export const generateSignalsForStrategiesBatch = async (
  strategyIds: string[],
  userId: string
): Promise<Map<string, OptimizedSignalGenerationResult>> => {
  const startTime = Date.now();
  const results = new Map<string, OptimizedSignalGenerationResult>();

  try {
    console.log(`[BatchSignalGen] Processing ${strategyIds.length} strategies in parallel`);

    // Fetch all strategies in parallel
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('*')
      .in('id', strategyIds)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (strategiesError || !strategies) {
      console.error('[BatchSignalGen] Error fetching strategies:', strategiesError);
      return results;
    }

    // Group strategies by asset for batch price fetching
    const assetGroups = new Map<string, any[]>();
    strategies.forEach(strategy => {
      if (!assetGroups.has(strategy.target_asset)) {
        assetGroups.set(strategy.target_asset, []);
      }
      assetGroups.get(strategy.target_asset)?.push(strategy);
    });

    // Batch fetch current prices for all unique assets
    const uniqueAssets = Array.from(assetGroups.keys()).filter(Boolean);
    console.log(`[BatchSignalGen] Fetching prices for ${uniqueAssets.length} unique assets`);
    
    const pricesMap = await batchGetCurrentPrices(uniqueAssets);
    
    // Check daily limits for all strategies in parallel
    const today = new Date().toISOString().split('T')[0];
    const { data: signalCounts } = await supabase
      .from('trading_signals')
      .select('strategy_id, id', { count: 'exact' })
      .in('strategy_id', strategyIds)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    const dailyCountsMap = new Map<string, number>();
    signalCounts?.forEach(signal => {
      const count = dailyCountsMap.get(signal.strategy_id) || 0;
      dailyCountsMap.set(signal.strategy_id, count + 1);
    });

    // Process all strategies in parallel
    const processingPromises = strategies.map(async (strategy) => {
      const strategyStartTime = Date.now();
      
      try {
        // Check daily limit
        const dailyCount = dailyCountsMap.get(strategy.id) || 0;
        const dailyLimit = strategy.daily_signal_limit || 5;
        
        if (dailyCount >= dailyLimit) {
          return {
            strategyId: strategy.id,
            result: {
              signalGenerated: false,
              reason: `Daily signal limit reached (${dailyCount}/${dailyLimit})`,
              processingTime: Date.now() - strategyStartTime,
              cacheHits: 1
            }
          };
        }

        // Get current price from batch
        const currentPrice = pricesMap.get(strategy.target_asset);
        if (!currentPrice) {
          return {
            strategyId: strategy.id,
            result: {
              signalGenerated: false,
              reason: `Failed to get current price for ${strategy.target_asset}`,
              processingTime: Date.now() - strategyStartTime,
              cacheHits: 0
            }
          };
        }

        // Get trading rules
        const rulesData = await getTradingRulesForStrategy(strategy.id);
        if (!rulesData || (!rulesData.entryRules?.length && !rulesData.exitRules?.length)) {
          return {
            strategyId: strategy.id,
            result: {
              signalGenerated: false,
              reason: 'No trading rules defined for this strategy',
              processingTime: Date.now() - strategyStartTime,
              cacheHits: 1
            }
          };
        }

        // Evaluate rules for entry signals
        let signalType: 'entry' | 'exit' | null = null;
        let evaluation = null;

        if (rulesData.entryRules?.length > 0) {
          evaluation = await evaluateTradingRules(
            rulesData.entryRules,
            strategy.target_asset,
            currentPrice,
            strategy.timeframe
          );

          if (evaluation.signalGenerated && evaluation.matchedConditions?.length > 0) {
            signalType = 'entry';
          }
        }

        // Check exit rules if no entry signal
        if (!signalType && rulesData.exitRules?.length > 0) {
          evaluation = await evaluateTradingRules(
            rulesData.exitRules,
            strategy.target_asset,
            currentPrice,
            strategy.timeframe
          );

          if (evaluation.signalGenerated && evaluation.matchedConditions?.length > 0) {
            signalType = 'exit';
          }
        }

        // Generate signal if conditions are met
        if (signalType && evaluation?.signalGenerated) {
          const signalData = {
            strategyId: strategy.id,
            strategyName: strategy.name,
            targetAsset: strategy.target_asset,
            targetAssetName: strategy.target_asset_name || strategy.target_asset,
            price: currentPrice,
            userId: userId,
            timestamp: new Date().toISOString(),
            timeframe: strategy.timeframe,
            signalType: signalType,
            reason: `${signalType.charAt(0).toUpperCase() + signalType.slice(1)} signal - conditions verified and met`,
            matchedConditions: evaluation.matchedConditions,
            evaluationDetails: evaluation.evaluationDetails,
            conditionsMetCount: evaluation.matchedConditions.length,
            marketPrice: currentPrice,
            dailySignalNumber: dailyCount + 1,
            conditionsMet: true,
            verifiedAt: new Date().toISOString(),
            processingTime: Date.now() - strategyStartTime
          };

          const { data: signal, error: signalError } = await supabase
            .from('trading_signals')
            .insert({
              strategy_id: strategy.id,
              signal_type: signalType,
              signal_data: signalData,
              processed: false
            })
            .select()
            .single();

          if (signalError || !signal) {
            return {
              strategyId: strategy.id,
              result: {
                signalGenerated: false,
                reason: `Failed to create signal in database: ${signalError?.message}`,
                processingTime: Date.now() - strategyStartTime,
                cacheHits: 1
              }
            };
          }

          return {
            strategyId: strategy.id,
            result: {
              signalGenerated: true,
              signalId: signal.id,
              reason: `${signalType.charAt(0).toUpperCase() + signalType.slice(1)} signal generated - conditions verified and met`,
              matchedConditions: evaluation.matchedConditions,
              evaluationDetails: evaluation.evaluationDetails,
              processingTime: Date.now() - strategyStartTime,
              cacheHits: 2
            }
          };
        }

        return {
          strategyId: strategy.id,
          result: {
            signalGenerated: false,
            reason: 'Market conditions do not meet trading rule criteria',
            evaluationDetails: evaluation?.evaluationDetails || [],
            processingTime: Date.now() - strategyStartTime,
            cacheHits: 1
          }
        };

      } catch (error) {
        console.error(`[BatchSignalGen] Error processing strategy ${strategy.id}:`, error);
        return {
          strategyId: strategy.id,
          result: {
            signalGenerated: false,
            reason: `Error during signal generation: ${error.message}`,
            processingTime: Date.now() - strategyStartTime,
            cacheHits: 0
          }
        };
      }
    });

    // Wait for all strategies to complete processing
    const processingResults = await Promise.all(processingPromises);
    
    // Collect results
    processingResults.forEach(({ strategyId, result }) => {
      results.set(strategyId, result);
    });

    const totalTime = Date.now() - startTime;
    console.log(`[BatchSignalGen] Completed processing ${strategies.length} strategies in ${totalTime}ms`);
    console.log(`[BatchSignalGen] Generated ${Array.from(results.values()).filter(r => r.signalGenerated).length} signals`);

  } catch (error) {
    console.error('[BatchSignalGen] Error in batch signal generation:', error);
  }

  return results;
};

// Optimized single strategy signal generation
export const generateOptimizedSignalForStrategy = async (
  strategyId: string,
  userId: string
): Promise<OptimizedSignalGenerationResult> => {
  const results = await generateSignalsForStrategiesBatch([strategyId], userId);
  return results.get(strategyId) || {
    signalGenerated: false,
    reason: 'Strategy not found in batch results',
    processingTime: 0,
    cacheHits: 0
  };
};

// Batch trigger for multiple strategies with performance monitoring
export const triggerOptimizedSignalMonitoring = async () => {
  const startTime = Date.now();
  
  try {
    console.log('[OptimizedTrigger] Starting optimized signal monitoring...');
    
    const { data, error } = await supabase.functions.invoke('monitor-trading-signals', {
      body: { 
        manual: true,
        source: 'optimized_batch_trigger',
        timestamp: new Date().toISOString(),
        optimized: true,
        parallel: true,
        performance_tracking: true
      }
    });
    
    const processingTime = Date.now() - startTime;

    if (error) {
      console.error('[OptimizedTrigger] Error:', error);
      return { 
        success: false, 
        error: error.message,
        processingTime
      };
    }

    console.log(`[OptimizedTrigger] Completed in ${processingTime}ms:`, data);
    
    return { 
      success: true, 
      data: {
        ...data,
        totalProcessingTime: processingTime,
        optimization: 'parallel_processing'
      }
    };
  } catch (error) {
    console.error('[OptimizedTrigger] Error in optimized monitoring:', error);
    return { 
      success: false, 
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
};

// Performance analytics for signal generation
export const getSignalGenerationPerformance = async (timeRange: string = '1h') => {
  try {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - 1);

    const { data: recentSignals, error } = await supabase
      .from('trading_signals')
      .select('created_at, signal_data')
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Performance] Error fetching signals:', error);
      return null;
    }

    const processingTimes = recentSignals
      ?.map(signal => signal.signal_data?.processingTime)
      .filter(time => typeof time === 'number') || [];

    const avgProcessingTime = processingTimes.length > 0 
      ? Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length)
      : 0;

    return {
      signalsGenerated: recentSignals?.length || 0,
      avgProcessingTime,
      minProcessingTime: processingTimes.length > 0 ? Math.min(...processingTimes) : 0,
      maxProcessingTime: processingTimes.length > 0 ? Math.max(...processingTimes) : 0,
      timeRange,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Performance] Error calculating performance:', error);
    return null;
  }
};

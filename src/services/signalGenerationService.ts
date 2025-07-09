
import { supabase } from "@/integrations/supabase/client";
import { getTradingRulesForStrategy } from "./strategyService";
import { getStockPrice } from "./marketDataService";
import { evaluateTradingRules } from "./tradingRuleEvaluationService";

export interface SignalGenerationResult {
  signalGenerated: boolean;
  signalId?: string;
  reason?: string;
  matchedConditions?: string[];
  evaluationDetails?: string[];
}

export const generateSignalForStrategy = async (
  strategyId: string,
  userId: string
): Promise<SignalGenerationResult> => {
  try {
    console.log(`[SignalGen] Starting signal generation for strategy: ${strategyId}`);

    // Get strategy details
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', strategyId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (strategyError || !strategy) {
      console.error('[SignalGen] Strategy not found or inactive:', strategyError);
      return {
        signalGenerated: false,
        reason: 'Strategy not found or inactive'
      };
    }

    console.log(`[SignalGen] Found strategy: ${strategy.name} for asset ${strategy.target_asset}`);

    // Check daily signal limit
    const today = new Date().toISOString().split('T')[0];
    const { data: signalCount } = await supabase
      .from('trading_signals')
      .select('id', { count: 'exact' })
      .eq('strategy_id', strategyId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    const dailyLimit = strategy.daily_signal_limit || 5;
    if (signalCount && signalCount.length >= dailyLimit) {
      console.log(`[SignalGen] Daily signal limit reached: ${signalCount.length}/${dailyLimit}`);
      return {
        signalGenerated: false,
        reason: `Daily signal limit reached (${signalCount.length}/${dailyLimit})`
      };
    }

    // Get current market price with enhanced error handling
    let currentPrice;
    try {
      const priceData = await getStockPrice(strategy.target_asset);
      if (!priceData) {
        console.error(`[SignalGen] Failed to get current price for ${strategy.target_asset}`);
        return {
          signalGenerated: false,
          reason: `Failed to get current price for ${strategy.target_asset}`
        };
      }
      currentPrice = priceData.price;
      console.log(`[SignalGen] Current price for ${strategy.target_asset}: $${currentPrice}`);
    } catch (error) {
      console.error(`[SignalGen] Error fetching price for ${strategy.target_asset}:`, error);
      return {
        signalGenerated: false,
        reason: `Error fetching market data: ${error.message}`
      };
    }

    // Get trading rules for the strategy with improved error handling
    let rulesData;
    try {
      rulesData = await getTradingRulesForStrategy(strategyId);
      if (!rulesData || (!rulesData.entryRules?.length && !rulesData.exitRules?.length)) {
        console.log(`[SignalGen] No trading rules found for strategy ${strategyId}`);
        return {
          signalGenerated: false,
          reason: 'No trading rules defined for this strategy'
        };
      }
    } catch (error) {
      console.error(`[SignalGen] Error fetching trading rules:`, error);
      return {
        signalGenerated: false,
        reason: `Error fetching trading rules: ${error.message}`
      };
    }

    console.log(`[SignalGen] Found ${rulesData.entryRules?.length || 0} entry rule groups and ${rulesData.exitRules?.length || 0} exit rule groups`);

    // Evaluate entry rules first
    let signalType: 'entry' | 'exit' | null = null;
    let evaluation = null;

    if (rulesData.entryRules?.length > 0) {
      console.log('[SignalGen] Evaluating entry rules...');
      try {
        evaluation = await evaluateTradingRules(
          rulesData.entryRules,
          strategy.target_asset,
          currentPrice,
          strategy.timeframe
        );

        console.log(`[SignalGen] Entry rules evaluation result:`, evaluation);

        if (evaluation.signalGenerated) {
          signalType = 'entry';
          console.log('[SignalGen] ✓ Entry signal conditions met!');
        } else {
          console.log('[SignalGen] ✗ Entry signal conditions not met');
        }
      } catch (error) {
        console.error(`[SignalGen] Error evaluating entry rules:`, error);
        return {
          signalGenerated: false,
          reason: `Error evaluating entry rules: ${error.message}`
        };
      }
    }

    // If no entry signal, check exit rules
    if (!signalType && rulesData.exitRules?.length > 0) {
      console.log('[SignalGen] Evaluating exit rules...');
      try {
        evaluation = await evaluateTradingRules(
          rulesData.exitRules,
          strategy.target_asset,
          currentPrice,
          strategy.timeframe
        );

        console.log(`[SignalGen] Exit rules evaluation result:`, evaluation);

        if (evaluation.signalGenerated) {
          signalType = 'exit';
          console.log('[SignalGen] ✓ Exit signal conditions met!');
        } else {
          console.log('[SignalGen] ✗ Exit signal conditions not met');
        }
      } catch (error) {
        console.error(`[SignalGen] Error evaluating exit rules:`, error);
        return {
          signalGenerated: false,
          reason: `Error evaluating exit rules: ${error.message}`
        };
      }
    }

    // If no signal conditions are met, return early with detailed info
    if (!signalType || !evaluation?.signalGenerated) {
      console.log(`[SignalGen] No signal generated for strategy: ${strategyId}`);
      console.log(`[SignalGen] Evaluation details:`, evaluation?.evaluationDetails);
      return {
        signalGenerated: false,
        reason: 'Market conditions do not meet trading rule criteria',
        evaluationDetails: evaluation?.evaluationDetails || []
      };
    }

    // Create signal data with enhanced information
    const signalData = {
      strategyId: strategyId,
      strategyName: strategy.name,
      targetAsset: strategy.target_asset,
      price: currentPrice,
      userId: userId,
      timestamp: new Date().toISOString(),
      timeframe: strategy.timeframe,
      signalType: signalType,
      reason: `${signalType.charAt(0).toUpperCase() + signalType.slice(1)} signal generated - conditions met`,
      matchedConditions: evaluation.matchedConditions,
      evaluationDetails: evaluation.evaluationDetails,
      conditionsMetCount: evaluation.matchedConditions.length
    };

    // Insert the signal into database
    const { data: signal, error: signalError } = await supabase
      .from('trading_signals')
      .insert({
        strategy_id: strategyId,
        signal_type: signalType,
        signal_data: signalData,
        processed: false
      })
      .select()
      .single();

    if (signalError) {
      console.error('[SignalGen] Error creating signal:', signalError);
      return {
        signalGenerated: false,
        reason: `Failed to create signal: ${signalError.message}`
      };
    }

    console.log(`[SignalGen] ✓ ${signalType} signal generated successfully:`, signal.id);
    console.log(`[SignalGen] Signal matched ${evaluation.matchedConditions.length} conditions`);

    return {
      signalGenerated: true,
      signalId: signal.id,
      reason: `${signalType.charAt(0).toUpperCase() + signalType.slice(1)} signal generated - all required conditions met`,
      matchedConditions: evaluation.matchedConditions,
      evaluationDetails: evaluation.evaluationDetails
    };

  } catch (error) {
    console.error('[SignalGen] Error in generateSignalForStrategy:', error);
    return {
      signalGenerated: false,
      reason: `Error during signal generation: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Enhanced function to test signal generation manually
export const testSignalGeneration = async (strategyId: string) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    console.log(`[TestSignal] Testing signal generation for strategy: ${strategyId}`);
    
    const result = await generateSignalForStrategy(strategyId, user.user.id);
    
    console.log(`[TestSignal] Test result:`, result);
    
    return result;
  } catch (error) {
    console.error('[TestSignal] Error testing signal generation:', error);
    return {
      signalGenerated: false,
      reason: `Test error: ${error.message}`
    };
  }
};

// Function to manually trigger signal monitoring
export const triggerSignalMonitoring = async () => {
  try {
    console.log('[TriggerMonitor] Manually triggering signal monitoring...');
    
    const { data, error } = await supabase.functions.invoke('monitor-trading-signals', {
      body: { 
        manual: true,
        source: 'manual_trigger',
        timestamp: new Date().toISOString()
      }
    });
    
    if (error) {
      console.error('[TriggerMonitor] Error triggering monitoring:', error);
      return { success: false, error: error.message };
    }
    
    console.log('[TriggerMonitor] Monitoring triggered successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[TriggerMonitor] Error in triggerSignalMonitoring:', error);
    return { success: false, error: error.message };
  }
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

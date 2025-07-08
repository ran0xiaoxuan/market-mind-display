
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
    console.log(`Starting signal generation for strategy: ${strategyId}`);

    // Get strategy details
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', strategyId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (strategyError || !strategy) {
      console.error('Strategy not found or inactive:', strategyError);
      return {
        signalGenerated: false,
        reason: 'Strategy not found or inactive'
      };
    }

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
      console.log(`Daily signal limit reached for strategy ${strategyId}: ${signalCount.length}/${dailyLimit}`);
      return {
        signalGenerated: false,
        reason: `Daily signal limit reached (${signalCount.length}/${dailyLimit})`
      };
    }

    // Get current market price
    const currentPrice = await getStockPrice(strategy.target_asset);
    if (!currentPrice) {
      console.error(`Failed to get current price for ${strategy.target_asset}`);
      return {
        signalGenerated: false,
        reason: `Failed to get current price for ${strategy.target_asset}`
      };
    }

    console.log(`Current price for ${strategy.target_asset}: $${currentPrice.price}`);

    // Get trading rules for the strategy
    const rulesData = await getTradingRulesForStrategy(strategyId);
    if (!rulesData || (!rulesData.entryRules?.length && !rulesData.exitRules?.length)) {
      console.log(`No trading rules found for strategy ${strategyId}`);
      return {
        signalGenerated: false,
        reason: 'No trading rules defined for this strategy'
      };
    }

    // Evaluate entry rules first
    let signalType: 'entry' | 'exit' | null = null;
    let evaluation = null;

    if (rulesData.entryRules?.length > 0) {
      console.log('Evaluating entry rules...');
      evaluation = await evaluateTradingRules(
        rulesData.entryRules,
        strategy.target_asset,
        currentPrice.price,
        strategy.timeframe
      );

      if (evaluation.signalGenerated) {
        signalType = 'entry';
        console.log('Entry signal conditions met!');
      }
    }

    // If no entry signal, check exit rules
    if (!signalType && rulesData.exitRules?.length > 0) {
      console.log('Evaluating exit rules...');
      evaluation = await evaluateTradingRules(
        rulesData.exitRules,
        strategy.target_asset,
        currentPrice.price,
        strategy.timeframe
      );

      if (evaluation.signalGenerated) {
        signalType = 'exit';
        console.log('Exit signal conditions met!');
      }
    }

    // If no signal conditions are met, return early
    if (!signalType || !evaluation?.signalGenerated) {
      console.log('No signal conditions met for strategy:', strategyId);
      return {
        signalGenerated: false,
        reason: 'Market conditions do not meet trading rule criteria',
        evaluationDetails: evaluation?.evaluationDetails || []
      };
    }

    // Create signal data
    const signalData = {
      strategyId: strategyId,
      strategyName: strategy.name,
      targetAsset: strategy.target_asset,
      price: currentPrice.price,
      userId: userId,
      timestamp: new Date().toISOString(),
      reason: `${signalType.charAt(0).toUpperCase() + signalType.slice(1)} signal generated`,
      matchedConditions: evaluation.matchedConditions,
      evaluationDetails: evaluation.evaluationDetails
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
      console.error('Error creating signal:', signalError);
      return {
        signalGenerated: false,
        reason: `Failed to create signal: ${signalError.message}`
      };
    }

    console.log(`${signalType} signal generated successfully:`, signal.id);

    return {
      signalGenerated: true,
      signalId: signal.id,
      reason: `${signalType.charAt(0).toUpperCase() + signalType.slice(1)} signal generated based on rule evaluation`,
      matchedConditions: evaluation.matchedConditions,
      evaluationDetails: evaluation.evaluationDetails
    };

  } catch (error) {
    console.error('Error in generateSignalForStrategy:', error);
    return {
      signalGenerated: false,
      reason: `Error during signal generation: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

export const cleanupInvalidSignals = async () => {
  try {
    console.log('Starting cleanup of invalid signals...');
    
    const { data: invalidSignals, error: fetchError } = await supabase
      .from('trading_signals')
      .select('id, strategy_id, signal_data')
      .is('signal_data->strategyId', null);

    if (fetchError) {
      console.error('Error fetching invalid signals:', fetchError);
      return;
    }

    if (!invalidSignals || invalidSignals.length === 0) {
      console.log('No invalid signals found');
      return;
    }

    console.log(`Found ${invalidSignals.length} invalid signals to clean up`);

    const { error: deleteError } = await supabase
      .from('trading_signals')
      .delete()
      .in('id', invalidSignals.map(s => s.id));

    if (deleteError) {
      console.error('Error deleting invalid signals:', deleteError);
      return;
    }

    console.log(`Successfully cleaned up ${invalidSignals.length} invalid signals`);
  } catch (error) {
    console.error('Error during signal cleanup:', error);
  }
};

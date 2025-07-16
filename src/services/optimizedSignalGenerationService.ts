import { supabase } from "@/integrations/supabase/client";
import { evaluateRuleGroup } from "./tradingRuleEvaluationService";
import { fetchMarketDataWithCache } from "./optimizedMarketDataService";

interface SignalGenerationResult {
  signalGenerated: boolean;
  signalId?: string;
  reason?: string;
  matchedConditions?: string[];
  evaluationDetails?: string[];
  processingTime: number;
  cacheHits?: number;
  testProcessingTime?: number;
}

interface Strategy {
  id: string;
  name: string;
  target_asset: string;
  timeframe: string;
  user_id: string;
  is_active: boolean;
  signal_notifications_enabled: boolean;
  rule_groups: Array<{
    id: string;
    rule_type: string;
    logic: string;
    required_conditions: number | null;
    trading_rules: Array<{
      id: string;
      left_type: string;
      left_indicator: string | null;
      left_parameters: any;
      left_value: string | null;
      condition: string;
      right_type: string;
      right_indicator: string | null;
      right_parameters: any;
      right_value: string | null;
    }>;
  }>;
}

interface BatchSignalResult {
  strategyId: string;
  success: boolean;
  result?: SignalGenerationResult;
  error?: string;
  processingTime: number;
}

// Helper function to format conditions
function formatConditions(conditions: any[]): string[] {
  return conditions.map(condition => {
    return `Condition: ${condition.condition}, Left: ${condition.left_indicator || condition.left_value}, Right: ${condition.right_indicator || condition.right_value}`;
  });
}

// Helper function to log signal details
function logSignalDetails(strategy: Strategy, result: SignalGenerationResult) {
  console.log(`Signal Details for Strategy ${strategy.name} (${strategy.id}):`);
  console.log(`  Signal Generated: ${result.signalGenerated}`);
  if (result.reason) console.log(`  Reason: ${result.reason}`);
  if (result.matchedConditions) console.log(`  Matched Conditions: ${result.matchedConditions.join(', ')}`);
  console.log(`  Processing Time: ${result.processingTime}ms`);
}

export async function generateSignalForStrategy(
  strategy: Strategy,
  marketData: any,
  testMode: boolean = false
): Promise<SignalGenerationResult> {
  const startTime = Date.now();
  
  try {
    console.log(`Generating signal for strategy: ${strategy.name} (${strategy.id})`);
    
    // Check if strategy is active
    if (!strategy.is_active) {
      return {
        signalGenerated: false,
        reason: "Strategy is not active",
        processingTime: Date.now() - startTime
      };
    }

    // Get entry and exit rule groups
    const entryGroups = strategy.rule_groups.filter(g => g.rule_type === 'entry');
    const exitGroups = strategy.rule_groups.filter(g => g.rule_type === 'exit');

    if (entryGroups.length === 0) {
      return {
        signalGenerated: false,
        reason: "No entry rules defined",
        processingTime: Date.now() - startTime
      };
    }

    // Evaluate entry conditions
    const entryResults = await Promise.all(
      entryGroups.map(group => evaluateRuleGroup(group, marketData, strategy.target_asset))
    );

    const entryConditionMet = entryResults.some(result => result.conditionMet);

    if (!entryConditionMet) {
      return {
        signalGenerated: false,
        reason: "Entry conditions not met",
        processingTime: Date.now() - startTime
      };
    }

    // If we have exit rules, check them too
    let exitConditionMet = false;
    if (exitGroups.length > 0) {
      const exitResults = await Promise.all(
        exitGroups.map(group => evaluateRuleGroup(group, marketData, strategy.target_asset))
      );
      exitConditionMet = exitResults.some(result => result.conditionMet);
    }

    // Determine signal type
    const signalType = exitConditionMet ? 'exit' : 'entry';

    // Create signal data with proper typing
    const signalData = {
      strategy_id: strategy.id,
      signal_type: signalType,
      target_asset: strategy.target_asset,
      timestamp: new Date().toISOString(),
      conditions_met: entryResults.filter(r => r.conditionMet).map(r => r.details).flat(),
      market_data: marketData,
      processingTime: Date.now() - startTime
    };

    if (testMode) {
      // For test mode, don't save to database
      return {
        signalGenerated: true,
        signalId: `test-${Date.now()}`,
        reason: `${signalType} signal generated (test mode)`,
        matchedConditions: signalData.conditions_met,
        processingTime: Date.now() - startTime,
        testProcessingTime: Date.now() - startTime
      };
    }

    // Save signal to database
    const { data: signal, error } = await supabase
      .from('trading_signals')
      .insert({
        strategy_id: strategy.id,
        signal_type: signalType,
        signal_data: signalData
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving signal:', error);
      return {
        signalGenerated: false,
        reason: `Error saving signal: ${error.message}`,
        processingTime: Date.now() - startTime
      };
    }

    return {
      signalGenerated: true,
      signalId: signal.id,
      reason: `${signalType} signal generated successfully`,
      matchedConditions: signalData.conditions_met,
      processingTime: Date.now() - startTime
    };

  } catch (error) {
    console.error('Error in generateSignalForStrategy:', error);
    return {
      signalGenerated: false,
      reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      processingTime: Date.now() - startTime
    };
  }
}

export async function generateSignalsInBatch(
  strategies: Strategy[],
  testMode: boolean = false
): Promise<BatchSignalResult[]> {
  const batchStartTime = Date.now();
  console.log(`Starting batch signal generation for ${strategies.length} strategies`);

  // Process strategies in parallel with concurrency limit
  const concurrencyLimit = 5;
  const results: BatchSignalResult[] = [];

  for (let i = 0; i < strategies.length; i += concurrencyLimit) {
    const batch = strategies.slice(i, i + concurrencyLimit);
    
    const batchPromises = batch.map(async (strategy) => {
      const startTime = Date.now();
      try {
        // Fetch market data for this strategy
        const marketData = await fetchMarketDataWithCache(
          strategy.target_asset,
          strategy.timeframe,
          300 // 5 minute cache
        );

        if (!marketData) {
          return {
            strategyId: strategy.id,
            success: false,
            error: 'Failed to fetch market data',
            processingTime: Date.now() - startTime
          };
        }

        const result = await generateSignalForStrategy(strategy, marketData, testMode);
        
        return {
          strategyId: strategy.id,
          success: true,
          result,
          processingTime: Date.now() - startTime
        };
      } catch (error) {
        return {
          strategyId: strategy.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime: Date.now() - startTime
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  const totalTime = Date.now() - batchStartTime;
  console.log(`Batch signal generation completed in ${totalTime}ms`);

  return results;
}


import { supabase } from "@/integrations/supabase/client";
import { getStockPrice } from "./marketDataService";

export interface TradingSignal {
  id: string;
  strategy_id: string;
  signal_type: 'entry' | 'exit';
  signal_data: {
    reason: string;
    price: number;
    timestamp: string;
    profit?: number;
    profitPercentage?: number;
    indicators?: Record<string, number>;
  };
  created_at: string;
  processed: boolean;
}

export const evaluateStrategy = async (strategyId: string) => {
  console.log(`Evaluating strategy ${strategyId}`);
  
  try {
    // Get strategy details
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', strategyId)
      .eq('is_active', true)
      .single();

    if (strategyError || !strategy) {
      console.log(`Strategy ${strategyId} not found or inactive`);
      return;
    }

    // Get trading rules for this strategy
    const { data: ruleGroups, error: rulesError } = await supabase
      .from('rule_groups')
      .select(`
        id,
        rule_type,
        logic,
        required_conditions,
        trading_rules (
          id,
          left_type,
          left_indicator,
          left_parameters,
          condition,
          right_type,
          right_value,
          right_value_type,
          explanation
        )
      `)
      .eq('strategy_id', strategyId)
      .order('group_order');

    if (rulesError || !ruleGroups || ruleGroups.length === 0) {
      console.log(`No trading rules found for strategy ${strategyId}`);
      return;
    }

    // Get current market data
    let currentPrice = 0;
    let indicators: Record<string, number> = {};

    try {
      // Try to get real price data
      const priceData = await getStockPrice(strategy.target_asset);
      if (priceData) {
        currentPrice = priceData.price;
      }

      // Generate realistic RSI with better logic
      indicators.rsi = generateRealisticRSI(currentPrice, strategy.target_asset);
      console.log(`Generated RSI for ${strategy.target_asset}: ${indicators.rsi}`);
    } catch (error) {
      console.warn('Market data fetch failed, using simulated data:', error);
      // Use simulated data with realistic ranges
      currentPrice = getBasePriceForSymbol(strategy.target_asset);
      indicators.rsi = generateRealisticRSI(currentPrice, strategy.target_asset);
    }

    // Evaluate entry and exit rules
    const entryRules = ruleGroups.filter(group => group.rule_type === 'entry');
    const exitRules = ruleGroups.filter(group => group.rule_type === 'exit');

    // Check for entry signals
    if (await shouldGenerateEntrySignal(entryRules, indicators, currentPrice)) {
      await generateTradingSignal(strategyId, 'entry', {
        reason: 'Entry conditions met',
        price: currentPrice,
        timestamp: new Date().toISOString(),
        indicators
      });
    }

    // Check for exit signals
    if (await shouldGenerateExitSignal(exitRules, indicators, currentPrice, strategyId)) {
      await generateTradingSignal(strategyId, 'exit', {
        reason: 'Exit conditions met',
        price: currentPrice,
        timestamp: new Date().toISOString(),
        indicators
      });
    }

  } catch (error) {
    console.error(`Error evaluating strategy ${strategyId}:`, error);
  }
};

const getBasePriceForSymbol = (symbol: string): number => {
  // Realistic base prices for common symbols
  const basePrices: Record<string, number> = {
    'AAPL': 175,
    'GOOGL': 140,
    'MSFT': 350,
    'AMZN': 145,
    'TSLA': 200,
    'NVDA': 450,
    'META': 300,
    'NFLX': 400,
    'SPY': 450,
    'QQQ': 380,
    'TQQQ': 77,
  };

  return basePrices[symbol.toUpperCase()] || 150;
};

const generateRealisticRSI = (price: number, symbol: string): number => {
  // Generate more realistic RSI values based on price movements and symbol
  const baseRSI = symbol === 'TQQQ' ? 45 : 50;
  const variation = (Math.random() - 0.5) * 30;
  const priceInfluence = (price % 10) * 1.5;
  const rsi = baseRSI + variation + priceInfluence;
  
  return Math.min(Math.max(rsi, 10), 90);
};

const shouldGenerateEntrySignal = async (
  entryRules: any[], 
  indicators: Record<string, number>, 
  currentPrice: number
): Promise<boolean> => {
  if (!entryRules.length) return false;

  for (const group of entryRules) {
    if (await evaluateRuleGroup(group, indicators, currentPrice)) {
      return true;
    }
  }
  return false;
};

const shouldGenerateExitSignal = async (
  exitRules: any[], 
  indicators: Record<string, number>, 
  currentPrice: number,
  strategyId: string
): Promise<boolean> => {
  if (!exitRules.length) return false;

  // Check if there are open positions first
  const { data: openPositions } = await supabase
    .from('trading_signals')
    .select('*')
    .eq('strategy_id', strategyId)
    .eq('signal_type', 'entry')
    .eq('processed', true);

  if (!openPositions || openPositions.length === 0) {
    return false;
  }

  for (const group of exitRules) {
    if (await evaluateRuleGroup(group, indicators, currentPrice)) {
      return true;
    }
  }
  return false;
};

const evaluateRuleGroup = async (
  group: any, 
  indicators: Record<string, number>, 
  currentPrice: number
): Promise<boolean> => {
  const rules = group.trading_rules || [];
  if (!rules.length) return false;

  const results: boolean[] = [];

  for (const rule of rules) {
    const result = evaluateRule(rule, indicators, currentPrice);
    results.push(result);
  }

  // Apply group logic
  if (group.logic === 'AND') {
    return results.every(result => result);
  } else if (group.logic === 'OR') {
    const requiredConditions = group.required_conditions || 1;
    const trueCount = results.filter(result => result).length;
    return trueCount >= requiredConditions;
  }

  return false;
};

const evaluateRule = (
  rule: any, 
  indicators: Record<string, number>, 
  currentPrice: number
): boolean => {
  try {
    let leftValue: number = 0;
    let rightValue: number = 0;

    // Get left side value
    if (rule.left_type === 'indicator') {
      leftValue = indicators[rule.left_indicator?.toLowerCase()] || 0;
    } else if (rule.left_type === 'price') {
      leftValue = currentPrice;
    }

    // Get right side value
    if (rule.right_type === 'value') {
      rightValue = parseFloat(rule.right_value) || 0;
    } else if (rule.right_type === 'indicator') {
      rightValue = indicators[rule.right_indicator?.toLowerCase()] || 0;
    }

    // Evaluate condition
    switch (rule.condition) {
      case '>':
        return leftValue > rightValue;
      case '<':
        return leftValue < rightValue;
      case '>=':
        return leftValue >= rightValue;
      case '<=':
        return leftValue <= rightValue;
      case '==':
        return Math.abs(leftValue - rightValue) < 0.01;
      default:
        return false;
    }
  } catch (error) {
    console.error('Error evaluating rule:', error);
    return false;
  }
};

const generateTradingSignal = async (
  strategyId: string,
  signalType: 'entry' | 'exit',
  signalData: any
) => {
  try {
    // Calculate profit for exit signals
    if (signalType === 'exit') {
      const profitData = await calculateExitProfit(strategyId, signalData.price);
      if (profitData) {
        signalData.profit = profitData.profit;
        signalData.profitPercentage = profitData.profitPercentage;
      }
    }

    const { error } = await supabase
      .from('trading_signals')
      .insert({
        strategy_id: strategyId,
        signal_type: signalType,
        signal_data: signalData,
        processed: true
      });

    if (error) {
      console.error('Error inserting trading signal:', error);
    } else {
      console.log(`Generated ${signalType} signal for strategy ${strategyId}`);
    }
  } catch (error) {
    console.error('Error generating trading signal:', error);
  }
};

const calculateExitProfit = async (strategyId: string, exitPrice: number) => {
  try {
    // Get the most recent entry signal
    const { data: entrySignal } = await supabase
      .from('trading_signals')
      .select('*')
      .eq('strategy_id', strategyId)
      .eq('signal_type', 'entry')
      .eq('processed', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!entrySignal) return null;

    const entryData = entrySignal.signal_data as any;
    const entryPrice = entryData.price || 0;

    if (entryPrice > 0) {
      const profitPercentage = ((exitPrice - entryPrice) / entryPrice) * 100;
      // Use a default volume for profit calculation since we removed volume from signals
      const defaultVolume = 100;
      const profit = profitPercentage / 100 * entryPrice * defaultVolume;

      return {
        profit: Math.round(profit * 100) / 100,
        profitPercentage: Math.round(profitPercentage * 100) / 100
      };
    }

    return null;
  } catch (error) {
    console.error('Error calculating exit profit:', error);
    return null;
  }
};

export const cleanupInvalidSignals = async () => {
  try {
    console.log('Starting cleanup of invalid signals...');

    // First get all valid strategy IDs
    const { data: validStrategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('id');

    if (strategiesError) {
      console.error('Error fetching valid strategies:', strategiesError);
      throw strategiesError;
    }

    if (!validStrategies || validStrategies.length === 0) {
      console.log('No valid strategies found, skipping cleanup');
      return;
    }

    const validStrategyIds = validStrategies.map(s => s.id);

    // Delete signals that don't have valid strategy references
    const { error: deleteError } = await supabase
      .from('trading_signals')
      .delete()
      .not('strategy_id', 'in', `(${validStrategyIds.join(',')})`);

    if (deleteError) {
      console.error('Error cleaning up invalid signals:', deleteError);
      throw deleteError;
    }

    console.log('Invalid signals cleanup completed');
  } catch (error) {
    console.error('Cleanup failed:', error);
    throw error;
  }
};

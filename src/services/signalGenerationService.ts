
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
    marketData?: {
      change: number;
      changePercent: number;
      volume: number;
    };
  };
  created_at: string;
  processed: boolean;
}

// Get real technical indicators from FMP API
const getRealTechnicalIndicators = async (symbol: string): Promise<Record<string, number> | null> => {
  try {
    console.log(`Fetching real technical indicators for ${symbol}`);
    
    // Get FMP API key
    const { data, error } = await supabase.functions.invoke('get-fmp-key');
    if (error || !data?.key) {
      console.warn('FMP API key not available for technical indicators');
      return null;
    }

    const apiKey = data.key;
    
    // Fetch RSI (14-period)
    const rsiResponse = await fetch(
      `https://financialmodelingprep.com/api/v3/technical_indicator/1min/${symbol}?period=14&type=rsi&apikey=${apiKey}`
    );
    
    let indicators: Record<string, number> = {};
    
    if (rsiResponse.ok) {
      const rsiData = await rsiResponse.json();
      if (Array.isArray(rsiData) && rsiData.length > 0) {
        indicators.rsi = rsiData[0].rsi;
        console.log(`Real RSI for ${symbol}: ${indicators.rsi}`);
      }
    }
    
    // Fetch SMA (Simple Moving Average)
    try {
      const smaResponse = await fetch(
        `https://financialmodelingprep.com/api/v3/technical_indicator/1min/${symbol}?period=20&type=sma&apikey=${apiKey}`
      );
      
      if (smaResponse.ok) {
        const smaData = await smaResponse.json();
        if (Array.isArray(smaData) && smaData.length > 0) {
          indicators.sma = smaData[0].sma;
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch SMA for ${symbol}:`, error);
    }
    
    // Fetch EMA (Exponential Moving Average)
    try {
      const emaResponse = await fetch(
        `https://financialmodelingprep.com/api/v3/technical_indicator/1min/${symbol}?period=20&type=ema&apikey=${apiKey}`
      );
      
      if (emaResponse.ok) {
        const emaData = await emaResponse.json();
        if (Array.isArray(emaData) && emaData.length > 0) {
          indicators.ema = emaData[0].ema;
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch EMA for ${symbol}:`, error);
    }
    
    return Object.keys(indicators).length > 0 ? indicators : null;
    
  } catch (error) {
    console.error(`Error fetching real technical indicators for ${symbol}:`, error);
    return null;
  }
};

export const evaluateStrategy = async (strategyId: string) => {
  console.log(`Evaluating strategy ${strategyId} with REAL market data`);
  
  try {
    // Get strategy details
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', strategyId)
      .single();

    if (strategyError || !strategy) {
      console.log(`Strategy ${strategyId} not found`);
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

    // Get REAL current market data - no fallbacks to simulated data
    let priceData;
    let indicators: Record<string, number> = {};

    try {
      // Get real price data
      priceData = await getStockPrice(strategy.target_asset);
      if (!priceData || priceData.price === 0) {
        console.warn(`No real price data available for ${strategy.target_asset}, skipping signal generation`);
        return; // Don't generate signals without real data
      }

      // Get real technical indicators
      const realIndicators = await getRealTechnicalIndicators(strategy.target_asset);
      if (realIndicators) {
        indicators = { ...realIndicators };
      } else {
        console.warn(`No real technical indicators available for ${strategy.target_asset}, skipping signal generation`);
        return; // Don't generate signals without real indicators
      }

      console.log(`Real market data for ${strategy.target_asset}:`, {
        price: priceData.price,
        change: priceData.change,
        changePercent: priceData.changePercent,
        indicators: indicators
      });

    } catch (error) {
      console.error(`Failed to get real market data for ${strategy.target_asset}:`, error);
      return; // Don't generate signals without real data
    }

    const currentPrice = priceData.price;

    // Evaluate entry and exit rules with REAL data only
    const entryRules = ruleGroups.filter(group => group.rule_type === 'entry');
    const exitRules = ruleGroups.filter(group => group.rule_type === 'exit');

    // Check for entry signals with real data
    if (await shouldGenerateEntrySignal(entryRules, indicators, currentPrice)) {
      const entryReason = `Entry conditions met with REAL data - RSI: ${indicators.rsi?.toFixed(2) || 'N/A'}, Price: $${currentPrice.toFixed(2)}`;
      
      await generateTradingSignal(strategyId, 'entry', {
        reason: entryReason,
        price: currentPrice,
        timestamp: new Date().toISOString(),
        indicators,
        marketData: {
          change: priceData.change,
          changePercent: priceData.changePercent,
          volume: 0 // Volume not available in current price data structure
        }
      });
    }

    // Check for exit signals with real data
    if (await shouldGenerateExitSignal(exitRules, indicators, currentPrice, strategyId)) {
      const exitReason = `Exit conditions met with REAL data - RSI: ${indicators.rsi?.toFixed(2) || 'N/A'}, Price: $${currentPrice.toFixed(2)}`;
      
      await generateTradingSignal(strategyId, 'exit', {
        reason: exitReason,
        price: currentPrice,
        timestamp: new Date().toISOString(),
        indicators,
        marketData: {
          change: priceData.change,
          changePercent: priceData.changePercent,
          volume: 0
        }
      });
    }

  } catch (error) {
    console.error(`Error evaluating strategy ${strategyId} with real data:`, error);
  }
};

const shouldGenerateEntrySignal = async (
  entryRules: any[], 
  indicators: Record<string, number>, 
  currentPrice: number
): Promise<boolean> => {
  if (!entryRules.length) return false;

  // Require real RSI data for entry signals
  if (!indicators.rsi || indicators.rsi === 0) {
    console.log('No real RSI data available, skipping entry signal generation');
    return false;
  }

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
    .eq('processed', true)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!openPositions || openPositions.length === 0) {
    return false;
  }

  // Require real RSI data for exit signals
  if (!indicators.rsi || indicators.rsi === 0) {
    console.log('No real RSI data available, skipping exit signal generation');
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
    
    console.log(`REAL DATA Rule evaluation: ${rule.left_indicator || rule.left_type} ${rule.condition} ${rule.right_value} = ${result}`);
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
      const indicatorKey = rule.left_indicator?.toLowerCase();
      leftValue = indicators[indicatorKey] || 0;
      
      // Don't evaluate rules with missing real indicator data
      if (leftValue === 0 && indicatorKey === 'rsi') {
        console.warn(`Missing real ${indicatorKey} data for rule evaluation`);
        return false;
      }
    } else if (rule.left_type === 'price') {
      leftValue = currentPrice;
    }

    // Get right side value
    if (rule.right_type === 'value') {
      rightValue = parseFloat(rule.right_value) || 0;
    } else if (rule.right_type === 'indicator') {
      const indicatorKey = rule.right_indicator?.toLowerCase();
      rightValue = indicators[indicatorKey] || 0;
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
    console.error('Error evaluating rule with real data:', error);
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

    // Generate and store the signal with real market data
    const { error } = await supabase
      .from('trading_signals')
      .insert({
        strategy_id: strategyId,
        signal_type: signalType,
        signal_data: signalData,
        processed: true,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error inserting real market data trading signal:', error);
    } else {
      console.log(`Generated REAL DATA ${signalType} signal for strategy ${strategyId} at ${signalData.timestamp}`);
    }
  } catch (error) {
    console.error('Error generating real market data trading signal:', error);
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
      const profit = exitPrice - entryPrice;

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

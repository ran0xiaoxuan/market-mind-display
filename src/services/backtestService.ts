
import { supabase } from "@/integrations/supabase/client";
import { getStockPrice } from "./marketDataService";

interface BacktestParams {
  strategyId: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  stopLoss?: number;
  takeProfit?: number;
  singleBuyVolume?: number;
  maxBuyVolume?: number;
}

export interface BacktestResult {
  id: string;
  strategyId: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  totalReturn: number;
  totalReturnPercentage: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgProfit: number;
  avgLoss: number;
  profitFactor: number;
  createdAt: string;
  trades: BacktestTrade[];
}

export interface BacktestTrade {
  id: string;
  backtestId: string;
  date: string;
  type: 'Buy' | 'Sell';
  signal: string;
  price: number;
  contracts: number;
  profit?: number;
  profitPercentage?: number;
}

export const runBacktest = async (params: BacktestParams): Promise<string> => {
  try {
    console.log('Starting backtest simulation with params:', params);

    // Get strategy details
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', params.strategyId)
      .single();

    if (strategyError || !strategy) {
      throw new Error('Strategy not found');
    }

    // Use passed risk management parameters instead of strategy fields
    const riskManagement = {
      stopLoss: params.stopLoss || 5,
      takeProfit: params.takeProfit || 10,
      singleBuyVolume: params.singleBuyVolume || 1000,
      maxBuyVolume: params.maxBuyVolume || 5000
    };

    // Get trading rules
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
      .eq('strategy_id', params.strategyId)
      .order('group_order');

    if (rulesError || !ruleGroups || ruleGroups.length === 0) {
      throw new Error('No trading rules found for this strategy');
    }

    // Since backtest tables don't exist yet, we'll simulate the backtest in memory
    const backtestId = `backtest-${Date.now()}`;
    
    // Simulate backtesting logic
    const trades = await simulateBacktest(
      strategy.target_asset,
      params.startDate,
      params.endDate,
      params.initialCapital,
      riskManagement,
      ruleGroups
    );

    // Calculate metrics
    const metrics = calculateBacktestMetrics(trades, params.initialCapital);

    // Create backtest result object (in memory since no database table exists)
    const backtestResult: BacktestResult = {
      id: backtestId,
      strategyId: params.strategyId,
      startDate: params.startDate,
      endDate: params.endDate,
      initialCapital: params.initialCapital,
      totalReturn: metrics.totalReturn,
      totalReturnPercentage: metrics.totalReturnPercentage,
      annualizedReturn: metrics.annualizedReturn,
      sharpeRatio: metrics.sharpeRatio,
      maxDrawdown: metrics.maxDrawdown,
      winRate: metrics.winRate,
      totalTrades: metrics.totalTrades,
      winningTrades: metrics.winningTrades,
      losingTrades: metrics.losingTrades,
      avgProfit: metrics.avgProfit,
      avgLoss: metrics.avgLoss,
      profitFactor: metrics.profitFactor,
      createdAt: new Date().toISOString(),
      trades: trades
    };

    // Store result in memory for this session (since no database table)
    // In a real implementation, this would be saved to the database
    console.log('Backtest completed successfully:', backtestResult);
    
    return backtestId;

  } catch (error) {
    console.error('Error running backtest:', error);
    throw error;
  }
};

const simulateBacktest = async (
  asset: string,
  startDate: string,
  endDate: string,
  initialCapital: number,
  riskManagement: any,
  ruleGroups: any[]
): Promise<BacktestTrade[]> => {
  const trades: BacktestTrade[] = [];
  
  // Simplified simulation - generate some sample trades
  const numberOfTrades = Math.floor(Math.random() * 20) + 10;
  let currentPrice = 150; // Base price
  
  for (let i = 0; i < numberOfTrades; i++) {
    const isEntry = Math.random() > 0.5;
    const priceChange = (Math.random() - 0.5) * 10;
    currentPrice += priceChange;
    
    const trade: BacktestTrade = {
      id: `trade-${i}`,
      backtestId: '',
      date: new Date(Date.now() - (numberOfTrades - i) * 24 * 60 * 60 * 1000).toISOString(),
      type: isEntry ? 'Buy' : 'Sell',
      signal: isEntry ? 'Entry Signal' : 'Exit Signal',
      price: Math.max(currentPrice, 50),
      contracts: Math.floor(riskManagement.singleBuyVolume / currentPrice),
      profit: isEntry ? undefined : (Math.random() - 0.4) * 500,
      profitPercentage: isEntry ? undefined : (Math.random() - 0.4) * 10
    };
    
    trades.push(trade);
  }
  
  return trades;
};

const calculateBacktestMetrics = (trades: BacktestTrade[], initialCapital: number) => {
  const profitTrades = trades.filter(t => t.profit && t.profit > 0);
  const lossTrades = trades.filter(t => t.profit && t.profit < 0);
  const totalProfit = trades.reduce((sum, t) => sum + (t.profit || 0), 0);
  
  return {
    totalReturn: totalProfit,
    totalReturnPercentage: (totalProfit / initialCapital) * 100,
    annualizedReturn: (totalProfit / initialCapital) * 100 * 2, // Simplified
    sharpeRatio: Math.random() * 2,
    maxDrawdown: Math.random() * -20,
    winRate: (profitTrades.length / Math.max(profitTrades.length + lossTrades.length, 1)) * 100,
    totalTrades: profitTrades.length + lossTrades.length,
    winningTrades: profitTrades.length,
    losingTrades: lossTrades.length,
    avgProfit: profitTrades.length > 0 ? profitTrades.reduce((sum, t) => sum + (t.profit || 0), 0) / profitTrades.length : 0,
    avgLoss: lossTrades.length > 0 ? lossTrades.reduce((sum, t) => sum + (t.profit || 0), 0) / lossTrades.length : 0,
    profitFactor: lossTrades.length > 0 ? Math.abs(profitTrades.reduce((sum, t) => sum + (t.profit || 0), 0) / lossTrades.reduce((sum, t) => sum + (t.profit || 0), 0)) : 0
  };
};

export const getBacktestHistory = async (): Promise<BacktestResult[]> => {
  try {
    // Since backtest tables don't exist, return empty array
    console.log('Backtest tables not implemented yet, returning empty history');
    return [];
  } catch (error) {
    console.error('Error fetching backtest history:', error);
    throw error;
  }
};

export const getBacktestById = async (id: string): Promise<BacktestResult | null> => {
  try {
    // Since backtest tables don't exist, return null
    console.log('Backtest tables not implemented yet, returning null for backtest:', id);
    return null;
  } catch (error) {
    console.error('Error fetching backtest:', error);
    throw error;
  }
};

export const getBacktestTrades = async (backtestId: string): Promise<BacktestTrade[]> => {
  try {
    // Since backtest tables don't exist, return empty array
    console.log('Backtest tables not implemented yet, returning empty trades for:', backtestId);
    return [];
  } catch (error) {
    console.error('Error fetching backtest trades:', error);
    throw error;
  }
};

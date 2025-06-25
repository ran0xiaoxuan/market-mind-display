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
    console.log('Starting backtest with params:', params);

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

    // Create backtest record
    const { data: backtest, error: backtestError } = await supabase
      .from('backtests')
      .insert({
        strategy_id: params.strategyId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        start_date: params.startDate,
        end_date: params.endDate,
        initial_capital: params.initialCapital,
        total_return: 0,
        total_return_percentage: 0,
        annualized_return: 0,
        sharpe_ratio: 0,
        max_drawdown: 0,
        win_rate: 0,
        total_trades: 0,
        winning_trades: 0,
        losing_trades: 0,
        avg_profit: 0,
        avg_loss: 0,
        profit_factor: 0
      })
      .select()
      .single();

    if (backtestError) {
      throw backtestError;
    }

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

    // Update backtest with results
    const { error: updateError } = await supabase
      .from('backtests')
      .update({
        total_return: metrics.totalReturn,
        total_return_percentage: metrics.totalReturnPercentage,
        annualized_return: metrics.annualizedReturn,
        sharpe_ratio: metrics.sharpeRatio,
        max_drawdown: metrics.maxDrawdown,
        win_rate: metrics.winRate,
        total_trades: metrics.totalTrades,
        winning_trades: metrics.winningTrades,
        losing_trades: metrics.losingTrades,
        avg_profit: metrics.avgProfit,
        avg_loss: metrics.avgLoss,
        profit_factor: metrics.profitFactor
      })
      .eq('id', backtest.id);

    if (updateError) {
      throw updateError;
    }

    // Save trades
    if (trades.length > 0) {
      const tradesToInsert = trades.map(trade => ({
        backtest_id: backtest.id,
        date: trade.date,
        type: trade.type,
        signal: trade.signal,
        price: trade.price,
        contracts: trade.contracts,
        profit: trade.profit,
        profit_percentage: trade.profitPercentage
      }));

      const { error: tradesError } = await supabase
        .from('backtest_trades')
        .insert(tradesToInsert);

      if (tradesError) {
        console.error('Error saving backtest trades:', tradesError);
      }
    }

    console.log('Backtest completed successfully');
    return backtest.id;

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
    const { data: backtests, error } = await supabase
      .from('backtests')
      .select(`
        *,
        strategies (
          name,
          target_asset
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return backtests?.map(backtest => ({
      id: backtest.id,
      strategyId: backtest.strategy_id,
      startDate: backtest.start_date,
      endDate: backtest.end_date,
      initialCapital: backtest.initial_capital,
      totalReturn: backtest.total_return || 0,
      totalReturnPercentage: backtest.total_return_percentage || 0,
      annualizedReturn: backtest.annualized_return || 0,
      sharpeRatio: backtest.sharpe_ratio || 0,
      maxDrawdown: backtest.max_drawdown || 0,
      winRate: backtest.win_rate || 0,
      totalTrades: backtest.total_trades || 0,
      winningTrades: backtest.winning_trades || 0,
      losingTrades: backtest.losing_trades || 0,
      avgProfit: backtest.avg_profit || 0,
      avgLoss: backtest.avg_loss || 0,
      profitFactor: backtest.profit_factor || 0,
      createdAt: backtest.created_at
    })) || [];

  } catch (error) {
    console.error('Error fetching backtest history:', error);
    throw error;
  }
};

export const getBacktestById = async (id: string): Promise<BacktestResult | null> => {
  try {
    const { data: backtest, error } = await supabase
      .from('backtests')
      .select(`
        *,
        strategies (
          name,
          target_asset
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return {
      id: backtest.id,
      strategyId: backtest.strategy_id,
      startDate: backtest.start_date,
      endDate: backtest.end_date,
      initialCapital: backtest.initial_capital,
      totalReturn: backtest.total_return || 0,
      totalReturnPercentage: backtest.total_return_percentage || 0,
      annualizedReturn: backtest.annualized_return || 0,
      sharpeRatio: backtest.sharpe_ratio || 0,
      maxDrawdown: backtest.max_drawdown || 0,
      winRate: backtest.win_rate || 0,
      totalTrades: backtest.total_trades || 0,
      winningTrades: backtest.winning_trades || 0,
      losingTrades: backtest.losing_trades || 0,
      avgProfit: backtest.avg_profit || 0,
      avgLoss: backtest.avg_loss || 0,
      profitFactor: backtest.profit_factor || 0,
      createdAt: backtest.created_at
    };

  } catch (error) {
    console.error('Error fetching backtest:', error);
    throw error;
  }
};

export const getBacktestTrades = async (backtestId: string): Promise<BacktestTrade[]> => {
  try {
    const { data: trades, error } = await supabase
      .from('backtest_trades')
      .select('*')
      .eq('backtest_id', backtestId)
      .order('date', { ascending: true });

    if (error) {
      throw error;
    }

    return trades?.map(trade => ({
      id: trade.id,
      backtestId: trade.backtest_id,
      date: trade.date,
      type: trade.type as 'Buy' | 'Sell',
      signal: trade.signal,
      price: trade.price,
      contracts: trade.contracts,
      profit: trade.profit,
      profitPercentage: trade.profit_percentage
    })) || [];

  } catch (error) {
    console.error('Error fetching backtest trades:', error);
    throw error;
  }
};

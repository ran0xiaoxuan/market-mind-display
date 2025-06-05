
import { supabase } from '@/integrations/supabase/client';

export interface BacktestTrade {
  id: string;
  backtestId: string;
  date: string;
  price: number;
  contracts: number;
  profit?: number;
  profitPercentage?: number;
  type: string;
  signal: string;
  createdAt: string;
}

export interface Backtest {
  id: string;
  strategyId: string;
  userId: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  totalReturn?: number;
  totalReturnPercentage?: number;
  annualizedReturn?: number;
  sharpeRatio?: number;
  maxDrawdown?: number;
  winRate?: number;
  profitFactor?: number;
  totalTrades?: number;
  winningTrades?: number;
  losingTrades?: number;
  avgProfit?: number;
  avgLoss?: number;
  createdAt: string;
}

export const getBacktests = async (strategyId?: string): Promise<Backtest[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  let query = supabase
    .from('backtests')
    .select('*')
    .eq('user_id', user.id);
  
  if (strategyId) {
    query = query.eq('strategy_id', strategyId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching backtests:', error);
    throw error;
  }

  return data?.map(backtest => ({
    id: backtest.id,
    strategyId: backtest.strategy_id,
    userId: backtest.user_id,
    startDate: backtest.start_date,
    endDate: backtest.end_date,
    initialCapital: backtest.initial_capital,
    totalReturn: backtest.total_return,
    totalReturnPercentage: backtest.total_return_percentage,
    annualizedReturn: backtest.annualized_return,
    sharpeRatio: backtest.sharpe_ratio,
    maxDrawdown: backtest.max_drawdown,
    winRate: backtest.win_rate,
    profitFactor: backtest.profit_factor,
    totalTrades: backtest.total_trades,
    winningTrades: backtest.winning_trades,
    losingTrades: backtest.losing_trades,
    avgProfit: backtest.avg_profit,
    avgLoss: backtest.avg_loss,
    createdAt: backtest.created_at
  })) || [];
};

export const getBacktestTrades = async (backtestId: string): Promise<BacktestTrade[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  // First verify the backtest belongs to the user
  const { data: backtest } = await supabase
    .from('backtests')
    .select('id')
    .eq('id', backtestId)
    .eq('user_id', user.id)
    .single();

  if (!backtest) {
    throw new Error('Backtest not found or access denied');
  }

  const { data, error } = await supabase
    .from('backtest_trades')
    .select('*')
    .eq('backtest_id', backtestId)
    .order('date');

  if (error) {
    console.error('Error fetching backtest trades:', error);
    throw error;
  }

  return data?.map(trade => ({
    id: trade.id,
    backtestId: trade.backtest_id,
    date: trade.date,
    price: Number(trade.price),
    contracts: Number(trade.contracts),
    profit: trade.profit ? Number(trade.profit) : undefined,
    profitPercentage: trade.profit_percentage ? Number(trade.profit_percentage) : undefined,
    type: trade.type,
    signal: trade.signal,
    createdAt: trade.created_at
  })) || [];
};

export const createBacktest = async (backtest: Omit<Backtest, 'id' | 'userId' | 'createdAt'>): Promise<Backtest> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  // Verify the strategy belongs to the user
  const { data: strategy } = await supabase
    .from('strategies')
    .select('id')
    .eq('id', backtest.strategyId)
    .eq('user_id', user.id)
    .single();

  if (!strategy) {
    throw new Error('Strategy not found or access denied');
  }

  const { data, error } = await supabase
    .from('backtests')
    .insert({
      strategy_id: backtest.strategyId,
      user_id: user.id,
      start_date: backtest.startDate,
      end_date: backtest.endDate,
      initial_capital: backtest.initialCapital,
      total_return: backtest.totalReturn,
      total_return_percentage: backtest.totalReturnPercentage,
      annualized_return: backtest.annualizedReturn,
      sharpe_ratio: backtest.sharpeRatio,
      max_drawdown: backtest.maxDrawdown,
      win_rate: backtest.winRate,
      profit_factor: backtest.profitFactor,
      total_trades: backtest.totalTrades,
      winning_trades: backtest.winningTrades,
      losing_trades: backtest.losingTrades,
      avg_profit: backtest.avgProfit,
      avg_loss: backtest.avgLoss
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating backtest:', error);
    throw error;
  }

  return {
    id: data.id,
    strategyId: data.strategy_id,
    userId: data.user_id,
    startDate: data.start_date,
    endDate: data.end_date,
    initialCapital: data.initial_capital,
    totalReturn: data.total_return,
    totalReturnPercentage: data.total_return_percentage,
    annualizedReturn: data.annualized_return,
    sharpeRatio: data.sharpe_ratio,
    maxDrawdown: data.max_drawdown,
    winRate: data.win_rate,
    profitFactor: data.profit_factor,
    totalTrades: data.total_trades,
    winningTrades: data.winning_trades,
    losingTrades: data.losing_trades,
    avgProfit: data.avg_profit,
    avgLoss: data.avg_loss,
    createdAt: data.created_at
  };
};


import { supabase } from '@/integrations/supabase/client';

export interface BacktestResult {
  id: string;
  strategyId: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  totalTrades: number;
  createdAt: string;
  trades: BacktestTrade[];
}

export interface BacktestTrade {
  id: string;
  backtestId: string;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  type: 'buy' | 'sell';
}

export interface BacktestParams {
  strategyId: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
}

export const runBacktest = async (params: BacktestParams): Promise<BacktestResult> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  // Verify user owns the strategy
  const { data: strategy, error: strategyError } = await supabase
    .from('strategies')
    .select('*')
    .eq('id', params.strategyId)
    .eq('user_id', user.id)
    .single();

  if (strategyError || !strategy) {
    throw new Error('Strategy not found or access denied');
  }

  try {
    const { data, error } = await supabase.functions.invoke('run-backtest', {
      body: params
    });

    if (error) throw error;
    return data as BacktestResult;
  } catch (error) {
    console.error('Error running backtest:', error);
    throw error;
  }
};

export const getBacktestResults = async (strategyId: string): Promise<BacktestResult[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  const { data, error } = await supabase
    .from('backtest_results')
    .select(`
      *,
      backtest_trades (*)
    `)
    .eq('strategy_id', strategyId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching backtest results:', error);
    throw error;
  }

  return data?.map(result => ({
    id: result.id,
    strategyId: result.strategy_id,
    startDate: result.start_date,
    endDate: result.end_date,
    initialCapital: result.initial_capital,
    finalCapital: result.final_capital,
    totalReturn: result.total_return,
    maxDrawdown: result.max_drawdown,
    sharpeRatio: result.sharpe_ratio,
    winRate: result.win_rate,
    totalTrades: result.total_trades,
    createdAt: result.created_at,
    trades: result.backtest_trades?.map((trade: any) => ({
      id: trade.id,
      backtestId: trade.backtest_id,
      entryDate: trade.entry_date,
      exitDate: trade.exit_date,
      entryPrice: trade.entry_price,
      exitPrice: trade.exit_price,
      quantity: trade.quantity,
      pnl: trade.pnl,
      type: trade.type
    })) || []
  })) || [];
};

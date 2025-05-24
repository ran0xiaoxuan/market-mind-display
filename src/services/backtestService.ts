
import { supabase } from "@/integrations/supabase/client";
import { getHistoricalPrices, HistoricalPrice } from "./marketDataService";

export interface BacktestParams {
  strategyId: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  positionSize?: number;
}

export interface BacktestResult {
  id: string;
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
  trades: BacktestTrade[];
}

export interface BacktestTrade {
  date: string;
  type: 'Buy' | 'Sell';
  signal: string;
  price: number;
  contracts: number;
  profit?: number;
  profitPercentage?: number;
}

/**
 * Run a backtest with real historical market data
 */
export const runBacktestWithRealData = async (params: BacktestParams): Promise<BacktestResult> => {
  try {
    // Get strategy details
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', params.strategyId)
      .single();

    if (strategyError || !strategy) {
      throw new Error('Strategy not found');
    }

    // Get trading rules
    const { data: ruleGroups, error: rulesError } = await supabase
      .from('rule_groups')
      .select(`
        *,
        trading_rules (*)
      `)
      .eq('strategy_id', params.strategyId);

    if (rulesError) {
      throw new Error('Failed to fetch trading rules');
    }

    // Get historical price data for the target asset
    const historicalPrices = await getHistoricalPrices(
      strategy.target_asset,
      params.startDate,
      params.endDate
    );

    if (historicalPrices.length === 0) {
      throw new Error('No historical data available for the selected period');
    }

    // Create backtest record
    const { data: backtest, error: backtestError } = await supabase
      .from('backtests')
      .insert({
        strategy_id: params.strategyId,
        start_date: params.startDate,
        end_date: params.endDate,
        initial_capital: params.initialCapital
      })
      .select()
      .single();

    if (backtestError || !backtest) {
      throw new Error('Failed to create backtest record');
    }

    // Run the simulation
    const backtestResult = await simulateBacktest(
      backtest.id,
      strategy,
      ruleGroups || [],
      historicalPrices,
      params.initialCapital
    );

    // Update backtest record with results
    await supabase
      .from('backtests')
      .update({
        total_return: backtestResult.totalReturn,
        total_return_percentage: backtestResult.totalReturnPercentage,
        annualized_return: backtestResult.annualizedReturn,
        sharpe_ratio: backtestResult.sharpeRatio,
        max_drawdown: backtestResult.maxDrawdown,
        win_rate: backtestResult.winRate,
        total_trades: backtestResult.totalTrades,
        winning_trades: backtestResult.winningTrades,
        losing_trades: backtestResult.losingTrades,
        avg_profit: backtestResult.avgProfit,
        avg_loss: backtestResult.avgLoss
      })
      .eq('id', backtest.id);

    return {
      ...backtestResult,
      id: backtest.id
    };
  } catch (error) {
    console.error('Backtest execution error:', error);
    throw error;
  }
};

/**
 * Simulate the backtest using historical data and trading rules
 */
const simulateBacktest = async (
  backtestId: string,
  strategy: any,
  ruleGroups: any[],
  historicalPrices: HistoricalPrice[],
  initialCapital: number
): Promise<Omit<BacktestResult, 'id'>> => {
  const trades: BacktestTrade[] = [];
  let currentCapital = initialCapital;
  let position = 0; // Number of shares held
  let positionValue = 0;
  let maxCapital = initialCapital;
  let maxDrawdown = 0;

  // Simple momentum strategy simulation (placeholder)
  // In a real implementation, you would parse and execute the actual trading rules
  for (let i = 1; i < historicalPrices.length; i++) {
    const currentPrice = historicalPrices[i];
    const previousPrice = historicalPrices[i - 1];
    
    // Simple buy signal: price increased by more than 2%
    const priceChange = (currentPrice.close - previousPrice.close) / previousPrice.close;
    
    if (priceChange > 0.02 && position === 0) {
      // Buy signal
      const shares = Math.floor(currentCapital * 0.1 / currentPrice.close); // Use 10% of capital
      if (shares > 0) {
        position = shares;
        positionValue = shares * currentPrice.close;
        currentCapital -= positionValue;
        
        const trade: BacktestTrade = {
          date: currentPrice.date,
          type: 'Buy',
          signal: 'Momentum Buy',
          price: currentPrice.close,
          contracts: shares
        };
        
        trades.push(trade);
        
        // Save trade to database
        await supabase.from('backtest_trades').insert({
          backtest_id: backtestId,
          date: currentPrice.date,
          type: 'Buy',
          signal: 'Momentum Buy',
          price: currentPrice.close,
          contracts: shares
        });
      }
    }
    
    // Simple sell signal: price decreased by more than 3% from entry or gained 5%
    if (position > 0) {
      const entryPrice = positionValue / position;
      const priceChangeFromEntry = (currentPrice.close - entryPrice) / entryPrice;
      
      if (priceChangeFromEntry < -0.03 || priceChangeFromEntry > 0.05) {
        // Sell signal
        const sellValue = position * currentPrice.close;
        const profit = sellValue - positionValue;
        const profitPercentage = (profit / positionValue) * 100;
        
        currentCapital += sellValue;
        
        const trade: BacktestTrade = {
          date: currentPrice.date,
          type: 'Sell',
          signal: priceChangeFromEntry < -0.03 ? 'Stop Loss' : 'Take Profit',
          price: currentPrice.close,
          contracts: position,
          profit,
          profitPercentage
        };
        
        trades.push(trade);
        
        // Save trade to database
        await supabase.from('backtest_trades').insert({
          backtest_id: backtestId,
          date: currentPrice.date,
          type: 'Sell',
          signal: trade.signal,
          price: currentPrice.close,
          contracts: position,
          profit,
          profit_percentage: profitPercentage
        });
        
        position = 0;
        positionValue = 0;
      }
    }
    
    // Track max drawdown
    const totalValue = currentCapital + (position * currentPrice.close);
    if (totalValue > maxCapital) {
      maxCapital = totalValue;
    }
    const drawdown = (maxCapital - totalValue) / maxCapital;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  // Calculate final metrics
  const finalValue = currentCapital + (position * historicalPrices[historicalPrices.length - 1].close);
  const totalReturn = finalValue - initialCapital;
  const totalReturnPercentage = (totalReturn / initialCapital) * 100;
  
  // Calculate annualized return
  const startDate = new Date(historicalPrices[0].date);
  const endDate = new Date(historicalPrices[historicalPrices.length - 1].date);
  const yearsDiff = (endDate.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  const annualizedReturn = Math.pow(finalValue / initialCapital, 1 / yearsDiff) - 1;
  
  // Calculate trade statistics
  const completedTrades = trades.filter(t => t.type === 'Sell');
  const winningTrades = completedTrades.filter(t => (t.profit || 0) > 0).length;
  const losingTrades = completedTrades.filter(t => (t.profit || 0) < 0).length;
  const winRate = completedTrades.length > 0 ? (winningTrades / completedTrades.length) * 100 : 0;
  
  const profits = completedTrades.filter(t => (t.profit || 0) > 0).map(t => t.profit || 0);
  const losses = completedTrades.filter(t => (t.profit || 0) < 0).map(t => t.profit || 0);
  
  const avgProfit = profits.length > 0 ? profits.reduce((a, b) => a + b, 0) / profits.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
  
  // Simple Sharpe ratio calculation (assuming risk-free rate of 2%)
  const riskFreeRate = 0.02;
  const excessReturn = annualizedReturn - riskFreeRate;
  const sharpeRatio = excessReturn / 0.15; // Assuming 15% volatility as placeholder
  
  return {
    totalReturn,
    totalReturnPercentage,
    annualizedReturn: annualizedReturn * 100,
    sharpeRatio,
    maxDrawdown: maxDrawdown * 100,
    winRate,
    totalTrades: trades.length,
    winningTrades,
    losingTrades,
    avgProfit,
    avgLoss,
    trades
  };
};

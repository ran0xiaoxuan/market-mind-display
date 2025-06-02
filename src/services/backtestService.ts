
import { supabase } from "@/integrations/supabase/client";

export interface BacktestParameters {
  strategyId: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
}

export interface BacktestResult {
  id: string;
  totalReturn: number;
  totalReturnPercentage: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
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

// Helper function to parse percentage string to number
const parsePercentage = (percentageStr: string): number | null => {
  if (!percentageStr) return null;
  const cleaned = percentageStr.replace('%', '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};

export const runBacktest = async (parameters: BacktestParameters): Promise<BacktestResult> => {
  try {
    console.log('Starting backtest with parameters:', parameters);
    
    // Get strategy details including risk management settings
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', parameters.strategyId)
      .single();

    if (strategyError) throw strategyError;
    if (!strategy) throw new Error('Strategy not found');

    console.log('Strategy loaded:', strategy);

    // Parse risk management settings
    const stopLossPercent = parsePercentage(strategy.stop_loss);
    const takeProfitPercent = parsePercentage(strategy.take_profit);

    console.log('Risk management settings:', {
      stopLoss: stopLossPercent,
      takeProfit: takeProfitPercent
    });

    // Create backtest record
    const { data: backtest, error: backtestError } = await supabase
      .from('backtests')
      .insert({
        strategy_id: parameters.strategyId,
        user_id: strategy.user_id,
        start_date: parameters.startDate,
        end_date: parameters.endDate,
        initial_capital: parameters.initialCapital
      })
      .select()
      .single();

    if (backtestError) throw backtestError;

    console.log('Backtest record created:', backtest.id);

    // Generate sample trades with risk management enforcement
    const trades = generateSampleTrades(
      parameters.startDate, 
      parameters.endDate, 
      strategy.target_asset || 'AAPL',
      stopLossPercent,
      takeProfitPercent
    );

    console.log('Generated trades:', trades.length);

    // Insert trades into database
    if (trades.length > 0) {
      const { error: tradesError } = await supabase
        .from('backtest_trades')
        .insert(
          trades.map(trade => ({
            backtest_id: backtest.id,
            date: trade.date,
            type: trade.type,
            signal: trade.signal,
            price: trade.price,
            contracts: trade.contracts,
            profit: trade.profit,
            profit_percentage: trade.profitPercentage
          }))
        );

      if (tradesError) throw tradesError;
    }

    // Calculate performance metrics
    const metrics = calculatePerformanceMetrics(trades, parameters.initialCapital);

    // Update backtest record with results
    const { error: updateError } = await supabase
      .from('backtests')
      .update({
        total_return: metrics.totalReturn,
        total_return_percentage: metrics.totalReturnPercentage,
        annualized_return: metrics.annualizedReturn,
        sharpe_ratio: metrics.sharpeRatio,
        max_drawdown: metrics.maxDrawdown,
        win_rate: metrics.winRate,
        profit_factor: metrics.profitFactor,
        total_trades: metrics.totalTrades,
        winning_trades: metrics.winningTrades,
        losing_trades: metrics.losingTrades,
        avg_profit: metrics.avgProfit,
        avg_loss: metrics.avgLoss
      })
      .eq('id', backtest.id);

    if (updateError) throw updateError;

    console.log('Backtest completed successfully');

    return {
      id: backtest.id,
      ...metrics,
      trades
    };

  } catch (error) {
    console.error('Backtest failed:', error);
    throw error;
  }
};

const generateSampleTrades = (
  startDate: string, 
  endDate: string, 
  asset: string,
  stopLossPercent: number | null,
  takeProfitPercent: number | null
): BacktestTrade[] => {
  const trades: BacktestTrade[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysBetween = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  // Generate trades every 5-15 days on average
  const avgDaysBetweenTrades = 8;
  const expectedTrades = Math.floor(daysBetween / avgDaysBetweenTrades);
  
  let currentDate = new Date(start);
  let openPositions: Array<{
    entryPrice: number;
    entryDate: string;
    contracts: number;
    signal: string;
  }> = [];

  // Base price for the asset
  let basePrice = 150;
  
  for (let i = 0; i < expectedTrades && currentDate <= end; i++) {
    // Add random days between trades (5-15 days)
    const daysToAdd = Math.floor(Math.random() * 10) + 5;
    currentDate.setDate(currentDate.getDate() + daysToAdd);
    
    if (currentDate > end) break;
    
    // Simulate price movement (+/- 10% from base price)
    const priceVariation = (Math.random() - 0.5) * 0.2; // -10% to +10%
    const currentPrice = basePrice * (1 + priceVariation);
    
    // 60% chance of buy signal, 40% chance of sell signal
    const isBuySignal = Math.random() < 0.6;
    
    if (isBuySignal) {
      // Generate buy trade
      const contracts = Math.floor(Math.random() * 100) + 10; // 10-110 contracts
      const signal = ['RSI Oversold', 'MACD Bullish Cross', 'Support Level Break'][Math.floor(Math.random() * 3)];
      
      trades.push({
        date: currentDate.toISOString(),
        type: 'Buy',
        signal,
        price: currentPrice,
        contracts
      });

      // Add to open positions
      openPositions.push({
        entryPrice: currentPrice,
        entryDate: currentDate.toISOString(),
        contracts,
        signal
      });
      
    } else if (openPositions.length > 0) {
      // Generate sell trade for existing position
      const positionIndex = Math.floor(Math.random() * openPositions.length);
      const position = openPositions[positionIndex];
      
      // Calculate raw profit percentage
      const rawProfitPercentage = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
      
      // Apply risk management constraints
      let constrainedPrice = currentPrice;
      let constrainedProfitPercentage = rawProfitPercentage;
      let sellSignal = 'Take Profit';
      
      // Check stop loss constraint
      if (stopLossPercent !== null && rawProfitPercentage <= -Math.abs(stopLossPercent)) {
        constrainedProfitPercentage = -Math.abs(stopLossPercent);
        constrainedPrice = position.entryPrice * (1 + constrainedProfitPercentage / 100);
        sellSignal = 'Stop Loss Triggered';
        console.log(`Stop loss triggered: Raw P&L: ${rawProfitPercentage.toFixed(2)}%, Constrained: ${constrainedProfitPercentage.toFixed(2)}%`);
      }
      
      // Check take profit constraint
      if (takeProfitPercent !== null && rawProfitPercentage >= takeProfitPercent) {
        constrainedProfitPercentage = takeProfitPercent;
        constrainedPrice = position.entryPrice * (1 + constrainedProfitPercentage / 100);
        sellSignal = 'Take Profit Triggered';
        console.log(`Take profit triggered: Raw P&L: ${rawProfitPercentage.toFixed(2)}%, Constrained: ${constrainedProfitPercentage.toFixed(2)}%`);
      }
      
      // If neither stop loss nor take profit was triggered, use random exit signals
      if (sellSignal === 'Take Profit' && Math.abs(rawProfitPercentage) < 3) {
        sellSignal = ['RSI Overbought', 'MACD Bearish Cross', 'Resistance Level'][Math.floor(Math.random() * 3)];
      }
      
      // Calculate profit based on constrained price
      const profit = (constrainedPrice - position.entryPrice) * position.contracts;
      
      trades.push({
        date: currentDate.toISOString(),
        type: 'Sell',
        signal: sellSignal,
        price: constrainedPrice,
        contracts: position.contracts,
        profit,
        profitPercentage: constrainedProfitPercentage
      });
      
      // Remove position from open positions
      openPositions.splice(positionIndex, 1);
    }
    
    // Update base price for next iteration (trend simulation)
    basePrice = currentPrice;
  }
  
  return trades;
};

const calculatePerformanceMetrics = (trades: BacktestTrade[], initialCapital: number) => {
  if (trades.length === 0) {
    return {
      totalReturn: 0,
      totalReturnPercentage: 0,
      annualizedReturn: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      winRate: 0,
      profitFactor: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      avgProfit: 0,
      avgLoss: 0
    };
  }

  const sellTrades = trades.filter(trade => trade.type === 'Sell' && trade.profit !== undefined);
  const totalReturn = sellTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
  const totalReturnPercentage = (totalReturn / initialCapital) * 100;
  
  const winningTrades = sellTrades.filter(trade => (trade.profit || 0) > 0);
  const losingTrades = sellTrades.filter(trade => (trade.profit || 0) < 0);
  
  const winRate = sellTrades.length > 0 ? (winningTrades.length / sellTrades.length) * 100 : 0;
  
  const totalWinnings = winningTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0));
  
  const profitFactor = totalLosses > 0 ? totalWinnings / totalLosses : 0;
  const avgProfit = winningTrades.length > 0 ? totalWinnings / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
  
  // Simple annualized return calculation (assuming 1 year period)
  const annualizedReturn = totalReturnPercentage;
  
  // Simplified Sharpe ratio calculation
  const sharpeRatio = totalReturnPercentage > 0 ? totalReturnPercentage / 15 : 0; // Assuming 15% volatility
  
  // Simplified max drawdown calculation
  let runningTotal = initialCapital;
  let peak = initialCapital;
  let maxDrawdown = 0;
  
  for (const trade of trades) {
    if (trade.type === 'Sell' && trade.profit !== undefined) {
      runningTotal += trade.profit;
      if (runningTotal > peak) {
        peak = runningTotal;
      } else {
        const drawdown = ((peak - runningTotal) / peak) * 100;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    }
  }
  
  return {
    totalReturn,
    totalReturnPercentage,
    annualizedReturn,
    sharpeRatio,
    maxDrawdown,
    winRate,
    profitFactor,
    totalTrades: sellTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    avgProfit,
    avgLoss
  };
};

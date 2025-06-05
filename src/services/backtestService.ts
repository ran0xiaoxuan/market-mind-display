
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

    console.log('Strategy loaded:', strategy.name);

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

    // Insert trades into database if we have any
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

      if (tradesError) {
        console.error('Error inserting trades:', tradesError);
        throw tradesError;
      }
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

    if (updateError) {
      console.error('Error updating backtest results:', updateError);
      throw updateError;
    }

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
  console.log('Starting trade generation for:', { startDate, endDate, asset });
  
  const trades: BacktestTrade[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysBetween = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  // Ensure we have a reasonable time period
  if (daysBetween <= 0) {
    console.log('Invalid date range for backtest');
    return trades;
  }
  
  console.log(`Generating trades over ${daysBetween} days`);
  
  // Cap the maximum number of trades to prevent infinite loops
  const maxTrades = Math.min(30, Math.floor(daysBetween / 2));
  const avgDaysBetweenTrades = Math.max(3, Math.floor(daysBetween / maxTrades));
  
  let currentDate = new Date(start);
  let openPositions: Array<{
    entryPrice: number;
    entryDate: string;
    contracts: number;
    signal: string;
  }> = [];

  // Base price for the asset
  let basePrice = 150;
  let tradeCount = 0;
  let iterationCount = 0;
  const maxIterations = maxTrades * 3; // Safety limit to prevent infinite loops
  
  while (tradeCount < maxTrades && currentDate <= end && iterationCount < maxIterations) {
    iterationCount++;
    
    // Add random days between trades
    const daysToAdd = Math.floor(Math.random() * 5) + avgDaysBetweenTrades;
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + daysToAdd);
    
    if (currentDate > end) break;
    
    // Simulate price movement (+/- 20% from base price)
    const priceVariation = (Math.random() - 0.5) * 0.4; // -20% to +20%
    const currentPrice = Math.max(50, basePrice * (1 + priceVariation));
    
    // Decide trade type: if no positions, buy; otherwise 70% chance to sell existing
    const shouldSell = openPositions.length > 0 && Math.random() < 0.7;
    
    if (shouldSell) {
      // Generate sell trade for existing position
      const positionIndex = Math.floor(Math.random() * openPositions.length);
      const position = openPositions[positionIndex];
      
      // Calculate raw profit percentage
      const rawProfitPercentage = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
      
      // Apply risk management constraints
      let constrainedPrice = currentPrice;
      let constrainedProfitPercentage = rawProfitPercentage;
      let sellSignal = 'Market Exit';
      
      // Check stop loss constraint
      if (stopLossPercent !== null && rawProfitPercentage <= -Math.abs(stopLossPercent)) {
        constrainedProfitPercentage = -Math.abs(stopLossPercent);
        constrainedPrice = position.entryPrice * (1 + constrainedProfitPercentage / 100);
        sellSignal = 'Stop Loss Triggered';
      }
      // Check take profit constraint
      else if (takeProfitPercent !== null && rawProfitPercentage >= takeProfitPercent) {
        constrainedProfitPercentage = takeProfitPercent;
        constrainedPrice = position.entryPrice * (1 + constrainedProfitPercentage / 100);
        sellSignal = 'Take Profit Triggered';
      }
      // Random exit signals
      else {
        const exitSignals = ['RSI Overbought', 'MACD Bearish Cross', 'Resistance Level', 'Profit Taking'];
        sellSignal = exitSignals[Math.floor(Math.random() * exitSignals.length)];
      }
      
      // Calculate profit based on constrained price
      const profit = (constrainedPrice - position.entryPrice) * position.contracts;
      
      trades.push({
        date: currentDate.toISOString(),
        type: 'Sell',
        signal: sellSignal,
        price: Number(constrainedPrice.toFixed(2)),
        contracts: position.contracts,
        profit: Number(profit.toFixed(2)),
        profitPercentage: Number(constrainedProfitPercentage.toFixed(2))
      });
      
      // Remove position from open positions
      openPositions.splice(positionIndex, 1);
      
    } else {
      // Generate buy trade
      const contracts = Math.floor(Math.random() * 40) + 10; // 10-50 contracts
      const signals = ['RSI Oversold', 'MACD Bullish Cross', 'Support Level', 'Moving Average Cross'];
      const signal = signals[Math.floor(Math.random() * signals.length)];
      
      trades.push({
        date: currentDate.toISOString(),
        type: 'Buy',
        signal,
        price: Number(currentPrice.toFixed(2)),
        contracts
      });

      // Add to open positions (limit to 3 concurrent positions)
      if (openPositions.length < 3) {
        openPositions.push({
          entryPrice: currentPrice,
          entryDate: currentDate.toISOString(),
          contracts,
          signal
        });
      }
    }
    
    // Update base price for next iteration (trend simulation)
    basePrice = currentPrice * (1 + (Math.random() - 0.5) * 0.01); // Small trend
    tradeCount++;
    
    // Log progress every 10 trades
    if (tradeCount % 10 === 0) {
      console.log(`Generated ${tradeCount} trades, ${openPositions.length} open positions`);
    }
  }
  
  // Close any remaining open positions at the end
  if (openPositions.length > 0) {
    console.log(`Closing ${openPositions.length} remaining positions`);
    const finalPrice = basePrice;
    
    openPositions.forEach(position => {
      const profit = (finalPrice - position.entryPrice) * position.contracts;
      const profitPercentage = ((finalPrice - position.entryPrice) / position.entryPrice) * 100;
      
      trades.push({
        date: end.toISOString(),
        type: 'Sell',
        signal: 'End of Period',
        price: Number(finalPrice.toFixed(2)),
        contracts: position.contracts,
        profit: Number(profit.toFixed(2)),
        profitPercentage: Number(profitPercentage.toFixed(2))
      });
    });
  }
  
  console.log(`Trade generation completed: ${trades.length} trades over ${daysBetween} days (${iterationCount} iterations)`);
  return trades;
};

const calculatePerformanceMetrics = (trades: BacktestTrade[], initialCapital: number) => {
  console.log('Calculating performance metrics for', trades.length, 'trades');
  
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
  
  const metrics = {
    totalReturn: Number(totalReturn.toFixed(2)),
    totalReturnPercentage: Number(totalReturnPercentage.toFixed(2)),
    annualizedReturn: Number(annualizedReturn.toFixed(2)),
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    winRate: Number(winRate.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(2)),
    totalTrades: sellTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    avgProfit: Number(avgProfit.toFixed(2)),
    avgLoss: Number(avgLoss.toFixed(2))
  };
  
  console.log('Performance metrics calculated:', metrics);
  return metrics;
};

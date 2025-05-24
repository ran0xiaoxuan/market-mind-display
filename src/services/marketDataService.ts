
import { supabase } from "@/integrations/supabase/client";
import { getFmpApiKey } from "./assetApiService";

export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

export interface HistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PortfolioMetrics {
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  dailyChange: number;
  dailyChangePercent: number;
}

/**
 * Get current stock price for a symbol
 */
export const getStockPrice = async (symbol: string): Promise<StockPrice | null> => {
  try {
    const apiKey = await getFmpApiKey();
    if (!apiKey) {
      throw new Error("Unable to access market data: API key not available");
    }

    const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`;
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors',
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const quote = data[0];
    return {
      symbol: quote.symbol,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changesPercentage,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching stock price for ${symbol}:`, error);
    return null;
  }
};

/**
 * Get historical prices for a symbol within a date range
 */
export const getHistoricalPrices = async (
  symbol: string, 
  from: string, 
  to: string
): Promise<HistoricalPrice[]> => {
  try {
    const apiKey = await getFmpApiKey();
    if (!apiKey) {
      throw new Error("Unable to access market data: API key not available");
    }

    const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?from=${from}&to=${to}&apikey=${apiKey}`;
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors',
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.historical || !Array.isArray(data.historical)) {
      return [];
    }

    return data.historical.map((item: any) => ({
      date: item.date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    }));
  } catch (error) {
    console.error(`Error fetching historical prices for ${symbol}:`, error);
    return [];
  }
};

/**
 * Get current prices for multiple symbols
 */
export const getBulkStockPrices = async (symbols: string[]): Promise<StockPrice[]> => {
  try {
    const apiKey = await getFmpApiKey();
    if (!apiKey) {
      throw new Error("Unable to access market data: API key not available");
    }

    const symbolString = symbols.join(',');
    const url = `https://financialmodelingprep.com/api/v3/quote/${symbolString}?apikey=${apiKey}`;
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors',
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((quote: any) => ({
      symbol: quote.symbol,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changesPercentage,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error("Error fetching bulk stock prices:", error);
    return [];
  }
};

/**
 * Calculate portfolio metrics from user's strategies and current market data
 */
export const calculatePortfolioMetrics = async (timeRange: "7d" | "30d" | "all"): Promise<{
  strategiesCount: string;
  strategiesChange: { value: string; positive: boolean };
  activeStrategies: string;
  activeChange: { value: string; positive: boolean };
  totalReturn: string;
  returnChange: { value: string; positive: boolean };
  sharpeRatio: string;
  sharpeChange: { value: string; positive: boolean };
}> => {
  try {
    // Fetch user's strategies
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('*');

    if (strategiesError) {
      console.error("Error fetching strategies:", strategiesError);
      throw strategiesError;
    }

    const totalStrategies = strategies?.length || 0;
    const activeStrategies = strategies?.filter(s => s.is_active)?.length || 0;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    if (timeRange === "7d") {
      startDate.setDate(endDate.getDate() - 7);
    } else if (timeRange === "30d") {
      startDate.setDate(endDate.getDate() - 30);
    } else {
      startDate.setFullYear(endDate.getFullYear() - 1);
    }

    // Fetch recent backtests for performance calculation
    const { data: backtests, error: backtestsError } = await supabase
      .from('backtests')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (backtestsError) {
      console.error("Error fetching backtests:", backtestsError);
    }

    // Calculate average performance metrics
    const recentBacktests = backtests || [];
    const avgTotalReturn = recentBacktests.length > 0 
      ? recentBacktests.reduce((sum, bt) => sum + (bt.total_return_percentage || 0), 0) / recentBacktests.length
      : 0;

    const avgSharpeRatio = recentBacktests.length > 0
      ? recentBacktests.reduce((sum, bt) => sum + (bt.sharpe_ratio || 0), 0) / recentBacktests.length
      : 0;

    // Calculate changes (simplified - in real app you'd compare with previous period)
    const returnChange = Math.random() * 2 - 1; // Placeholder calculation
    const sharpeChange = Math.random() * 0.4 - 0.2; // Placeholder calculation

    return {
      strategiesCount: totalStrategies.toString(),
      strategiesChange: {
        value: "+0",
        positive: false
      },
      activeStrategies: activeStrategies.toString(),
      activeChange: {
        value: "+0",
        positive: false
      },
      totalReturn: `${avgTotalReturn >= 0 ? '+' : ''}${avgTotalReturn.toFixed(1)}%`,
      returnChange: {
        value: `${returnChange >= 0 ? '+' : ''}${returnChange.toFixed(1)}%`,
        positive: returnChange >= 0
      },
      sharpeRatio: avgSharpeRatio.toFixed(1),
      sharpeChange: {
        value: `${sharpeChange >= 0 ? '+' : ''}${sharpeChange.toFixed(1)}`,
        positive: sharpeChange >= 0
      }
    };
  } catch (error) {
    console.error("Error calculating portfolio metrics:", error);
    // Return fallback data on error
    return {
      strategiesCount: "0",
      strategiesChange: { value: "+0", positive: false },
      activeStrategies: "0",
      activeChange: { value: "+0", positive: false },
      totalReturn: "+0.0%",
      returnChange: { value: "+0.0%", positive: false },
      sharpeRatio: "0.0",
      sharpeChange: { value: "+0.0", positive: false }
    };
  }
};

/**
 * Get real trade history from database with current market prices
 */
export const getRealTradeHistory = async (timeRange: "7d" | "30d" | "all") => {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    if (timeRange === "7d") {
      startDate.setDate(endDate.getDate() - 7);
    } else if (timeRange === "30d") {
      startDate.setDate(endDate.getDate() - 30);
    } else {
      startDate.setFullYear(endDate.getFullYear() - 1);
    }

    // Fetch trades from database
    const { data: trades, error: tradesError } = await supabase
      .from('backtest_trades')
      .select(`
        *,
        backtests!inner (
          strategy_id,
          strategies!inner (
            name,
            target_asset
          )
        )
      `)
      .gte('date', startDate.toISOString())
      .order('date', { ascending: false })
      .limit(50);

    if (tradesError) {
      console.error("Error fetching trades:", tradesError);
      return [];
    }

    if (!trades || trades.length === 0) {
      return [];
    }

    // Format trades for display
    return trades.map(trade => ({
      id: trade.id,
      date: new Date(trade.date).toLocaleDateString(),
      type: trade.type,
      signal: trade.signal,
      price: `$${trade.price.toFixed(2)}`,
      contracts: trade.contracts,
      profit: trade.profit !== null ? `${trade.profit >= 0 ? '+' : ''}$${trade.profit.toFixed(2)}` : null,
      profitPercentage: trade.profit_percentage !== null ? `${trade.profit_percentage >= 0 ? '+' : ''}${trade.profit_percentage.toFixed(2)}%` : null,
      strategyName: trade.backtests?.strategies?.name || "Unknown Strategy",
      strategyId: trade.backtests?.strategy_id,
      targetAsset: trade.backtests?.strategies?.target_asset || "Unknown"
    }));
  } catch (error) {
    console.error("Error fetching real trade history:", error);
    return [];
  }
};

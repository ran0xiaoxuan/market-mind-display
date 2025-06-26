import { supabase } from "@/integrations/supabase/client";

export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

export interface PortfolioMetrics {
  strategiesCount: string;
  strategiesChange: {
    value: string;
    positive: boolean;
  };
  activeStrategies: string;
  activeChange: {
    value: string;
    positive: boolean;
  };
  signalAmount: string;
  signalChange: {
    value: string;
    positive: boolean;
  };
  transactionAmount: number;
  transactionChange: {
    value: string;
    positive: boolean;
  };
}

export const getStockPrice = async (symbol: string): Promise<StockPrice | null> => {
  try {
    console.log(`[MarketData] Fetching real stock price for ${symbol}`);
    
    // Get FMP API key with improved error handling and consistent method
    let fmpApiKey;
    try {
      console.log('[MarketData] Requesting FMP API key from edge function...');
      const { data, error } = await supabase.functions.invoke('get-fmp-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (error) {
        console.error('[MarketData] Error invoking get-fmp-key function:', error);
        throw new Error(`Failed to get FMP API key: ${error.message}`);
      }
      
      if (!data?.key) {
        console.error('[MarketData] No FMP API key returned from function:', data);
        throw new Error('FMP API key not available - please check Supabase secrets configuration');
      }
      
      fmpApiKey = data.key;
      console.log('[MarketData] Successfully retrieved FMP API key');
      
    } catch (error) {
      console.error('[MarketData] Failed to get FMP API key:', error);
      throw new Error(`API key retrieval failed: ${error.message}`);
    }

    // Test FMP API connectivity with a simple validation call first
    console.log(`[MarketData] Testing FMP API connectivity for ${symbol}...`);
    const testResponse = await fetch(
      `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${fmpApiKey}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TradingApp/1.0'
        },
        timeout: 10000
      }
    );

    if (!testResponse.ok) {
      if (testResponse.status === 429) {
        console.error('[MarketData] FMP API rate limit reached');
        throw new Error('FMP API rate limit reached - please try again later');
      } else if (testResponse.status === 401 || testResponse.status === 403) {
        console.error('[MarketData] FMP API authentication failed');
        throw new Error('FMP API authentication failed - please check API key');
      } else {
        console.error(`[MarketData] FMP API error: ${testResponse.status} ${testResponse.statusText}`);
        throw new Error(`FMP API error: ${testResponse.status} - ${testResponse.statusText}`);
      }
    }

    const quotes = await testResponse.json();
    console.log(`[MarketData] Raw FMP API response for ${symbol}:`, quotes);
    
    if (!Array.isArray(quotes) || quotes.length === 0) {
      console.error(`[MarketData] No price data found for ${symbol}:`, quotes);
      throw new Error(`No price data found for ${symbol} - symbol may not exist or market may be closed`);
    }

    const quote = quotes[0];
    
    if (!quote.price || quote.price === 0) {
      console.error(`[MarketData] Invalid price data for ${symbol}:`, quote);
      throw new Error(`Invalid price data for ${symbol} - price is zero or null`);
    }

    const stockPrice = {
      symbol: quote.symbol,
      price: quote.price,
      change: quote.change || 0,
      changePercent: quote.changesPercentage || 0,
      timestamp: new Date().toISOString()
    };

    console.log(`[MarketData] Successfully retrieved real price data for ${symbol}:`, stockPrice);
    return stockPrice;

  } catch (error) {
    console.error(`[MarketData] Error fetching real price for ${symbol}:`, error);
    throw new Error(`Failed to fetch real market data for ${symbol}: ${error.message}`);
  }
};

const generateSimulatedPrice = (symbol: string): StockPrice => {
  // Generate realistic price based on symbol
  const basePrice = getBasePriceForSymbol(symbol);
  const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
  const price = basePrice * (1 + variation);
  const change = basePrice * variation;
  const changePercent = variation * 100;

  return {
    symbol,
    price: Math.round(price * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    timestamp: new Date().toISOString()
  };
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
    'QQQ': 380
  };

  return basePrices[symbol.toUpperCase()] || 150;
};

export const calculatePortfolioMetrics = async (timeRange: string): Promise<PortfolioMetrics> => {
  try {
    console.log(`Calculating portfolio metrics for timeRange: ${timeRange}`);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get date range for filtering
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'all':
      default:
        startDate = new Date('2020-01-01');
        break;
    }

    // Fetch strategies count
    const { data: strategies } = await supabase
      .from('strategies')
      .select('id, is_active')
      .eq('user_id', user.id);

    const totalStrategies = strategies?.length || 0;
    const activeStrategies = strategies?.filter(s => s.is_active)?.length || 0;

    // Fetch signals count in time range
    const { data: signals } = await supabase
      .from('trading_signals')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())
      .in('strategy_id', strategies?.map(s => s.id) || []);

    const signalAmount = signals?.length || 0;

    // Calculate transaction amount from signals
    const transactionAmount = (signals || []).reduce((total, signal) => {
      const signalData = signal.signal_data as any;
      const price = signalData?.price || 0;
      const volume = signalData?.volume || 0;
      return total + (price * volume);
    }, 0);

    return {
      strategiesCount: totalStrategies.toString(),
      strategiesChange: { value: "+0", positive: false },
      activeStrategies: activeStrategies.toString(),
      activeChange: { value: "+0", positive: false },
      signalAmount: signalAmount.toString(),
      signalChange: { value: "+0", positive: false },
      transactionAmount: Math.round(transactionAmount * 100) / 100,
      transactionChange: { value: "+0", positive: false }
    };

  } catch (error) {
    console.error('Error calculating portfolio metrics:', error);
    return {
      strategiesCount: "0",
      strategiesChange: { value: "+0", positive: false },
      activeStrategies: "0",
      activeChange: { value: "+0", positive: false },
      signalAmount: "0",
      signalChange: { value: "+0", positive: false },
      transactionAmount: 0,
      transactionChange: { value: "+0", positive: false }
    };
  }
};

export const getRealTradeHistory = async (timeRange: string = '7d') => {
  try {
    console.log(`Fetching real trade history for timeRange: ${timeRange}`);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get date range for filtering
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'all':
      default:
        startDate = new Date('2020-01-01');
        break;
    }

    // Fetch user's strategies first
    const { data: userStrategies } = await supabase
      .from('strategies')
      .select('id, name, target_asset')
      .eq('user_id', user.id);

    if (!userStrategies || userStrategies.length === 0) {
      console.log('No strategies found for user');
      return [];
    }

    const strategyIds = userStrategies.map(s => s.id);

    // Fetch trading signals for user's strategies in the specified time range
    const { data: signals, error } = await supabase
      .from('trading_signals')
      .select('*')
      .in('strategy_id', strategyIds)
      .eq('processed', true)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching trading signals:', error);
      return [];
    }

    if (!signals || signals.length === 0) {
      console.log('No trading signals found in time range');
      return [];
    }

    // Format signals into trade history format
    const formattedTrades = signals.map(signal => {
      const signalData = signal.signal_data as any;
      const strategy = userStrategies.find(s => s.id === signal.strategy_id);
      
      return {
        id: signal.id,
        date: new Date(signal.created_at).toLocaleDateString(),
        type: signal.signal_type === 'entry' ? 'Buy' : 'Sell',
        signal: signalData?.reason || 'Trading Signal',
        price: `$${(signalData?.price || 0).toFixed(2)}`,
        contracts: signalData?.volume || 0,
        profit: signalData?.profit !== null && signalData?.profit !== undefined 
          ? `${signalData.profit >= 0 ? '+' : ''}$${signalData.profit.toFixed(2)}` 
          : null,
        profitPercentage: signalData?.profitPercentage !== null && signalData?.profitPercentage !== undefined
          ? `${signalData.profitPercentage >= 0 ? '+' : ''}${signalData.profitPercentage.toFixed(2)}%`
          : null,
        strategyId: signal.strategy_id,
        strategyName: strategy?.name || 'Unknown Strategy',
        targetAsset: strategy?.target_asset || 'Unknown Asset'
      };
    });

    console.log(`Found ${formattedTrades.length} real trades in time range`);
    return formattedTrades;

  } catch (error) {
    console.error('Error fetching real trade history:', error);
    return [];
  }
};

import { supabase } from "@/integrations/supabase/client";
import { 
  getOptimizedCurrentPrice,
  batchGetCurrentPrices,
  fetchOptimizedMarketData,
  batchFetchMarketData,
  cleanupOptimizedCaches,
  warmUpCache,
  getOptimizedCacheStats,
  startRealTimePriceMonitoring
} from "./optimizedMarketDataService";

export interface MarketData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketDataOptions {
  symbol: string;
  timeframe: string;
  limit?: number;
  from?: string;
  to?: string;
}

// Use optimized implementation for better performance
export const getCurrentPrice = async (symbol: string): Promise<number | null> => {
  return await getOptimizedCurrentPrice(symbol);
};

export const getStockPrice = async (symbol: string): Promise<{ price: number } | null> => {
  const price = await getCurrentPrice(symbol);
  if (price === null) return null;
  return { price };
};

export const fetchMarketData = async (options: MarketDataOptions): Promise<MarketData[]> => {
  const { symbol, timeframe, limit = 100 } = options;
  
  try {
    const optimizedData = await fetchOptimizedMarketData(symbol, timeframe, limit);
    
    // Convert to the expected format
    return optimizedData.map(item => ({
      date: item.date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    }));
  } catch (error) {
    console.error(`[MarketData] Error fetching data for ${symbol}:`, error);
    throw error;
  }
};

// Batch operations for better performance
export const batchGetPrices = async (symbols: string[]): Promise<Map<string, number>> => {
  return await batchGetCurrentPrices(symbols);
};

export const batchGetMarketData = async (requests: Array<{
  symbols: string[];
  timeframe: string;
  limit?: number;
}>) => {
  return await batchFetchMarketData(requests);
};

// Extract arrays from market data for indicator calculations
export const extractIndicatorData = (marketData: MarketData[]) => {
  return {
    open: marketData.map(d => d.open),
    high: marketData.map(d => d.high),
    low: marketData.map(d => d.low),
    close: marketData.map(d => d.close),
    volume: marketData.map(d => d.volume)
  };
};

// Enhanced portfolio metrics calculation
export const calculatePortfolioMetrics = async (timeRange: string = '7d') => {
  try {
    console.log(`[Portfolio] Calculating optimized metrics for timeRange: ${timeRange}`);
    
    // This can be enhanced with real portfolio calculations later
    return {
      totalValue: "$0.00",
      totalChange: {
        value: "+$0.00",
        positive: true
      },
      winRate: "0%",
      winRateChange: {
        value: "+0%",
        positive: true
      },
      avgReturn: "0%",
      avgReturnChange: {
        value: "+0%",
        positive: true
      },
      sharpeRatio: "0.00",
      sharpeChange: {
        value: "+0.00",
        positive: true
      },
      lastUpdated: new Date().toISOString(),
      processingTime: Date.now()
    };
  } catch (error) {
    console.error('[Portfolio] Error calculating metrics:', error);
    return {
      totalValue: "$0.00",
      totalChange: { value: "+$0.00", positive: true },
      winRate: "0%",
      winRateChange: { value: "+0%", positive: true },
      avgReturn: "0%",
      avgReturnChange: { value: "+0%", positive: true },
      sharpeRatio: "0.00",
      sharpeChange: { value: "+0.00", positive: true },
      lastUpdated: new Date().toISOString(),
      processingTime: 0
    };
  }
};

// Performance monitoring and cache management
export const getMarketDataStats = () => {
  return getOptimizedCacheStats();
};

export const cleanupMarketDataCache = () => {
  return cleanupOptimizedCaches();
};

// Enhanced initialization with WebSocket support
export const initializeMarketDataCache = async (symbols: string[] = [], timeframes: string[] = ['1h', '4h', 'Daily']) => {
  try {
    console.log('[MarketData] Initializing cache with WebSocket support...');
    
    // Get active strategy symbols if none provided
    if (symbols.length === 0) {
      const { data: strategies } = await supabase
        .from('strategies')
        .select('target_asset')
        .eq('is_active', true);
      
      if (strategies) {
        symbols = [...new Set(strategies.map(s => s.target_asset).filter(Boolean))];
      }
    }
    
    if (symbols.length > 0) {
      // Initialize WebSocket connection and subscriptions
      await warmUpCache(symbols, timeframes);
      
      // Start real-time monitoring
      await startRealTimePriceMonitoring();
    }
    
    // Set up periodic cache cleanup
    setInterval(() => {
      cleanupOptimizedCaches();
    }, 30000);
    
    console.log('[MarketData] Cache initialization completed with WebSocket integration');
  } catch (error) {
    console.error('[MarketData] Error initializing cache:', error);
  }
};

// Real-time price monitoring for active strategies
export const startRealTimePriceMonitoring = async () => {
  try {
    const { data: strategies } = await supabase
      .from('strategies')
      .select('target_asset')
      .eq('is_active', true);

    if (strategies && strategies.length > 0) {
      const symbols = [...new Set(strategies.map(s => s.target_asset).filter(Boolean))];
      
      console.log(`[RealTimeMonitor] Starting real-time monitoring for ${symbols.length} symbols`);
      
      // Update prices every 15 seconds during market hours
      const updatePrices = async () => {
        try {
          await batchGetCurrentPrices(symbols);
        } catch (error) {
          console.error('[RealTimeMonitor] Error updating prices:', error);
        }
      };
      
      // Initial update
      await updatePrices();
      
      // Set up interval for continuous updates
      const interval = setInterval(updatePrices, 15000);
      
      // Clean up on page unload
      window.addEventListener('beforeunload', () => {
        clearInterval(interval);
      });
      
      return () => clearInterval(interval);
    }
  } catch (error) {
    console.error('[RealTimeMonitor] Error starting real-time monitoring:', error);
  }
};

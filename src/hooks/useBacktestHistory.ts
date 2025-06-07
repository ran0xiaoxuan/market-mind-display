
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BacktestHistoryItem {
  id: string;
  strategyName: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  totalReturn: number;
  totalReturnPercentage: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  createdAt: string;
}

// Cache for backtest history to avoid repeated API calls
const historyCache = new Map<string, {
  data: BacktestHistoryItem[];
  timestamp: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useBacktestHistory = () => {
  const [backtestHistory, setBacktestHistory] = useState<BacktestHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  const ITEMS_PER_PAGE = 20;

  // Optimized fetch function with caching and pagination
  const fetchBacktestHistory = useCallback(async (page = 0, useCache = true) => {
    const cacheKey = `backtest_history_${page}`;
    
    // Check cache first
    if (useCache && historyCache.has(cacheKey)) {
      const cached = historyCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Using cached backtest history for page', page);
        return cached.data;
      }
    }

    try {
      setError(null);
      console.log('Fetching backtest history page:', page);
      
      // Optimized query with proper joins and pagination
      const { data: backtests, error: fetchError } = await supabase
        .from('backtests')
        .select(`
          id,
          start_date,
          end_date,
          initial_capital,
          total_return,
          total_return_percentage,
          sharpe_ratio,
          max_drawdown,
          win_rate,
          total_trades,
          created_at,
          strategies!inner(name)
        `)
        .order('created_at', { ascending: false })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      if (fetchError) {
        console.error('Error fetching backtest history:', fetchError);
        throw new Error(`Failed to load backtest history: ${fetchError.message}`);
      }

      if (!backtests) {
        throw new Error('No data received from server');
      }

      console.log('Fetched backtest data for page', page, ':', backtests.length, 'items');

      const formattedHistory: BacktestHistoryItem[] = backtests.map(backtest => ({
        id: backtest.id,
        strategyName: backtest.strategies.name,
        startDate: backtest.start_date,
        endDate: backtest.end_date,
        initialCapital: backtest.initial_capital || 0,
        totalReturn: backtest.total_return || 0,
        totalReturnPercentage: backtest.total_return_percentage || 0,
        sharpeRatio: backtest.sharpe_ratio || 0,
        maxDrawdown: backtest.max_drawdown || 0,
        winRate: backtest.win_rate || 0,
        totalTrades: backtest.total_trades || 0,
        createdAt: backtest.created_at
      }));

      // Update cache
      historyCache.set(cacheKey, {
        data: formattedHistory,
        timestamp: Date.now()
      });

      // Check if there are more items
      setHasMore(formattedHistory.length === ITEMS_PER_PAGE);

      return formattedHistory;
    } catch (error: any) {
      console.error('Error in fetchBacktestHistory:', error);
      const errorMessage = error.message || 'An unexpected error occurred while loading backtest history';
      setError(errorMessage);
      throw error;
    }
  }, []);

  // Load initial page
  const loadInitialHistory = useCallback(async () => {
    setIsLoading(true);
    setCurrentPage(0);
    try {
      const data = await fetchBacktestHistory(0);
      setBacktestHistory(data);
    } catch (error) {
      console.error('Failed to load initial backtest history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchBacktestHistory]);

  // Load more pages (for pagination)
  const loadMoreHistory = useCallback(async () => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const data = await fetchBacktestHistory(nextPage);
      setBacktestHistory(prev => [...prev, ...data]);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Failed to load more backtest history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, hasMore, isLoading, fetchBacktestHistory]);

  // Refresh history (bypasses cache)
  const refreshHistory = useCallback(async () => {
    // Clear cache
    historyCache.clear();
    setCurrentPage(0);
    setIsLoading(true);
    try {
      const data = await fetchBacktestHistory(0, false);
      setBacktestHistory(data);
    } catch (error) {
      console.error('Failed to refresh backtest history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchBacktestHistory]);

  // Add new backtest to history (for real-time updates)
  const addBacktestToHistory = useCallback((newBacktest: BacktestHistoryItem) => {
    setBacktestHistory(prev => [newBacktest, ...prev]);
    // Clear cache since we have new data
    historyCache.clear();
  }, []);

  // Load initial data on mount
  useEffect(() => {
    loadInitialHistory();
  }, [loadInitialHistory]);

  return {
    backtestHistory,
    isLoading,
    error,
    hasMore,
    loadMoreHistory,
    refreshHistory,
    addBacktestToHistory
  };
};

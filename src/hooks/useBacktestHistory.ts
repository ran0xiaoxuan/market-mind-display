
import { useState, useEffect, useCallback } from 'react';

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

export const useBacktestHistory = () => {
  const [backtestHistory, setBacktestHistory] = useState<BacktestHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Load initial history - returns empty array since no backtest tables exist
  const loadInitialHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setBacktestHistory([]);
      setHasMore(false);
      setError(null);
    } catch (error) {
      console.error('Failed to load initial backtest history:', error);
      setError('Failed to load backtest history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load more pages (for pagination) - returns empty since no data
  const loadMoreHistory = useCallback(async () => {
    // No-op since there are no backtest tables
    return;
  }, []);

  // Refresh history (bypasses cache) - returns empty
  const refreshHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setBacktestHistory([]);
      setHasMore(false);
      setError(null);
    } catch (error) {
      console.error('Failed to refresh backtest history:', error);
      setError('Failed to refresh backtest history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add new backtest to history (for real-time updates)
  const addBacktestToHistory = useCallback((newBacktest: BacktestHistoryItem) => {
    setBacktestHistory(prev => [newBacktest, ...prev]);
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

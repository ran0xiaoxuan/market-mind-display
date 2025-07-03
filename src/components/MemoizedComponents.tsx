
import React from 'react';
import { MetricCard } from '@/components/MetricCard';
import { TradeHistoryTable } from '@/components/strategy-detail/TradeHistoryTable';

// Memoized MetricCard to prevent unnecessary re-renders
export const MemoizedMetricCard = React.memo(MetricCard);

// Memoized TradeHistoryTable to prevent unnecessary re-renders
export const MemoizedTradeHistoryTable = React.memo(TradeHistoryTable);

// Higher-order component for memoizing strategy cards
export const withMemoization = <T extends object>(Component: React.ComponentType<T>) => {
  return React.memo(Component);
};

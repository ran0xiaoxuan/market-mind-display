
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface BacktestHistoryTableProps {
  backtestHistory: BacktestHistoryItem[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  onViewDetails: (backtest: BacktestHistoryItem, event: React.MouseEvent) => void;
  onRowClick: (strategyName: string) => void;
}

export const BacktestHistoryTable = ({
  backtestHistory,
  isLoading,
  error,
  hasMore,
  onLoadMore,
  onRefresh,
  onViewDetails,
  onRowClick
}: BacktestHistoryTableProps) => {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-2">Error loading backtest history</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={onRefresh} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading && backtestHistory.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent border-zinc-800" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          No backtest history available
        </p>
        <Button 
          onClick={onRefresh} 
          variant="ghost" 
          size="sm"
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Backtest functionality is not yet available. Once implemented, your backtest results will appear here.
        </AlertDescription>
      </Alert>
    </div>
  );
};

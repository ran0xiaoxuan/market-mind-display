
import { useState } from "react";
import { format } from "date-fns";
import { Eye, RefreshCw, ChevronDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await onLoadMore();
    setLoadingMore(false);
  };

  const handleRowClick = async (backtest: BacktestHistoryItem) => {
    try {
      const { data, error } = await supabase
        .from('strategies')
        .select('id')
        .eq('name', backtest.strategyName)
        .single();
      
      if (data && !error) {
        onRowClick(data.id);
      } else {
        console.error('Could not find strategy ID:', error);
        toast.error('Could not navigate to strategy details');
      }
    } catch (error) {
      console.error('Error finding strategy:', error);
      toast.error('Could not navigate to strategy details');
    }
  };

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

  if (backtestHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground text-lg mb-2">No backtest history yet</p>
        <p className="text-sm text-muted-foreground">Run your first optimized backtest to see results here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Showing {backtestHistory.length} backtest{backtestHistory.length !== 1 ? 's' : ''}
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

      <div className="rounded-lg border border-zinc-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/50">
              <TableHead className="font-semibold text-zinc-700">Strategy</TableHead>
              <TableHead className="font-semibold text-zinc-700">Period</TableHead>
              <TableHead className="font-semibold text-zinc-700">Capital</TableHead>
              <TableHead className="font-semibold text-zinc-700">Return</TableHead>
              <TableHead className="font-semibold text-zinc-700">Win Rate</TableHead>
              <TableHead className="font-semibold text-zinc-700">Trades</TableHead>
              <TableHead className="font-semibold text-zinc-700">Date</TableHead>
              <TableHead className="font-semibold text-zinc-700 w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {backtestHistory.map((backtest) => (
              <TableRow 
                key={backtest.id}
                className="hover:bg-zinc-50/50 cursor-pointer transition-colors"
                onClick={() => handleRowClick(backtest)}
              >
                <TableCell className="font-medium text-zinc-900">
                  {backtest.strategyName}
                </TableCell>
                <TableCell className="text-sm text-zinc-600">
                  {format(new Date(backtest.startDate), "MMM dd")} - {format(new Date(backtest.endDate), "MMM dd, yyyy")}
                </TableCell>
                <TableCell className="text-sm text-zinc-600">
                  ${backtest.initialCapital.toLocaleString()}
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "font-medium text-sm",
                    backtest.totalReturnPercentage >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {backtest.totalReturnPercentage >= 0 ? '+' : ''}{backtest.totalReturnPercentage.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="text-sm text-zinc-600">
                  {backtest.winRate.toFixed(0)}%
                </TableCell>
                <TableCell className="text-sm text-zinc-600">
                  {backtest.totalTrades}
                </TableCell>
                <TableCell className="text-sm text-zinc-500">
                  {format(new Date(backtest.createdAt), "MMM dd")}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => onViewDetails(backtest, e)}
                    className="p-2 h-8 w-8 hover:bg-zinc-100"
                  >
                    <Eye className="h-4 w-4 text-zinc-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button 
            onClick={handleLoadMore}
            variant="outline"
            disabled={loadingMore}
            className="flex items-center gap-2"
          >
            {loadingMore ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                Loading...
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Load More
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

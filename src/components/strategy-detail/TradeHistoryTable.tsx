
import { useEffect, useState, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/Badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Trade {
  id?: string | number;
  date: string;
  type: string;
  signal: string;
  price: string;
  contracts: number;
  quantity?: number; // Number of shares/units
  amount?: number; // Total trade amount in dollars
  profit: string | null;
  profitPercentage?: string | null;
  strategyName?: string;
  targetAsset?: string;
  targetAssetName?: string;
  strategyId?: string;
}

interface TradeHistoryTableProps {
  trades: Trade[];
  maxRows?: number;
  onViewAllClick?: () => void;
  showViewAllButton?: boolean;
  enableRowClick?: boolean;
}

export const TradeHistoryTable = ({
  trades = [],
  maxRows,
  onViewAllClick,
  showViewAllButton = false,
  enableRowClick = false
}: TradeHistoryTableProps) => {
  const navigate = useNavigate();
  // Ensure we have valid trades array
  const safeTrades = Array.isArray(trades) ? trades : [];
  const displayTrades = maxRows ? safeTrades.slice(0, maxRows) : safeTrades;
  const hasMoreTrades = maxRows && safeTrades.length > maxRows;
  
  const handleRowClick = useCallback((trade: Trade) => {
    if (enableRowClick && trade.strategyId) {
      navigate(`/strategy/${trade.strategyId}`);
    }
  }, [navigate, enableRowClick]);

  // Format date to YYYY/MM/DD HH:MM format
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return dateString; // Return original string if invalid
      }
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}/${month}/${day} ${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return dateString; // Return original string if error occurs
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20">
            <TableHead className="whitespace-nowrap font-medium">Asset</TableHead>
            <TableHead className="whitespace-nowrap font-medium">Type</TableHead>
            <TableHead className="whitespace-nowrap font-medium">Time</TableHead>
            <TableHead className="whitespace-nowrap font-medium">Price</TableHead>
            <TableHead className="whitespace-nowrap font-medium">Quantity</TableHead>
            <TableHead className="whitespace-nowrap font-medium">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayTrades.length > 0 ? (
            displayTrades.map((trade, index) => {
              const isBuy = trade.type.toLowerCase().includes('buy');
              
              return (
                <TableRow 
                  key={index} 
                  className={enableRowClick ? "cursor-pointer hover:bg-muted/60" : ""}
                  onClick={() => handleRowClick(trade)}
                >
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="max-w-[160px] truncate">
                            {trade.targetAsset || "—"}
                          </div>
                        </TooltipTrigger>
                        {(trade.targetAssetName || trade.targetAsset) && (
                          <TooltipContent side="top" className="max-w-xs">
                            <p>{trade.targetAssetName || trade.targetAsset}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={isBuy ? "default" : "outline"}
                      className={isBuy ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"}
                    >
                      {trade.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDateTime(trade.date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {trade.price}
                  </TableCell>
                  <TableCell>
                    {trade.quantity !== undefined && trade.quantity !== null ? (
                      <span className="font-medium">{trade.quantity}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {trade.amount !== undefined && trade.amount !== null ? (
                      <span className="font-medium">${trade.amount.toFixed(2)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No trade history available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {showViewAllButton && (
        <div className="mt-4 flex justify-center">
          <Button 
            variant="outline" 
            onClick={onViewAllClick} 
            className="w-full"
          >
            View All Trades
          </Button>
        </div>
      )}
    </div>
  );
};

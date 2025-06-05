
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
  profit: string | null;
  profitPercentage?: string | null;
  strategyName?: string;
  targetAsset?: string;
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

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20">
            <TableHead className="whitespace-nowrap font-medium">Asset</TableHead>
            <TableHead className="whitespace-nowrap font-medium">Type</TableHead>
            <TableHead className="whitespace-nowrap font-medium">Date</TableHead>
            <TableHead className="whitespace-nowrap font-medium">Price</TableHead>
            <TableHead className="whitespace-nowrap font-medium">Volume</TableHead>
            <TableHead className="whitespace-nowrap font-medium">Profit/Loss</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayTrades.length > 0 ? (
            displayTrades.map((trade, index) => {
              const isBuy = trade.type.toLowerCase().includes('buy');
              const isProfitPositive = trade.profit ? !trade.profit.includes('-') : false;
              const isProfitNegative = trade.profit ? trade.profit.includes('-') : false;
              
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
                        {trade.targetAsset && (
                          <TooltipContent side="top" className="max-w-xs">
                            <p>{trade.targetAsset}</p>
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
                    {trade.date}
                  </TableCell>
                  <TableCell>
                    {trade.price}
                  </TableCell>
                  <TableCell>
                    {trade.contracts}
                  </TableCell>
                  <TableCell>
                    {!isBuy && trade.profit && (
                      <div className="flex flex-col">
                        <span className={
                          isProfitPositive ? "text-green-600" : 
                          isProfitNegative ? "text-red-600" : ""
                        }>
                          {trade.profit}
                        </span>
                        {trade.profitPercentage && (
                          <span className={`text-xs ${
                            isProfitPositive ? "text-green-600" : 
                            isProfitNegative ? "text-red-600" : ""
                          }`}>
                            {trade.profitPercentage}
                          </span>
                        )}
                      </div>
                    )}
                    {isBuy && (
                      <span className="text-gray-400">—</span>
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

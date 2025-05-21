
import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

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
  strategyId?: string; // Added strategyId field
}

interface TradeHistoryTableProps {
  trades: Trade[];
}

export const TradeHistoryTable = ({
  trades = []
}: TradeHistoryTableProps) => {
  // Ensure we have valid trades array
  const safeTrades = Array.isArray(trades) ? trades : [];
  const [strategiesMap, setStrategiesMap] = useState<Record<string, string>>({});
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(false);
  
  // Fetch strategy names from Supabase when component mounts
  useEffect(() => {
    const fetchStrategyNames = async () => {
      // Extract unique strategy IDs from trades
      const strategyIds = safeTrades
        .filter(trade => trade.strategyId)
        .map(trade => trade.strategyId);
      
      if (strategyIds.length === 0) return;
      
      try {
        setIsLoadingStrategies(true);
        const { data, error } = await supabase
          .from('strategies')
          .select('id, name')
          .in('id', strategyIds);
        
        if (error) {
          console.error("Error fetching strategy names:", error);
          return;
        }
        
        // Create a map of strategy IDs to names
        const strategiesMap: Record<string, string> = {};
        data.forEach(strategy => {
          strategiesMap[strategy.id] = strategy.name;
        });
        
        setStrategiesMap(strategiesMap);
      } catch (err) {
        console.error("Error in fetchStrategyNames:", err);
      } finally {
        setIsLoadingStrategies(false);
      }
    };
    
    fetchStrategyNames();
  }, [safeTrades]);
  
  // Function to get strategy name from ID or fall back to name in trade data
  const getStrategyName = (trade: Trade) => {
    if (trade.strategyId && strategiesMap[trade.strategyId]) {
      return strategiesMap[trade.strategyId];
    }
    return trade.strategyName || "—";
  };
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20">
            <TableHead className="whitespace-nowrap font-medium">Strategy</TableHead>
            <TableHead className="whitespace-nowrap font-medium">Asset</TableHead>
            <TableHead className="whitespace-nowrap font-medium">Type</TableHead>
            <TableHead className="whitespace-nowrap font-medium">Date</TableHead>
            <TableHead className="whitespace-nowrap font-medium">Price</TableHead>
            <TableHead className="whitespace-nowrap font-medium">Volume</TableHead>
            <TableHead className="whitespace-nowrap font-medium">Profit/Loss</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {safeTrades.length > 0 ? (
            safeTrades.map((trade, index) => {
              const isBuy = trade.type.toLowerCase().includes('buy');
              const isProfitPositive = trade.profit ? !trade.profit.includes('-') : false;
              const isProfitNegative = trade.profit ? trade.profit.includes('-') : false;
              const strategyName = getStrategyName(trade);
              
              return (
                <TableRow key={index}>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="max-w-[160px] truncate">
                            {isLoadingStrategies ? "Loading..." : strategyName}
                          </div>
                        </TooltipTrigger>
                        {strategyName && strategyName !== "—" && (
                          <TooltipContent side="top" className="max-w-xs">
                            <p>{strategyName}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    {trade.targetAsset || "—"}
                  </TableCell>
                  <TableCell>
                    {trade.type}
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
              <TableCell colSpan={7} className="h-24 text-center">
                No trade history available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

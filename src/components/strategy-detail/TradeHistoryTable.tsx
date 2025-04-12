import { ArrowDownUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
interface Trade {
  id?: number;
  date: string;
  type: string;
  signal: string;
  price: string;
  contracts: number;
  profit: string;
  profitPercentage?: string;
}
interface TradeHistoryTableProps {
  trades: Trade[];
}
export const TradeHistoryTable = ({
  trades
}: TradeHistoryTableProps) => {
  return <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20">
            <TableHead className="whitespace-nowrap font-medium">
              <div className="flex items-center gap-1">
                Trade # <ArrowDownUp size={14} className="text-muted-foreground" />
              </div>
            </TableHead>
            <TableHead className="whitespace-nowrap font-medium">Type</TableHead>
            <TableHead className="whitespace-nowrap font-medium">Date/Time</TableHead>
            <TableHead className="whitespace-nowrap font-medium">Price</TableHead>
            <TableHead className="whitespace-nowrap font-medium">Volume</TableHead>
            <TableHead className="whitespace-nowrap font-medium">Profit/Loss</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade, index) => {
          const tradeId = trade.id || trades.length - index;
          const isEntryRow = trade.type.toLowerCase().includes('entry');
          const isExitRow = trade.type.toLowerCase().includes('exit');
          const isProfitPositive = parseFloat(trade.profit?.replace(/[^0-9.-]+/g, '') || '0') > 0;
          const isProfitNegative = parseFloat(trade.profit?.replace(/[^0-9.-]+/g, '') || '0') < 0;
          // Determine if the trade is a buy or sell based on its type
          const tradeType = isEntryRow ? "Buy" : "Sell";
          return <TableRow key={index} className={isEntryRow ? "border-b-0 pb-0" : ""}>
                {isEntryRow && <TableCell rowSpan={2} className="align-center font-medium text-center">
                    {tradeId}
                  </TableCell>}
                <TableCell className="py-3">
                  {trade.signal}
                </TableCell>
                <TableCell className="py-3">
                  {trade.date}
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex flex-col">
                    <span>{trade.price}</span>
                    <span className="text-muted-foreground text-xs">USD</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-left">{trade.contracts}</TableCell>
                <TableCell className="py-3">
                  {isExitRow && trade.profit && <div className="flex flex-col items-left">
                      <span className={isProfitPositive ? "text-green-600" : isProfitNegative ? "text-red-600" : ""}>
                        {trade.profit}
                      </span>
                      {trade.profitPercentage && <span className={`text-xs ${isProfitPositive ? "text-green-600" : isProfitNegative ? "text-red-600" : ""}`}>
                          {trade.profitPercentage}
                        </span>}
                    </div>}
                </TableCell>
              </TableRow>;
        })}
        </TableBody>
      </Table>
    </div>;
};
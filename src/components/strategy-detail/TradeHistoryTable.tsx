
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Trade {
  date: string;
  type: string;
  price: string;
  shares: number;
  profitLoss: string;
  profitLossAmount: string;
}

interface TradeHistoryTableProps {
  trades: Trade[];
}

export const TradeHistoryTable = ({ trades }: TradeHistoryTableProps) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Shares</TableHead>
            <TableHead>Profit/Loss</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade, index) => (
            <TableRow key={index}>
              <TableCell>{trade.date}</TableCell>
              <TableCell className={trade.type === "Buy" ? "text-green-500" : "text-red-500"}>
                {trade.type}
              </TableCell>
              <TableCell>{trade.price}</TableCell>
              <TableCell>{trade.shares}</TableCell>
              <TableCell>
                {trade.profitLoss !== "-" ? (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-green-500">{trade.profitLoss}</span>
                    <span className="text-green-500">{trade.profitLossAmount}</span>
                  </div>
                ) : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

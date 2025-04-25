
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card } from "@/components/ui/card";

const recentTradesData = [{
  date: "2024-03",
  day: "03",
  strategy: "RSI Strategy",
  symbol: "AAPL",
  type: "Buy",
  typeColor: "text-green-600",
  price: "$172.40",
  shares: "100",
  pnl: "-",
  pnlColor: ""
}, {
  date: "2024-03",
  day: "03",
  strategy: "Moving Average",
  symbol: "TSLA",
  type: "Sell",
  typeColor: "text-red-600",
  price: "$149.75",
  shares: "150",
  pnl: "-3.2%",
  pnlColor: "text-red-600"
}, {
  date: "2024-03",
  day: "03",
  strategy: "Bollinger Bands",
  symbol: "GOOGL",
  type: "Buy",
  typeColor: "text-green-600",
  price: "$147.00",
  shares: "200",
  pnl: "-",
  pnlColor: ""
}, {
  date: "2024-03",
  day: "02",
  strategy: "RSI Strategy",
  symbol: "MSFT",
  type: "Sell",
  typeColor: "text-red-600",
  price: "$177.82",
  shares: "75",
  pnl: "-1.8%",
  pnlColor: "text-red-600"
}, {
  date: "2024-03",
  day: "02",
  strategy: "Moving Average",
  symbol: "AMZN",
  type: "Sell",
  typeColor: "text-red-600",
  price: "$178.75",
  shares: "125",
  pnl: "+0.5%",
  pnlColor: "text-green-600"
}];

export function RecentTrades() {
  return <Card>
      <div className="p-6 pb-3">
        <h3 className="text-lg font-semibold mb-2">Trade Analysis</h3>
        <p className="text-sm text-muted-foreground">Latest trades across all strategies</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Strategy</TableHead>
            <TableHead>Symbol</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Shares</TableHead>
            <TableHead>P/L</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentTradesData.map((trade, index) => <TableRow key={index}>
              <TableCell>{`${trade.date}-${trade.day}`}</TableCell>
              <TableCell>{trade.strategy}</TableCell>
              <TableCell>{trade.symbol}</TableCell>
              <TableCell className={trade.typeColor}>{trade.type}</TableCell>
              <TableCell>{trade.price}</TableCell>
              <TableCell>{trade.shares}</TableCell>
              <TableCell className={trade.pnlColor}>{trade.pnl}</TableCell>
            </TableRow>)}
        </TableBody>
      </Table>

      <div className="p-4 flex justify-center">
        
      </div>
    </Card>;
}

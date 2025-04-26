
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface BacktestResultsProps {
  activeTab: "summary" | "trades";
  onTabChange: (tab: "summary" | "trades") => void;
}

export function BacktestResults({ activeTab, onTabChange }: BacktestResultsProps) {
  return (
    <div className="border-t pt-4">
      <h4 className="text-sm text-muted-foreground mb-3">Backtest Results</h4>
      <Tabs defaultValue={activeTab} onValueChange={(value) => onTabChange(value as "summary" | "trades")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="summary">
            Summary
          </TabsTrigger>
          <TabsTrigger value="trades">
            Trades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Performance Metrics</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Return</span>
                  <span className="text-sm font-medium text-green-600">+21.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Annualized Return</span>
                  <span className="text-sm font-medium text-green-600">+21.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
                  <span className="text-sm font-medium">1.8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Max Drawdown</span>
                  <span className="text-sm font-medium text-red-600">-5.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Win Rate</span>
                  <span className="text-sm font-medium">68%</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Trade Statistics</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Trades</span>
                  <span className="text-sm font-medium">25</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Winning Trades</span>
                  <span className="text-sm font-medium">17</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Losing Trades</span>
                  <span className="text-sm font-medium">8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg. Profit</span>
                  <span className="text-sm font-medium text-green-600">$245.80</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg. Loss</span>
                  <span className="text-sm font-medium text-red-600">-$125.30</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trades">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead className="text-right">P/L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { date: "04/01/2024", type: "Buy", price: "$320.45", shares: "100", pl: "-" },
                  { date: "04/03/2024", type: "Sell", price: "$345.80", shares: "100", pl: "+$25.35" },
                  { date: "04/05/2024", type: "Buy", price: "$342.10", shares: "150", pl: "-" },
                  { date: "04/08/2024", type: "Sell", price: "$354.75", shares: "150", pl: "+$12.65" }
                ].map((trade, index) => (
                  <TableRow key={index}>
                    <TableCell>{trade.date}</TableCell>
                    <TableCell>{trade.type}</TableCell>
                    <TableCell>{trade.price}</TableCell>
                    <TableCell>{trade.shares}</TableCell>
                    <TableCell className={`text-right ${
                      trade.pl.startsWith("+") ? "text-green-600" : 
                      trade.pl.startsWith("-") ? "text-red-600" : ""
                    }`}>
                      {trade.pl}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

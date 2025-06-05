
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface BacktestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  backtest: {
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
  } | null;
}

export const BacktestDetailsModal = ({ isOpen, onClose, backtest }: BacktestDetailsModalProps) => {
  if (!backtest) return null;

  // Mock trade data for demonstration - in a real app, this would be fetched from the database
  const mockTrades = [
    { date: "2024-01-15", type: "Buy", price: 150.25, contracts: 100, profit: null },
    { date: "2024-01-18", type: "Sell", price: 155.80, contracts: 100, profit: 555 },
    { date: "2024-01-22", type: "Buy", price: 148.90, contracts: 150, profit: null },
    { date: "2024-01-25", type: "Sell", price: 152.30, contracts: 150, profit: 510 },
    { date: "2024-01-29", type: "Buy", price: 146.75, contracts: 200, profit: null },
    { date: "2024-02-01", type: "Sell", price: 151.20, contracts: 200, profit: 890 },
  ];

  const performanceMetrics = [
    {
      name: "Total Return",
      value: `${backtest.totalReturnPercentage >= 0 ? '+' : ''}${backtest.totalReturnPercentage.toFixed(2)}%`,
      green: backtest.totalReturnPercentage > 0
    },
    {
      name: "Sharpe Ratio",
      value: backtest.sharpeRatio.toFixed(2)
    },
    {
      name: "Max Drawdown",
      value: `-${backtest.maxDrawdown.toFixed(2)}%`
    },
    {
      name: "Win Rate",
      value: `${backtest.winRate.toFixed(1)}%`
    },
    {
      name: "Total Trades",
      value: backtest.totalTrades.toString()
    }
  ];

  const tradeStatistics = [
    {
      name: "Winning Trades",
      value: Math.floor(backtest.totalTrades * (backtest.winRate / 100)).toString()
    },
    {
      name: "Losing Trades",
      value: (backtest.totalTrades - Math.floor(backtest.totalTrades * (backtest.winRate / 100))).toString()
    },
    {
      name: "Initial Capital",
      value: `$${backtest.initialCapital.toLocaleString()}`
    },
    {
      name: "Final Value",
      value: `$${(backtest.initialCapital + backtest.totalReturn).toLocaleString()}`
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Backtest Details - {backtest.strategyName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {format(new Date(backtest.startDate), "MMM dd, yyyy")} to {format(new Date(backtest.endDate), "MMM dd, yyyy")}
          </p>
        </DialogHeader>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Performance Metrics</TabsTrigger>
            <TabsTrigger value="statistics">Trade Statistics</TabsTrigger>
            <TabsTrigger value="trades">Individual Trades</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-4">Performance Overview</h3>
                <div className="space-y-3">
                  {performanceMetrics.map((metric, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{metric.name}</span>
                      <span className={cn(
                        "text-sm font-medium",
                        metric.green ? "text-green-600" : 
                        metric.value.startsWith("+") ? "text-green-600" : 
                        metric.value.startsWith("-") ? "text-red-600" : ""
                      )}>
                        {metric.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="statistics" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-4">Trading Statistics</h3>
                <div className="space-y-3">
                  {tradeStatistics.map((stat, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{stat.name}</span>
                      <span className="text-sm font-medium">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trades" className="mt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Contracts</TableHead>
                    <TableHead className="text-right">P/L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTrades.map((trade, index) => (
                    <TableRow key={index}>
                      <TableCell>{format(new Date(trade.date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{trade.type}</TableCell>
                      <TableCell>${trade.price.toFixed(2)}</TableCell>
                      <TableCell>{trade.contracts}</TableCell>
                      <TableCell className={cn(
                        "text-right",
                        trade.profit ? trade.profit > 0 ? "text-green-600" : "text-red-600" : ""
                      )}>
                        {trade.profit ? `$${trade.profit.toFixed(2)}` : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

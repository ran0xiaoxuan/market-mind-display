import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Copy, PlayIcon, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/Badge";

const StrategyDetail = () => {
  const { strategyId } = useParams<{ strategyId: string }>();
  const [activeTab, setActiveTab] = useState("overview");

  // Placeholder data based on the strategy name from the URL
  // In a real app, you'd fetch this data from an API
  const strategy = {
    name: strategyId?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    description: "A strategy that generates signals based on when a faster moving average crosses a slower moving average.",
    status: "active",
    performance: "+8.2%",
    annualized: "+24.6%",
    sharpeRatio: "1.4",
    maxDrawdown: "-5.2%",
    winRate: "62%",
    profitFactor: "1.8",
    createdDate: "2023-10-15",
    lastUpdated: "2 days ago",
    market: "Stocks",
    timeframe: "Daily",
    targetAsset: "AAPL - Apple Inc.",
    startingValue: "$10,000",
    currentValue: "$15,000",
    totalGrowth: "+50.0%",
    trades: [
      { date: "2023-12-01", type: "Buy", price: "$150.25", shares: 10, profitLoss: "-" },
      { date: "2023-12-15", type: "Sell", price: "$158.50", shares: 10, profitLoss: "+5.5%" },
      { date: "2024-01-10", type: "Buy", price: "$155.75", shares: 12, profitLoss: "-" },
      { date: "2024-01-25", type: "Sell", price: "$162.25", shares: 12, profitLoss: "+4.2%" },
      { date: "2024-02-05", type: "Buy", price: "$160.50", shares: 15, profitLoss: "-" },
      { date: "2024-02-20", type: "Sell", price: "$168.75", shares: 15, profitLoss: "+5.1%" }
    ],
    performanceMetrics: {
      totalReturn: "17.00%",
      annualizedReturn: "34.00%",
      sharpeRatio: "1.8",
      maxDrawdown: "-3.8%",
      winRate: "68%"
    },
    tradeStats: {
      totalTrades: 25,
      winningTrades: 17,
      losingTrades: 8,
      avgProfit: "$320.45",
      avgLoss: "-$175.20"
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header section */}
          <div className="mb-6">
            <Link to="/strategies" className="text-sm flex items-center mb-4 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold">{strategy.name}</h1>
                <Badge variant="outline" className={strategy.status === "active" ? "bg-muted" : "bg-muted text-muted-foreground"}>
                  Active
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Copy className="h-4 w-4" />
                  Copy Strategy
                </Button>
                <Button variant="outline" className="gap-2">
                  <PlayIcon className="h-4 w-4" />
                  Run Backtest
                </Button>
                <Button variant="outline" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
            
            <p className="text-muted-foreground mt-1">
              {strategy.description}
            </p>
          </div>
          
          {/* Performance summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <div>
                <h3 className="text-sm text-muted-foreground">Total Return</h3>
                <p className="text-2xl font-semibold text-green-500">{strategy.performance}</p>
                <p className="text-xs text-muted-foreground">Annualized: <span className="text-green-500">{strategy.annualized}</span></p>
              </div>
            </Card>
            <Card className="p-4">
              <div>
                <h3 className="text-sm text-muted-foreground">Sharpe Ratio</h3>
                <p className="text-2xl font-semibold">{strategy.sharpeRatio}</p>
                <p className="text-xs text-muted-foreground">Max Drawdown: <span className="text-red-500">{strategy.maxDrawdown}</span></p>
              </div>
            </Card>
            <Card className="p-4">
              <div>
                <h3 className="text-sm text-muted-foreground">Win Rate</h3>
                <p className="text-2xl font-semibold">{strategy.winRate}</p>
                <p className="text-xs text-muted-foreground">Profit Factor: {strategy.profitFactor}</p>
              </div>
            </Card>
          </div>
          
          {/* Navigation tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="trades">Trades</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="pt-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-2">Strategy Information</h2>
                <p className="text-sm text-muted-foreground mb-4">Basic information about this strategy</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{strategy.createdDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{strategy.lastUpdated}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Market</p>
                    <p className="font-medium">{strategy.market}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Timeframe</p>
                    <p className="font-medium">{strategy.timeframe}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Target Asset</p>
                    <p className="font-medium">{strategy.targetAsset}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <p className="font-medium">Active</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">This strategy is currently active and will generate trading signals.</p>
                    <p className="text-xs text-muted-foreground mt-1">Note: Status can only be changed from the strategy settings page.</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 mt-6">
                <h2 className="text-xl font-semibold mb-2">Performance Summary</h2>
                <p className="text-sm text-muted-foreground mb-4">Key performance metrics for this strategy</p>
                
                <Tabs defaultValue="equity-curve" className="w-full">
                  <TabsList>
                    <TabsTrigger value="equity-curve">Equity Curve</TabsTrigger>
                    <TabsTrigger value="returns">Returns</TabsTrigger>
                    <TabsTrigger value="drawdown">Drawdown</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="equity-curve" className="pt-4">
                    <div className="h-[300px] flex flex-col items-center justify-center border border-dashed rounded-md">
                      <p className="text-lg font-medium">Equity curve data not available</p>
                      <p className="text-sm text-muted-foreground max-w-md text-center mt-2">
                        This chart would display your portfolio value over time, showing the growth of your investments.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Starting Value</p>
                        <p className="font-medium">{strategy.startingValue}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Current Value</p>
                        <p className="font-medium text-green-500">{strategy.currentValue}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Growth</p>
                        <p className="font-medium text-green-500">{strategy.totalGrowth}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Annualized</p>
                        <p className="font-medium text-green-500">{strategy.annualized}</p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Other tab content would be similar */}
                </Tabs>
              </Card>
            </TabsContent>
            
            <TabsContent value="performance" className="pt-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-2">Performance Metrics</h2>
                <p className="text-sm text-muted-foreground mb-4">Detailed performance analysis</p>
                
                <Tabs defaultValue="summary">
                  <TabsList>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="equity-curve">Equity Curve</TabsTrigger>
                    <TabsTrigger value="trades">Trades</TabsTrigger>
                    <TabsTrigger value="monthly-returns">Monthly Returns</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="summary" className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-medium mb-3">Performance Metrics</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Total Return</span>
                            <span className="text-sm font-medium text-green-500">{strategy.performanceMetrics.totalReturn}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Annualized Return</span>
                            <span className="text-sm font-medium text-green-500">{strategy.performanceMetrics.annualizedReturn}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Sharpe Ratio</span>
                            <span className="text-sm font-medium">{strategy.performanceMetrics.sharpeRatio}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Max Drawdown</span>
                            <span className="text-sm font-medium text-red-500">{strategy.performanceMetrics.maxDrawdown}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Win Rate</span>
                            <span className="text-sm font-medium">{strategy.performanceMetrics.winRate}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-3">Trade Statistics</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Total Trades</span>
                            <span className="text-sm font-medium">{strategy.tradeStats.totalTrades}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Winning Trades</span>
                            <span className="text-sm font-medium">{strategy.tradeStats.winningTrades}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Losing Trades</span>
                            <span className="text-sm font-medium">{strategy.tradeStats.losingTrades}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Avg. Profit</span>
                            <span className="text-sm font-medium text-green-500">{strategy.tradeStats.avgProfit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Avg. Loss</span>
                            <span className="text-sm font-medium text-red-500">{strategy.tradeStats.avgLoss}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Other tab content would be similar */}
                </Tabs>
              </Card>
            </TabsContent>
            
            <TabsContent value="rules" className="pt-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-2">Strategy Rules</h2>
                <p className="text-sm text-muted-foreground mb-6">Trading rules and conditions</p>
                
                {/* Simplified rules section for now */}
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Entry Rules</h3>
                    <div className="border rounded-md p-4">
                      <p>SMA(20) crosses above SMA(50)</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Exit Rules</h3>
                    <div className="border rounded-md p-4">
                      <p>SMA(20) crosses below SMA(50)</p>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="trades" className="pt-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-2">Trade History</h2>
                <p className="text-sm text-muted-foreground mb-6">Historical trades executed by this strategy</p>
                
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
                      {strategy.trades.map((trade, index) => (
                        <TableRow key={index}>
                          <TableCell>{trade.date}</TableCell>
                          <TableCell className={trade.type === "Buy" ? "text-green-500" : "text-red-500"}>
                            {trade.type}
                          </TableCell>
                          <TableCell>{trade.price}</TableCell>
                          <TableCell>{trade.shares}</TableCell>
                          <TableCell className={trade.profitLoss.startsWith("+") ? "text-green-500" : ""}>
                            {trade.profitLoss}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mt-6">
                  <Button variant="outline">Export Trade History</Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default StrategyDetail;

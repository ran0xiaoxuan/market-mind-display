import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Copy, PlayIcon, Edit, Trash2, Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/Badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const StrategyDetail = () => {
  const { strategyId } = useParams<{ strategyId: string }>();
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  
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
    riskManagement: {
      stopLoss: "5",
      takeProfit: "15",
      singleBuyVolume: "1000",
      maxBuyVolume: "5000"
    },
    trades: [{
      date: "2023-12-01",
      type: "Buy",
      price: "$150.25",
      shares: 10,
      profitLoss: "-",
      profitLossAmount: "-"
    }, {
      date: "2023-12-15",
      type: "Sell",
      price: "$158.50",
      shares: 10,
      profitLoss: "+5.5%",
      profitLossAmount: "+$82.50"
    }, {
      date: "2024-01-10",
      type: "Buy",
      price: "$155.75",
      shares: 12,
      profitLoss: "-",
      profitLossAmount: "-"
    }, {
      date: "2024-01-25",
      type: "Sell",
      price: "$162.25",
      shares: 12,
      profitLoss: "+4.2%",
      profitLossAmount: "+$78.00"
    }, {
      date: "2024-02-05",
      type: "Buy",
      price: "$160.50",
      shares: 15,
      profitLoss: "-",
      profitLossAmount: "-"
    }, {
      date: "2024-02-20",
      type: "Sell",
      price: "$168.75",
      shares: 15,
      profitLoss: "+5.1%",
      profitLossAmount: "+$123.75"
    }],
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
    },
    entryRules: [{
      id: 1,
      indicator: "SMA",
      condition: "Crosses Above",
      value: "SMA",
      indicatorPeriod: "20",
      valuePeriod: "50",
    }],
    exitRules: [{
      id: 1,
      indicator: "SMA",
      condition: "Crosses Below",
      value: "SMA",
      indicatorPeriod: "20",
      valuePeriod: "50",
    }]
  };
  
  const [isActive, setIsActive] = useState(strategy.status === "active");
  
  const handleStatusChange = (checked: boolean) => {
    setIsActive(checked);
    toast({
      title: `Strategy ${checked ? 'activated' : 'deactivated'}`,
      description: `The strategy is now ${checked ? 'active' : 'inactive'} and will ${checked ? '' : 'not'} generate trading signals.`,
    });
  };

  return <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link to="/strategies" className="text-sm flex items-center mb-4 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold">{strategy.name}</h1>
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
                <Button variant="outline" className="gap-2 bg-red-600 hover:bg-red-500 text-slate-50">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
          
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
                <p className="text-muted-foreground mb-4">{strategy.description}</p>
                
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
                      <Switch id="strategy-status" checked={isActive} onCheckedChange={handleStatusChange} />
                    </div>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 mt-6">
                <div className="mb-2">
                  <h2 className="text-xl font-semibold">Risk Management</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Parameters to control risk exposure and trading volume
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Stop Loss</p>
                      <p className="font-medium text-red-500">{strategy.riskManagement.stopLoss}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Take Profit</p>
                      <p className="font-medium text-green-500">{strategy.riskManagement.takeProfit}%</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Single Buy Volume</p>
                      <p className="font-medium">${strategy.riskManagement.singleBuyVolume}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Max Buy Volume</p>
                      <p className="font-medium">${strategy.riskManagement.maxBuyVolume}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="performance" className="pt-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-2">Performance Metrics</h2>
                <p className="text-sm text-muted-foreground mb-4">Detailed performance analysis</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
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
              </Card>
            </TabsContent>
            
            <TabsContent value="rules" className="pt-6">
              <Card className="p-6 mb-6">
                <h2 className="text-xl font-semibold mb-1">Trading Rules</h2>
                <p className="text-sm text-muted-foreground mb-4">Entry and exit conditions for this strategy</p>
                
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-4">Entry Rules</h3>
                  
                  {strategy.entryRules.map((rule) => (
                    <div key={rule.id} className="mb-4 pb-4 border-b border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">Inequality {rule.id}</div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                        <div>
                          <Label>Indicator</Label>
                          <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background">
                            {rule.indicator}
                          </div>
                        </div>
                        
                        <div>
                          <Label>Condition</Label>
                          <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background">
                            {rule.condition}
                          </div>
                        </div>
                        
                        <div>
                          <Label>Value</Label>
                          <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background">
                            {rule.value}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Parameters Period</Label>
                          <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background">
                            {rule.indicatorPeriod}
                          </div>
                        </div>
                        
                        <div>
                          <Label>Value Parameters Period</Label>
                          <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background">
                            {rule.valuePeriod}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Exit Rules</h3>
                  
                  {strategy.exitRules.map((rule) => (
                    <div key={rule.id} className="mb-4 pb-4 border-b border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">Inequality {rule.id}</div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                        <div>
                          <Label>Indicator</Label>
                          <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background">
                            {rule.indicator}
                          </div>
                        </div>
                        
                        <div>
                          <Label>Condition</Label>
                          <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background">
                            {rule.condition}
                          </div>
                        </div>
                        
                        <div>
                          <Label>Value</Label>
                          <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background">
                            {rule.value}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Parameters Period</Label>
                          <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background">
                            {rule.indicatorPeriod}
                          </div>
                        </div>
                        
                        <div>
                          <Label>Value Parameters Period</Label>
                          <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background">
                            {rule.valuePeriod}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end">
                  <Button variant="outline" className="gap-2" asChild>
                    <Link to={`/strategy/${strategyId}/edit`}>
                      <Edit className="h-4 w-4 mr-1" /> Edit Rules
                    </Link>
                  </Button>
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
                      {strategy.trades.map((trade, index) => <TableRow key={index}>
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
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>;
};
export default StrategyDetail;

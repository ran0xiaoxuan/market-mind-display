
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Copy, 
  PlayIcon, 
  Edit, 
  Trash2, 
  History, 
  LineChart,
  MoreHorizontal,
  ChevronRight,
  CheckCircle2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/Badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Toggle, toggleVariants } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const LogicalAndBadge = () => (
  <div className="rounded-md bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1">
    AND
  </div>
);

const LogicalOrBadge = ({ count }: { count?: number }) => (
  <div className="rounded-md bg-amber-100 text-amber-700 text-xs font-medium px-2 py-1 flex items-center gap-1">
    <span>OR</span>
    {count && count > 0 && (
      <span className="bg-amber-700 text-amber-50 rounded-full text-[10px] w-4 h-4 inline-flex items-center justify-center">
        {count}
      </span>
    )}
  </div>
);

const LogicalOrCounter = ({ count, required = 1 }: { count: number, required?: number }) => (
  <div className="flex items-center justify-center gap-1 mb-2 mt-1">
    <span className="text-xs text-muted-foreground">
      At least {required === 1 ? "one" : required} of {count} conditions must be met
    </span>
    <CheckCircle2 className="h-3 w-3 text-amber-700" />
  </div>
);

const StrategyDetail = () => {
  const { strategyId } = useParams<{ strategyId: string; }>();
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
    trades: [
      {
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
      }
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
    },
    entryRules: [
      {
        id: 1,
        logic: "AND",
        inequalities: [
          {
            id: 1,
            left: {
              type: "indicator",
              indicator: "SMA",
              parameters: { period: "20" }
            },
            condition: "Crosses Above",
            right: {
              type: "indicator",
              indicator: "SMA",
              parameters: { period: "50" }
            }
          },
          {
            id: 2,
            left: {
              type: "price",
              value: "Close"
            },
            condition: "Greater Than",
            right: {
              type: "value",
              value: "200"
            }
          }
        ]
      },
      {
        id: 2,
        logic: "OR",
        inequalities: [
          {
            id: 1,
            left: {
              type: "indicator",
              indicator: "RSI",
              parameters: { period: "14" }
            },
            condition: "Less Than",
            right: {
              type: "value",
              value: "30"
            }
          }
        ]
      }
    ],
    exitRules: [
      {
        id: 1,
        logic: "AND",
        inequalities: [
          {
            id: 1,
            left: {
              type: "indicator",
              indicator: "SMA",
              parameters: { period: "20" }
            },
            condition: "Crosses Below",
            right: {
              type: "indicator",
              indicator: "SMA",
              parameters: { period: "50" }
            }
          },
          {
            id: 2,
            left: {
              type: "indicator",
              indicator: "MACD",
              parameters: { fast: "12", slow: "26", signal: "9" }
            },
            condition: "Crosses Below",
            right: {
              type: "value",
              value: "0"
            }
          }
        ]
      },
      {
        id: 2,
        logic: "OR",
        inequalities: [
          {
            id: 1,
            left: {
              type: "price",
              value: "Close"
            },
            condition: "Less Than",
            right: {
              type: "value",
              value: "Stop Loss"
            }
          }
        ]
      }
    ]
  };

  const [isActive, setIsActive] = useState(strategy.status === "active");
  const handleStatusChange = (checked: boolean) => {
    setIsActive(checked);
    toast({
      title: `Strategy ${checked ? 'activated' : 'deactivated'}`,
      description: `The strategy is now ${checked ? 'active' : 'inactive'} and will ${checked ? '' : 'not'} generate trading signals.`
    });
  };

  const renderSide = (side: any) => {
    if (side.type === "indicator") {
      return (
        <div className="flex flex-col">
          <span className="font-medium">{side.indicator}</span>
          <span className="text-xs text-muted-foreground">
            {Object.entries(side.parameters).map(([key, value]) => 
              `${key}: ${value}`
            ).join(', ')}
          </span>
        </div>
      );
    } else if (side.type === "price") {
      return <span className="font-medium">{side.value} Price</span>;
    } else {
      return <span className="font-medium">{side.value}</span>;
    }
  };

  const renderInequality = (inequality: any) => (
    <div key={inequality.id} className="bg-slate-50 p-3 rounded-lg">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
        <div className="p-2 bg-white rounded border">
          {renderSide(inequality.left)}
        </div>
        <div className="flex justify-center">
          <Badge variant="outline" className="bg-white font-medium text-center">
            {inequality.condition}
          </Badge>
        </div>
        <div className="p-2 bg-white rounded border">
          {renderSide(inequality.right)}
        </div>
      </div>
    </div>
  );

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
              
              <div className="flex items-center gap-2">
                <ToggleGroup type="single" defaultValue="overview">
                  <Link to={`/strategy/${strategyId}/edit`}>
                    <Button variant="outline" size="sm" className="h-9 px-2.5 border border-input">
                      <Edit className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  </Link>
                  
                  <ToggleGroupItem value="backtest" aria-label="Run Backtest" asChild>
                    <Button variant="outline" className="h-9 px-2.5 border border-input" onClick={() => {
                      toast({
                        title: "Backtest started",
                        description: "Running backtest for this strategy..."
                      });
                    }}>
                      <PlayIcon className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Backtest</span>
                    </Button>
                  </ToggleGroupItem>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 px-2.5 border border-input"
                    onClick={() => {
                      toast({
                        title: "Strategy copied",
                        description: "A copy of this strategy has been created"
                      });
                    }}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Copy</span>
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 px-2.5 border border-input">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuSeparator />
                      <Link to={`/strategy/${strategyId}/history`}>
                        <DropdownMenuItem>
                          <History className="h-4 w-4 mr-2" />
                          Edit History
                        </DropdownMenuItem>
                      </Link>
                      <Link to={`/strategy/${strategyId}/backtests`}>
                        <DropdownMenuItem>
                          <LineChart className="h-4 w-4 mr-2" />
                          Backtest History
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => {
                        toast({
                          title: "Delete strategy?",
                          description: "This action cannot be undone."
                        });
                      }}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Strategy
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </ToggleGroup>
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
                <p className="text-sm text-muted-foreground mb-4">Detailed performance analysis (Only trades that generated trading signals are included.)</p>
                
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
                <p className="text-sm text-muted-foreground mb-6">Entry and exit conditions for this strategy</p>
                
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-4">Entry Rules</h3>
                  
                  {strategy.entryRules.map((ruleGroup, groupIndex) => (
                    <div key={`entry-${ruleGroup.id}`} className="mb-6">
                      {groupIndex > 0 && (
                        <div className="flex justify-center my-3">
                          <LogicalOrBadge />
                        </div>
                      )}
                      
                      {ruleGroup.inequalities.length > 1 && ruleGroup.logic === "OR" && (
                        <LogicalOrCounter count={ruleGroup.inequalities.length} />
                      )}
                      
                      <div className="space-y-3">
                        {ruleGroup.inequalities.map((inequality, ineqIndex) => (
                          <div key={`entry-${ruleGroup.id}-${inequality.id}`}>
                            {ineqIndex > 0 && (
                              <div className="flex justify-center my-3">
                                {ruleGroup.logic === "AND" ? <LogicalAndBadge /> : <LogicalOrBadge />}
                              </div>
                            )}
                            {renderInequality(inequality)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Exit Rules</h3>
                  
                  {strategy.exitRules.map((ruleGroup, groupIndex) => (
                    <div key={`exit-${ruleGroup.id}`} className="mb-6">
                      {groupIndex > 0 && (
                        <div className="flex justify-center my-3">
                          <LogicalOrBadge />
                        </div>
                      )}
                      
                      {ruleGroup.inequalities.length > 1 && ruleGroup.logic === "OR" && (
                        <LogicalOrCounter count={ruleGroup.inequalities.length} />
                      )}
                      
                      <div className="space-y-3">
                        {ruleGroup.inequalities.map((inequality, ineqIndex) => (
                          <div key={`exit-${ruleGroup.id}-${inequality.id}`}>
                            {ineqIndex > 0 && (
                              <div className="flex justify-center my-3">
                                {ruleGroup.logic === "AND" ? <LogicalAndBadge /> : <LogicalOrBadge />}
                              </div>
                            )}
                            {renderInequality(inequality)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
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
                            {trade.profitLoss !== "-" ? <div className="flex items-center gap-2">
                                <span className="font-medium text-green-500">{trade.profitLoss}</span>
                                <span className="text-green-500">{trade.profitLossAmount}</span>
                              </div> : "-"}
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

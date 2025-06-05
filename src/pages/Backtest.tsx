import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { CalendarIcon, PlayIcon, History } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { getStrategies, Strategy } from "@/services/strategyService";
import { toast } from "sonner";
import { StrategySelect } from "@/components/backtest/StrategySelect";
import { runBacktest, BacktestResult } from "@/services/backtestService";
import { supabase } from "@/integrations/supabase/client";

interface BacktestHistoryItem {
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
  createdAt: string;
}

const Backtest = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [strategy, setStrategy] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [initialCapital, setInitialCapital] = useState<string>("10000");
  const [hasResults, setHasResults] = useState<boolean>(false);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [backtestResults, setBacktestResults] = useState<BacktestResult | null>(null);
  const [runningBacktest, setRunningBacktest] = useState<boolean>(false);
  const [backtestHistory, setBacktestHistory] = useState<BacktestHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const {
    toast: showToast
  } = useToast();

  // Memoized function to fetch backtest history
  const fetchBacktestHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      setHistoryError(null);
      
      console.log('Fetching backtest history...');
      
      const {
        data: backtests,
        error
      } = await supabase.from('backtests').select(`
          id,
          start_date,
          end_date,
          initial_capital,
          total_return,
          total_return_percentage,
          sharpe_ratio,
          max_drawdown,
          win_rate,
          total_trades,
          created_at,
          strategies!inner(name)
        `).order('created_at', {
        ascending: false
      });
      
      if (error) {
        console.error('Error fetching backtest history:', error);
        setHistoryError('Failed to load backtest history');
        return;
      }
      
      console.log('Backtest history fetched:', backtests?.length || 0, 'records');
      
      const formattedHistory: BacktestHistoryItem[] = backtests?.map(backtest => ({
        id: backtest.id,
        strategyName: backtest.strategies.name,
        startDate: backtest.start_date,
        endDate: backtest.end_date,
        initialCapital: backtest.initial_capital,
        totalReturn: backtest.total_return || 0,
        totalReturnPercentage: backtest.total_return_percentage || 0,
        sharpeRatio: backtest.sharpe_ratio || 0,
        maxDrawdown: backtest.max_drawdown || 0,
        winRate: backtest.win_rate || 0,
        totalTrades: backtest.total_trades || 0,
        createdAt: backtest.created_at
      })) || [];
      
      setBacktestHistory(formattedHistory);
    } catch (error) {
      console.error('Error in fetchBacktestHistory:', error);
      setHistoryError('Failed to load backtest history');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Fetch backtest history only once on component mount
  useEffect(() => {
    fetchBacktestHistory();
  }, [fetchBacktestHistory]);

  // Fetch strategies from database
  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        setIsLoading(true);
        const data = await getStrategies();
        setStrategies(data);
      } catch (error) {
        console.error("Error fetching strategies:", error);
        showToast({
          title: "Error loading strategies",
          description: "Failed to load your strategies for selection",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStrategies();
  }, [showToast]);

  // Parse URL search parameters to get strategy ID if present
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const strategyId = searchParams.get("strategyId");
    if (strategyId) {
      setStrategy(strategyId);
      showToast({
        title: "Strategy selected",
        description: "Strategy has been automatically selected for backtest"
      });
    }
  }, [location.search, showToast]);

  // New function to disable future dates
  const disableFutureDates = (date: Date) => {
    return date > new Date();
  };

  const handleBacktestRowClick = (strategyId: string) => {
    navigate(`/strategy/${strategyId}`);
  };

  const runBacktestHandler = async () => {
    if (!strategy) {
      showToast({
        title: "Strategy is required",
        description: "Please select a strategy for your backtest",
        variant: "destructive"
      });
      return;
    }
    if (!startDate || !endDate) {
      showToast({
        title: "Date range is required",
        description: "Please select both start and end dates for your backtest",
        variant: "destructive"
      });
      return;
    }
    setRunningBacktest(true);
    toast.success("Backtest started", {
      description: "Running backtest with real market data..."
    });
    try {
      const result = await runBacktest({
        strategyId: strategy,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        initialCapital: parseFloat(initialCapital)
      });
      setBacktestResults(result);
      setHasResults(true);
      toast.success("Backtest completed", {
        description: `Generated ${result.totalTrades} trades with ${result.totalReturnPercentage.toFixed(2)}% return`
      });

      // Refresh backtest history after successful completion
      await fetchBacktestHistory();
    } catch (error: any) {
      console.error("Backtest error:", error);
      toast.error("Backtest failed", {
        description: error.message || "An unexpected error occurred during backtesting"
      });
    } finally {
      setRunningBacktest(false);
    }
  };
  const formatMetrics = () => {
    if (!backtestResults) return null;
    return {
      performanceMetrics: [{
        name: "Total Return",
        value: `${backtestResults.totalReturnPercentage >= 0 ? '+' : ''}${backtestResults.totalReturnPercentage.toFixed(2)}%`,
        green: backtestResults.totalReturnPercentage > 0
      }, {
        name: "Annualized Return",
        value: `${backtestResults.annualizedReturn >= 0 ? '+' : ''}${backtestResults.annualizedReturn.toFixed(2)}%`,
        green: backtestResults.annualizedReturn > 0
      }, {
        name: "Sharpe Ratio",
        value: backtestResults.sharpeRatio.toFixed(2)
      }, {
        name: "Max Drawdown",
        value: `-${backtestResults.maxDrawdown.toFixed(2)}%`
      }, {
        name: "Win Rate",
        value: `${backtestResults.winRate.toFixed(1)}%`
      }],
      tradeStatistics: [{
        name: "Total Trades",
        value: backtestResults.totalTrades.toString()
      }, {
        name: "Winning Trades",
        value: backtestResults.winningTrades.toString()
      }, {
        name: "Losing Trades",
        value: backtestResults.losingTrades.toString()
      }, {
        name: "Avg. Profit",
        value: `$${backtestResults.avgProfit.toFixed(2)}`,
        green: backtestResults.avgProfit > 0
      }, {
        name: "Avg. Loss",
        value: `$${backtestResults.avgLoss.toFixed(2)}`
      }]
    };
  };
  const metrics = formatMetrics();
  return <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Container className="py-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Backtest</h1>
          </div>

          <div className="space-y-6">
            {/* Main Backtest Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Backtest Parameters Card */}
              <Card className="shadow-sm border-zinc-200">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-bold mb-1">Backtest Parameters</h2>
                  <p className="text-muted-foreground text-sm mb-6">Configure the parameters for your backtest with real market data.</p>

                  <div className="space-y-6">
                    <StrategySelect selectedStrategy={strategy} strategies={strategies} isLoading={isLoading} onSelectStrategy={setStrategy} disabled={runningBacktest} />

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Time Period</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">Start Date</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")} disabled={runningBacktest}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "MM/dd/yyyy") : "mm/dd/yyyy"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-white" align="start">
                              <Calendar mode="single" selected={startDate} onSelect={setStartDate} disabled={disableFutureDates} initialFocus className="p-3 pointer-events-auto" />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">End Date</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")} disabled={runningBacktest}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "MM/dd/yyyy") : "mm/dd/yyyy"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-white" align="start">
                              <Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={disableFutureDates} initialFocus className="p-3 pointer-events-auto" />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="initialCapital" className="text-sm font-medium">Initial Capital ($)</label>
                      <Input id="initialCapital" type="number" value={initialCapital} onChange={e => setInitialCapital(e.target.value)} placeholder="10000" disabled={runningBacktest} className="bg-background" />
                    </div>

                    <Button onClick={runBacktestHandler} className="w-full bg-zinc-950 hover:bg-zinc-800 text-white" disabled={runningBacktest}>
                      {runningBacktest ? <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent" /> 
                          Running Backtest...
                        </> : <>
                          <PlayIcon className="h-4 w-4 mr-2" /> Run Backtest
                        </>}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Backtest Results Card */}
              <Card className="shadow-sm border-zinc-200">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-bold mb-1">Backtest Results</h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    {hasResults ? "View the performance of your strategy using real market data." : "Run a backtest to see results here."}
                  </p>

                  {hasResults && metrics ? <div>
                      <Tabs defaultValue="summary" className="mb-6">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="summary">Summary</TabsTrigger>
                          <TabsTrigger value="trades">Trades</TabsTrigger>
                        </TabsList>
                        <TabsContent value="summary" className="pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h3 className="font-medium mb-3">Performance Metrics</h3>
                              <div className="space-y-2">
                                {metrics.performanceMetrics.map((metric, index) => <div key={index} className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{metric.name}</span>
                                    <span className={cn("text-sm font-medium", metric.green ? "text-green-600" : metric.value.startsWith("+") ? "text-green-600" : metric.value.startsWith("-") ? "text-red-600" : "")}>
                                      {metric.value}
                                    </span>
                                  </div>)}
                              </div>
                            </div>
                            <div>
                              <h3 className="font-medium mb-3">Trade Statistics</h3>
                              <div className="space-y-2">
                                {metrics.tradeStatistics.map((stat, index) => <div key={index} className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{stat.name}</span>
                                    <span className={cn("text-sm font-medium", stat.green ? "text-green-600" : stat.value.startsWith("+") ? "text-green-600" : stat.value.startsWith("-") ? "text-red-600" : "")}>
                                      {stat.value}
                                    </span>
                                  </div>)}
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
                                {backtestResults?.trades.slice(0, 10).map((trade, index) => <TableRow key={index}>
                                    <TableCell>{new Date(trade.date).toLocaleDateString()}</TableCell>
                                    <TableCell>{trade.type}</TableCell>
                                    <TableCell>${trade.price.toFixed(2)}</TableCell>
                                    <TableCell>{trade.contracts}</TableCell>
                                    <TableCell className={cn("text-right", trade.profit ? trade.profit > 0 ? "text-green-600" : "text-red-600" : "")}>
                                      {trade.profit ? `$${trade.profit.toFixed(2)}` : "-"}
                                    </TableCell>
                                  </TableRow>)}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div> : <div className="flex flex-col items-center justify-center h-64">
                      {runningBacktest ? <div className="flex flex-col items-center">
                          <div className="h-8 w-8 mb-4 animate-spin rounded-full border-4 border-t-transparent border-zinc-800" /> 
                          <p className="text-muted-foreground">Processing your backtest with real market data...</p>
                        </div> : <p className="text-muted-foreground">No backtest results to display. Click "Run Backtest" to start.</p>}
                    </div>}
                </CardContent>
              </Card>
            </div>

            {/* Backtest History Section */}
            <Card className="shadow-sm border-zinc-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-6">
                  <h2 className="text-xl font-bold">Backtest History</h2>
                </div>
                
                {loadingHistory ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent border-zinc-800" />
                  </div>
                ) : historyError ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <History className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-lg mb-2">Error loading backtest history</p>
                    <p className="text-sm text-muted-foreground mb-4">{historyError}</p>
                    <Button onClick={fetchBacktestHistory} variant="outline">Try Again</Button>
                  </div>
                ) : backtestHistory.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Strategy</TableHead>
                          <TableHead>Time Period</TableHead>
                          <TableHead>Initial Capital</TableHead>
                          <TableHead>Total Return</TableHead>
                          <TableHead>Sharpe Ratio</TableHead>
                          <TableHead>Max Drawdown</TableHead>
                          <TableHead>Win Rate</TableHead>
                          <TableHead>Trades</TableHead>
                          <TableHead>Date Run</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {backtestHistory.map(backtest => (
                          <TableRow 
                            key={backtest.id} 
                            className="hover:bg-muted/50 cursor-pointer"
                            onClick={() => {
                              // Extract strategy ID from the backtest data
                              // We need to fetch this from the strategies table since it's not directly available
                              supabase
                                .from('strategies')
                                .select('id')
                                .eq('name', backtest.strategyName)
                                .single()
                                .then(({ data, error }) => {
                                  if (data && !error) {
                                    handleBacktestRowClick(data.id);
                                  } else {
                                    console.error('Could not find strategy ID:', error);
                                    toast.error('Could not navigate to strategy details');
                                  }
                                });
                            }}
                          >
                            <TableCell className="font-medium">{backtest.strategyName}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{format(new Date(backtest.startDate), "MMM dd, yyyy")}</div>
                                <div className="text-muted-foreground">to {format(new Date(backtest.endDate), "MMM dd, yyyy")}</div>
                              </div>
                            </TableCell>
                            <TableCell>${backtest.initialCapital.toLocaleString()}</TableCell>
                            <TableCell>
                              <span className={cn("font-medium", backtest.totalReturnPercentage >= 0 ? "text-green-600" : "text-red-600")}>
                                {backtest.totalReturnPercentage >= 0 ? '+' : ''}{backtest.totalReturnPercentage.toFixed(2)}%
                              </span>
                            </TableCell>
                            <TableCell>{backtest.sharpeRatio.toFixed(2)}</TableCell>
                            <TableCell className="text-red-600">-{backtest.maxDrawdown.toFixed(2)}%</TableCell>
                            <TableCell>{backtest.winRate.toFixed(1)}%</TableCell>
                            <TableCell>{backtest.totalTrades}</TableCell>
                            <TableCell>{format(new Date(backtest.createdAt), "MMM dd, yyyy")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <History className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-lg mb-2">No backtest history yet</p>
                    <p className="text-sm text-muted-foreground">Run your first backtest to see results here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </Container>
      </main>
    </div>;
};

export default Backtest;

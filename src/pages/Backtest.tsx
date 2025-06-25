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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { getStrategies, Strategy } from "@/services/strategyService";
import { toast } from "sonner";
import { StrategySelect } from "@/components/backtest/StrategySelect";
import { runOptimizedBacktest, BacktestResult, clearBacktestCaches } from "@/services/optimizedBacktestService";
import { BacktestDetailsModal } from "@/components/backtest/BacktestDetailsModal";
import { BacktestProgressIndicator } from "@/components/backtest/BacktestProgressIndicator";
import { useBacktestProgress } from "@/hooks/useBacktestProgress";
import { useBacktestHistory } from "@/hooks/useBacktestHistory";
import { BacktestHistoryTable } from "@/components/backtest/BacktestHistoryTable";

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
  
  // Risk Management Parameters
  const [stopLoss, setStopLoss] = useState<string>("5");
  const [takeProfit, setTakeProfit] = useState<string>("10");
  const [singleBuyVolume, setSingleBuyVolume] = useState<string>("1000");
  const [maxBuyVolume, setMaxBuyVolume] = useState<string>("5000");
  
  const [hasResults, setHasResults] = useState<boolean>(false);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [backtestResults, setBacktestResults] = useState<BacktestResult | null>(null);
  const [selectedBacktest, setSelectedBacktest] = useState<BacktestHistoryItem | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Use the progress tracking hook
  const {
    progress,
    isRunning: runningBacktest,
    startProgress,
    updateProgress,
    completeProgress,
    resetProgress
  } = useBacktestProgress();

  // Use the optimized backtest history hook
  const {
    backtestHistory,
    isLoading: loadingHistory,
    error: historyError,
    hasMore,
    loadMoreHistory,
    refreshHistory,
    addBacktestToHistory
  } = useBacktestHistory();
  
  const { toast: showToast } = useToast();

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

  // Optimized backtest handler with progress tracking and risk management
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

    // Validate risk management parameters
    const stopLossValue = parseFloat(stopLoss);
    const takeProfitValue = parseFloat(takeProfit);
    const singleBuyVolumeValue = parseFloat(singleBuyVolume);
    const maxBuyVolumeValue = parseFloat(maxBuyVolume);

    if (isNaN(stopLossValue) || stopLossValue <= 0) {
      showToast({
        title: "Invalid Stop Loss",
        description: "Stop Loss must be a positive number",
        variant: "destructive"
      });
      return;
    }

    if (isNaN(takeProfitValue) || takeProfitValue <= 0) {
      showToast({
        title: "Invalid Take Profit", 
        description: "Take Profit must be a positive number",
        variant: "destructive"
      });
      return;
    }

    if (isNaN(singleBuyVolumeValue) || singleBuyVolumeValue <= 0) {
      showToast({
        title: "Invalid Single Buy Volume",
        description: "Single Buy Volume must be a positive number",
        variant: "destructive"
      });
      return;
    }

    if (isNaN(maxBuyVolumeValue) || maxBuyVolumeValue <= 0) {
      showToast({
        title: "Invalid Max Buy Volume",
        description: "Max Buy Volume must be a positive number",
        variant: "destructive"
      });
      return;
    }

    if (singleBuyVolumeValue > maxBuyVolumeValue) {
      showToast({
        title: "Invalid Volume Settings",
        description: "Single Buy Volume cannot exceed Max Buy Volume",
        variant: "destructive"
      });
      return;
    }

    try {
      startProgress();
      toast.success("Optimized backtest started", {
        description: "Using enhanced algorithms with risk management..."
      });

      const result = await runOptimizedBacktest({
        strategyId: strategy,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        initialCapital: parseFloat(initialCapital),
        stopLoss: stopLossValue,
        takeProfit: takeProfitValue,
        singleBuyVolume: singleBuyVolumeValue,
        maxBuyVolume: maxBuyVolumeValue
      }, updateProgress);

      setBacktestResults(result);
      setHasResults(true);
      completeProgress();
      toast.success("Backtest completed successfully", {
        description: `Generated ${result.totalTrades} trades with ${result.totalReturnPercentage.toFixed(2)}% return`
      });

      // Refresh backtest history after successful completion
      await refreshHistory();
    } catch (error: any) {
      console.error("Optimized backtest error:", error);
      resetProgress();
      toast.error("Backtest failed", {
        description: error.message || "An unexpected error occurred during backtesting"
      });
    }
  };

  // Cancel backtest handler
  const cancelBacktest = () => {
    resetProgress();
    toast.info("Backtest cancelled", {
      description: "The backtest operation has been cancelled"
    });
  };

  // Clear caches handler
  const handleClearCaches = () => {
    clearBacktestCaches();
    toast.success("Performance caches cleared", {
      description: "Backtest caches have been cleared for optimal performance"
    });
  };

  const handleViewDetails = (backtest: BacktestHistoryItem, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedBacktest(backtest);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedBacktest(null);
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Container className="py-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Backtest</h1>
          </div>

          <div className="space-y-6">
            {/* Progress Indicator */}
            <BacktestProgressIndicator progress={progress} isRunning={runningBacktest} onCancel={cancelBacktest} />

            {/* Main Backtest Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Backtest Parameters Card */}
              <Card className="shadow-sm border-zinc-200">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-bold mb-1">Backtest Parameters</h2>
                  <p className="text-muted-foreground text-sm mb-6">Configure the parameters for your optimized backtest with real market data.</p>

                  <div className="space-y-6">
                    <StrategySelect 
                      selectedStrategy={strategy} 
                      strategies={strategies} 
                      isLoading={isLoading} 
                      onSelectStrategy={setStrategy} 
                      disabled={runningBacktest} 
                    />

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Time Period</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">Start Date</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="outline" 
                                className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")} 
                                disabled={runningBacktest}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "MM/dd/yyyy") : "mm/dd/yyyy"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-white" align="start">
                              <Calendar 
                                mode="single" 
                                selected={startDate} 
                                onSelect={setStartDate} 
                                disabled={disableFutureDates} 
                                initialFocus 
                                className="p-3 pointer-events-auto" 
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">End Date</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="outline" 
                                className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")} 
                                disabled={runningBacktest}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "MM/dd/yyyy") : "mm/dd/yyyy"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-white" align="start">
                              <Calendar 
                                mode="single" 
                                selected={endDate} 
                                onSelect={setEndDate} 
                                disabled={disableFutureDates} 
                                initialFocus 
                                className="p-3 pointer-events-auto" 
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="initialCapital" className="text-sm font-medium">Initial Capital ($)</label>
                      <Input 
                        id="initialCapital" 
                        type="number" 
                        value={initialCapital} 
                        onChange={e => setInitialCapital(e.target.value)} 
                        placeholder="10000" 
                        disabled={runningBacktest} 
                        className="bg-background" 
                      />
                    </div>

                    {/* Risk Management Parameters */}
                    <div className="space-y-4 border-t pt-4">
                      <h3 className="text-sm font-medium text-muted-foreground">Risk Management</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="stopLoss" className="text-sm font-medium">Stop Loss (%)</label>
                          <Input 
                            id="stopLoss" 
                            type="number" 
                            step="0.1"
                            min="0"
                            value={stopLoss} 
                            onChange={e => setStopLoss(e.target.value)} 
                            placeholder="5" 
                            disabled={runningBacktest} 
                            className="bg-background" 
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="takeProfit" className="text-sm font-medium">Take Profit (%)</label>
                          <Input 
                            id="takeProfit" 
                            type="number" 
                            step="0.1"
                            min="0"
                            value={takeProfit} 
                            onChange={e => setTakeProfit(e.target.value)} 
                            placeholder="10" 
                            disabled={runningBacktest} 
                            className="bg-background" 
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="singleBuyVolume" className="text-sm font-medium">Single Buy Volume ($)</label>
                          <Input 
                            id="singleBuyVolume" 
                            type="number" 
                            step="100"
                            min="0"
                            value={singleBuyVolume} 
                            onChange={e => setSingleBuyVolume(e.target.value)} 
                            placeholder="1000" 
                            disabled={runningBacktest} 
                            className="bg-background" 
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="maxBuyVolume" className="text-sm font-medium">Max Buy Volume ($)</label>
                          <Input 
                            id="maxBuyVolume" 
                            type="number" 
                            step="100"
                            min="0"
                            value={maxBuyVolume} 
                            onChange={e => setMaxBuyVolume(e.target.value)} 
                            placeholder="5000" 
                            disabled={runningBacktest} 
                            className="bg-background" 
                          />
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={runBacktestHandler} 
                      className="w-full bg-zinc-950 hover:bg-zinc-800 text-white" 
                      disabled={runningBacktest}
                    >
                      {runningBacktest ? (
                        <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent" /> 
                          Running Optimized Backtest...
                        </>
                      ) : (
                        <>
                          <PlayIcon className="h-4 w-4 mr-2" /> Run Optimized Backtest
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Backtest Results Card */}
              <Card className="shadow-sm border-zinc-200">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-bold mb-1">Backtest Results</h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    {hasResults ? "View the performance of your strategy using optimized algorithms and real market data." : "Run an optimized backtest to see results here."}
                  </p>

                  {hasResults && metrics ? (
                    <div>
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
                                {metrics.performanceMetrics.map((metric, index) => (
                                  <div key={index} className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{metric.name}</span>
                                    <span className={cn("text-sm font-medium", 
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
                            <div>
                              <h3 className="font-medium mb-3">Trade Statistics</h3>
                              <div className="space-y-2">
                                {metrics.tradeStatistics.map((stat, index) => (
                                  <div key={index} className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{stat.name}</span>
                                    <span className={cn("text-sm font-medium", 
                                      stat.green ? "text-green-600" :
                                      stat.value.startsWith("+") ? "text-green-600" : 
                                      stat.value.startsWith("-") ? "text-red-600" : ""
                                    )}>
                                      {stat.value}
                                    </span>
                                  </div>
                                ))}
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
                                {backtestResults?.trades.slice(0, 10).map((trade, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{new Date(trade.date).toLocaleDateString()}</TableCell>
                                    <TableCell>{trade.type}</TableCell>
                                    <TableCell>${trade.price.toFixed(2)}</TableCell>
                                    <TableCell>{trade.contracts}</TableCell>
                                    <TableCell className={cn("text-right", 
                                      trade.profit ? 
                                        trade.profit > 0 ? "text-green-600" : "text-red-600" : ""
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
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64">
                      {runningBacktest ? (
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 mb-4 animate-spin rounded-full border-4 border-t-transparent border-zinc-800" /> 
                          <p className="text-muted-foreground">Processing your optimized backtest...</p>
                          {progress && <p className="text-sm text-gray-500 mt-2">{progress.message}</p>}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No backtest results to display. Click "Run Optimized Backtest" to start.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </main>

      <BacktestDetailsModal 
        isOpen={isDetailsModalOpen} 
        onClose={handleCloseDetailsModal} 
        backtest={selectedBacktest} 
      />
    </div>
  );
};

export default Backtest;

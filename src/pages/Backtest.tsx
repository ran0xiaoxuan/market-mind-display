import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, PlayIcon, Save } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";
import { getStrategies, Strategy } from "@/services/strategyService";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SaveBacktestDialog } from "@/components/backtest/SaveBacktestDialog";

const Backtest = () => {
  const location = useLocation();
  const [strategy, setStrategy] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [initialCapital, setInitialCapital] = useState<string>("10000");
  const [positionSize, setPositionSize] = useState<string>("10");
  const [hasResults, setHasResults] = useState<boolean>(false);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [backtestResults, setBacktestResults] = useState<any>(null);
  const [runningBacktest, setRunningBacktest] = useState<boolean>(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState<boolean>(false);
  
  const { toast } = useToast();

  // Fetch strategies from database
  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        setIsLoading(true);
        const data = await getStrategies();
        setStrategies(data);
      } catch (error) {
        console.error("Error fetching strategies:", error);
        toast({
          title: "Error loading strategies",
          description: "Failed to load your strategies for selection",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStrategies();
  }, []);

  // Parse URL search parameters to get strategy ID if present
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const strategyId = searchParams.get("strategyId");
    
    if (strategyId) {
      setStrategy(strategyId);
      toast({
        title: "Strategy selected",
        description: "Strategy has been automatically selected for backtest"
      });
    }
  }, [location.search, toast]);

  const performanceMetrics = [
    {
      name: "Total Return",
      value: "17.00%",
      green: true
    }, {
      name: "Annualized Return",
      value: "34.00%",
      green: true
    }, {
      name: "Sharpe Ratio",
      value: "1.8"
    }, {
      name: "Max Drawdown",
      value: "-3.8%"
    }, {
      name: "Win Rate",
      value: "68%"
    }
  ];

  const tradeStatistics = [
    {
      name: "Total Trades",
      value: "25"
    }, {
      name: "Winning Trades",
      value: "17"
    }, {
      name: "Losing Trades",
      value: "8"
    }, {
      name: "Avg. Profit",
      value: "$320.45",
      green: true
    }, {
      name: "Avg. Loss",
      value: "-$175.20"
    }
  ];

  const runBacktest = async () => {
    if (!strategy) {
      toast({
        title: "Strategy is required",
        description: "Please select a strategy for your backtest",
        variant: "destructive"
      });
      return;
    }
    if (!startDate || !endDate) {
      toast({
        title: "Date range is required",
        description: "Please select both start and end dates for your backtest",
        variant: "destructive"
      });
      return;
    }
    
    setRunningBacktest(true);
    toast({
      title: "Backtest running",
      description: "Your backtest is being processed..."
    });
    
    try {
      // Fetch strategy trading rules using the new database structure
      const { data: ruleGroups, error: ruleGroupsError } = await supabase
        .from('rule_groups')
        .select('*')
        .eq('strategy_id', strategy);
        
      if (ruleGroupsError) {
        throw new Error(`Failed to fetch rule groups: ${ruleGroupsError.message}`);
      }
      
      // For each rule group, fetch the associated trading rules
      let allRules = [];
      
      for (const group of ruleGroups || []) {
        const { data: rules, error: rulesError } = await supabase
          .from('trading_rules')
          .select('*')
          .eq('rule_group_id', group.id);
          
        if (rulesError) {
          throw new Error(`Failed to fetch trading rules: ${rulesError.message}`);
        }
        
        allRules.push({
          ...group,
          rules: rules || []
        });
      }
      
      console.log('Fetched rule groups and rules:', allRules);
      
      // For this example, we'll just simulate a backtest result
      // In a real implementation, you would use the rules to run a backtest
      setTimeout(() => {
        setHasResults(true);
        setBacktestResults({
          performanceMetrics,
          tradeStatistics
        });
        
        toast({
          title: "Backtest complete",
          description: "Your backtest results are ready to view"
        });
        setRunningBacktest(false);
      }, 1500);
      
    } catch (error) {
      console.error("Backtest error:", error);
      toast({
        title: "Backtest error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      setRunningBacktest(false);
    }
  };

  const handleSaveResults = () => {
    setSaveDialogOpen(true);
  };

  const handleCloseSaveDialog = () => {
    setSaveDialogOpen(false);
  };

  return <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Backtest</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-1">Backtest Parameters</h2>
              <p className="text-muted-foreground text-sm mb-6">Configure the parameters for your backtest.</p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="strategy" className="text-sm font-medium">
                    Strategy
                  </label>
                  <Select value={strategy} onValueChange={setStrategy} disabled={isLoading || runningBacktest}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={isLoading ? "Loading strategies..." : "Select strategy"} />
                    </SelectTrigger>
                    <SelectContent>
                      {strategies.length > 0 ? (
                        strategies.map((strategyItem) => (
                          <SelectItem key={strategyItem.id} value={strategyItem.id}>
                            {strategyItem.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          {isLoading ? "Loading strategies..." : "No strategies available"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Time Period</label>
                  <div className="grid grid-cols-2 gap-4">
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
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="pointer-events-auto" />
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
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="initialCapital" className="text-sm font-medium">
                    Initial Capital
                  </label>
                  <Input 
                    id="initialCapital" 
                    type="number" 
                    value={initialCapital} 
                    onChange={e => setInitialCapital(e.target.value)} 
                    placeholder="10000" 
                    disabled={runningBacktest}
                  />
                </div>

                <Button 
                  onClick={runBacktest} 
                  className="w-full bg-zinc-950 hover:bg-zinc-800" 
                  disabled={runningBacktest}
                >
                  {runningBacktest ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent" /> 
                      Running Backtest...
                    </>
                  ) : (
                    <>
                      <PlayIcon className="h-4 w-4 mr-2" /> Run Backtest
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">Backtest Results</h2>
                  <p className="text-muted-foreground text-sm">
                    {hasResults ? "View the performance of your strategy over the selected time period." : "Run a backtest to see results here."}
                  </p>
                </div>
                
                {hasResults && (
                  <Button onClick={handleSaveResults} size="sm" variant="outline">
                    <Save className="h-4 w-4 mr-2" />
                    Save Results
                  </Button>
                )}
              </div>

              {hasResults ? <div>
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
                            {performanceMetrics.map((metric, index) => <div key={index} className="flex justify-between items-center">
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
                            {tradeStatistics.map((stat, index) => <div key={index} className="flex justify-between items-center">
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
                            {[{
                              date: "04/01/2025",
                              type: "Buy",
                              price: "$320.45",
                              shares: "100",
                              pl: "-"
                            }, {
                              date: "04/03/2025",
                              type: "Sell",
                              price: "$345.80",
                              shares: "100",
                              pl: "+$25.35"
                            }, {
                              date: "04/05/2025",
                              type: "Buy",
                              price: "$342.10",
                              shares: "150",
                              pl: "-"
                            }, {
                              date: "04/08/2025",
                              type: "Sell",
                              price: "$354.75",
                              shares: "150",
                              pl: "+$12.65"
                            }, {
                              date: "04/10/2025",
                              type: "Buy",
                              price: "$358.30",
                              shares: "200",
                              pl: "-"
                            }].map((trade, index) => <TableRow key={index}>
                                <TableCell>{trade.date}</TableCell>
                                <TableCell>{trade.type}</TableCell>
                                <TableCell>{trade.price}</TableCell>
                                <TableCell>{trade.shares}</TableCell>
                                <TableCell className={cn("text-right", trade.pl.startsWith("+") ? "text-green-600" : trade.pl.startsWith("-") ? "text-red-600" : "")}>{trade.pl}</TableCell>
                              </TableRow>)}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div> : <div className="flex flex-col items-center justify-center h-64">
                  {runningBacktest ? (
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 mb-4 animate-spin rounded-full border-4 border-t-transparent border-zinc-800" /> 
                      <p className="text-muted-foreground">Processing your backtest...</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No backtest results to display. Click "Run Backtest" to start.</p>
                  )}
                </div>}
            </CardContent>
          </Card>
        </div>
        
        <SaveBacktestDialog 
          isOpen={saveDialogOpen}
          onClose={handleCloseSaveDialog}
          backtestResults={backtestResults}
          strategyId={strategy}
          backtestParameters={{
            startDate,
            endDate,
            initialCapital,
            positionSize
          }}
        />
      </main>
    </div>;
};

export default Backtest;

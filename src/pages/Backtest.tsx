import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, PlayIcon } from "lucide-react";
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

const Backtest = () => {
  const [strategy, setStrategy] = useState<string>("");
  // Removing symbol state and keeping it for reference in case it's needed later
  // const [symbol, setSymbol] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [initialCapital, setInitialCapital] = useState<string>("10000");
  const [positionSize, setPositionSize] = useState<string>("10");
  const [hasResults, setHasResults] = useState<boolean>(false);
  const { toast } = useToast();

  const performanceMetrics = [{
    name: "Total Return",
    value: "17.00%"
  }, {
    name: "Annualized Return",
    value: "34.00%"
  }, {
    name: "Sharpe Ratio",
    value: "1.8"
  }, {
    name: "Max Drawdown",
    value: "-3.8%"
  }, {
    name: "Win Rate",
    value: "68%"
  }];
  const tradeStatistics = [{
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
    value: "$320.45"
  }, {
    name: "Avg. Loss",
    value: "-$175.20"
  }];

  const handleRunBacktest = () => {
    if (!strategy) {
      toast({
        title: "Strategy is required",
        description: "Please select a strategy for your backtest",
        variant: "destructive"
      });
      return;
    }

    // Removed the symbol validation check since it's no longer needed

    if (!startDate || !endDate) {
      toast({
        title: "Date range is required",
        description: "Please select both start and end dates for your backtest",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Backtest running",
      description: "Your backtest is being processed..."
    });

    setTimeout(() => {
      setHasResults(true);
      toast({
        title: "Backtest complete",
        description: "Your backtest results are ready to view"
      });
    }, 1500);
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
                  <Select value={strategy} onValueChange={setStrategy}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moving-average-crossover">Moving Average Crossover</SelectItem>
                      <SelectItem value="rsi-divergence">RSI Divergence</SelectItem>
                      <SelectItem value="macd-strategy">MACD Strategy</SelectItem>
                      <SelectItem value="bollinger-bands">Bollinger Bands</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Removed the Trading Symbol selection */}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Time Period</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Start Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
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
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
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
                  <Input id="initialCapital" type="number" value={initialCapital} onChange={e => setInitialCapital(e.target.value)} placeholder="10000" />
                </div>

                <Button className="w-full" onClick={handleRunBacktest}>
                  <PlayIcon className="h-4 w-4 mr-2" /> Run Backtest
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-1">Backtest Results</h2>
              <p className="text-muted-foreground text-sm mb-6">
                {hasResults ? "View the performance of your strategy over the selected time period." : "Run a backtest to see results here."}
              </p>

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
                                <span className="text-sm font-medium">{metric.value}</span>
                              </div>)}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium mb-3">Trade Statistics</h3>
                          <div className="space-y-2">
                            {tradeStatistics.map((stat, index) => <div key={index} className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">{stat.name}</span>
                                <span className="text-sm font-medium">{stat.value}</span>
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
                              <TableHead className="text-right">P/L</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>04/01/2025</TableCell>
                              <TableCell>Buy</TableCell>
                              <TableCell>$320.45</TableCell>
                              <TableCell className="text-right">-</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>04/03/2025</TableCell>
                              <TableCell>Sell</TableCell>
                              <TableCell>$345.80</TableCell>
                              <TableCell className="text-right text-green-600">+$25.35</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>04/05/2025</TableCell>
                              <TableCell>Buy</TableCell>
                              <TableCell>$342.10</TableCell>
                              <TableCell className="text-right">-</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>04/08/2025</TableCell>
                              <TableCell>Sell</TableCell>
                              <TableCell>$354.75</TableCell>
                              <TableCell className="text-right text-green-600">+$12.65</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>04/10/2025</TableCell>
                              <TableCell>Buy</TableCell>
                              <TableCell>$358.30</TableCell>
                              <TableCell className="text-right">-</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div> : <div className="flex flex-col items-center justify-center h-64">
                  <p className="text-muted-foreground">No backtest results to display. Click "Run Backtest" to start.</p>
                </div>}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>;
};

export default Backtest;

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ChevronDown, ChevronUp, Play } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PerformanceChart } from "@/components/PerformanceChart";
interface BacktestData {
  id: number;
  version: string;
  date: string;
  time: string;
  isLatest?: boolean;
  metrics: {
    totalReturn: string;
    totalReturnValue: number;
    sharpeRatio: number;
    winRate: string;
    maxDrawdown: string;
    maxDrawdownValue: number;
    trades: number;
  };
  parameters: {
    [key: string]: string | number;
  };
}
const BacktestHistory = () => {
  const {
    strategyId
  } = useParams<{
    strategyId: string;
  }>();
  const strategyName = strategyId ? strategyId.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "RSI Strategy v2";
  const [backtests, setBacktests] = useState<BacktestData[]>([{
    id: 3,
    version: "v1.2",
    date: "Mar 28, 2024",
    time: "10:30 PM",
    isLatest: true,
    metrics: {
      totalReturn: "+17.50%",
      totalReturnValue: 17.5,
      sharpeRatio: 1.8,
      winRate: "68%",
      maxDrawdown: "-5.2%",
      maxDrawdownValue: -5.2,
      trades: 25
    },
    parameters: {
      "Initial Capital": 10000,
      "Start Date": "2023-01-01",
      "End Date": "2024-01-01"
    }
  }, {
    id: 2,
    version: "v1.1",
    date: "Mar 25, 2024",
    time: "06:15 PM",
    metrics: {
      totalReturn: "+15.80%",
      totalReturnValue: 15.8,
      sharpeRatio: 1.6,
      winRate: "65%",
      maxDrawdown: "-6.1%",
      maxDrawdownValue: -6.1,
      trades: 23
    },
    parameters: {
      "Initial Capital": 10000,
      "Start Date": "2023-01-01",
      "End Date": "2024-01-01"
    }
  }, {
    id: 1,
    version: "v1.0",
    date: "Mar 20, 2024",
    time: "05:45 PM",
    metrics: {
      totalReturn: "+12.30%",
      totalReturnValue: 12.3,
      sharpeRatio: 1.4,
      winRate: "60%",
      maxDrawdown: "-7.5%",
      maxDrawdownValue: -7.5,
      trades: 18
    },
    parameters: {
      "Initial Capital": 10000,
      "Start Date": "2023-01-01",
      "End Date": "2023-12-01"
    }
  }]);
  const [openBacktests, setOpenBacktests] = useState<Record<number, boolean>>({
    1: true
  });
  const toggleBacktestDetails = (backtestId: number) => {
    setOpenBacktests(prev => ({
      ...prev,
      [backtestId]: !prev[backtestId]
    }));
  };
  const handleRunNewBacktest = () => {
    console.log("Running new backtest");
  };
  return <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link to={`/strategy/${strategyId}`} className="text-sm flex items-center mb-4 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">Backtest History</h1>
                <p className="text-muted-foreground">View and compare backtest results for {strategyName}</p>
              </div>
              
              <Link to="/backtest">
                <Button>
                  <Play className="h-4 w-4 mr-2" />
                  Run New Backtest
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="space-y-4">
            {backtests.map(backtest => <Card key={backtest.id} className="overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-semibold">Backtest {backtest.id} <span className="text-base font-medium">{backtest.version}</span></h2>
                      {backtest.isLatest && <Badge variant="outline" className="text-xs">Latest</Badge>}
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-4">
                    {backtest.date}, {backtest.time}
                  </div>
                  
                  <Button variant="outline" className="flex justify-between items-center py-2 w-full md:w-auto" onClick={() => toggleBacktestDetails(backtest.id)}>
                    <div className="font-medium">
                      {openBacktests[backtest.id] ? "Close Backtest Details" : "View Backtest Details"}
                    </div>
                    <div>
                      {openBacktests[backtest.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </Button>
                  
                  {openBacktests[backtest.id] && <div className="mt-4 space-y-6">
                      <div className="grid grid-cols-5 gap-6">
                        <div>
                          <div className="text-sm text-muted-foreground">Total Return</div>
                          <div className={`text-xl font-medium ${backtest.metrics.totalReturnValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {backtest.metrics.totalReturn}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                          <div className="text-xl font-medium">
                            {backtest.metrics.sharpeRatio}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground">Win Rate</div>
                          <div className="text-xl font-medium">
                            {backtest.metrics.winRate}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground">Max Drawdown</div>
                          <div className="text-xl font-medium text-red-500">
                            {backtest.metrics.maxDrawdown}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground">Trades</div>
                          <div className="text-xl font-medium">
                            {backtest.metrics.trades}
                          </div>
                        </div>
                      </div>
                      
                      
                      
                    </div>}
                </div>
              </Card>)}
          </div>
        </div>
      </main>
    </div>;
};
export default BacktestHistory;
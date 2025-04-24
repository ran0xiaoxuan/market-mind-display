import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ChevronDown, ChevronUp, Play } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TradingRules } from "@/components/strategy-detail/TradingRules";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface IndicatorParameters {
  period?: string;
  fast?: string;
  slow?: string;
  signal?: string;
}

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
  entryRules: {
    id: number;
    logic: string;
    inequalities: {
      id: number;
      left: {
        type: string;
        indicator?: string;
        parameters?: IndicatorParameters;
        value?: string;
      };
      condition: string;
      right: {
        type: string;
        indicator?: string;
        parameters?: IndicatorParameters;
        value?: string;
      };
    }[];
  }[];
  exitRules: {
    id: number;
    logic: string;
    inequalities: {
      id: number;
      left: {
        type: string;
        indicator?: string;
        parameters?: IndicatorParameters;
        value?: string;
      };
      condition: string;
      right: {
        type: string;
        indicator?: string;
        parameters?: IndicatorParameters;
        value?: string;
      };
    }[];
  }[];
}

const BacktestHistory = () => {
  const { strategyId } = useParams<{ strategyId: string }>();
  const strategyName = strategyId ? strategyId.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "RSI Strategy v2";
  
  const [backtests, setBacktests] = useState<BacktestData[]>([
    {
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
        "End Date": "2024-01-01",
        "Single Buy Volume": 1000,
        "Max Buy Volume": 5000
      },
      entryRules: [
        {
          id: 1,
          logic: "AND",
          inequalities: [{
            id: 1,
            left: {
              type: "indicator",
              indicator: "SMA",
              parameters: {
                period: "20"
              }
            },
            condition: "Crosses Above",
            right: {
              type: "indicator",
              indicator: "SMA",
              parameters: {
                period: "50"
              }
            }
          }]
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
                parameters: {
                  period: "14"
                }
              },
              condition: "Less Than",
              right: {
                type: "value",
                value: "30"
              }
            },
            {
              id: 2,
              left: {
                type: "indicator",
                indicator: "MACD",
                parameters: {
                  fast: "12",
                  slow: "26",
                  signal: "9"
                }
              },
              condition: "Crosses Above",
              right: {
                type: "value",
                value: "0"
              }
            }
          ]
        }
      ],
      exitRules: [
        {
          id: 1,
          logic: "AND",
          inequalities: [{
            id: 1,
            left: {
              type: "indicator",
              indicator: "SMA",
              parameters: {
                period: "20"
              }
            },
            condition: "Crosses Below",
            right: {
              type: "indicator",
              indicator: "SMA",
              parameters: {
                period: "50"
              }
            }
          }]
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
                parameters: {
                  period: "14"
                }
              },
              condition: "Greater Than",
              right: {
                type: "value",
                value: "70"
              }
            },
            {
              id: 2,
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
    },
    {
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
      },
      entryRules: [{
        id: 1,
        logic: "AND",
        inequalities: [{
          id: 1,
          left: {
            type: "indicator",
            indicator: "SMA",
            parameters: {
              period: "20"
            }
          },
          condition: "Crosses Above",
          right: {
            type: "indicator",
            indicator: "SMA",
            parameters: {
              period: "50"
            }
          }
        }]
      }],
      exitRules: [{
        id: 1,
        logic: "AND",
        inequalities: [{
          id: 1,
          left: {
            type: "indicator",
            indicator: "SMA",
            parameters: {
              period: "20"
            }
          },
          condition: "Crosses Below",
          right: {
            type: "indicator",
            indicator: "SMA",
            parameters: {
              period: "50"
            }
          }
        }]
      }]
    },
    {
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
      },
      entryRules: [{
        id: 1,
        logic: "AND",
        inequalities: [{
          id: 1,
          left: {
            type: "indicator",
            indicator: "SMA",
            parameters: {
              period: "20"
            }
          },
          condition: "Crosses Above",
          right: {
            type: "indicator",
            indicator: "SMA",
            parameters: {
              period: "50"
            }
          }
        }]
      }],
      exitRules: [{
        id: 1,
        logic: "AND",
        inequalities: [{
          id: 1,
          left: {
            type: "indicator",
            indicator: "SMA",
            parameters: {
              period: "20"
            }
          },
          condition: "Crosses Below",
          right: {
            type: "indicator",
            indicator: "SMA",
            parameters: {
              period: "50"
            }
          }
        }]
      }]
    }
  ]);

  const [openBacktests, setOpenBacktests] = useState<Record<number, boolean>>({
    1: true
  });

  const [activeTab, setActiveTab] = useState<Record<number, "summary" | "trades">>({});

  const toggleTab = (backtestId: number, tab: "summary" | "trades") => {
    setActiveTab(prev => ({
      ...prev,
      [backtestId]: tab
    }));
  };

  const toggleBacktestDetails = (backtestId: number) => {
    setOpenBacktests(prev => ({
      ...prev,
      [backtestId]: !prev[backtestId]
    }));
  };

  const handleRunNewBacktest = () => {
    console.log("Running new backtest");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
            {backtests.map(backtest => (
              <Card key={backtest.id} className="overflow-hidden">
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
                  
                  {openBacktests[backtest.id] && (
                    <div className="mt-4 space-y-6">
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div>
                          <h4 className="text-sm text-muted-foreground mb-2">Time Period</h4>
                          <div className="flex items-center gap-2 mb-1">
                            <p>From: {backtest.parameters["Start Date"]}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p>To: {backtest.parameters["End Date"]}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm text-muted-foreground mb-2">Initial Capital</h4>
                          <div className="flex items-center gap-2">
                            <p>${backtest.parameters["Initial Capital"].toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="text-sm text-muted-foreground mb-3 flex items-center gap-2">Risk Management</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Stop Loss</p>
                            <p className="font-medium text-red-500">-2.5%</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Take Profit</p>
                            <p className="font-medium text-green-500">+5.0%</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Single Buy Volume</p>
                            <p className="font-medium">${backtest.parameters["Single Buy Volume"] || "1,000"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Max Buy Volume</p>
                            <p className="font-medium">${backtest.parameters["Max Buy Volume"] || "5,000"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="text-sm text-muted-foreground mb-3 flex items-center gap-2">Entry Rules</h4>
                        <TradingRules
                          entryRules={[
                            {
                              id: 1,
                              logic: "AND",
                              inequalities: backtest.entryRules[0].inequalities
                            },
                            {
                              id: 2,
                              logic: "OR",
                              inequalities: backtest.entryRules[1]?.inequalities || [],
                              requiredConditions: 1
                            }
                          ]}
                          exitRules={[]}
                          editable={false}
                        />
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="text-sm text-muted-foreground mb-3 flex items-center gap-2">Exit Rules</h4>
                        <TradingRules
                          entryRules={[]}
                          exitRules={[
                            {
                              id: 1,
                              logic: "AND",
                              inequalities: backtest.exitRules[0].inequalities
                            },
                            {
                              id: 2,
                              logic: "OR",
                              inequalities: backtest.exitRules[1]?.inequalities || [],
                              requiredConditions: 1
                            }
                          ]}
                          editable={false}
                        />
                      </div>

                      {openBacktests[backtest.id] && (
                        <div className="border-t pt-4">
                          <h4 className="text-sm text-muted-foreground mb-3">Backtest Results</h4>
                          <Tabs defaultValue="summary" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                              <TabsTrigger value="summary" onClick={() => toggleTab(backtest.id, "summary")}>
                                Summary
                              </TabsTrigger>
                              <TabsTrigger value="trades" onClick={() => toggleTab(backtest.id, "trades")}>
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
                                      <span className={`text-sm font-medium ${backtest.metrics.totalReturnValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {backtest.metrics.totalReturn}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
                                      <span className="text-sm font-medium">{backtest.metrics.sharpeRatio}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Win Rate</span>
                                      <span className="text-sm font-medium">{backtest.metrics.winRate}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h3 className="font-medium mb-3">Trade Statistics</h3>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Total Trades</span>
                                      <span className="text-sm font-medium">{backtest.metrics.trades}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Winning Trades</span>
                                      <span className="text-sm font-medium">17</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Losing Trades</span>
                                      <span className="text-sm font-medium">8</span>
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
                                      <TableHead className="text-right">P/L</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {[
                                      { date: "04/01/2024", type: "Buy", price: "$320.45", pl: "-" },
                                      { date: "04/03/2024", type: "Sell", price: "$345.80", pl: "+$25.35" },
                                      { date: "04/05/2024", type: "Buy", price: "$342.10", pl: "-" },
                                      { date: "04/08/2024", type: "Sell", price: "$354.75", pl: "+$12.65" }
                                    ].map((trade, index) => (
                                      <TableRow key={index}>
                                        <TableCell>{trade.date}</TableCell>
                                        <TableCell>{trade.type}</TableCell>
                                        <TableCell>{trade.price}</TableCell>
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
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BacktestHistory;

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play } from "lucide-react";
import { BacktestCard } from "@/components/backtest/BacktestCard";
import { BacktestData } from "@/types/backtest";

const BacktestHistory = () => {
  const { strategyId } = useParams<{ strategyId: string }>();
  const strategyName = strategyId ? strategyId.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "RSI Strategy v2";
  
  const [backtests, setBacktests] = useState<BacktestData[]>([
    {
      id: 1,
      version: "v1",
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
    }
  ]);

  const [openBacktests, setOpenBacktests] = useState<Record<number, boolean>>({
    3: true
  });

  const toggleBacktestDetails = (backtestId: number) => {
    setOpenBacktests(prev => ({
      ...prev,
      [backtestId]: !prev[backtestId]
    }));
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
              <BacktestCard
                key={backtest.id}
                backtest={backtest}
                isOpen={!!openBacktests[backtest.id]}
                onToggle={toggleBacktestDetails}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BacktestHistory;

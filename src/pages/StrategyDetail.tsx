import { useState } from "react";
import { useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { StrategyHeader } from "@/components/strategy-detail/StrategyHeader";
import { StrategyInfo } from "@/components/strategy-detail/StrategyInfo";
import { RiskManagement } from "@/components/strategy-detail/RiskManagement";
import { PerformanceMetricsCard } from "@/components/strategy-detail/PerformanceMetricsCard";
import { TradingRules } from "@/components/strategy-detail/TradingRules";
import { TradeHistoryTable } from "@/components/strategy-detail/TradeHistoryTable";

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
      }, {
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
      }]
    }, {
      id: 2,
      logic: "OR",
      inequalities: [{
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
      }, {
        id: 2,
        left: {
          type: "indicator",
          indicator: "Volume",
          parameters: {
            period: "5"
          }
        },
        condition: "Greater Than",
        right: {
          type: "indicator",
          indicator: "Volume MA",
          parameters: {
            period: "20"
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
      }, {
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
        condition: "Crosses Below",
        right: {
          type: "value",
          value: "0"
        }
      }]
    }, {
      id: 2,
      logic: "OR",
      inequalities: [{
        id: 1,
        left: {
          type: "price",
          value: "Close"
        },
        condition: "Less Than",
        right: {
          type: "value",
          value: "145.50"
        }
      }, {
        id: 2,
        left: {
          type: "price",
          value: "Close"
        },
        condition: "Greater Than",
        right: {
          type: "value",
          value: "175.25"
        }
      }]
    }]
  };

  const [isActive, setIsActive] = useState(strategy.status === "active");
  
  const handleStatusChange = (checked: boolean) => {
    setIsActive(checked);
    toast({
      title: `Strategy ${checked ? 'activated' : 'deactivated'}`,
      description: `The strategy is now ${checked ? 'active' : 'inactive'} and will ${checked ? '' : 'not'} generate trading signals.`
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <StrategyHeader 
            strategyId={strategyId || ""} 
            strategyName={strategy.name || ""} 
          />
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="trades">Trades</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="pt-6">
              <StrategyInfo 
                strategy={strategy} 
                isActive={isActive} 
                onStatusChange={handleStatusChange} 
              />
              
              <RiskManagement 
                riskManagement={strategy.riskManagement} 
              />
            </TabsContent>
            
            <TabsContent value="performance" className="pt-6">
              <PerformanceMetricsCard 
                performanceMetrics={strategy.performanceMetrics}
                tradeStats={strategy.tradeStats}
              />
            </TabsContent>
            
            <TabsContent value="rules" className="pt-6">
              <TradingRules 
                entryRules={strategy.entryRules}
                exitRules={strategy.exitRules}
              />
            </TabsContent>
            
            <TabsContent value="trades" className="pt-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-2">Trade History</h2>
                <p className="text-sm text-muted-foreground mb-6">Historical trades executed by this strategy</p>
                
                <TradeHistoryTable trades={strategy.trades} />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default StrategyDetail;

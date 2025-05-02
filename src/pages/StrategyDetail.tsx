
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { StrategyHeader } from "@/components/strategy-detail/StrategyHeader";
import { StrategyInfo } from "@/components/strategy-detail/StrategyInfo";
import { RiskManagement } from "@/components/strategy-detail/RiskManagement";
import { PerformanceMetricsCard } from "@/components/strategy-detail/PerformanceMetricsCard";
import { TradingRules } from "@/components/strategy-detail/TradingRules";
import { TradeHistoryTable } from "@/components/strategy-detail/TradeHistoryTable";
import { 
  getStrategyById, 
  Strategy, 
  getRiskManagementForStrategy, 
  RiskManagementData,
  getTradingRulesForStrategy
} from "@/services/strategyService";
import { RuleGroupData } from "@/components/strategy-detail/types";

const StrategyDetail = () => {
  const { strategyId } = useParams<{ strategyId: string }>();
  const [activeTab, setActiveTab] = useState("overview");
  const [strategy, setStrategy] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [riskManagement, setRiskManagement] = useState<RiskManagementData | null>(null);
  const [tradingRules, setTradingRules] = useState<{ 
    entryRules: RuleGroupData[],
    exitRules: RuleGroupData[]
  } | null>(null);

  useEffect(() => {
    const fetchStrategyData = async () => {
      if (!strategyId) return;
      
      try {
        setLoading(true);
        const fetchedStrategy = await getStrategyById(strategyId);
        
        if (fetchedStrategy) {
          // Get risk management data directly from the strategy
          const riskData = {
            stopLoss: fetchedStrategy.stopLoss || "5",
            takeProfit: fetchedStrategy.takeProfit || "15",
            singleBuyVolume: fetchedStrategy.singleBuyVolume || "1000",
            maxBuyVolume: fetchedStrategy.maxBuyVolume || "5000"
          };
          setRiskManagement(riskData);
          
          // Fetch trading rules data
          const rulesData = await getTradingRulesForStrategy(strategyId);
          setTradingRules(rulesData);
          
          // Convert database strategy to UI strategy format
          setStrategy({
            ...fetchedStrategy,
            name: fetchedStrategy.name,
            description: fetchedStrategy.description,
            status: fetchedStrategy.isActive ? "active" : "inactive",
            performance: "+8.2%",
            annualized: "+24.6%",
            sharpeRatio: "1.4", 
            maxDrawdown: "-5.2%",
            winRate: "62%",
            profitFactor: "1.8",
            createdDate: fetchedStrategy.createdAt,
            lastUpdated: fetchedStrategy.updatedAt,
            market: fetchedStrategy.market,
            timeframe: fetchedStrategy.timeframe,
            targetAsset: fetchedStrategy.targetAsset,
            startingValue: "$10,000",
            currentValue: "$15,000",
            totalGrowth: "+50.0%",
            // Keep mock data for now
            trades: [
              {
                id: 196,
                date: "Apr 09, 2025",
                type: "Entry long",
                signal: "Long",
                price: "171.95",
                contracts: 1,
                profit: "",
                profitPercentage: ""
              },
              {
                id: 196,
                date: "Apr 11, 2025",
                type: "Exit long",
                signal: "Take Profit",
                price: "190.81",
                contracts: 1,
                profit: "+18.86",
                profitPercentage: "+10.97%"
              },
              {
                id: 195,
                date: "Apr 07, 2025",
                type: "Entry long",
                signal: "Long",
                price: "177.20",
                contracts: 1,
                profit: "",
                profitPercentage: ""
              },
              {
                id: 195,
                date: "Apr 08, 2025",
                type: "Exit long",
                signal: "Take Profit",
                price: "186.70",
                contracts: 1,
                profit: "+9.50",
                profitPercentage: "+5.36%"
              },
              {
                id: 194,
                date: "Mar 13, 2025",
                type: "Entry long",
                signal: "Long",
                price: "215.95",
                contracts: 1,
                profit: "",
                profitPercentage: ""
              },
              {
                id: 194,
                date: "Mar 14, 2025",
                type: "Exit long",
                signal: "Take Profit",
                price: "211.25",
                contracts: 1,
                profit: "-4.70",
                profitPercentage: "-2.18%"
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
            }
          });
          
          setIsActive(fetchedStrategy.isActive);
        }
      } catch (error) {
        console.error("Error fetching strategy:", error);
        toast.error("Failed to load strategy details");
      } finally {
        setLoading(false);
      }
    };

    fetchStrategyData();
  }, [strategyId]);
  
  const handleStatusChange = async (checked: boolean) => {
    setIsActive(checked);
    
    // No need to toast here as it's handled in the StrategyInfo component
    
    // Update the strategy object to reflect the new status
    if (strategy) {
      setStrategy({
        ...strategy,
        status: checked ? "active" : "inactive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse h-8 w-64 bg-muted rounded mb-6"></div>
            <div className="animate-pulse h-64 rounded-lg border bg-card mb-6"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">Strategy Not Found</h2>
              <p className="text-muted-foreground">The requested strategy could not be found.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Use risk management data directly from strategy
  const riskManagementData = riskManagement || {
    stopLoss: "5",
    takeProfit: "15", 
    singleBuyVolume: "1000",
    maxBuyVolume: "5000"
  };

  // Use default values if trading rules data is not available
  const defaultTradingRules = {
    entryRules: [{
      id: 1,
      logic: "AND",
      inequalities: [{
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
          parameters: { period: "20" }
        },
        condition: "Crosses Below",
        right: {
          type: "indicator",
          indicator: "SMA",
          parameters: { period: "50" }
        }
      }]
    }]
  };

  const tradingRulesData = tradingRules || defaultTradingRules;

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
                riskManagement={riskManagementData} 
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
                entryRules={tradingRulesData.entryRules}
                exitRules={tradingRulesData.exitRules}
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


import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [strategy, setStrategy] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [riskManagement, setRiskManagement] = useState<RiskManagementData | null>(null);
  const [tradingRules, setTradingRules] = useState<{ 
    entryRules: RuleGroupData[],
    exitRules: RuleGroupData[]
  } | null>(null);

  useEffect(() => {
    const fetchStrategyData = async () => {
      if (!strategyId) {
        setError("No strategy ID provided");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching strategy with ID:", strategyId);
        
        const fetchedStrategy = await getStrategyById(strategyId);
        
        if (fetchedStrategy) {
          console.log("Strategy data retrieved:", fetchedStrategy);
          
          // Get risk management data directly from the strategy
          const riskData = {
            stopLoss: fetchedStrategy.stop_loss || "5",
            takeProfit: fetchedStrategy.take_profit || "15",
            singleBuyVolume: fetchedStrategy.single_buy_volume || "1000",
            maxBuyVolume: fetchedStrategy.max_buy_volume || "5000"
          };
          setRiskManagement(riskData);
          
          // Fetch trading rules data
          const rulesData = await getTradingRulesForStrategy(strategyId);
          console.log("Trading rules data:", rulesData);
          setTradingRules(rulesData);
          
          // Convert database strategy to UI strategy format
          setStrategy({
            ...fetchedStrategy,
            name: fetchedStrategy.name,
            description: fetchedStrategy.description,
            status: fetchedStrategy.is_active ? "active" : "inactive",
            performance: "+8.2%",
            annualized: "+24.6%",
            sharpeRatio: "1.4", 
            maxDrawdown: "-5.2%",
            winRate: "62%",
            profitFactor: "1.8",
            createdDate: fetchedStrategy.created_at,
            lastUpdated: fetchedStrategy.updated_at,
            market: fetchedStrategy.market,
            timeframe: fetchedStrategy.timeframe,
            targetAsset: fetchedStrategy.target_asset,
            startingValue: "$10,000",
            currentValue: "$15,000",
            totalGrowth: "+50.0%",
            // Mock data for trades
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
          
          setIsActive(fetchedStrategy.is_active);
        } else {
          setError("Strategy not found");
        }
      } catch (error: any) {
        console.error("Error fetching strategy:", error);
        setError(error.message || "Failed to load strategy details");
        toast.error("Failed to load strategy details", {
          description: error.message || "An unexpected error occurred"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStrategyData();
  }, [strategyId]);
  
  const handleStatusChange = async (checked: boolean) => {
    setIsActive(checked);
    
    // Update the strategy object to reflect the new status
    if (strategy) {
      setStrategy({
        ...strategy,
        status: checked ? "active" : "inactive"
      });
    }
  };

  const handleGoBack = () => {
    navigate("/strategies");
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

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={handleGoBack}>Back to Strategies</Button>
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
              <p className="text-muted-foreground mb-6">The requested strategy could not be found.</p>
              <Button onClick={handleGoBack}>Back to Strategies</Button>
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
      id: "default-entry",
      logic: "AND",
      inequalities: [{
        id: "default-entry-inequality",
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
      id: "default-exit",
      logic: "AND",
      inequalities: [{
        id: "default-exit-inequality",
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

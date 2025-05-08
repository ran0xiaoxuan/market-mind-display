
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
  getRiskManagementForStrategy, 
  getTradingRulesForStrategy
} from "@/services/strategyService";
import { RuleGroupData } from "@/components/strategy-detail/types";

const StrategyDetail = () => {
  // Extract the strategyId from URL params
  const params = useParams<{ strategyId: string }>();
  const strategyId = params.strategyId;
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [strategy, setStrategy] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [riskManagement, setRiskManagement] = useState({
    stopLoss: "5",
    takeProfit: "15",
    singleBuyVolume: "1000",
    maxBuyVolume: "5000"
  });
  const [tradingRules, setTradingRules] = useState<{
    entryRules: RuleGroupData[];
    exitRules: RuleGroupData[];
  }>({
    entryRules: [],
    exitRules: []
  });

  useEffect(() => {
    const fetchStrategyData = async () => {
      if (!strategyId) {
        console.error("No strategy ID provided in URL params:", params);
        setError("Strategy ID is missing. Please go back and select a strategy.");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching strategy with ID:", strategyId);
        
        // Fetch strategy data with proper error handling
        const fetchedStrategy = await getStrategyById(strategyId);
        
        if (!fetchedStrategy) {
          console.error("Strategy not found with ID:", strategyId);
          setError(`Strategy with ID ${strategyId} not found`);
          setLoading(false);
          return;
        }

        console.log("Strategy data retrieved:", fetchedStrategy);
        
        // Extract risk management data from strategy
        setRiskManagement({
          stopLoss: fetchedStrategy.stopLoss || "5",
          takeProfit: fetchedStrategy.takeProfit || "15", 
          singleBuyVolume: fetchedStrategy.singleBuyVolume || "1000",
          maxBuyVolume: fetchedStrategy.maxBuyVolume || "5000"
        });
        
        // Safely fetch trading rules
        try {
          const rulesData = await getTradingRulesForStrategy(strategyId);
          console.log("Retrieved trading rules:", rulesData);
          
          if (rulesData) {
            setTradingRules({
              entryRules: Array.isArray(rulesData.entryRules) ? rulesData.entryRules : [],
              exitRules: Array.isArray(rulesData.exitRules) ? rulesData.exitRules : []
            });
          } else {
            console.log("No trading rules found, using empty arrays");
            setTradingRules({
              entryRules: [],
              exitRules: []
            });
          }
        } catch (rulesError) {
          console.error("Error fetching trading rules:", rulesError);
          // Don't fail the entire page load for rules error
          setTradingRules({
            entryRules: [],
            exitRules: []
          });
        }
        
        // Set up demo data for the strategy with safe fallbacks
        setStrategy({
          ...fetchedStrategy,
          id: fetchedStrategy.id,
          name: fetchedStrategy.name || "Untitled Strategy",
          description: fetchedStrategy.description || "No description provided",
          status: fetchedStrategy.isActive ? "active" : "inactive",
          performance: "+8.2%",
          annualized: "+24.6%",
          sharpeRatio: "1.4", 
          maxDrawdown: "-5.2%",
          winRate: "62%",
          profitFactor: "1.8",
          createdAt: fetchedStrategy.createdAt,
          updatedAt: fetchedStrategy.updatedAt,
          market: fetchedStrategy.market || "Unknown",
          timeframe: fetchedStrategy.timeframe || "Unknown",
          targetAsset: fetchedStrategy.targetAsset || "Unknown",
          trades: [
            {
              id: "1",
              date: "2023-01-05",
              type: "Buy",
              price: "$150.25",
              contracts: 10,
              signal: "SMA Crossover",
              profit: null,
              profitPercentage: null
            },
            {
              id: "2",
              date: "2023-01-12",
              type: "Sell",
              price: "$165.50",
              contracts: 10,
              signal: "SMA Crossover",
              profit: "$152.50",
              profitPercentage: "+10.15%"
            },
            {
              id: "3",
              date: "2023-02-01",
              type: "Buy",
              price: "$168.75",
              contracts: 5,
              signal: "RSI Oversold",
              profit: null,
              profitPercentage: null
            },
            {
              id: "4",
              date: "2023-02-10",
              type: "Sell",
              price: "$160.00",
              contracts: 5,
              signal: "RSI Overbought",
              profit: "-$43.75",
              profitPercentage: "-5.15%"
            }
          ],
          performanceMetrics: {
            totalReturn: "+12.5%",
            annualizedReturn: "+37.5%",
            sharpeRatio: "1.8",
            maxDrawdown: "-4.8%",
            winRate: "65%"
          },
          tradeStats: {
            totalTrades: 45,
            winningTrades: 29,
            losingTrades: 16,
            avgProfit: "+2.3%",
            avgLoss: "-1.5%"
          }
        });
        
        setIsActive(fetchedStrategy.isActive || false);
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
  
  const handleStatusChange = (checked: boolean) => {
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
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <StrategyHeader 
            strategyId={strategyId || ""} 
            strategyName={strategy.name} 
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
                riskManagement={riskManagement} 
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
                entryRules={tradingRules.entryRules}
                exitRules={tradingRules.exitRules}
              />
            </TabsContent>
            
            <TabsContent value="trades" className="pt-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-2">Trade History</h2>
                <p className="text-sm text-muted-foreground mb-6">Historical trades executed by this strategy</p>
                
                <TradeHistoryTable trades={strategy.trades || []} />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default StrategyDetail;

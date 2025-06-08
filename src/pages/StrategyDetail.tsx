
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container } from "@/components/ui/container";
import { StrategyHeader } from "@/components/strategy-detail/StrategyHeader";
import { StrategyInfo } from "@/components/strategy-detail/StrategyInfo";
import { TradingRules } from "@/components/strategy-detail/TradingRules";
import { RiskManagement } from "@/components/strategy-detail/RiskManagement";
import { TradeHistoryTable } from "@/components/strategy-detail/TradeHistoryTable";
import { PerformanceMetricsCard } from "@/components/strategy-detail/PerformanceMetricsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RuleGroupData } from "@/components/strategy-detail/types";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTradingRulesForStrategy, getStrategyById, getRiskManagementForStrategy } from "@/services/strategyService";
import { Navbar } from "@/components/Navbar";
import { getStockPrice } from "@/services/marketDataService";
import { cleanupInvalidSignals } from "@/services/signalGenerationService";

const StrategyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [strategy, setStrategy] = useState<any>(null);
  const [entryRules, setEntryRules] = useState<RuleGroupData[]>([]);
  const [exitRules, setExitRules] = useState<RuleGroupData[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasValidTradingRules, setHasValidTradingRules] = useState(false);
  
  const fetchStrategyDetails = async () => {
    console.log("Strategy ID from params:", id);
    
    if (!id || id === 'undefined') {
      console.error("Invalid strategy ID:", id);
      setError("Invalid strategy ID. Please check the URL and try again.");
      setLoading(false);
      return;
    }
    
    try {
      console.log("Fetching strategy details for ID:", id);
      
      // Fetch strategy details using the service function
      const strategyData = await getStrategyById(id);
      
      if (!strategyData) {
        setError("Strategy not found");
        setLoading(false);
        return;
      }
      
      setStrategy(strategyData);
      setIsActive(strategyData.isActive);
      
      console.log("Strategy data fetched:", strategyData);
      
      // Fetch trading rules using the service function
      const rulesData = await getTradingRulesForStrategy(id);
      
      console.log("Trading rules fetched:", rulesData);
      
      if (rulesData) {
        setEntryRules(rulesData.entryRules);
        setExitRules(rulesData.exitRules);
        
        // Check if strategy has valid trading rules
        const hasEntryRules = rulesData.entryRules?.some(group => 
          group.inequalities && group.inequalities.length > 0
        );
        const hasExitRules = rulesData.exitRules?.some(group => 
          group.inequalities && group.inequalities.length > 0
        );
        
        setHasValidTradingRules(hasEntryRules || hasExitRules);
      }
      
      // Only fetch trade data if strategy has valid trading rules
      if (hasValidTradingRules) {
        // Fetch real backtest trades for this strategy with temporal validation
        const { data: backtests, error: backtestError } = await supabase
          .from("backtests")
          .select("id, start_date, end_date")
          .eq("strategy_id", id)
          .order("created_at", { ascending: false })
          .limit(1);
        
        if (!backtestError && backtests && backtests.length > 0) {
          const latestBacktest = backtests[0];
          const strategyCreatedAt = new Date(strategyData.createdAt);
          const backtestStartDate = new Date(latestBacktest.start_date);
          
          // Validate that backtest doesn't start before strategy creation
          if (backtestStartDate < strategyCreatedAt) {
            console.warn(`Backtest start date (${backtestStartDate.toISOString()}) is before strategy creation date (${strategyCreatedAt.toISOString()}). This indicates problematic data.`);
            toast.error("Data inconsistency detected", {
              description: "Trade history contains data from before the strategy was created. This will be cleaned up."
            });
          }
          
          const { data: tradesData, error: tradesError } = await supabase
            .from("backtest_trades")
            .select("*")
            .eq("backtest_id", latestBacktest.id)
            .order("date", { ascending: false })
            .limit(20);
          
          if (!tradesError && tradesData) {
            // Filter out trades that occur before strategy creation or on weekends
            const validTrades = tradesData.filter(trade => {
              const tradeDate = new Date(trade.date);
              const dayOfWeek = tradeDate.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
              const isValid = tradeDate >= strategyCreatedAt && !isWeekend;
              
              if (!isValid) {
                console.warn(`Filtering out trade ${trade.id} with date ${tradeDate.toISOString()} as it ${tradeDate < strategyCreatedAt ? 'predates strategy creation' : 'occurred on weekend'}`);
              }
              return isValid;
            });
            
            if (validTrades.length !== tradesData.length) {
              console.log(`Filtered out ${tradesData.length - validTrades.length} invalid trades`);
            }
            
            // Get current prices for open positions
            const uniqueAssets = [...new Set(validTrades.map(trade => strategyData.targetAsset).filter(Boolean))];
            const currentPrices = new Map();
            
            for (const asset of uniqueAssets) {
              try {
                const priceData = await getStockPrice(asset);
                if (priceData) {
                  currentPrices.set(asset, priceData.price);
                }
              } catch (error) {
                console.warn(`Failed to fetch price for ${asset}:`, error);
              }
            }

            // Format trade data for display
            const formattedTrades = validTrades.map(trade => {
              const currentPrice = currentPrices.get(strategyData.targetAsset);
              let calculatedProfit = trade.profit;
              let calculatedProfitPercentage = trade.profit_percentage;

              // For open positions (buy trades without corresponding sells), calculate unrealized P&L
              if (trade.type === 'Buy' && currentPrice && !trade.profit) {
                const unrealizedProfitPercentage = ((currentPrice - trade.price) / trade.price) * 100;
                const unrealizedProfit = unrealizedProfitPercentage / 100 * trade.price * trade.contracts;
                
                calculatedProfit = unrealizedProfit;
                calculatedProfitPercentage = unrealizedProfitPercentage;

                console.log(`Open position ${trade.id}: Unrealized P&L: ${unrealizedProfitPercentage.toFixed(2)}%`);
              }

              return {
                id: trade.id,
                date: new Date(trade.date).toLocaleDateString(),
                type: trade.type,
                signal: trade.signal,
                price: `$${trade.price.toFixed(2)}`,
                contracts: trade.contracts,
                profit: calculatedProfit !== null ? `${calculatedProfit >= 0 ? '+' : ''}$${calculatedProfit.toFixed(2)}` : null,
                profitPercentage: calculatedProfitPercentage !== null ? `${calculatedProfitPercentage >= 0 ? '+' : ''}${calculatedProfitPercentage.toFixed(2)}%` : null,
                strategyId: id,
                targetAsset: strategyData.targetAsset
              };
            });
            
            setTrades(formattedTrades);
          }
        }
      }
    } catch (err: any) {
      console.error("Error fetching strategy details:", err);
      setError(err.message || "Failed to load strategy details");
      toast.error("Failed to load strategy details", {
        description: err.message || "An error occurred while loading strategy data"
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchStrategyDetails();
  }, [id]);
  
  const handleStatusChange = async (checked: boolean) => {
    if (checked && !hasValidTradingRules) {
      toast.error("Cannot activate strategy without trading conditions", {
        description: "Please define entry or exit rules before activating this strategy."
      });
      return;
    }
    
    setIsActive(checked);
    
    // Update the strategy status in the database
    try {
      const { error } = await supabase
        .from('strategies')
        .update({ is_active: checked })
        .eq('id', id);
      
      if (error) {
        console.error("Error updating strategy status:", error);
        toast.error("Failed to update strategy status");
        // Revert the UI state if there was an error
        setIsActive(!checked);
        return;
      }
      
      toast.success(`Strategy ${checked ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error("Error in handleStatusChange:", err);
      toast.error("An error occurred while updating strategy status");
      // Revert the UI state if there was an error
      setIsActive(!checked);
    }
  };

  const handleCleanupInvalidData = async () => {
    try {
      await cleanupInvalidSignals();
      toast.success("Invalid signals cleaned up successfully");
      // Refresh the data
      await fetchStrategyDetails();
    } catch (error) {
      console.error("Error cleaning up invalid data:", error);
      toast.error("Failed to cleanup invalid data");
    }
  };
  
  if (!id || id === 'undefined') {
    return (
      <>
        <Navbar />
        <Container>
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Invalid Strategy ID</AlertTitle>
            <AlertDescription>
              The strategy ID is missing or invalid. Please check the URL and try again.
            </AlertDescription>
          </Alert>
        </Container>
      </>
    );
  }
  
  if (loading) {
    return (
      <>
        <Navbar />
        <Container>
          <div className="my-4 space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </Container>
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <Navbar />
        <Container>
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </Container>
      </>
    );
  }
  
  const riskManagementData = {
    stopLoss: strategy.stopLoss || "Not set",
    takeProfit: strategy.takeProfit || "Not set",
    singleBuyVolume: strategy.singleBuyVolume || "Not set",
    maxBuyVolume: strategy.maxBuyVolume || "Not set"
  };
  
  return (
    <>
      <Navbar />
      <Container>
        <div className="my-6 space-y-8">
          <StrategyHeader 
            strategyId={id || ""} 
            strategyName={strategy.name} 
          />
          
          {!hasValidTradingRules && (
            <Alert className="border-amber-200 bg-amber-50">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">No Trading Conditions Defined</AlertTitle>
              <AlertDescription className="text-amber-700">
                This strategy cannot generate trading signals because it has no entry or exit conditions. 
                Define trading rules to enable signal generation and strategy activation.
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCleanupInvalidData}
                    className="border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    Clean Up Invalid Data
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <StrategyInfo 
            strategy={{
              description: strategy.description,
              createdAt: strategy.createdAt,
              updatedAt: strategy.updatedAt,
              timeframe: strategy.timeframe,
              targetAsset: strategy.targetAsset
            }} 
            isActive={isActive} 
            onStatusChange={handleStatusChange} 
          />
          
          <TradingRules 
            entryRules={entryRules} 
            exitRules={exitRules} 
          />
          
          <RiskManagement riskManagement={riskManagementData} />
          
          <PerformanceMetricsCard strategyId={id || ""} />
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Trade History</h2>
            {!hasValidTradingRules ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No Trade History Available</AlertTitle>
                <AlertDescription>
                  This strategy has no trading conditions defined, so no valid trades can be generated. 
                  Please define entry and exit rules to enable trading.
                </AlertDescription>
              </Alert>
            ) : trades.length > 0 ? (
              <TradeHistoryTable trades={trades} />
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No Trades Yet</AlertTitle>
                <AlertDescription>
                  This strategy has trading conditions but hasn't generated any trades yet. 
                  Trades will appear here when the market conditions meet your defined criteria.
                </AlertDescription>
              </Alert>
            )}
          </Card>
        </div>
      </Container>
    </>
  );
};

export default StrategyDetail;

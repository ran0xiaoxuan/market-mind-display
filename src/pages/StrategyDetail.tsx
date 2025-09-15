
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container } from "@/components/ui/container";
import { StrategyHeader } from "@/components/strategy-detail/StrategyHeader";
import { StrategyInfo } from "@/components/strategy-detail/StrategyInfo";
import { TradingRules } from "@/components/strategy-detail/TradingRules";
import { TradeHistoryTable } from "@/components/strategy-detail/TradeHistoryTable";
import { DailySignalUsage } from "@/components/strategy-detail/DailySignalUsage";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RuleGroupData } from "@/components/strategy-detail/types";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTradingRulesForStrategy, getStrategyById } from "@/services/strategyService";
import { Navbar } from "@/components/Navbar";
import { getStockPrice } from "@/services/marketDataService";
import { cleanupInvalidSignals } from "@/services/signalGenerationService";
import { useUserSubscription, isPro } from "@/hooks/useUserSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { shareStrategyToRecommendations } from "@/services/recommendationService";
import { isStrategyShared, unshareStrategyFromRecommendations } from "@/services/recommendationService";

// Type for signal data structure
interface SignalData {
  reason?: string;
  price?: number;
  current_price?: number; // Add current_price field
  profit?: number;
  profitPercentage?: number;
  [key: string]: any;
}

const StrategyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [strategy, setStrategy] = useState<any>(null);
  const [entryRules, setEntryRules] = useState<RuleGroupData[]>([]);
  const [exitRules, setExitRules] = useState<RuleGroupData[]>([]);
  const [trades, setTradesState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasValidTradingRules, setHasValidTradingRules] = useState(false);
  const { tier, isLoading: subscriptionLoading } = useUserSubscription();
  const userIsPro = isPro(tier);
  const { user } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [isShared, setIsShared] = useState<boolean>(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Pagination calculations
  const totalPages = Math.ceil(trades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTrades = trades.slice(startIndex, endIndex);
  
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

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
      
      // Clear existing data first to avoid showing stale data
      setStrategy(null);
      setEntryRules([]);
      setExitRules([]);
      
      // Reset to first page when fetching new data
      setCurrentPage(1);
      
      // Fetch strategy details with all fields including daily_signal_limit
      const { data: strategyData, error: strategyError } = await supabase
        .from('strategies')
        .select('*')
        .eq('id', id)
        .single();

      if (strategyError) {
        console.error('Error fetching strategy:', strategyError);
        setError("Strategy not found");
        setLoading(false);
        return;
      }
      
      if (!strategyData) {
        setError("Strategy not found");
        setLoading(false);
        return;
      }
      
      // Transform the data to match our expected format
      const transformedStrategy = {
        id: strategyData.id,
        name: strategyData.name,
        description: strategyData.description,
        timeframe: strategyData.timeframe,
        targetAsset: strategyData.target_asset,
        targetAssetName: strategyData.target_asset_name,
        isActive: strategyData.is_active,
        createdAt: strategyData.created_at,
        updatedAt: strategyData.updated_at,
        userId: strategyData.user_id,
        canBeDeleted: strategyData.can_be_deleted,
        dailySignalLimit: strategyData.daily_signal_limit, // Make sure this is included
        signalNotificationsEnabled: strategyData.signal_notifications_enabled,
        isRecommendedCopy: strategyData.is_recommended_copy,
        sourceStrategyId: strategyData.source_strategy_id
      };
      
      setStrategy(transformedStrategy);
      // Check if shared
      try {
        const shared = await isStrategyShared(transformedStrategy.id);
        setIsShared(shared);
      } catch (_) {}
      
      console.log("Strategy data fetched with daily_signal_limit:", transformedStrategy.dailySignalLimit);
      
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
      
      // Fetch ONLY REAL trading signals for this specific strategy (exclude test signals)
      console.log("Fetching REAL trading signals for strategy:", id);
      const { data: signals, error: signalsError } = await supabase
        .from("trading_signals")
        .select("*")
        .eq("strategy_id", id)
        .order("created_at", { ascending: false });
      
      if (signalsError) {
        console.error('Error fetching signals:', signalsError);
        setTradesState([]);
      } else if (signals && signals.length > 0) {
        console.log(`Found ${signals.length} real trading signals for strategy ${id}`);
        
        // Get current prices for open positions
        const currentPrices = new Map();
        
        try {
          const priceData = await getStockPrice(transformedStrategy.targetAsset);
          if (priceData) {
            currentPrices.set(transformedStrategy.targetAsset, priceData.price);
          }
        } catch (error) {
          console.warn(`Failed to fetch price for ${transformedStrategy.targetAsset}:`, error);
        }

        // Format ONLY REAL trading signals for display
        const formattedTrades = signals.map(signal => {
          const signalData = (signal.signal_data as SignalData) || {};
          const currentPrice = currentPrices.get(transformedStrategy.targetAsset);
          
          // Use current_price from signal_data if available, fallback to price
          const signalPrice = signalData.current_price || signalData.price || 0;
          
          let calculatedProfit = signalData.profit;
          let calculatedProfitPercentage = signalData.profitPercentage;

          // For open positions (entry signals without corresponding exits), calculate unrealized P&L
          if (signal.signal_type === 'entry' && currentPrice && !calculatedProfit) {
            const entryPrice = signalPrice;
            if (entryPrice > 0) {
              const unrealizedProfitPercentage = ((currentPrice - entryPrice) / entryPrice) * 100;
              // Calculate profit based on price difference only (no volume)
              const unrealizedProfit = currentPrice - entryPrice;
              
              calculatedProfit = unrealizedProfit;
              calculatedProfitPercentage = unrealizedProfitPercentage;

              console.log(`Open position ${signal.id}: Unrealized P&L: ${unrealizedProfitPercentage.toFixed(2)}%`);
            }
          }

          return {
            id: signal.id,
            date: signal.created_at, // Use the actual created_at timestamp from the signal
            type: signal.signal_type === 'entry' ? 'Buy' : 'Sell',
            signal: signalData.reason || 'Trading Signal',
            price: `$${signalPrice.toFixed(2)}`,
            contracts: 1, // Set to 1 since volume is removed but still needed for interface compatibility
            profit: calculatedProfit !== null && calculatedProfit !== undefined ? `${calculatedProfit >= 0 ? '+' : ''}$${calculatedProfit.toFixed(2)}` : null,
            profitPercentage: calculatedProfitPercentage !== null && calculatedProfitPercentage !== undefined ? `${calculatedProfitPercentage >= 0 ? '+' : ''}${calculatedProfitPercentage.toFixed(2)}%` : null,
            strategyId: id,
            strategyName: transformedStrategy.name,
            targetAsset: transformedStrategy.targetAsset,
            processed: signal.processed
          };
        });
        
        setTradesState(formattedTrades);
        console.log(`Strategy Detail: Formatted ${formattedTrades.length} real trades for display (excluding test signals)`);
      } else {
        console.log('No real trading signals found for this strategy');
        setTradesState([]);
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

  // Add effect to refresh data when returning from edit page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("Page became visible, refreshing strategy data");
        fetchStrategyDetails();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id]);

  const handleCleanupInvalidData = async () => {
    try {
      await cleanupInvalidSignals();
      toast.success("Invalid signals cleaned up successfully");
      await fetchStrategyDetails();
    } catch (error) {
      console.error("Error cleaning up invalid data:", error);
      toast.error("Failed to cleanup invalid data");
    }
  };

  const canShare = !!user && user.email?.toLowerCase() === 'ran0xiaoxuan@gmail.com' && strategy?.userId === user.id;

  const handleShare = async () => {
    if (!id) return;
    try {
      setIsSharing(true);
      if (isShared) {
        await unshareStrategyFromRecommendations(id);
        setIsShared(false);
        toast.success("Unshared successfully");
      } else {
        await shareStrategyToRecommendations(id);
        setIsShared(true);
        toast.success("Shared to Recommendation");
      }
    } catch (e: any) {
      toast.error(isShared ? "Unshare failed" : "Share failed", { description: e.message });
    } finally {
      setIsSharing(false);
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
  
  if (loading || subscriptionLoading) {
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

  if (!strategy) {
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
  
  return (
    <>
      <Navbar />
      <Container>
        <div className="my-6 space-y-8">
          <StrategyHeader 
            strategyId={id || ""} 
            strategyName={strategy?.name || ""} 
            showShareButton={canShare}
            isSharing={isSharing}
            onShare={handleShare}
            shareButtonLabel={canShare ? (isShared ? 'Unshare' : 'Share') : undefined}
            shareLoadingLabel={canShare ? (isShared ? 'Unsharing...' : 'Sharing...') : undefined}
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
              id: id,
              description: strategy?.description,
              createdAt: strategy?.createdAt,
              updatedAt: strategy?.updatedAt,
              timeframe: strategy?.timeframe,
              targetAsset: strategy?.targetAsset,
              dailySignalLimit: strategy?.dailySignalLimit, // Pass the actual value from database
              signalNotificationsEnabled: strategy?.signalNotificationsEnabled
            }} 
          />
          
          {/* Show DailySignalUsage for PRO users with external notifications enabled */}
          {userIsPro && strategy?.signalNotificationsEnabled && (
            <DailySignalUsage
              strategyId={id || ""}
              isProUser={userIsPro}
              signalNotificationsEnabled={strategy?.signalNotificationsEnabled || false}
            />
          )}
          
          <TradingRules 
            entryRules={entryRules} 
            exitRules={exitRules} 
          />
          
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
              <div className="space-y-4">
                <TradeHistoryTable trades={currentTrades} />
                
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, trades.length)} of {trades.length} trades
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={goToPrevious}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNumber;
                          if (totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNumber}
                              variant={currentPage === pageNumber ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => goToPage(pageNumber)}
                            >
                              {pageNumber}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={goToNext}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
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

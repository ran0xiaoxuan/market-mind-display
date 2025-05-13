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
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RuleGroupData } from "@/components/strategy-detail/types";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { getTradingRulesForStrategy, getStrategyById, getRiskManagementForStrategy } from "@/services/strategyService";
import { Navbar } from '@/components/Navbar';
import { StrategyDetailNav } from '@/components/strategy-detail/StrategyDetailNav';

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
  
  const fetchStrategyDetails = async () => {
    if (!id) {
      setError("Strategy ID is missing");
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
      }
      
      // Fetch most recent backtest trades
      const { data: backtest, error: backtestError } = await supabase
        .from("backtests")
        .select("id")
        .eq("strategy_id", id)
        .order("created_at", { ascending: false })
        .limit(1);
      
      if (!backtestError && backtest && backtest.length > 0) {
        const { data: tradesData, error: tradesError } = await supabase
          .from("backtest_trades")
          .select("*")
          .eq("backtest_id", backtest[0].id)
          .order("date", { ascending: true });
        
        if (!tradesError && tradesData) {
          // Format trade data for display
          const formattedTrades = tradesData.map(trade => ({
            id: trade.id,
            date: new Date(trade.date).toLocaleDateString(),
            type: trade.type,
            signal: trade.signal,
            price: `$${trade.price.toFixed(2)}`,
            contracts: trade.contracts,
            profit: trade.profit !== null ? `$${trade.profit.toFixed(2)}` : null,
            profitPercentage: trade.profit_percentage !== null ? `${trade.profit_percentage.toFixed(2)}%` : null
          }));
          
          setTrades(formattedTrades);
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
  
  if (loading) {
    return (
      <>
        <Navbar />
        <StrategyDetailNav strategyId={id || ""} strategyName={null} />
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
        <StrategyDetailNav strategyId={id || ""} strategyName="Error Loading Strategy" />
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
      <StrategyDetailNav strategyId={id || ""} strategyName={strategy.name} />
      <Container>
        <div className="my-6 space-y-8">
          <StrategyHeader 
            strategyId={id || ""} 
            strategyName={strategy.name} 
          />
          
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
            <TradeHistoryTable trades={trades} />
          </Card>
        </div>
      </Container>
    </>
  );
};

export default StrategyDetail;

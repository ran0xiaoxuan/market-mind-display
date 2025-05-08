
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
      // Fetch strategy details
      const { data: strategyData, error: strategyError } = await supabase
        .from("strategies")
        .select("*")
        .eq("id", id)
        .single();
      
      if (strategyError) {
        throw strategyError;
      }
      
      if (!strategyData) {
        setError("Strategy not found");
        setLoading(false);
        return;
      }
      
      setStrategy(strategyData);
      setIsActive(strategyData.is_active);
      
      // Fetch rule groups and their rules
      const { data: ruleGroups, error: ruleGroupsError } = await supabase
        .from("rule_groups")
        .select(`
          id,
          rule_type,
          group_order,
          logic,
          required_conditions,
          explanation,
          trading_rules (
            id,
            inequality_order,
            left_type,
            left_indicator,
            left_parameters,
            left_value,
            left_value_type,
            condition,
            right_type,
            right_indicator,
            right_parameters,
            right_value,
            right_value_type,
            explanation
          )
        `)
        .eq("strategy_id", id)
        .order("group_order", { ascending: true });
      
      if (ruleGroupsError) {
        throw ruleGroupsError;
      }
      
      // Transform rule groups into our app's format
      if (ruleGroups) {
        const entryRuleGroups: RuleGroupData[] = [];
        const exitRuleGroups: RuleGroupData[] = [];
        
        ruleGroups.forEach(group => {
          const transformedGroup: RuleGroupData = {
            id: group.id,
            logic: group.logic,
            requiredConditions: group.required_conditions,
            explanation: group.explanation,
            inequalities: group.trading_rules.sort((a: any, b: any) => 
              a.inequality_order - b.inequality_order
            ).map((rule: any) => ({
              id: rule.id,
              left: {
                type: rule.left_type,
                indicator: rule.left_indicator,
                parameters: rule.left_parameters,
                value: rule.left_value,
                valueType: rule.left_value_type
              },
              condition: rule.condition,
              right: {
                type: rule.right_type,
                indicator: rule.right_indicator,
                parameters: rule.right_parameters,
                value: rule.right_value,
                valueType: rule.right_value_type
              },
              explanation: rule.explanation
            }))
          };
          
          if (group.rule_type === 'entry') {
            entryRuleGroups.push(transformedGroup);
          } else if (group.rule_type === 'exit') {
            exitRuleGroups.push(transformedGroup);
          }
        });
        
        setEntryRules(entryRuleGroups);
        setExitRules(exitRuleGroups);
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
  
  const handleStatusChange = (checked: boolean) => {
    setIsActive(checked);
  };
  
  if (loading) {
    return (
      <Container>
        <div className="my-4">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-40 w-full mb-6" />
          <Skeleton className="h-60 w-full mb-6" />
          <Skeleton className="h-40 w-full" />
        </div>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container>
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Container>
    );
  }
  
  const riskManagementData = {
    stopLoss: strategy.stop_loss || "Not set",
    takeProfit: strategy.take_profit || "Not set",
    singleBuyVolume: strategy.single_buy_volume || "Not set",
    maxBuyVolume: strategy.max_buy_volume || "Not set"
  };
  
  return (
    <Container>
      <div className="my-6">
        <StrategyHeader 
          strategyId={id || ""} 
          strategyName={strategy.name} 
        />
        
        <StrategyInfo 
          strategy={{
            description: strategy.description,
            createdAt: strategy.created_at,
            updatedAt: strategy.updated_at,
            timeframe: strategy.timeframe,
            targetAsset: strategy.target_asset
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
        
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Trade History</h2>
          <TradeHistoryTable trades={trades} />
        </div>
      </div>
    </Container>
  );
};

export default StrategyDetail;

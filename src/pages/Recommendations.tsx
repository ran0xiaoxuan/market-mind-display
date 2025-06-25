import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp, Copy, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Strategy } from "@/services/strategyService";
import { TradingRules } from "@/components/strategy-detail/TradingRules";
const Recommendations = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [recommendedStrategies, setRecommendedStrategies] = useState<Strategy[]>([]);
  const [communityStrategies, setCommunityStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedStrategies, setCopiedStrategies] = useState<Set<string>>(new Set());
  useEffect(() => {
    fetchRecommendedStrategies();
  }, []);
  const fetchRecommendedStrategies = async () => {
    try {
      setLoading(true);

      // Fetch official recommended strategies
      const {
        data: officialStrategies,
        error: officialError
      } = await supabase.from('recommended_strategies').select(`
          strategy_id,
          is_official,
          strategies (
            id,
            name,
            description,
            timeframe,
            target_asset,
            target_asset_name,
            is_active,
            created_at,
            updated_at,
            user_id,
            can_be_deleted,
            is_recommended_copy,
            source_strategy_id
          )
        `).eq('is_official', true).eq('deprecated', false);
      if (officialError) {
        console.error('Error fetching official strategies:', officialError);
        throw officialError;
      }

      // Fetch community recommended strategies
      const {
        data: communityStrategiesList,
        error: communityError
      } = await supabase.from('recommended_strategies').select(`
          strategy_id,
          is_official,
          strategies (
            id,
            name,
            description,
            timeframe,
            target_asset,
            target_asset_name,
            is_active,
            created_at,
            updated_at,
            user_id,
            can_be_deleted,
            is_recommended_copy,
            source_strategy_id
          )
        `).eq('is_official', false).eq('deprecated', false).limit(10);
      if (communityError) {
        console.error('Error fetching community strategies:', communityError);
        throw communityError;
      }

      // Format official strategies
      const formattedOfficialStrategies = officialStrategies?.filter(item => item.strategies).map(item => ({
        id: item.strategies.id,
        name: item.strategies.name,
        description: item.strategies.description || '',
        targetAsset: item.strategies.target_asset || '',
        targetAssetName: item.strategies.target_asset_name || '',
        isActive: item.strategies.is_active,
        timeframe: item.strategies.timeframe,
        createdAt: item.strategies.created_at,
        updatedAt: item.strategies.updated_at,
        userId: item.strategies.user_id,
        canBeDeleted: item.strategies.can_be_deleted,
        isRecommendedCopy: item.strategies.is_recommended_copy,
        sourceStrategyId: item.strategies.source_strategy_id
      })) || [];

      // Format community strategies
      const formattedCommunityStrategies = communityStrategiesList?.filter(item => item.strategies).map(item => ({
        id: item.strategies.id,
        name: item.strategies.name,
        description: item.strategies.description || '',
        targetAsset: item.strategies.target_asset || '',
        targetAssetName: item.strategies.target_asset_name || '',
        isActive: item.strategies.is_active,
        timeframe: item.strategies.timeframe,
        createdAt: item.strategies.created_at,
        updatedAt: item.strategies.updated_at,
        userId: item.strategies.user_id,
        canBeDeleted: item.strategies.can_be_deleted,
        isRecommendedCopy: item.strategies.is_recommended_copy,
        sourceStrategyId: item.strategies.source_strategy_id
      })) || [];
      setRecommendedStrategies(formattedOfficialStrategies);
      setCommunityStrategies(formattedCommunityStrategies);
    } catch (error) {
      console.error('Error fetching recommended strategies:', error);
      toast.error('Failed to load recommended strategies');
    } finally {
      setLoading(false);
    }
  };
  const copyStrategy = async (strategy: Strategy) => {
    if (!user) {
      toast.error("Please log in to copy strategies");
      navigate('/auth/login');
      return;
    }
    try {
      // First, fetch the trading rules for the original strategy
      const {
        data: ruleGroups,
        error: rulesError
      } = await supabase.from('rule_groups').select(`
          rule_type,
          logic,
          required_conditions,
          group_order,
          trading_rules (
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
            explanation,
            inequality_order
          )
        `).eq('strategy_id', strategy.id).order('group_order');
      if (rulesError) {
        console.error('Error fetching trading rules:', rulesError);
        throw rulesError;
      }

      // Create the new strategy copy
      const {
        data: newStrategy,
        error: strategyError
      } = await supabase.from('strategies').insert({
        name: `${strategy.name} (Copy)`,
        description: strategy.description,
        timeframe: strategy.timeframe,
        target_asset: strategy.targetAsset,
        target_asset_name: strategy.targetAssetName,
        user_id: user.id,
        is_active: false,
        is_recommended_copy: true,
        source_strategy_id: strategy.id
      }).select().single();
      if (strategyError) {
        console.error('Error creating strategy copy:', strategyError);
        throw strategyError;
      }

      // Copy the trading rules if they exist
      if (ruleGroups && ruleGroups.length > 0) {
        for (const group of ruleGroups) {
          const {
            data: newRuleGroup,
            error: groupError
          } = await supabase.from('rule_groups').insert({
            strategy_id: newStrategy.id,
            rule_type: group.rule_type,
            logic: group.logic,
            required_conditions: group.required_conditions,
            group_order: group.group_order
          }).select().single();
          if (groupError) {
            console.error('Error creating rule group:', groupError);
            throw groupError;
          }

          // Copy the individual trading rules
          if (group.trading_rules && group.trading_rules.length > 0) {
            const rulesToInsert = group.trading_rules.map((rule: any) => ({
              rule_group_id: newRuleGroup.id,
              left_type: rule.left_type,
              left_indicator: rule.left_indicator,
              left_parameters: rule.left_parameters,
              left_value: rule.left_value,
              left_value_type: rule.left_value_type,
              condition: rule.condition,
              right_type: rule.right_type,
              right_indicator: rule.right_indicator,
              right_parameters: rule.right_parameters,
              right_value: rule.right_value,
              right_value_type: rule.right_value_type,
              explanation: rule.explanation,
              inequality_order: rule.inequality_order
            }));
            const {
              error: rulesInsertError
            } = await supabase.from('trading_rules').insert(rulesToInsert);
            if (rulesInsertError) {
              console.error('Error inserting trading rules:', rulesInsertError);
              throw rulesInsertError;
            }
          }
        }
      }

      // Record the copy action
      const {
        error: copyRecordError
      } = await supabase.from('strategy_copies').insert({
        source_strategy_id: strategy.id,
        copied_strategy_id: newStrategy.id,
        copied_by: user.id,
        copy_type: 'recommendation'
      });
      if (copyRecordError) {
        console.error('Error recording copy action:', copyRecordError);
        // This is not critical, so we don't throw
      }
      setCopiedStrategies(prev => new Set([...prev, strategy.id]));
      toast.success(`Strategy "${strategy.name}" copied successfully!`);

      // Navigate to the copied strategy
      navigate(`/strategy/${newStrategy.id}`);
    } catch (error) {
      console.error('Error copying strategy:', error);
      toast.error('Failed to copy strategy. Please try again.');
    }
  };
  const StrategyCard = ({
    strategy,
    isOfficial = false
  }: {
    strategy: Strategy;
    isOfficial?: boolean;
  }) => <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{strategy.name}</CardTitle>
          <div className="flex gap-2">
            {isOfficial && <Badge variant="default" className="bg-blue-500">
                Official
              </Badge>}
            <Badge variant={strategy.isActive ? "default" : "secondary"}>
              {strategy.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {strategy.description}
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" />
            <span>{strategy.targetAsset}</span>
            {strategy.targetAssetName && <span className="text-muted-foreground">({strategy.targetAssetName})</span>}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Timeframe: {strategy.timeframe}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Updated {formatDistanceToNow(new Date(strategy.updatedAt), {
            addSuffix: true
          })}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/strategy/${strategy.id}`)} className="flex-1">
            View Details
          </Button>
          <Button size="sm" onClick={() => copyStrategy(strategy)} disabled={copiedStrategies.has(strategy.id)} className="flex-1">
            {copiedStrategies.has(strategy.id) ? <>
                <CheckCircle className="h-4 w-4 mr-1" />
                Copied
              </> : <>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </>}
          </Button>
        </div>
      </CardContent>
    </Card>;
  if (loading) {
    return <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto p-6">
          <div className="text-center">Loading recommendations...</div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Strategy Recommendations</h1>
          <p className="text-muted-foreground">
            Discover and copy proven trading strategies from our community and experts.
          </p>
        </div>

        {/* Official Recommendations */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Official Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedStrategies.map(strategy => <StrategyCard key={strategy.id} strategy={strategy} isOfficial={true} />)}
          </div>
          {recommendedStrategies.length === 0 && <p className="text-muted-foreground">No official recommendations available at the moment.</p>}
        </section>

        {/* Community Recommendations */}
        
      </div>
    </div>;
};
export default Recommendations;
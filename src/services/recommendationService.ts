
import { supabase } from "@/integrations/supabase/client";

export interface RecommendedStrategy {
  id: string;
  name: string;
  description: string;
  targetAsset: string;
  targetAssetName: string;
  timeframe: string;
  createdAt: string;
  updatedAt: string;
  isOfficial: boolean;
  applicationCount?: number;
}

export const getRecommendedStrategies = async (): Promise<RecommendedStrategy[]> => {
  try {
    console.log('Fetching recommended strategies...');
    
    const { data, error } = await supabase
      .from('recommended_strategies')
      .select(`
        id,
        strategy_id,
        is_official,
        strategies!inner (
          id,
          name,
          description,
          target_asset,
          target_asset_name,
          timeframe,
          created_at,
          updated_at
        )
      `)
      .eq('is_public', true)
      .eq('deprecated', false);

    if (error) {
      console.error('Error fetching recommended strategies:', error);
      throw error;
    }

    console.log('Raw recommended strategies data:', data);

    if (!data || data.length === 0) {
      console.log('No recommended strategies found');
      return [];
    }

    const strategies = await Promise.all(
      data.map(async (item: any) => {
        const strategy = item.strategies;
        
        // Get application count using the database function
        let applicationCount = 0;
        try {
          const { data: countData, error: countError } = await supabase
            .rpc('get_strategy_application_count', { strategy_id: strategy.id });
          
          if (countError) {
            console.error('Error getting application count:', countError);
          } else {
            applicationCount = countData || 0;
          }
        } catch (err) {
          console.error('Error fetching application count:', err);
        }

        return {
          id: strategy.id,
          name: strategy.name || 'Unnamed Strategy',
          description: strategy.description || 'No description available',
          targetAsset: strategy.target_asset || 'Unknown',
          targetAssetName: strategy.target_asset_name || strategy.target_asset || 'Unknown Asset',
          timeframe: strategy.timeframe || '1h',
          createdAt: strategy.created_at,
          updatedAt: strategy.updated_at,
          isOfficial: item.is_official || false,
          applicationCount
        };
      })
    );

    console.log('Processed recommended strategies:', strategies);
    return strategies;

  } catch (error) {
    console.error('Error in getRecommendedStrategies:', error);
    return [];
  }
};

export const applyRecommendedStrategy = async (strategyId: string): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  try {
    // Get the original strategy (only public ones)
    const { data: originalStrategy, error: fetchError } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', strategyId)
      .single();

    if (fetchError || !originalStrategy) {
      throw new Error('Strategy not found or not accessible');
    }

    // Verify it's a public recommended strategy
    const { data: recommendedStrategy } = await supabase
      .from('recommended_strategies')
      .select('*')
      .eq('strategy_id', strategyId)
      .eq('is_public', true)
      .eq('deprecated', false)
      .single();

    if (!recommendedStrategy) {
      throw new Error('Strategy is not publicly available');
    }

    // Create a copy for the user
    const { data: newStrategy, error: createError } = await supabase
      .from('strategies')
      .insert({
        user_id: user.id,
        name: `${originalStrategy.name} (Copy)`,
        description: originalStrategy.description,
        timeframe: originalStrategy.timeframe,
        target_asset: originalStrategy.target_asset,
        target_asset_name: originalStrategy.target_asset_name,
        stop_loss: originalStrategy.stop_loss,
        take_profit: originalStrategy.take_profit,
        single_buy_volume: originalStrategy.single_buy_volume,
        max_buy_volume: originalStrategy.max_buy_volume,
        is_active: false,
        is_recommended_copy: true,
        source_strategy_id: strategyId,
        can_be_deleted: true
      })
      .select()
      .single();

    if (createError || !newStrategy) {
      console.error('Error creating strategy copy:', createError);
      throw new Error('Failed to create strategy copy');
    }

    // Record the application
    const { error: applicationError } = await supabase
      .from('strategy_applications')
      .insert({
        strategy_id: strategyId,
        user_id: user.id
      });

    if (applicationError) {
      console.error('Error recording strategy application:', applicationError);
      // Don't throw here as the strategy was already created
    }

    // Record the copy relationship
    const { error: copyError } = await supabase
      .from('strategy_copies')
      .insert({
        source_strategy_id: strategyId,
        copied_strategy_id: newStrategy.id,
        copied_by: user.id,
        copy_type: 'recommendation_apply'
      });

    if (copyError) {
      console.error('Error recording strategy copy:', copyError);
      // Don't throw here as the strategy was already created
    }

    return newStrategy.id;

  } catch (error) {
    console.error('Error applying recommended strategy:', error);
    throw error;
  }
};

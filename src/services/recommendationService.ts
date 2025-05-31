
import { supabase } from "@/integrations/supabase/client";

export interface StrategyApplyCount {
  strategy_id: string;
  apply_count: number;
}

// Track when a user applies a strategy - now creates a copy
export const trackStrategyApplication = async (strategyId: string, userId: string) => {
  try {
    // First get the strategy details to copy
    const { data: originalStrategy, error: strategyError } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', strategyId)
      .single();

    if (strategyError || !originalStrategy) {
      throw new Error('Strategy not found');
    }

    // Create a copy of the strategy for the user
    const { data: copiedStrategy, error: copyError } = await supabase
      .from('strategies')
      .insert({
        name: `${originalStrategy.name} (from recommendations)`,
        description: originalStrategy.description,
        target_asset: originalStrategy.target_asset,
        target_asset_name: originalStrategy.target_asset_name,
        timeframe: originalStrategy.timeframe,
        is_active: true,
        user_id: userId,
        stop_loss: originalStrategy.stop_loss,
        take_profit: originalStrategy.take_profit,
        single_buy_volume: originalStrategy.single_buy_volume,
        max_buy_volume: originalStrategy.max_buy_volume,
        is_recommended_copy: true,
        source_strategy_id: strategyId,
        can_be_deleted: true
      })
      .select()
      .single();

    if (copyError || !copiedStrategy) {
      throw new Error('Failed to create strategy copy');
    }

    // Record the copy in strategy_copies table
    const { error: copyRecordError } = await supabase
      .from('strategy_copies')
      .insert({
        source_strategy_id: strategyId,
        copied_strategy_id: copiedStrategy.id,
        copied_by: userId,
        copy_type: 'recommendation_apply'
      });

    if (copyRecordError) {
      console.error("Error recording strategy copy:", copyRecordError);
      // Don't throw error here as the copy was successful
    }

    // Also record in the old table for backward compatibility
    const { error: applicationError } = await supabase
      .from('strategy_applications')
      .insert({
        strategy_id: strategyId,
        user_id: userId,
        applied_at: new Date().toISOString()
      });

    if (applicationError) {
      console.error("Error tracking strategy application:", applicationError);
      // Don't throw error here as the main operation was successful
    }

    return copiedStrategy;
  } catch (error) {
    console.error("Error in trackStrategyApplication:", error);
    throw error;
  }
};

// Get apply counts for all strategies using the new database function
export const getStrategyApplyCounts = async (): Promise<Map<string, number>> => {
  try {
    // Get all unique strategy IDs that have been applied
    const { data: appliedStrategies, error } = await supabase
      .from('strategy_copies')
      .select('source_strategy_id')
      .eq('copy_type', 'recommendation_apply');

    if (error) {
      console.error("Error fetching strategy apply counts:", error);
      return new Map();
    }

    // Also get from old table for backward compatibility
    const { data: oldApplications, error: oldError } = await supabase
      .from('strategy_applications')
      .select('strategy_id');

    if (oldError) {
      console.error("Error fetching old strategy applications:", oldError);
    }

    // Count applications per strategy
    const counts = new Map<string, number>();
    
    // Count from new table
    appliedStrategies?.forEach(application => {
      const currentCount = counts.get(application.source_strategy_id) || 0;
      counts.set(application.source_strategy_id, currentCount + 1);
    });

    // Add counts from old table
    oldApplications?.forEach(application => {
      const currentCount = counts.get(application.strategy_id) || 0;
      counts.set(application.strategy_id, currentCount + 1);
    });

    return counts;
  } catch (error) {
    console.error("Error in getStrategyApplyCounts:", error);
    return new Map();
  }
};

// Create a recommended strategy (admin only)
export const createRecommendedStrategy = async (originalStrategyId: string, userId: string) => {
  try {
    // First get the original strategy
    const { data: originalStrategy, error: strategyError } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', originalStrategyId)
      .single();

    if (strategyError || !originalStrategy) {
      throw new Error('Original strategy not found');
    }

    // Create a copy for the recommendations (with admin as owner but marked as recommended)
    const { data: recommendedStrategy, error: copyError } = await supabase
      .from('strategies')
      .insert({
        name: originalStrategy.name,
        description: originalStrategy.description,
        target_asset: originalStrategy.target_asset,
        target_asset_name: originalStrategy.target_asset_name,
        timeframe: originalStrategy.timeframe,
        is_active: originalStrategy.is_active,
        user_id: userId, // Admin becomes the owner of the recommended copy
        stop_loss: originalStrategy.stop_loss,
        take_profit: originalStrategy.take_profit,
        single_buy_volume: originalStrategy.single_buy_volume,
        max_buy_volume: originalStrategy.max_buy_volume,
        is_recommended_copy: true,
        source_strategy_id: originalStrategyId,
        can_be_deleted: false // Recommended strategies cannot be deleted
      })
      .select()
      .single();

    if (copyError || !recommendedStrategy) {
      throw new Error('Failed to create recommended strategy copy');
    }

    // Create the recommendation record
    const { error: recommendationError } = await supabase
      .from('strategy_recommendations')
      .insert({
        original_strategy_id: originalStrategyId,
        recommended_strategy_id: recommendedStrategy.id,
        recommended_by: userId,
        is_official: true
      });

    if (recommendationError) {
      // If recommendation record fails, clean up the strategy copy
      await supabase.from('strategies').delete().eq('id', recommendedStrategy.id);
      throw recommendationError;
    }

    // Also add to old table for backward compatibility
    const { error: oldRecommendationError } = await supabase
      .from('recommended_strategies')
      .insert({
        strategy_id: recommendedStrategy.id,
        recommended_by: userId,
        is_official: true,
        is_public: true,
        deprecated: false
      });

    if (oldRecommendationError) {
      console.error("Error adding to old recommendations table:", oldRecommendationError);
      // Don't throw error here as main operation was successful
    }

    return recommendedStrategy;
  } catch (error) {
    console.error("Error in createRecommendedStrategy:", error);
    throw error;
  }
};

// Remove a recommended strategy (admin only)
export const removeRecommendedStrategy = async (recommendedStrategyId: string, userId: string) => {
  try {
    // First check if this user created the recommendation
    const { data: recommendation, error: findError } = await supabase
      .from('strategy_recommendations')
      .select('*')
      .eq('recommended_strategy_id', recommendedStrategyId)
      .eq('recommended_by', userId)
      .single();

    if (findError || !recommendation) {
      throw new Error('Recommendation not found or unauthorized');
    }

    // Delete the recommendation record
    const { error: deleteRecommendationError } = await supabase
      .from('strategy_recommendations')
      .delete()
      .eq('id', recommendation.id);

    if (deleteRecommendationError) {
      throw deleteRecommendationError;
    }

    // Mark the strategy as deletable and delete it
    const { error: updateError } = await supabase
      .from('strategies')
      .update({ can_be_deleted: true })
      .eq('id', recommendedStrategyId);

    if (updateError) {
      console.error("Error updating strategy deletion flag:", updateError);
    }

    const { error: deleteStrategyError } = await supabase
      .from('strategies')
      .delete()
      .eq('id', recommendedStrategyId);

    if (deleteStrategyError) {
      throw deleteStrategyError;
    }

    // Also clean up old table
    const { error: oldCleanupError } = await supabase
      .from('recommended_strategies')
      .delete()
      .eq('strategy_id', recommendedStrategyId);

    if (oldCleanupError) {
      console.error("Error cleaning up old recommendations table:", oldCleanupError);
    }

  } catch (error) {
    console.error("Error in removeRecommendedStrategy:", error);
    throw error;
  }
};

// Get recommended strategies using new structure
export const getRecommendedStrategies = async () => {
  try {
    const { data: recommendations, error } = await supabase
      .from('strategy_recommendations')
      .select(`
        id,
        original_strategy_id,
        recommended_strategy_id,
        recommended_by,
        is_official,
        created_at,
        updated_at,
        strategies!strategy_recommendations_recommended_strategy_id_fkey (
          id,
          user_id,
          name,
          description,
          is_active,
          timeframe,
          target_asset,
          target_asset_name,
          created_at,
          updated_at,
          stop_loss,
          take_profit,
          single_buy_volume,
          max_buy_volume,
          is_recommended_copy,
          source_strategy_id,
          can_be_deleted
        )
      `);

    if (error) {
      console.error("Error fetching recommended strategies:", error);
      return [];
    }

    if (!recommendations || recommendations.length === 0) {
      console.log("No recommended strategies found");
      return [];
    }

    // Transform to expected format
    const transformedStrategies = recommendations
      .filter(rec => rec.strategies) // Filter out any null strategies
      .map(rec => ({
        id: rec.strategies.id,
        user_id: rec.strategies.user_id,
        name: rec.strategies.name,
        description: rec.strategies.description,
        is_active: rec.strategies.is_active,
        timeframe: rec.strategies.timeframe,
        target_asset: rec.strategies.target_asset,
        target_asset_name: rec.strategies.target_asset_name,
        created_at: rec.strategies.created_at,
        updated_at: rec.strategies.updated_at,
        stop_loss: rec.strategies.stop_loss,
        take_profit: rec.strategies.take_profit,
        single_buy_volume: rec.strategies.single_buy_volume,
        max_buy_volume: rec.strategies.max_buy_volume,
        is_official: rec.is_official,
        is_public: true,
        rating: 5,
        original_strategy_id: rec.original_strategy_id
      }));

    return transformedStrategies;
  } catch (error) {
    console.error("Error in getRecommendedStrategies:", error);
    return [];
  }
};

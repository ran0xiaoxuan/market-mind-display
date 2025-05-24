
import { supabase } from "@/integrations/supabase/client";

export interface StrategyApplyCount {
  strategy_id: string;
  apply_count: number;
}

// Track when a user applies a strategy
export const trackStrategyApplication = async (strategyId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('strategy_applications')
      .insert({
        strategy_id: strategyId,
        user_id: userId,
        applied_at: new Date().toISOString()
      });

    if (error) {
      console.error("Error tracking strategy application:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in trackStrategyApplication:", error);
    throw error;
  }
};

// Get apply counts for all strategies
export const getStrategyApplyCounts = async (): Promise<Map<string, number>> => {
  try {
    const { data, error } = await supabase
      .from('strategy_applications')
      .select('strategy_id')
      .order('applied_at', { ascending: false });

    if (error) {
      console.error("Error fetching strategy apply counts:", error);
      return new Map();
    }

    // Count applications per strategy
    const counts = new Map<string, number>();
    data?.forEach(application => {
      const currentCount = counts.get(application.strategy_id) || 0;
      counts.set(application.strategy_id, currentCount + 1);
    });

    return counts;
  } catch (error) {
    console.error("Error in getStrategyApplyCounts:", error);
    return new Map();
  }
};

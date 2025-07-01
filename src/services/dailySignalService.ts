
import { supabase } from "@/integrations/supabase/client";

export interface DailySignalCount {
  id: string;
  strategy_id: string;
  user_id: string;
  signal_date: string;
  notification_count: number;
  created_at: string;
  updated_at: string;
}

export const dailySignalService = {
  // Check if daily signal limit has been reached for a strategy
  async checkDailySignalLimit(strategyId: string, userId: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Get strategy's daily limit
      const { data: strategy, error: strategyError } = await supabase
        .from('strategies')
        .select('daily_signal_limit')
        .eq('id', strategyId)
        .single();

      if (strategyError || !strategy) {
        console.error('Error fetching strategy:', strategyError);
        return false; // Allow signal if we can't fetch strategy
      }

      // Get current daily count
      const { data: dailyCount, error: countError } = await supabase
        .from('daily_signal_counts')
        .select('notification_count')
        .eq('strategy_id', strategyId)
        .eq('signal_date', today)
        .single();

      if (countError && countError.code !== 'PGRST116') {
        console.error('Error fetching daily signal count:', countError);
        return true; // Allow signal if we can't fetch count
      }

      const currentCount = dailyCount?.notification_count || 0;
      const dailyLimit = strategy.daily_signal_limit || 5;

      return currentCount < dailyLimit;
    } catch (error) {
      console.error('Error checking daily signal limit:', error);
      return true; // Allow signal on error
    }
  },

  // Increment daily signal count for a strategy
  async incrementDailySignalCount(strategyId: string, userId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      // Try to increment existing count
      const { data: existingCount, error: fetchError } = await supabase
        .from('daily_signal_counts')
        .select('*')
        .eq('strategy_id', strategyId)
        .eq('signal_date', today)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching daily signal count:', fetchError);
        return;
      }

      if (existingCount) {
        // Update existing count
        const { error: updateError } = await supabase
          .from('daily_signal_counts')
          .update({ 
            notification_count: existingCount.notification_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCount.id);

        if (updateError) {
          console.error('Error updating daily signal count:', updateError);
        }
      } else {
        // Create new count record
        const { error: insertError } = await supabase
          .from('daily_signal_counts')
          .insert({
            strategy_id: strategyId,
            user_id: userId,
            signal_date: today,
            notification_count: 1
          });

        if (insertError) {
          console.error('Error creating daily signal count:', insertError);
        }
      }
    } catch (error) {
      console.error('Error incrementing daily signal count:', error);
    }
  },

  // Get current daily signal count for a strategy
  async getDailySignalCount(strategyId: string): Promise<{ current: number; limit: number }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get strategy's daily limit
      const { data: strategy, error: strategyError } = await supabase
        .from('strategies')
        .select('daily_signal_limit')
        .eq('id', strategyId)
        .single();

      if (strategyError || !strategy) {
        console.error('Error fetching strategy:', strategyError);
        return { current: 0, limit: 5 };
      }

      // Get current daily count
      const { data: dailyCount, error: countError } = await supabase
        .from('daily_signal_counts')
        .select('notification_count')
        .eq('strategy_id', strategyId)
        .eq('signal_date', today)
        .single();

      if (countError && countError.code !== 'PGRST116') {
        console.error('Error fetching daily signal count:', countError);
        return { current: 0, limit: strategy.daily_signal_limit || 5 };
      }

      return {
        current: dailyCount?.notification_count || 0,
        limit: strategy.daily_signal_limit || 5
      };
    } catch (error) {
      console.error('Error getting daily signal count:', error);
      return { current: 0, limit: 5 };
    }
  },

  // Reset daily signal counts (called at market open)
  async resetDailySignalCounts(): Promise<void> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Delete old counts (older than yesterday)
      const { error } = await supabase
        .from('daily_signal_counts')
        .delete()
        .lt('signal_date', yesterdayStr);

      if (error) {
        console.error('Error resetting daily signal counts:', error);
      } else {
        console.log('Successfully reset daily signal counts');
      }
    } catch (error) {
      console.error('Error in resetDailySignalCounts:', error);
    }
  }
};

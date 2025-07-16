
import { supabase } from "@/integrations/supabase/client";

const DAILY_TEST_SIGNAL_LIMIT = 20;

export interface DailyTestSignalUsage {
  count: number;
  limit: number;
  remaining: number;
  isLimitReached: boolean;
}

export const getDailyTestSignalUsage = async (): Promise<DailyTestSignalUsage> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_test_signal_counts')
      .select('test_signal_count')
      .eq('user_id', user.user.id)
      .eq('signal_date', today)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching daily test signal usage:', error);
      throw error;
    }

    const count = data?.test_signal_count || 0;
    const remaining = Math.max(0, DAILY_TEST_SIGNAL_LIMIT - count);
    const isLimitReached = count >= DAILY_TEST_SIGNAL_LIMIT;

    return {
      count,
      limit: DAILY_TEST_SIGNAL_LIMIT,
      remaining,
      isLimitReached
    };
  } catch (error) {
    console.error('Error in getDailyTestSignalUsage:', error);
    throw error;
  }
};

export const incrementDailyTestSignalCount = async (): Promise<void> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const today = new Date().toISOString().split('T')[0];

    // First, check if we've reached the limit
    const usage = await getDailyTestSignalUsage();
    if (usage.isLimitReached) {
      throw new Error(`Daily test signal limit of ${DAILY_TEST_SIGNAL_LIMIT} reached`);
    }

    // Try to insert a new record (for first signal of the day)
    const { error: insertError } = await supabase
      .from('daily_test_signal_counts')
      .insert({
        user_id: user.user.id,
        signal_date: today,
        test_signal_count: 1
      });

    if (insertError) {
      // If insert fails due to unique constraint, update existing record
      if (insertError.code === '23505') { // unique violation
        const { error: updateError } = await supabase
          .from('daily_test_signal_counts')
          .update({
            test_signal_count: usage.count + 1
          })
          .eq('user_id', user.user.id)
          .eq('signal_date', today);

        if (updateError) {
          console.error('Error updating daily test signal count:', updateError);
          throw updateError;
        }
      } else {
        console.error('Error inserting daily test signal count:', insertError);
        throw insertError;
      }
    }
  } catch (error) {
    console.error('Error in incrementDailyTestSignalCount:', error);
    throw error;
  }
};

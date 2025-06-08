
import { supabase } from "@/integrations/supabase/client";
import { getTradingRulesForStrategy } from "./strategyService";

export const cleanupInvalidSignals = async () => {
  try {
    console.log('Starting cleanup of invalid signals...');
    
    // 1. Delete signals from weekends (Saturday = 6, Sunday = 0)
    const { error: weekendError } = await supabase
      .from('trading_signals')
      .delete()
      .or('and(extract(dow from created_at).eq.0,extract(dow from created_at).eq.6)'); // Sunday=0, Saturday=6
    
    if (weekendError) {
      console.error('Error cleaning weekend signals:', weekendError);
    } else {
      console.log('Cleaned up weekend signals');
    }

    // 2. Delete signals generated outside market hours (before 9:30 AM or after 4:00 PM EST)
    const { error: marketHoursError } = await supabase
      .from('trading_signals')
      .delete()
      .or('extract(hour from (created_at AT TIME ZONE \'America/New_York\')).lt.9,extract(hour from (created_at AT TIME ZONE \'America/New_York\')).gt.16,and(extract(hour from (created_at AT TIME ZONE \'America/New_York\')).eq.9,extract(minute from (created_at AT TIME ZONE \'America/New_York\')).lt.30)');
    
    if (marketHoursError) {
      console.error('Error cleaning market hours signals:', marketHoursError);
    } else {
      console.log('Cleaned up out-of-hours signals');
    }

    // 3. Get all strategies and check if they have valid trading rules
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('id');

    if (strategiesError) {
      console.error('Error fetching strategies:', strategiesError);
      return;
    }

    for (const strategy of strategies || []) {
      const tradingRules = await getTradingRulesForStrategy(strategy.id);
      
      const hasValidRules = tradingRules?.entryRules?.some(group => 
        group.inequalities && group.inequalities.length > 0
      ) || tradingRules?.exitRules?.some(group => 
        group.inequalities && group.inequalities.length > 0
      );

      if (!hasValidRules) {
        // Delete signals for strategies without trading rules
        const { error: deleteError } = await supabase
          .from('trading_signals')
          .delete()
          .eq('strategy_id', strategy.id);

        if (deleteError) {
          console.error(`Error deleting signals for strategy ${strategy.id}:`, deleteError);
        } else {
          console.log(`Deleted signals for strategy ${strategy.id} (no valid trading rules)`);
        }
      }
    }

    // 4. Delete signals with invalid or missing data
    const { error: invalidDataError } = await supabase
      .from('trading_signals')
      .delete()
      .or('signal_data.is.null,signal_data->>\'price\'.is.null,signal_data->>\'asset\'.is.null');

    if (invalidDataError) {
      console.error('Error cleaning signals with invalid data:', invalidDataError);
    } else {
      console.log('Cleaned up signals with invalid data');
    }

    console.log('Signal cleanup completed successfully');
  } catch (error) {
    console.error('Error during signal cleanup:', error);
  }
};

// Function to get clean trading signals for display
export const getCleanTradingSignals = async (timeRange: string = '7d') => {
  try {
    // First run cleanup
    await cleanupInvalidSignals();
    
    // Then fetch clean signals
    let query = supabase
      .from('trading_signals')
      .select(`
        *,
        strategies!inner(name, target_asset, user_id)
      `)
      .order('created_at', { ascending: false });

    // Apply time range filter
    if (timeRange !== 'all') {
      const days = timeRange === '7d' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      query = query.gte('created_at', startDate.toISOString());
    }

    const { data: signals, error } = await query;

    if (error) {
      console.error('Error fetching clean trading signals:', error);
      return [];
    }

    return signals || [];
  } catch (error) {
    console.error('Error getting clean trading signals:', error);
    return [];
  }
};

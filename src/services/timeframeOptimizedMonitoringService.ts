
import { supabase } from "@/integrations/supabase/client";

export interface TimeframeConfig {
  intervalMinutes: number;
  name: string;
  description: string;
}

export const TIMEFRAME_CONFIGS: Record<string, TimeframeConfig> = {
  '1m': { intervalMinutes: 1, name: '1 Minute', description: 'Checked every minute during market hours' },
  '5m': { intervalMinutes: 5, name: '5 Minutes', description: 'Checked every 5 minutes during market hours' },
  '15m': { intervalMinutes: 15, name: '15 Minutes', description: 'Checked every 15 minutes during market hours' },
  '30m': { intervalMinutes: 30, name: '30 Minutes', description: 'Checked every 30 minutes during market hours' },
  '1h': { intervalMinutes: 60, name: '1 Hour', description: 'Checked every hour during market hours' },
  '4h': { intervalMinutes: 240, name: '4 Hours', description: 'Checked every 4 hours during market hours' },
  'Daily': { intervalMinutes: 1440, name: 'Daily', description: 'Checked once per day at market close (4:00 PM ET)' },
  'Weekly': { intervalMinutes: 10080, name: 'Weekly', description: 'Checked once per week on Friday at market close' },
  'Monthly': { intervalMinutes: 43200, name: 'Monthly', description: 'Checked once per month at end of trading month' }
};

export interface StrategyEvaluation {
  id: string;
  strategy_id: string;
  last_evaluated_at: string | null;
  next_evaluation_due: string | null;
  timeframe: string;
  evaluation_count: number;
}

// Get strategy evaluation records - mock implementation since table doesn't exist
export const getStrategyEvaluations = async (strategyId?: string): Promise<StrategyEvaluation[]> => {
  try {
    console.log('Strategy evaluations table does not exist yet, returning mock data');
    
    // Return mock evaluation data
    if (strategyId) {
      return [{
        id: `eval-${strategyId}`,
        strategy_id: strategyId,
        last_evaluated_at: null,
        next_evaluation_due: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        timeframe: '1h',
        evaluation_count: 0
      }];
    }

    return [];
  } catch (error) {
    console.error('Error in getStrategyEvaluations:', error);
    throw error;
  }
};

// Trigger manual signal check for specific timeframes
export const triggerTimeframeSignalCheck = async (timeframes?: string[]) => {
  try {
    console.log('Triggering timeframe-based signal monitoring check...', { timeframes });
    
    const { data, error } = await supabase.functions.invoke('monitor-trading-signals', {
      body: { 
        manual: true,
        timeframes: timeframes || [],
        source: 'manual_timeframe_trigger',
        timestamp: new Date().toISOString()
      }
    });

    if (error) {
      console.error('Error triggering timeframe signal check:', error);
      throw error;
    }

    console.log('Timeframe signal check completed:', data);
    return data;
  } catch (error) {
    console.error('Error in timeframe signal check:', error);
    throw error;
  }
};

// Get next evaluation time for a timeframe
export const getNextEvaluationTime = (timeframe: string, currentTime: Date = new Date()): Date => {
  const easternTime = new Date(currentTime.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const nextEval = new Date(easternTime);
  
  switch (timeframe) {
    case '1m':
      nextEval.setMinutes(nextEval.getMinutes() + 1);
      break;
    case '5m':
      const next5Min = Math.ceil(nextEval.getMinutes() / 5) * 5;
      nextEval.setMinutes(next5Min);
      nextEval.setSeconds(0, 0);
      break;
    case '15m':
      const next15Min = Math.ceil(nextEval.getMinutes() / 15) * 15;
      nextEval.setMinutes(next15Min);
      nextEval.setSeconds(0, 0);
      break;
    case '30m':
      const next30Min = Math.ceil(nextEval.getMinutes() / 30) * 30;
      nextEval.setMinutes(next30Min);
      nextEval.setSeconds(0, 0);
      break;
    case '1h':
      nextEval.setHours(nextEval.getHours() + 1);
      nextEval.setMinutes(0, 0, 0);
      break;
    case '4h':
      const next4Hour = Math.ceil(nextEval.getHours() / 4) * 4;
      nextEval.setHours(next4Hour);
      nextEval.setMinutes(0, 0, 0);
      break;
    case 'Daily':
      // Next trading day at 4:00 PM ET
      nextEval.setDate(nextEval.getDate() + 1);
      nextEval.setHours(16, 0, 0, 0);
      // Skip weekends
      while (nextEval.getDay() === 0 || nextEval.getDay() === 6) {
        nextEval.setDate(nextEval.getDate() + 1);
      }
      break;
    case 'Weekly':
      // Next Friday at 4:00 PM ET
      const daysUntilFriday = (5 - nextEval.getDay() + 7) % 7 || 7;
      nextEval.setDate(nextEval.getDate() + daysUntilFriday);
      nextEval.setHours(16, 0, 0, 0);
      break;
    case 'Monthly':
      // Last trading day of next month at 4:00 PM ET
      nextEval.setMonth(nextEval.getMonth() + 1);
      nextEval.setDate(1); // First day of next month
      nextEval.setDate(0); // Last day of current month (which is now next month)
      // Find last weekday
      while (nextEval.getDay() === 0 || nextEval.getDay() === 6) {
        nextEval.setDate(nextEval.getDate() - 1);
      }
      nextEval.setHours(16, 0, 0, 0);
      break;
    default:
      nextEval.setHours(nextEval.getHours() + 1);
  }
  
  return nextEval;
};

// Check if strategy should be evaluated now
export const shouldEvaluateNow = (
  timeframe: string, 
  lastEvaluated: Date | null, 
  nextDue: Date | null
): boolean => {
  const now = new Date();
  
  // If never evaluated, evaluate now
  if (!lastEvaluated || !nextDue) {
    return true;
  }
  
  // Check if it's time for next evaluation
  if (now >= nextDue) {
    // For daily strategies, only during market close window
    if (timeframe === 'Daily') {
      const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
      const hour = easternTime.getHours();
      const minute = easternTime.getMinutes();
      return hour === 16 && minute >= 0 && minute < 5; // 4:00-4:05 PM ET
    }
    
    // For weekly strategies, only on Friday during market close
    if (timeframe === 'Weekly') {
      const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
      const hour = easternTime.getHours();
      const minute = easternTime.getMinutes();
      return easternTime.getDay() === 5 && hour === 16 && minute >= 0 && minute < 5;
    }
    
    // For monthly strategies, only on last trading day during market close
    if (timeframe === 'Monthly') {
      const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
      const hour = easternTime.getHours();
      const minute = easternTime.getMinutes();
      const isLastTradingDay = isLastTradingDayOfMonth(easternTime);
      return isLastTradingDay && hour === 16 && minute >= 0 && minute < 5;
    }
    
    // For intraday strategies, check during market hours
    return isMarketOpen();
  }
  
  return false;
};

// Helper function to check if it's the last trading day of the month
const isLastTradingDayOfMonth = (date: Date): boolean => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // Get last day of current month
  const lastDay = new Date(year, month + 1, 0);
  
  // Find last weekday of the month
  while (lastDay.getDay() === 0 || lastDay.getDay() === 6) {
    lastDay.setDate(lastDay.getDate() - 1);
  }
  
  return date.getDate() === lastDay.getDate();
};

// Market hours check
export const isMarketOpen = (): boolean => {
  const now = new Date();
  const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  
  // Check if it's a weekday (Monday = 1, Friday = 5)
  const dayOfWeek = easternTime.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday = 0, Saturday = 6
    return false;
  }
  
  const hour = easternTime.getHours();
  const minute = easternTime.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  
  // Market hours: 9:30 AM (570 minutes) to 4:00 PM (960 minutes) EST
  return timeInMinutes >= 570 && timeInMinutes < 960;
};

// Get timeframe statistics - mock implementation
export const getTimeframeStats = async () => {
  try {
    console.log('Strategy evaluations table does not exist, returning mock stats');
    
    // Return mock stats for demonstration
    return [
      {
        timeframe: '1h',
        strategyCount: 3,
        totalEvaluations: 24,
        lastEvaluated: new Date(Date.now() - 3600000), // 1 hour ago
        nextDue: new Date(Date.now() + 3600000) // 1 hour from now
      },
      {
        timeframe: 'Daily',
        strategyCount: 2,
        totalEvaluations: 7,
        lastEvaluated: new Date(Date.now() - 86400000), // 1 day ago
        nextDue: new Date(Date.now() + 3600000) // 1 hour from now
      }
    ];
  } catch (error) {
    console.error('Error getting timeframe stats:', error);
    throw error;
  }
};

// Initialize strategy evaluation records - mock implementation
export const initializeStrategyEvaluations = async () => {
  try {
    console.log('Strategy evaluations table does not exist, skipping initialization');
    console.log('This function will be implemented when the strategy_evaluations table is created');
    return;
  } catch (error) {
    console.error('Error in initializeStrategyEvaluations:', error);
    throw error;
  }
};

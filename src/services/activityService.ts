
import { supabase } from "@/integrations/supabase/client";

export interface Activity {
  id: string;
  type: 'generate' | 'edit' | 'enable' | 'disable' | 'backtest';
  title: string;
  description: string;
  timestamp: Date;
  strategyName?: string;
  userId: string;
}

export const recordActivity = async (
  type: Activity['type'],
  title: string,
  description: string,
  strategyName?: string
) => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      console.error('No authenticated user found');
      return;
    }

    const { data, error } = await supabase
      .from('user_activities')
      .insert({
        user_id: userData.user.id,
        activity_type: type,
        title,
        description,
        strategy_name: strategyName,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error recording activity:', error);
      return;
    }

    console.log('Activity recorded successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in recordActivity:', error);
  }
};

export const getRecentActivities = async (limit: number = 10): Promise<Activity[]> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      console.error('No authenticated user found');
      return [];
    }

    const { data, error } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activities:', error);
      return [];
    }

    return data.map(activity => ({
      id: activity.id,
      type: activity.activity_type as Activity['type'],
      title: activity.title,
      description: activity.description,
      timestamp: new Date(activity.created_at),
      strategyName: activity.strategy_name,
      userId: activity.user_id
    }));
  } catch (error) {
    console.error('Error in getRecentActivities:', error);
    return [];
  }
};


import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Info, TrendingUp, Bell } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

interface DailySignalUsageProps {
  strategyId: string;
  isProUser: boolean;
  signalNotificationsEnabled: boolean;
}

export const DailySignalUsage = ({ 
  strategyId, 
  isProUser, 
  signalNotificationsEnabled 
}: DailySignalUsageProps) => {
  const [dailyCount, setDailyCount] = useState({ current: 0, limit: 5 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDailyCount = async () => {
      if (!strategyId) return;
      
      try {
        const today = new Date().toISOString().split('T')[0];

        // Get strategy's daily limit from the database
        const { data: strategy, error: strategyError } = await supabase
          .from('strategies')
          .select('daily_signal_limit')
          .eq('id', strategyId)
          .single();

        if (strategyError || !strategy) {
          console.error('Error fetching strategy daily limit:', strategyError);
          setDailyCount({ current: 0, limit: 5 }); // Fallback to default
          return;
        }

        // Get current daily count
        const { data: dailyCountData, error: countError } = await supabase
          .from('daily_signal_counts')
          .select('notification_count')
          .eq('strategy_id', strategyId)
          .eq('signal_date', today)
          .single();

        if (countError && countError.code !== 'PGRST116') {
          console.error('Error fetching daily signal count:', countError);
        }

        const currentCount = dailyCountData?.notification_count || 0;
        const dailyLimit = strategy.daily_signal_limit || 5;

        setDailyCount({
          current: currentCount,
          limit: dailyLimit
        });

        console.log(`Daily signal usage: ${currentCount}/${dailyLimit} for strategy ${strategyId}`);
      } catch (error) {
        console.error('Error loading daily signal count:', error);
        setDailyCount({ current: 0, limit: 5 }); // Fallback to default
      } finally {
        setIsLoading(false);
      }
    };

    loadDailyCount();
    
    // Refresh every 5 minutes
    const interval = setInterval(loadDailyCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [strategyId]);

  if (!isProUser || !signalNotificationsEnabled) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            Daily Signal Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-2 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = (dailyCount.current / dailyCount.limit) * 100;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = dailyCount.current >= dailyCount.limit;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-500" />
          Daily Signal Usage
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-sm">
                  Tracks how many signal notifications have been sent to your external channels today. 
                  Resets daily at market open (9:30 AM ET).
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Notifications Sent Today</span>
          <Badge 
            variant={isAtLimit ? "destructive" : isNearLimit ? "secondary" : "default"}
            className="text-sm"
          >
            {dailyCount.current} / {dailyCount.limit}
          </Badge>
        </div>
        
        <Progress 
          value={usagePercentage} 
          className="h-2"
        />
        
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {isAtLimit 
              ? "Daily limit reached - signals still recorded in app"
              : `${dailyCount.limit - dailyCount.current} notifications remaining today`
            }
          </span>
        </div>
        
        {isAtLimit && (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
            <strong>Limit Reached:</strong> You've reached your daily notification limit. 
            All trading signals will continue to be recorded in the app, but no external 
            notifications will be sent until tomorrow.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

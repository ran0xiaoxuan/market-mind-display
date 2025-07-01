import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Info, Crown, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { dailySignalService } from "@/services/dailySignalService";

interface StrategyInfoProps {
  strategy: any;
  isActive: boolean;
  onStatusChange: (checked: boolean) => void;
}

export const StrategyInfo = ({
  strategy,
  isActive,
  onStatusChange
}: StrategyInfoProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isProUser, setIsProUser] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [dailySignalLimit, setDailySignalLimit] = useState(5);
  const [dailySignalCount, setDailySignalCount] = useState({ current: 0, limit: 5 });
  const { user } = useAuth();

  // Get the strategy ID - handle both possible field names
  const strategyId = strategy?.id || strategy?.strategyId;

  console.log('StrategyInfo - strategy object:', strategy);
  console.log('StrategyInfo - strategyId:', strategyId);

  // Check user subscription status from profiles table
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user) {
        setIsProUser(false);
        setIsLoadingSubscription(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', user.id)
          .single();

        if (error) {
          console.log("No profile found for user:", error);
          setIsProUser(false);
        } else if (profile) {
          setIsProUser(profile.subscription_tier === 'pro');
        } else {
          setIsProUser(false);
        }
      } catch (error) {
        console.error("Error checking subscription status:", error);
        setIsProUser(false);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    checkSubscriptionStatus();
  }, [user]);

  // Format the time distance with more precise units and capitalize first letter
  const formatTimeAgo = (dateString: string) => {
    try {
      if (!dateString) return "Unknown";
      const date = new Date(dateString);
      const timeAgo = formatDistanceToNow(date, {
        addSuffix: true
      });

      // Capitalize the first letter
      return timeAgo.charAt(0).toUpperCase() + timeAgo.slice(1);
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString || "Unknown";
    }
  };

  // Load strategy settings
  useEffect(() => {
    if (strategy && strategyId) {
      // Use the dailySignalLimit from the strategy prop, fallback to 5 if not available
      const limit = strategy.dailySignalLimit || strategy.daily_signal_limit || 5;
      setDailySignalLimit(limit);
      
      // Load current daily signal count
      dailySignalService.getDailySignalCount(strategyId)
        .then(count => setDailySignalCount(count))
        .catch(error => console.error('Error loading daily signal count:', error));
    }
  }, [strategy, strategyId]);

  // Handle the unified status change
  const handleStatusChange = async (checked: boolean) => {
    if (!strategyId) {
      console.error('No strategy ID available for status change');
      toast.error("Unable to update strategy status - missing strategy ID");
      return;
    }

    // Only allow Pro users to activate strategies
    if (checked && !isProUser) {
      toast.error("Pro Feature Required", {
        description: "Strategy activation and signal notifications require a Pro subscription. Upgrade to activate strategies and receive real-time trading alerts.",
        duration: 6000,
        action: {
          label: "Upgrade to Pro",
          onClick: () => {
            console.log("Navigate to upgrade page");
          }
        }
      });
      return;
    }

    setIsSaving(true);
    try {
      console.log('Updating strategy status for ID:', strategyId, 'to:', checked);
      
      // Update both strategy activation and signal notifications
      const { error } = await supabase
        .from('strategies')
        .update({ 
          is_active: checked,
          signal_notifications_enabled: checked && isProUser,
          updated_at: new Date().toISOString()
        })
        .eq('id', strategyId);

      if (error) {
        console.error('Supabase error updating strategy status:', error);
        throw error;
      }

      // Call the parent component's handler
      onStatusChange(checked);
      
      if (checked) {
        toast.success("Strategy Activated", {
          description: isProUser 
            ? "Strategy is now active and will send notifications to your configured channels."
            : "Strategy is now active and signals will be recorded in the app."
        });
      } else {
        toast.success("Strategy Deactivated", {
          description: "Strategy will not generate any signals."
        });
      }
    } catch (error) {
      console.error("Error in status change:", error);
      toast.error("Failed to update strategy status");
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state while checking subscription
  if (isLoadingSubscription) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Strategy Information</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  const isFreeUser = !isProUser;
  
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">Strategy Information</h2>
      
      <div className="mb-8">
        <h3 className="text-sm text-muted-foreground">Strategy Introduction</h3>
        <p className="font-medium text-inherit">{strategy.description || "No description provided"}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6">
        <div>
          <p className="text-sm text-muted-foreground">Created</p>
          <p className="font-medium">{formatTimeAgo(strategy.createdAt)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Last Updated</p>
          <p className="font-medium">{formatTimeAgo(strategy.updatedAt)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Timeframe</p>
          <p className="font-medium">{strategy.timeframe || "Unknown"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Target Asset</p>
          <p className="font-medium">{strategy.targetAsset || "Unknown"}</p>
        </div>
        
        {/* Unified Strategy Control */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm text-muted-foreground">Strategy Status</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">
                    When active, the strategy generates trading signals in the app. 
                    {isProUser 
                      ? " Pro users can also send notifications to external channels."
                      : " Pro subscription required for external notifications."
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isFreeUser && <Crown className="h-4 w-4 text-yellow-500" />}
            {isFreeUser && <Lock className="h-4 w-4 text-muted-foreground" />}
          </div>
          
          {/* Show upgrade banner only for Free users */}
          {isFreeUser && (
            <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Crown className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-900 mb-1">Pro Feature Required</h4>
                  <p className="text-sm text-yellow-800 mb-3">
                    Strategy activation and external notifications require a Pro subscription. 
                    Upgrade to activate strategies and send alerts to your email, Discord, or Telegram.
                  </p>
                  <Button 
                    size="sm" 
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    onClick={() => {
                      console.log("Navigate to upgrade page");
                    }}
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Main Strategy Switch */}
            <div className="flex items-center gap-3">
              <Switch 
                id="strategy-status" 
                checked={isActive} 
                onCheckedChange={handleStatusChange} 
                disabled={isSaving} 
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {isSaving ? 'Updating...' : isActive ? 'Strategy Active' : 'Strategy Inactive'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isFreeUser 
                    ? 'Pro subscription required for activation'
                    : isActive 
                      ? 'Generating signals and sending notifications to configured channels' 
                      : 'Strategy will not generate any signals'
                  }
                </span>
              </div>
            </div>

            {/* Daily Signal Limit Display - Show for Pro users with active strategy */}
            {isProUser && isActive && (
              <div className="space-y-2 pl-8 border-l-2 border-gray-200">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">
                    Maximum Notifications Per Trading Day (Edit in Strategy Settings)
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">
                          Limits the number of signal notifications sent to your external channels per trading day. 
                          All signals are still recorded in the app regardless of this limit.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-foreground">
                    {dailySignalLimit} notifications per day
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Today: {dailySignalCount.current} notification{dailySignalCount.current !== 1 ? 's' : ''} sent
                  </span>
                </div>
                
                {dailySignalCount.current >= dailySignalCount.limit && (
                  <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                    ⚠️ Daily notification limit reached. Signals will still be recorded in the app.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

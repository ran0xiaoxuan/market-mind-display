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
  const [signalNotificationsEnabled, setSignalNotificationsEnabled] = useState(false);
  const [dailySignalLimit, setDailySignalLimit] = useState(5);
  const [dailySignalCount, setDailySignalCount] = useState({ current: 0, limit: 5 });
  const { user } = useAuth();

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

  // Load strategy notification settings
  useEffect(() => {
    if (strategy) {
      setSignalNotificationsEnabled(strategy.signal_notifications_enabled || false);
      setDailySignalLimit(strategy.daily_signal_limit || 5);
      
      // Load current daily signal count
      dailySignalService.getDailySignalCount(strategy.id)
        .then(count => setDailySignalCount(count))
        .catch(error => console.error('Error loading daily signal count:', error));
    }
  }, [strategy]);

  // Handle signal notifications toggle
  const handleSignalNotificationsChange = async (checked: boolean) => {
    // Only allow Pro users to enable signal notifications
    if (checked && !isProUser) {
      toast.error("Pro Feature Required", {
        description: "Signal notifications require a Pro subscription. Upgrade to activate strategies and receive real-time trading alerts.",
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
      const { error } = await supabase
        .from('strategies')
        .update({ 
          signal_notifications_enabled: checked,
          updated_at: new Date().toISOString()
        })
        .eq('id', strategy.id);

      if (error) throw error;

      setSignalNotificationsEnabled(checked);
      
      if (checked) {
        toast.success("Signal Notifications Enabled", {
          description: "You'll now receive trading signals via your configured notification channels."
        });
      } else {
        toast.success("Signal Notifications Disabled", {
          description: "Signals will be recorded in the app but no notifications will be sent."
        });
      }
    } catch (error) {
      console.error("Error updating signal notifications:", error);
      toast.error("Failed to update signal notifications");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle daily signal limit change
  const handleDailySignalLimitChange = async (value: number) => {
    if (value < 1 || value > 10) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('strategies')
        .update({ 
          daily_signal_limit: value,
          updated_at: new Date().toISOString()
        })
        .eq('id', strategy.id);

      if (error) throw error;

      setDailySignalLimit(value);
      setDailySignalCount(prev => ({ ...prev, limit: value }));
      
      toast.success("Daily Signal Limit Updated", {
        description: `Maximum signals per day set to ${value}`
      });
    } catch (error) {
      console.error("Error updating daily signal limit:", error);
      toast.error("Failed to update daily signal limit");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle the status change and update it in the database
  const handleStatusChange = async (checked: boolean) => {
    // Only allow Pro users to activate strategies
    if (checked && !isProUser) {
      toast.error("Pro Feature Required", {
        description: "Signal notifications require a Pro subscription. Upgrade to activate strategies and receive real-time trading alerts.",
        duration: 6000,
        action: {
          label: "Upgrade to Pro",
          onClick: () => {
            // Navigate to pricing/upgrade page
            console.log("Navigate to upgrade page");
          }
        }
      });
      return;
    }

    setIsSaving(true);
    try {
      // Call the parent component's handler to update the database and local state
      onStatusChange(checked);
      
      if (checked) {
        toast.success("Strategy Activated", {
          description: "You'll now receive trading signals via your configured notification channels."
        });
      } else {
        toast.success("Strategy Deactivated", {
          description: "Signals will be recorded in the app but no notifications will be sent."
        });
      }
    } catch (error) {
      console.error("Error in status change:", error);
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
        
        {/* Strategy Active Status */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm text-muted-foreground">Strategy Active</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">
                    When active, the strategy will generate trading signals in the app during market hours.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex items-center gap-3">
            <Switch 
              id="strategy-active" 
              checked={isActive} 
              onCheckedChange={onStatusChange} 
              disabled={isSaving} 
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {isSaving ? 'Updating...' : isActive ? 'Active - Generating Signals' : 'Inactive - No Signals'}
              </span>
              <span className="text-xs text-muted-foreground">
                {isActive 
                  ? 'Strategy will generate trading signals in the app' 
                  : 'Strategy will not generate any signals'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Signal Notifications Section */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm text-muted-foreground">Signal Notifications</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">
                    When enabled, trading signals are sent to your configured notification channels (email, Discord, Telegram) 
                    up to your daily limit. All signals are always recorded in the app.
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
                    Signal notifications require a Pro subscription. Upgrade to send trading alerts to your email, Discord, or Telegram.
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
            {/* Signal Notifications Toggle */}
            <div className="flex items-center gap-3">
              <Switch 
                id="signal-notifications" 
                checked={signalNotificationsEnabled} 
                onCheckedChange={handleSignalNotificationsChange} 
                disabled={isSaving || isFreeUser} 
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {isSaving ? 'Updating...' : signalNotificationsEnabled ? 'Notifications Enabled' : 'Notifications Disabled'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isFreeUser 
                    ? 'Pro subscription required for notifications'
                    : signalNotificationsEnabled 
                      ? 'Signals will be sent to your notification channels' 
                      : 'Signals will only be recorded in the app'
                  }
                </span>
              </div>
            </div>

            {/* Daily Signal Limit - Only show for Pro users with notifications enabled */}
            {isProUser && signalNotificationsEnabled && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="daily-signal-limit" className="text-sm font-medium">
                    Maximum Signals Per Trading Day
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
                  <Input
                    id="daily-signal-limit"
                    type="number"
                    min="1"
                    max="10"
                    value={dailySignalLimit}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value >= 1 && value <= 10) {
                        handleDailySignalLimitChange(value);
                      }
                    }}
                    className="w-20"
                    disabled={isSaving}
                  />
                  <span className="text-sm text-muted-foreground">
                    Today: {dailySignalCount.current} / {dailySignalCount.limit} signals sent
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

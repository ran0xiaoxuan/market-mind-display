import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Info, Crown, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

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
  const [wasProUser, setWasProUser] = useState(false);

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

  // Check if user was previously a Pro user (this would come from user subscription history)
  useEffect(() => {
    // This would be replaced with actual subscription history check
    // For now, we'll simulate detecting if they had active strategies before
    setWasProUser(isActive); // If strategy is active, they were likely Pro before
  }, []);

  // Handle the status change and update it in the database
  const handleStatusChange = async (checked: boolean) => {
    // For future Pro feature implementation
    const isProUser = false; // This will be replaced with actual user tier check
    
    if (checked && !isProUser) {
      const upgradeMessage = wasProUser 
        ? "Your Pro subscription has expired. Upgrade to reactivate signal notifications and continue receiving real-time trading alerts."
        : "Signal notifications are a Pro feature. Upgrade to receive real-time trading signals via email, Discord, or Telegram.";
      
      const upgradeTitle = wasProUser ? "Pro Subscription Expired" : "Pro Feature Required";
      
      toast.error(upgradeTitle, {
        description: upgradeMessage,
        duration: 6000,
        action: {
          label: "Upgrade to Pro",
          onClick: () => {
            // Navigate to pricing/upgrade page
            console.log("Navigate to upgrade page");
            // This would open the pricing page or subscription modal
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

  // Check if user is currently Pro (this would be replaced with actual subscription check)
  const isProUser = false; // This will be replaced with actual user tier check
  const showProRequired = !isProUser;
  
  return <Card className="p-6">
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
                    When active, trading signals are sent to your configured notification channels (email, Discord, Telegram). 
                    When inactive, signals are only recorded in the app.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Crown className="h-4 w-4 text-yellow-500" />
            {showProRequired && (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          
          {showProRequired && wasProUser ? (
            <div className="border border-orange-200 bg-orange-50 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-orange-900 mb-1">Pro Subscription Expired</h4>
                  <p className="text-sm text-orange-700 mb-3">
                    Your strategy has been deactivated because your Pro subscription expired. 
                    Upgrade to reactivate signal notifications.
                  </p>
                  <Button 
                    size="sm" 
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => {
                      console.log("Navigate to upgrade page");
                      // This would open the pricing page or subscription modal
                    }}
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              </div>
            </div>
          ) : showProRequired && !wasProUser ? (
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Crown className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-1">Pro Feature</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Signal notifications require a Pro subscription. Upgrade to receive real-time alerts 
                    via email, Discord, or Telegram.
                  </p>
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      console.log("Navigate to upgrade page");
                      // This would open the pricing page or subscription modal
                    }}
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            <Switch 
              id="strategy-status" 
              checked={isActive} 
              onCheckedChange={handleStatusChange} 
              disabled={isSaving || showProRequired} 
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {isSaving ? 'Updating...' : isActive ? 'Active - Notifications Enabled' : 'Inactive - App Only'}
              </span>
              <span className="text-xs text-muted-foreground">
                {showProRequired 
                  ? 'Pro subscription required for notifications'
                  : isActive 
                    ? 'Signals will be sent to your notification channels' 
                    : 'Signals will only be recorded in the app'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>;
};

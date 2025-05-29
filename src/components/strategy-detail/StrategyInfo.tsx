
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { Info, Crown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  // Handle the status change and update it in the database
  const handleStatusChange = async (checked: boolean) => {
    // For future Pro feature implementation
    const isProUser = true; // This will be replaced with actual user tier check
    
    if (checked && !isProUser) {
      toast.error("Pro Feature Required", {
        description: "Signal notifications are a Pro feature. Upgrade to receive real-time trading signals via email, Discord, or Telegram.",
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
          </div>
          <div className="flex items-center gap-3">
            <Switch 
              id="strategy-status" 
              checked={isActive} 
              onCheckedChange={handleStatusChange} 
              disabled={isSaving} 
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {isSaving ? 'Updating...' : isActive ? 'Active - Notifications Enabled' : 'Inactive - App Only'}
              </span>
              <span className="text-xs text-muted-foreground">
                {isActive 
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

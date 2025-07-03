
import React, { useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, BellOff } from "lucide-react";

interface NotificationToggleProps {
  strategyId: string;
  strategyName: string;
  isEnabled: boolean;
  isActive: boolean;
  onToggle: (enabled: boolean) => void;
}

export const NotificationToggle: React.FC<NotificationToggleProps> = ({
  strategyId,
  strategyName,
  isEnabled,
  isActive,
  onToggle
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (checked: boolean) => {
    if (!isActive && checked) {
      toast.error("Cannot enable notifications for inactive strategy", {
        description: "Please activate the strategy first before enabling notifications."
      });
      return;
    }

    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('strategies')
        .update({ 
          signal_notifications_enabled: checked,
          updated_at: new Date().toISOString()
        })
        .eq('id', strategyId);

      if (error) {
        console.error("Error updating notification settings:", error);
        toast.error("Failed to update notification settings");
        return;
      }

      onToggle(checked);
      toast.success(
        checked 
          ? "Notifications enabled for this strategy" 
          : "Notifications disabled for this strategy"
      );
    } catch (err) {
      console.error("Error in handleToggle:", err);
      toast.error("An error occurred while updating notification settings");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg border bg-card">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
        {isEnabled ? (
          <Bell className="h-4 w-4 text-green-600" />
        ) : (
          <BellOff className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      
      <div className="flex-1">
        <Label htmlFor={`notifications-${strategyId}`} className="text-sm font-medium">
          Send Notifications
        </Label>
        <p className="text-xs text-muted-foreground mt-1">
          {isEnabled 
            ? "Signals will be sent to your configured channels (Email/Discord/Telegram)"
            : "Signals will only be recorded in the app"
          }
        </p>
      </div>
      
      <Switch
        id={`notifications-${strategyId}`}
        checked={isEnabled}
        onCheckedChange={handleToggle}
        disabled={isUpdating || !isActive}
        aria-label={`Toggle notifications for ${strategyName}`}
      />
    </div>
  );
};

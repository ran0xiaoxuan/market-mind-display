
import React, { useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, BellOff, Crown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

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
  const [localEnabled, setLocalEnabled] = useState(isEnabled);
  const queryClient = useQueryClient();

  // Update local state when prop changes (e.g., from parent component refresh)
  React.useEffect(() => {
    setLocalEnabled(isEnabled);
  }, [isEnabled]);

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true);
    
    // Immediately update local state for responsive UI
    setLocalEnabled(checked);
    
    try {
      // When enabling notifications: set both is_active=true and signal_notifications_enabled=true
      // When disabling notifications: set signal_notifications_enabled=false but keep is_active=true
      const updateData = {
        is_active: true, // Always keep strategy active for signal recording
        signal_notifications_enabled: checked,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('strategies')
        .update(updateData)
        .eq('id', strategyId);

      if (error) {
        console.error("Error updating notification settings:", error);
        // Revert local state on error
        setLocalEnabled(!checked);
        toast.error("Failed to update notification settings");
        return;
      }

      // Invalidate and refetch related queries to update the UI immediately
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['strategies', 'optimized'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['strategy', strategyId] }),
      ]);

      // Dispatch custom events to notify other components
      window.dispatchEvent(new CustomEvent('strategy-updated', { 
        detail: { strategyId, notificationsEnabled: checked } 
      }));
      window.dispatchEvent(new CustomEvent('notification-settings-changed', { 
        detail: { strategyId, notificationsEnabled: checked } 
      }));

      // Call parent callback to update parent state
      onToggle(checked);
      toast.success(
        checked 
          ? "External notifications enabled - signals will be sent to your configured channels" 
          : "External notifications disabled - signals will only be recorded in the app"
      );
    } catch (err) {
      console.error("Error in handleToggle:", err);
      // Revert local state on error
      setLocalEnabled(!checked);
      toast.error("An error occurred while updating notification settings");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg border bg-card">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
        {localEnabled ? (
          <Bell className="h-4 w-4 text-green-600" />
        ) : (
          <BellOff className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <Label htmlFor={`notifications-${strategyId}`} className="text-sm font-medium">
            Send External Notifications
          </Label>
          <Crown className="h-3 w-3 text-amber-600" />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {localEnabled 
            ? "Signals will be sent to your configured channels (Email/Discord/Telegram) and recorded in the app"
            : "Signals will only be recorded in the app - upgrade to PRO to enable external notifications"
          }
        </p>
      </div>
      
      <Switch
        id={`notifications-${strategyId}`}
        checked={localEnabled}
        onCheckedChange={handleToggle}
        disabled={isUpdating}
        aria-label={`Toggle external notifications for ${strategyName}`}
      />
    </div>
  );
};

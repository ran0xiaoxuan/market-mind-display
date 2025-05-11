
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

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
    setIsSaving(true);
    try {
      // Call the parent component's handler to update the database and local state
      onStatusChange(checked);
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
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <div className="flex items-center gap-2">
            <Switch id="strategy-status" checked={isActive} onCheckedChange={handleStatusChange} disabled={isSaving} />
            <span className="text-sm">
              {isSaving ? 'Saving...' : isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </Card>;
};

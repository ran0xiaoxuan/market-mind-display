
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Clock, Target, Calendar, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { NotificationToggle } from "./NotificationToggle";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StrategyInfoProps {
  strategy: {
    id?: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
    timeframe?: string;
    targetAsset?: string;
    dailySignalLimit?: number;
    signalNotificationsEnabled?: boolean;
  };
  isActive: boolean;
  onStatusChange: (checked: boolean) => void;
}

export const StrategyInfo: React.FC<StrategyInfoProps> = ({
  strategy,
  isActive,
  onStatusChange
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    strategy.signalNotificationsEnabled || false
  );

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return "Unknown";
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Unknown";
    }
  };

  const handleNotificationToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Strategy Information
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Strategy Description */}
        {strategy.description && (
          <div>
            <h4 className="text-sm font-medium mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">{strategy.description}</p>
          </div>
        )}

        {/* Strategy Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Asset</p>
              <p className="text-sm font-medium">{strategy.targetAsset || "Not specified"}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Timeframe</p>
              <p className="text-sm font-medium">{strategy.timeframe || "Not specified"}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm font-medium">{formatTimeAgo(strategy.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Last Updated</p>
              <p className="text-sm font-medium">{formatTimeAgo(strategy.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Strategy Status Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
          <div className="space-y-1">
            <Label htmlFor="strategy-status" className="text-sm font-medium">
              Strategy Status
            </Label>
            <p className="text-xs text-muted-foreground">
              {isActive ? "Strategy is monitoring market conditions" : "Strategy is paused"}
            </p>
          </div>
          <Switch
            id="strategy-status"
            checked={isActive}
            onCheckedChange={onStatusChange}
          />
        </div>

        {/* Notification Settings */}
        {strategy.id && (
          <NotificationToggle
            strategyId={strategy.id}
            strategyName="Strategy" // This could be passed as a prop if needed
            isEnabled={notificationsEnabled}
            isActive={isActive}
            onToggle={handleNotificationToggle}
          />
        )}

        {/* Warning for inactive strategy with notifications */}
        {!isActive && notificationsEnabled && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This strategy has notifications enabled but is currently inactive. 
              Activate the strategy to start receiving notifications.
            </AlertDescription>
          </Alert>
        )}

        {/* Daily Signal Limit */}
        {strategy.dailySignalLimit && (
          <div className="text-sm">
            <span className="text-muted-foreground">Daily Signal Limit: </span>
            <span className="font-medium">{strategy.dailySignalLimit} signals per day</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

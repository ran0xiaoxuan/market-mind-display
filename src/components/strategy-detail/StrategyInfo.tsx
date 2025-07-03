
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Clock, Target, Calendar, Crown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { NotificationToggle } from "./NotificationToggle";
import { useUserSubscription, isPro } from "@/hooks/useUserSubscription";
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
}

export const StrategyInfo: React.FC<StrategyInfoProps> = ({
  strategy
}) => {
  const { tier, isLoading } = useUserSubscription();
  const userIsPro = isPro(tier);

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Strategy Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading subscription status...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strategy Information</CardTitle>
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

        {/* PRO Notification Settings */}
        {userIsPro ? (
          strategy.id && (
            <NotificationToggle
              strategyId={strategy.id}
              strategyName="Strategy"
              isEnabled={strategy.signalNotificationsEnabled || false}
              isActive={true} // Always true since strategies are always active for signal recording
              onToggle={() => {}} // Component handles its own state
            />
          )
        ) : (
          <Alert className="border-amber-200 bg-amber-50">
            <Crown className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              <div className="font-medium mb-1">PRO Feature: External Notifications</div>
              <p className="text-sm">
                Upgrade to PRO to send trading signals to your Email, Discord, or Telegram channels. 
                All signals are still recorded in the app.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Daily Signal Limit - Only show for PRO users */}
        {userIsPro && strategy.dailySignalLimit && (
          <div className="text-sm">
            <span className="text-muted-foreground">Daily Signal Limit: </span>
            <span className="font-medium">{strategy.dailySignalLimit} signals per day</span>
            <span className="text-xs text-amber-600 ml-2">
              <Crown className="h-3 w-3 inline mr-1" />
              PRO Feature
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

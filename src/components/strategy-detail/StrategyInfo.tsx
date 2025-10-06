
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Clock, Target, Calendar, Crown, DollarSign, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { NotificationToggle } from "./NotificationToggle";
import { useUserSubscription, isPro } from "@/hooks/useUserSubscription";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface StrategyInfoProps {
  strategy: {
    id?: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
    timeframe?: string;
    targetAsset?: string;
    targetAssetName?: string;
    dailySignalLimit?: number;
    signalNotificationsEnabled?: boolean;
    accountCapital?: number;
    riskTolerance?: string;
  };
  hideProBanner?: boolean;
}

export const StrategyInfo: React.FC<StrategyInfoProps> = ({
  strategy,
  hideProBanner
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

  const handleUpgrade = async (plan: 'monthly' | 'yearly') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Please log in again");
        return;
      }
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'x-site-url': window.location.origin,
        },
        body: { plan }
      });
      if (error) {
        const contextBody = (error as any)?.context?.body;
        try {
          const parsed = typeof contextBody === 'string' ? JSON.parse(contextBody) : contextBody;
          if (parsed?.error) {
            throw new Error(parsed.error);
          }
        } catch (_) {}
        throw error as any;
      }
      if (data?.url) {
        window.location.href = data.url as string;
      } else {
        toast.error("Failed to start checkout");
      }
    } catch (err: any) {
      console.error('Upgrade error:', err);
      toast.error(err?.message || "Failed to start checkout");
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
              <p className="text-sm font-medium">
                {strategy.targetAsset && strategy.targetAssetName 
                  ? `${strategy.targetAsset} - ${strategy.targetAssetName}`
                  : strategy.targetAsset || "Not specified"}
              </p>
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
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Strategy Capital</p>
              <p className="text-sm font-medium">
                ${(strategy.accountCapital || 10000).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Risk Tolerance</p>
              <p className="text-sm font-medium capitalize">
                {strategy.riskTolerance || 'moderate'}
                <span className="text-xs text-muted-foreground ml-1">
                  ({strategy.riskTolerance === 'conservative' ? '15%' : 
                    strategy.riskTolerance === 'aggressive' ? '35%' : 
                    '25%'} per trade)
                </span>
              </p>
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
        ) : !hideProBanner ? (
          <Alert className="border-amber-200 bg-amber-50">
            <Crown className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              <div className="font-medium mb-1">PRO Feature: External Notifications</div>
              <p className="text-sm">
                Upgrade to PRO to send trading signals to your Email, Discord, or Telegram channels. 
                All signals are still recorded in the app.
              </p>
              <div className="mt-3 flex flex-col sm:flex-row gap-3">
                <Button onClick={() => handleUpgrade('yearly')} size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-6 py-3" aria-label="Upgrade to Pro Yearly">
                  Upgrade to Pro — Yearly
                </Button>
                <Button onClick={() => handleUpgrade('monthly')} size="lg" variant="outline" className="bg-white border-amber-500 text-amber-700 hover:bg-amber-50 hover:text-amber-500 px-6 py-3" aria-label="Upgrade to Pro Monthly">
                  Upgrade to Pro — Monthly
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : null}

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

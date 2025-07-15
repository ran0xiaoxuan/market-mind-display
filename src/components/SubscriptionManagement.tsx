
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useUserSubscription, isPro } from "@/hooks/useUserSubscription";
import { Crown, ExternalLink, RefreshCw } from "lucide-react";

export const SubscriptionManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { tier, isLoading: subscriptionLoading, subscriptionEnd } = useUserSubscription();
  const userIsPro = isPro(tier);

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to open customer portal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshSubscription = async () => {
    setIsRefreshing(true);
    try {
      const { error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        throw error;
      }

      toast({
        title: "Subscription Updated",
        description: "Your subscription status has been refreshed.",
      });
      
      // Force a page reload to update all components
      window.location.reload();
    } catch (error) {
      console.error('Refresh error:', error);
      toast({
        title: "Refresh Error",
        description: error.message || "Failed to refresh subscription status.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (subscriptionLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Subscription
          </CardTitle>
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
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Subscription Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <div className="flex items-center gap-2">
              <Badge variant={userIsPro ? 'pro' : 'free'} className="text-sm">
                {userIsPro ? 'Pro' : 'Free'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshSubscription}
                disabled={isRefreshing}
                className="p-1 h-6 w-6"
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {userIsPro && subscriptionEnd && (
          <div>
            <p className="text-sm text-muted-foreground">Next Billing Date</p>
            <p className="font-medium">{formatDate(subscriptionEnd)}</p>
          </div>
        )}

        <div className="space-y-2">
          {userIsPro ? (
            <Button
              onClick={handleManageSubscription}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? "Opening..." : "Manage Subscription"}
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Upgrade to Pro to access advanced features like external notifications.
              </p>
              <Button asChild className="w-full">
                <a href="/pricing">Upgrade to Pro</a>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

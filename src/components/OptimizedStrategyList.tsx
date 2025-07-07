
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ChevronRight, Bell, BellOff } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useUserSubscription, isPro } from "@/hooks/useUserSubscription";
import { useOptimizedStrategies } from "@/hooks/useOptimizedStrategies";
import { useQueryClient } from "@tanstack/react-query";

export function OptimizedStrategyList() {
  const { data: strategies = [], isLoading, error, refetch } = useOptimizedStrategies();
  const [filteredStrategies, setFilteredStrategies] = useState(strategies.slice(0, 6));
  const queryClient = useQueryClient();

  const {
    tier
  } = useUserSubscription();
  const userIsPro = isPro(tier);

  useEffect(() => {
    setFilteredStrategies(strategies.slice(0, 6));
  }, [strategies]);

  useEffect(() => {
    if (error) {
      console.error("Error fetching strategies:", error);
      toast.error("Failed to load strategies", {
        description: "Please refresh to try again"
      });
    }
  }, [error]);

  // Listen for strategy updates and refresh data
  useEffect(() => {
    const handleStrategyUpdate = () => {
      console.log("Strategy updated, invalidating cache...");
      queryClient.invalidateQueries({ queryKey: ['strategies', 'optimized'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      refetch();
    };

    // Listen for custom events that might be dispatched when strategies are updated
    window.addEventListener('strategy-updated', handleStrategyUpdate);
    window.addEventListener('notification-settings-changed', handleStrategyUpdate);
    
    return () => {
      window.removeEventListener('strategy-updated', handleStrategyUpdate);
      window.removeEventListener('notification-settings-changed', handleStrategyUpdate);
    };
  }, [queryClient, refetch]);

  const formatTimeAgo = (dateString: string) => {
    try {
      if (!dateString) return "Unknown";
      const date = new Date(dateString);
      return formatDistanceToNow(date, {
        addSuffix: true
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Unknown";
    }
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">Your Strategies</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <div className="divide-y">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-4">
                <div className="animate-pulse w-2/3 h-6 rounded bg-muted"></div>
                <div className="animate-pulse w-8 h-8 rounded-full bg-muted"></div>
              </div>
            ))
          ) : error ? (
            <div className="px-6 py-4 text-center text-destructive">
              Failed to load strategies
              <Button variant="outline" size="sm" className="mt-2 mx-auto block" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : filteredStrategies.length > 0 ? (
            filteredStrategies.map(strategy => (
              <Link key={strategy.id} to={`/strategy/${strategy.id}`} className="block hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="mb-1">
                      <p className="font-medium truncate pr-2">{strategy.name}</p>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <span>{strategy.targetAsset || "Unknown"}</span>
                      <span>•</span>
                      <span>Updated {formatTimeAgo(strategy.updatedAt)}</span>
                      {userIsPro && (
                        <>
                          <span>•</span>
                          <div className="flex items-center">
                            {strategy.signalNotificationsEnabled ? (
                              <Bell className="h-3 w-3 text-green-600" />
                            ) : (
                              <BellOff className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </>
                      )}
                      {!userIsPro && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600">App-only signals</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="px-6 py-4 text-center text-muted-foreground">
              No strategies available
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-6">
        <Link to="/strategies" className="w-full">
          <Button variant="outline" className="w-full">
            View All Strategies
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}


import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ChevronRight, Bell, BellOff } from "lucide-react";
import { Link } from "react-router-dom";
import { getStrategies, Strategy } from "@/services/strategyService";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useUserSubscription, isPro } from "@/hooks/useUserSubscription";

export function StrategyList() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [filteredStrategies, setFilteredStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add subscription hook
  const { tier } = useUserSubscription();
  const userIsPro = isPro(tier);
  
  const fetchStrategies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStrategies();
      setStrategies(data);
      // Show all strategies, limit to 6 for dashboard display
      setFilteredStrategies(data.slice(0, 6));
    } catch (err) {
      console.error("Error fetching strategies:", err);
      setError("Failed to load strategies");
      toast.error("Failed to load strategies", {
        description: "Please refresh to try again"
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchStrategies();

    // Add listeners to ensure we update when a strategy is deleted or updated
    const handleStrategyUpdate = () => {
      fetchStrategies();
    };

    // Event listeners for navigation and focus - useful when user navigates back to a page after strategy deletion
    window.addEventListener('popstate', handleStrategyUpdate);
    window.addEventListener('focus', handleStrategyUpdate);

    // Listen for custom event that might be dispatched when strategies are updated or deleted
    window.addEventListener('strategy-updated', handleStrategyUpdate);
    window.addEventListener('strategy-deleted', handleStrategyUpdate);
    
    return () => {
      window.removeEventListener('popstate', handleStrategyUpdate);
      window.removeEventListener('focus', handleStrategyUpdate);
      window.removeEventListener('strategy-updated', handleStrategyUpdate);
      window.removeEventListener('strategy-deleted', handleStrategyUpdate);
    };
  }, []);

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
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-4">
                <div className="animate-pulse w-2/3 h-6 rounded bg-muted"></div>
                <div className="animate-pulse w-8 h-8 rounded-full bg-muted"></div>
              </div>
            ))
          ) : error ? (
            <div className="px-6 py-4 text-center text-destructive">
              {error}
              <Button variant="outline" size="sm" className="mt-2 mx-auto block" onClick={() => fetchStrategies()}>
                Retry
              </Button>
            </div>
          ) : filteredStrategies.length > 0 ? (
            filteredStrategies.map((strategy) => (
              <Link key={strategy.id} to={`/strategy/${strategy.id}`} className="block hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium">{strategy.name}</p>
                      {/* Show notification status only for PRO users, positioned after strategy name */}
                      {userIsPro && (
                        <>
                          {strategy.signalNotificationsEnabled ? (
                            <Bell className="h-3 w-3 text-green-600" />
                          ) : (
                            <BellOff className="h-3 w-3 text-muted-foreground" />
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                      <span>{strategy.targetAsset || "Unknown"}</span>
                      <span>•</span>
                      <span>Updated {formatTimeAgo(strategy.updatedAt)}</span>
                      {!userIsPro && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600">App-only signals</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
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

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { getStrategies, Strategy } from "@/services/strategyService";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
export function StrategyList() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchStrategies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStrategies();
      setStrategies(data.slice(0, 6)); // Changed from 4 to 6 strategies
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
  return <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">Your Strategies</CardTitle>
        
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <div className="divide-y">
          {loading ? Array(6).fill(0).map((_, i) => <div key={i} className="flex items-center justify-between px-6 py-4">
                <div className="animate-pulse w-2/3 h-6 rounded bg-muted"></div>
                <div className="animate-pulse w-8 h-8 rounded-full bg-muted"></div>
              </div>) : error ? <div className="px-6 py-4 text-center text-destructive">
              {error}
              <Button variant="outline" size="sm" className="mt-2 mx-auto block" onClick={() => fetchStrategies()}>
                Retry
              </Button>
            </div> : strategies.length > 0 ? strategies.map(strategy => <div key={strategy.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <div className="flex items-center">
                    <p className="font-medium">{strategy.name}</p>
                    {strategy.isActive ? <Badge variant="outline" className="ml-2 bg-muted">
                        Active
                      </Badge> : <Badge variant="outline" className="ml-2 text-muted-foreground">
                        Inactive
                      </Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {strategy.targetAsset || "Unknown"} • Updated {formatTimeAgo(strategy.updatedAt)}
                  </p>
                </div>
                <Link to={`/strategy/${strategy.id}`}>
                  <Button variant="ghost" size="icon">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>) : <div className="px-6 py-4 text-center text-muted-foreground">
              No strategies available
            </div>}
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-6">
        <Link to="/strategies" className="w-full">
          <Button variant="outline" className="w-full">
            View All Strategies
          </Button>
        </Link>
      </CardFooter>
    </Card>;
}
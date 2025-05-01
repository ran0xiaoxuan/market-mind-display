
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

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        setLoading(true);
        const data = await getStrategies();
        setStrategies(data.slice(0, 4)); // Get top 4 strategies
      } catch (error) {
        console.error("Error fetching strategies:", error);
        toast.error("Failed to load strategies");
      } finally {
        setLoading(false);
      }
    };

    fetchStrategies();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    try {
      if (!dateString) return "Unknown";
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Unknown";
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">Top Strategies</CardTitle>
        <p className="text-sm text-muted-foreground">Your recent strategies.</p>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <div className="divide-y">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-4">
                <div className="animate-pulse w-2/3 h-6 rounded bg-muted"></div>
                <div className="animate-pulse w-8 h-8 rounded-full bg-muted"></div>
              </div>
            ))
          ) : strategies.length > 0 ? (
            strategies.map((strategy) => (
              <div key={strategy.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <div className="flex items-center">
                    <p className="font-medium">{strategy.name}</p>
                    {strategy.isActive ? (
                      <Badge variant="outline" className="ml-2 bg-muted">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="ml-2 text-muted-foreground">
                        Inactive
                      </Badge>
                    )}
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
              </div>
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

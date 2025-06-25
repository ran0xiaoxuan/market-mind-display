import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpIcon, ArrowDownIcon, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { getRecommendedStrategies, getStrategyApplyCounts } from "@/services/recommendationService";

interface Strategy {
  id: string;
  name: string;
  targetAsset: string | null;
  applyCount: number;
}

export function StrategyRankings() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Loading strategy rankings data...");
        
        // Fetch recommended strategies and apply counts using new service
        const [recommendedStrategies, applyCounts] = await Promise.all([
          getRecommendedStrategies(),
          getStrategyApplyCounts()
        ]);

        console.log("Recommended strategies:", recommendedStrategies);
        console.log("Apply counts:", applyCounts);

        // Transform data and add apply counts
        const strategiesWithCounts = recommendedStrategies
          .map(strategy => ({
            id: strategy.id,
            name: strategy.name,
            targetAsset: strategy.targetAsset,
            applyCount: applyCounts.get(strategy.id) || 0
          }))
          .sort((a, b) => b.applyCount - a.applyCount) // Sort by apply count descending
          .slice(0, 5); // Take top 5

        console.log("Strategies with counts:", strategiesWithCounts);
        setStrategies(strategiesWithCounts);
      } catch (error) {
        console.error("Error loading strategy rankings:", error);
        setStrategies([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <Card className="p-6 px-[24px]">
        <h3 className="text-lg font-semibold mb-4">Strategy Rankings</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-muted"></div>
                <div className="h-4 w-32 bg-muted rounded"></div>
              </div>
              <div className="h-4 w-8 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 px-[24px]">
      <h3 className="text-lg font-semibold mb-4">Strategy Rankings</h3>
      <p className="text-sm text-muted-foreground mb-6">Strategies ranked by number of applications</p>
      
      <div className="space-y-4">
        {strategies.length > 0 ? (
          strategies.map((strategy, index) => (
            <div key={strategy.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-amber-600' :
                  'bg-blue-500'
                }`}></div>
                <span className="text-sm font-medium">{strategy.name}</span>
                {strategy.targetAsset && (
                  <Badge variant="outline" className="text-xs">
                    {strategy.targetAsset}
                  </Badge>
                )}
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 mr-1" fill="currentColor" />
                <span className="text-sm font-semibold">
                  {strategy.applyCount}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No strategy data available</p>
          </div>
        )}
      </div>
    </Card>
  );
}


import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, TrendingUp, Users, Target } from 'lucide-react';
import { RecommendedStrategy } from '@/services/recommendationService';

interface StrategyRankingsProps {
  strategies: RecommendedStrategy[];
  applyCounts: Record<string, number>;
  onApplyStrategy: (strategyId: string) => void;
}

const StrategyRankings: React.FC<StrategyRankingsProps> = ({
  strategies,
  applyCounts,
  onApplyStrategy
}) => {
  // Sort strategies by apply count
  const sortedStrategies = [...strategies].sort((a, b) => {
    const countA = applyCounts[a.strategyId] || 0;
    const countB = applyCounts[b.strategyId] || 0;
    return countB - countA;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Trophy className="h-5 w-5 text-yellow-600" />
        <h2 className="text-xl font-semibold">Strategy Rankings</h2>
      </div>
      
      <div className="grid gap-4">
        {sortedStrategies.map((item, index) => {
          const applyCount = applyCounts[item.strategyId] || 0;
          const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
          
          return (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold">{rankIcon}</span>
                      <CardTitle className="text-lg">{item.strategy.name}</CardTitle>
                      {item.isOfficial && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Official
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{item.strategy.description}</CardDescription>
                  </div>
                  <Button
                    onClick={() => onApplyStrategy(item.strategyId)}
                    size="sm"
                    className="shrink-0"
                  >
                    Apply Strategy
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Asset:</span>
                    <span className="font-medium">{item.strategy.targetAssetName || item.strategy.targetAsset}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Timeframe:</span>
                    <span className="font-medium">{item.strategy.timeframe}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Applied:</span>
                    <span className="font-medium">{applyCount} times</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={item.strategy.isActive ? "default" : "secondary"}>
                      {item.strategy.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StrategyRankings;

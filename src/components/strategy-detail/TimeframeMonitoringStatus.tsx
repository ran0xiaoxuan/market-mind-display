
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Activity, PlayCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { 
  getStrategyEvaluations, 
  triggerTimeframeSignalCheck, 
  getNextEvaluationTime,
  shouldEvaluateNow,
  isMarketOpen,
  TIMEFRAME_CONFIGS,
  type StrategyEvaluation 
} from "@/services/timeframeOptimizedMonitoringService";

interface TimeframeMonitoringStatusProps {
  strategyId: string;
  timeframe: string;
}

export function TimeframeMonitoringStatus({ strategyId, timeframe }: TimeframeMonitoringStatusProps) {
  const [evaluation, setEvaluation] = useState<StrategyEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);

  const fetchEvaluation = async () => {
    try {
      setIsLoading(true);
      const evaluations = await getStrategyEvaluations(strategyId);
      const strategyEvaluation = evaluations.find(e => e.strategy_id === strategyId);
      setEvaluation(strategyEvaluation || null);
    } catch (error) {
      console.error('Error fetching evaluation data:', error);
      toast.error("Failed to fetch monitoring status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEvaluation = async () => {
    setIsTesting(true);
    try {
      await triggerTimeframeSignalCheck([timeframe]);
      toast.success(`Manual evaluation triggered for ${timeframe} timeframe`);
      // Refresh evaluation data after a short delay
      setTimeout(fetchEvaluation, 2000);
    } catch (error) {
      console.error('Error triggering evaluation:', error);
      toast.error("Failed to trigger evaluation");
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    fetchEvaluation();
    // Refresh every 30 seconds
    const interval = setInterval(fetchEvaluation, 30000);
    return () => clearInterval(interval);
  }, [strategyId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Timeframe Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Activity className="w-6 h-6 animate-pulse text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const config = TIMEFRAME_CONFIGS[timeframe];
  const marketIsOpen = isMarketOpen();
  
  const lastEvaluated = evaluation?.last_evaluated_at ? new Date(evaluation.last_evaluated_at) : null;
  const nextDue = evaluation?.next_evaluation_due ? new Date(evaluation.next_evaluation_due) : null;
  const shouldEvaluateNext = shouldEvaluateNow(timeframe, lastEvaluated, nextDue);
  
  const calculatedNextDue = getNextEvaluationTime(timeframe);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Timeframe Monitoring
          <Badge variant="outline">{config?.name || timeframe}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {config?.description || `Strategy evaluated based on ${timeframe} timeframe`}
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Market Status</div>
            <Badge variant={marketIsOpen ? "default" : "secondary"}>
              {marketIsOpen ? "Open" : "Closed"}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Evaluation Count</div>
            <div className="text-lg font-mono">
              {evaluation?.evaluation_count || 0}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <div className="text-sm font-medium">Last Evaluated</div>
            <div className="text-sm text-muted-foreground">
              {lastEvaluated 
                ? `${formatDistanceToNow(lastEvaluated)} ago`
                : "Never evaluated"
              }
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Next Evaluation Due</div>
            <div className="text-sm text-muted-foreground">
              {nextDue 
                ? formatDistanceToNow(nextDue, { addSuffix: true })
                : `Based on timeframe: ${formatDistanceToNow(calculatedNextDue, { addSuffix: true })}`
              }
            </div>
          </div>

          {shouldEvaluateNext && (
            <Alert>
              <Activity className="h-4 w-4" />
              <AlertDescription>
                This strategy is due for evaluation based on its {timeframe} timeframe.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="pt-4 border-t">
          <Button 
            onClick={handleTestEvaluation}
            disabled={isTesting}
            className="w-full"
            variant="outline"
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            {isTesting ? "Testing..." : `Test ${timeframe} Evaluation`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

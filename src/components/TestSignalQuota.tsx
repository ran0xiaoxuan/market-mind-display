
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useDailyTestSignalUsage } from "@/hooks/useDailyTestSignalUsage";

export function TestSignalQuota() {
  const { usage, isLoading } = useDailyTestSignalUsage();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-2 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = (usage.count / usage.limit) * 100;
  const isNearLimit = usage.remaining <= 3;
  const isAtLimit = usage.isLimitReached;

  return (
    <Card className={`w-full ${isAtLimit ? 'border-destructive bg-destructive/5' : isNearLimit ? 'border-warning bg-warning/5' : 'border-border'}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isAtLimit ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : (
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            )}
            <h4 className="text-sm font-medium">Daily Test Signals</h4>
          </div>
          <span className={`text-sm font-mono ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-warning' : 'text-muted-foreground'}`}>
            {usage.count}/{usage.limit}
          </span>
        </div>
        
        <Progress 
          value={progressPercentage} 
          className={`h-2 ${isAtLimit ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-warning' : ''}`}
        />
        
        <div className="text-xs text-muted-foreground">
          {isAtLimit ? (
            <span className="text-destructive font-medium">
              Quota exhausted. Resets tomorrow.
            </span>
          ) : (
            <>
              {usage.remaining} test signal{usage.remaining !== 1 ? 's' : ''} remaining today
              {isNearLimit && (
                <span className="text-warning ml-2">• Running low</span>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Activity, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { getSignalMonitoringStatus, triggerManualSignalCheck, isMarketOpen, getNextMarketOpen, SignalMonitoringStatus } from "@/services/signalMonitoringService";
import { TimeframeMonitoringStatus } from "./TimeframeMonitoringStatus";

interface SignalMonitoringStatusProps {
  strategyId: string;
  timeframe: string;
}

export function SignalMonitoringStatusCard({
  strategyId,
  timeframe
}: SignalMonitoringStatusProps) {
  const [status, setStatus] = useState<SignalMonitoringStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = async () => {
    try {
      const monitoringStatus = await getSignalMonitoringStatus();
      setStatus(monitoringStatus);
    } catch (error) {
      console.error('Error fetching monitoring status:', error);
      toast.error("Failed to fetch monitoring status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualCheck = async () => {
    if (!isMarketOpen()) {
      toast.error("Manual signal check is only available during market hours");
      return;
    }
    
    setIsRefreshing(true);
    try {
      await triggerManualSignalCheck();
      toast.success("Manual signal check completed");
      await fetchStatus(); // Refresh status after manual check
    } catch (error) {
      console.error('Error in manual signal check:', error);
      toast.error("Failed to trigger manual signal check");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Refresh status every 5 minutes
    const interval = setInterval(fetchStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Signal Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        {/* Timeframe monitoring component */}
        <TimeframeMonitoringStatus strategyId={strategyId} timeframe={timeframe} />
      </div>
    );
  }

  const marketIsOpen = isMarketOpen();
  const nextMarketOpen = getNextMarketOpen();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Global Signal Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">System Status</div>
              <Badge variant={status?.isActive ? "default" : "destructive"}>
                {status?.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Market Status</div>
              <Badge variant={marketIsOpen ? "default" : "secondary"}>
                {marketIsOpen ? "Open" : "Closed"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Recent Signals</div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-lg font-mono">{status?.signalsGenerated || 0}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Last Check</div>
              <div className="text-sm text-muted-foreground">
                {status?.lastCheck 
                  ? formatDistanceToNow(new Date(status.lastCheck)) + " ago"
                  : "Never"
                }
              </div>
            </div>
          </div>

          {status?.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Error: {status.error}
              </AlertDescription>
            </Alert>
          )}

          {!marketIsOpen && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Market is closed. Next market open: {formatDistanceToNow(nextMarketOpen, { addSuffix: true })}
              </AlertDescription>
            </Alert>
          )}

          <div className="pt-4 border-t">
            <Button 
              onClick={handleManualCheck}
              disabled={isRefreshing || !marketIsOpen}
              className="w-full"
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? "Checking..." : "Manual Check"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Timeframe-specific monitoring component */}
      <TimeframeMonitoringStatus strategyId={strategyId} timeframe={timeframe} />
    </div>
  );
}

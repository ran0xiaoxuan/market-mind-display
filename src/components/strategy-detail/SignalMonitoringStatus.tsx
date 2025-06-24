
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Activity, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { 
  getSignalMonitoringStatus, 
  triggerManualSignalCheck, 
  isMarketOpen, 
  getNextMarketOpen,
  SignalMonitoringStatus 
} from "@/services/signalMonitoringService";

interface SignalMonitoringStatusProps {
  strategyId: string;
}

export function SignalMonitoringStatusCard({ strategyId }: SignalMonitoringStatusProps) {
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
    );
  }

  const marketIsOpen = isMarketOpen();
  const nextMarketOpen = getNextMarketOpen();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Signal Monitoring
          <Badge variant={status?.isActive ? "default" : "secondary"}>
            {status?.isActive ? "Active" : "Inactive"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Market Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="font-medium">Market Status</span>
          </div>
          <Badge variant={marketIsOpen ? "default" : "secondary"}>
            {marketIsOpen ? "Open" : "Closed"}
          </Badge>
        </div>

        {!marketIsOpen && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Market closed. Next open: {formatDistanceToNow(nextMarketOpen, { addSuffix: true })}
            </AlertDescription>
          </Alert>
        )}

        {/* Monitoring Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{status?.signalsGenerated || 0}</div>
            <div className="text-sm text-muted-foreground">Signals Today</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{status?.strategiesMonitored || 0}</div>
            <div className="text-sm text-muted-foreground">Strategies Monitored</div>
          </div>
        </div>

        {/* Last Check */}
        {status?.lastCheck && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Last checked:</span>
            <span>{formatDistanceToNow(new Date(status.lastCheck), { addSuffix: true })}</span>
          </div>
        )}

        {/* Error Display */}
        {status?.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{status.error}</AlertDescription>
          </Alert>
        )}

        {/* Manual Check Button */}
        <Button 
          onClick={handleManualCheck}
          disabled={!marketIsOpen || isRefreshing}
          className="w-full"
          variant="outline"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Checking Signals...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 mr-2" />
              Manual Signal Check
            </>
          )}
        </Button>

        {!marketIsOpen && (
          <p className="text-xs text-muted-foreground text-center">
            Manual checks are only available during market hours (9:30 AM - 4:00 PM EST, weekdays)
          </p>
        )}
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Activity, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { getSignalMonitoringStatus, triggerManualSignalCheck, isMarketOpen, getNextMarketOpen, SignalMonitoringStatus } from "@/services/signalMonitoringService";
interface SignalMonitoringStatusProps {
  strategyId: string;
}
export function SignalMonitoringStatusCard({
  strategyId
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
    return <Card>
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
      </Card>;
  }
  const marketIsOpen = isMarketOpen();
  const nextMarketOpen = getNextMarketOpen();
  return;
}
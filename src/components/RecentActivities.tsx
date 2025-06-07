
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, Edit, Play, Pause, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import { getRecentActivities, Activity } from "@/services/activityService";

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'generate':
      return <Zap className="h-4 w-4 text-blue-500" />;
    case 'edit':
      return <Edit className="h-4 w-4 text-orange-500" />;
    case 'enable':
      return <Play className="h-4 w-4 text-green-500" />;
    case 'disable':
      return <Pause className="h-4 w-4 text-red-500" />;
    case 'backtest':
      return <BarChart3 className="h-4 w-4 text-purple-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getActivityBadge = (type: Activity['type']) => {
  switch (type) {
    case 'generate':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Generate</Badge>;
    case 'edit':
      return <Badge variant="secondary" className="bg-orange-100 text-orange-700">Edit</Badge>;
    case 'enable':
      return <Badge variant="secondary" className="bg-green-100 text-green-700">Enable</Badge>;
    case 'disable':
      return <Badge variant="secondary" className="bg-red-100 text-red-700">Disable</Badge>;
    case 'backtest':
      return <Badge variant="secondary" className="bg-purple-100 text-purple-700">Backtest</Badge>;
    default:
      return <Badge variant="secondary">Activity</Badge>;
  }
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
};

export const RecentActivities = () => {
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const activities = await getRecentActivities(10);
        setRecentActivities(activities);
      } catch (error) {
        console.error('Error fetching recent activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        {recentActivities.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No recent activities</p>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getActivityBadge(activity.type)}
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(new Date(activity.timestamp))}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{activity.description}</p>
                    {activity.strategyName && (
                      <p className="text-xs text-muted-foreground">
                        Strategy: {activity.strategyName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

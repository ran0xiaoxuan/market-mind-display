
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, Edit, Play, Pause, BarChart3 } from "lucide-react";

interface Activity {
  id: string;
  type: 'generate' | 'edit' | 'enable' | 'disable' | 'backtest';
  title: string;
  description: string;
  timestamp: Date;
  strategyName?: string;
}

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
  // Mock data for demonstration - in a real app, this would come from an API
  const recentActivities: Activity[] = [
    {
      id: '1',
      type: 'generate',
      title: 'Generated new strategy',
      description: 'Created "Bitcoin Momentum Strategy" using AI',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      strategyName: 'Bitcoin Momentum Strategy'
    },
    {
      id: '2',
      type: 'backtest',
      title: 'Completed backtest',
      description: 'Ran backtest for "ETH Scalping Strategy"',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      strategyName: 'ETH Scalping Strategy'
    },
    {
      id: '3',
      type: 'enable',
      title: 'Enabled strategy',
      description: 'Activated "NASDAQ Trend Following"',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      strategyName: 'NASDAQ Trend Following'
    },
    {
      id: '4',
      type: 'edit',
      title: 'Updated strategy',
      description: 'Modified risk parameters for "Gold Hedge Strategy"',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      strategyName: 'Gold Hedge Strategy'
    },
    {
      id: '5',
      type: 'disable',
      title: 'Disabled strategy',
      description: 'Paused "Oil Futures Strategy" due to market conditions',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      strategyName: 'Oil Futures Strategy'
    },
    {
      id: '6',
      type: 'generate',
      title: 'Generated new strategy',
      description: 'Created "S&P 500 Mean Reversion" using AI',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      strategyName: 'S&P 500 Mean Reversion'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={activity.id} className="relative">
                {/* Timeline line */}
                {index < recentActivities.length - 1 && (
                  <div className="absolute left-4 top-8 h-8 w-px bg-border" />
                )}
                
                {/* Activity item */}
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background border-2 border-border">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <div className="flex items-center gap-2">
                        {getActivityBadge(activity.type)}
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    {activity.strategyName && (
                      <p className="text-xs text-primary font-medium">
                        Strategy: {activity.strategyName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};


import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Navbar } from "@/components/Navbar";
import { PerformanceMetricsGrid } from "@/components/PerformanceMetricsGrid";
import { RecentActivities } from "@/components/RecentActivities";
import { StrategyCard } from "@/components/StrategyCard";
import { TrendingUp, DollarSign, Target } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

interface DashboardData {
  totalStrategies: number;
  totalProfit: number;
  averageReturn: number;
  recentActivities: Array<{
    id: number;
    description: string;
    time: string;
  }>;
  popularStrategies: Array<{
    id: string;
    name: string;
    description: string;
    roi: number;
    risk: string;
  }>;
}

const Dashboard = () => {
  usePageTitle("Dashboard - StratAIge");
  
  const { data: dashboardData, isLoading, isError } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: async (): Promise<DashboardData> => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        totalStrategies: 15,
        totalProfit: 5240.50,
        averageReturn: 7.2,
        recentActivities: [
          { id: 1, description: 'Strategy "Momentum Master" executed a trade on AAPL', time: '2 minutes ago' },
          { id: 2, description: 'Strategy "Trend Tracker" rebalanced portfolio', time: '15 minutes ago' },
          { id: 3, description: 'New strategy "Daily Divergence" created', time: '30 minutes ago' },
        ],
        popularStrategies: [
          { id: 'momentum-master', name: 'Momentum Master', description: 'Captures short-term momentum in growth stocks', roi: 12.5, risk: 'Medium' },
          { id: 'trend-tracker', name: 'Trend Tracker', description: 'Follows long-term trends in major indices', roi: 9.8, risk: 'Low' },
        ],
      };
    },
  });

  if (isLoading) {
    return <div>Loading dashboard data...</div>;
  }

  if (isError || !dashboardData) {
    return <div>Error loading dashboard data.</div>;
  }

  return (
    <>
      <Navbar />
      <Container>
        <div className="py-8">
          <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>

          <PerformanceMetricsGrid
            metrics={[
              { label: 'Total Strategies', value: dashboardData.totalStrategies, icon: Target, color: 'text-blue-600' },
              { label: 'Total Profit', value: `$${dashboardData.totalProfit.toFixed(2)}`, icon: DollarSign, color: 'text-green-600' },
              { label: 'Average Return', value: `${dashboardData.averageReturn.toFixed(1)}%`, icon: TrendingUp, color: 'text-purple-600' },
            ]}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>Latest events from your strategies</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentActivities activities={dashboardData.recentActivities} />
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Popular Strategies</CardTitle>
                  <CardDescription>Top performing strategies this week</CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardData.popularStrategies.map(strategy => (
                    <StrategyCard key={strategy.id} strategy={strategy} />
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
};

export default Dashboard;


import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { MetricCard } from "@/components/MetricCard";
import { Navbar } from "@/components/Navbar";
import { PerformanceChart } from "@/components/PerformanceChart";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { StrategyList } from "@/components/StrategyList";
import { useState } from "react";

type TimeRange = "7d" | "30d" | "all";

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [activeTab, setActiveTab] = useState<"equity" | "returns" | "drawdown">("equity");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant={timeRange === "7d" ? "default" : "outline"} 
              onClick={() => setTimeRange("7d")}
            >
              Last 7 Days
            </Button>
            <Button 
              variant={timeRange === "30d" ? "default" : "outline"} 
              onClick={() => setTimeRange("30d")}
            >
              Last 30 Days
            </Button>
            <Button 
              variant={timeRange === "all" ? "default" : "outline"} 
              onClick={() => setTimeRange("all")}
            >
              All Time
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Strategies"
            value="12"
            change={{ value: "+2", positive: true }}
          />
          <MetricCard
            title="Active Strategies"
            value="8"
            change={{ value: "+1", positive: true }}
          />
          <MetricCard
            title="Total Return"
            value="+12.5%"
            change={{ value: "+2.3%", positive: true }}
            direction="up"
          />
          <MetricCard
            title="Sharpe Ratio"
            value="1.8"
            change={{ value: "+0.2", positive: true }}
            direction="up"
          />
        </div>

        <div className="grid gap-6 mt-6 md:grid-cols-3 lg:grid-cols-8">
          <div className="space-y-6 md:col-span-2 lg:col-span-5">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold">Performance Overview</h2>
                <p className="text-sm text-muted-foreground">View the performance of all your strategies over time.</p>
              </div>

              <Tabs
                defaultValue="equity"
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as "equity" | "returns" | "drawdown")}
                className="w-full"
              >
                <TabsContent value="equity" className="m-0">
                  <PerformanceChart type="equity" />
                  <div className="p-6">
                    <PerformanceMetrics type="equity" />
                  </div>
                </TabsContent>
                <TabsContent value="returns" className="m-0">
                  <PerformanceChart type="returns" />
                  <div className="p-6">
                    <PerformanceMetrics type="returns" />
                  </div>
                </TabsContent>
                <TabsContent value="drawdown" className="m-0">
                  <PerformanceChart type="drawdown" />
                  <div className="p-6">
                    <PerformanceMetrics type="drawdown" />
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
          <div className="md:col-span-1 lg:col-span-3">
            <StrategyList />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

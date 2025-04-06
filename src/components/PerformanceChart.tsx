
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
type ChartType = "equity" | "returns" | "drawdown";
type PerformanceChartProps = {
  type?: ChartType;
  timeRange: "7d" | "30d" | "all";
};

// Function to filter data based on time range
const getFilteredData = (data: any[], timeRange: "7d" | "30d" | "all") => {
  if (timeRange === "all") return data;
  
  const length = data.length;
  if (timeRange === "7d") {
    return length <= 7 ? data : data.slice(length - 7, length);
  } else if (timeRange === "30d") {
    return length <= 30 ? data : data.slice(length - 30, length);
  }
  
  return data;
};

// Generate more detailed data for different time ranges
const generateEquityData = (timeRange: "7d" | "30d" | "all") => {
  if (timeRange === "7d") {
    return [
      { date: "Mon", value: 42 },
      { date: "Tue", value: 44 },
      { date: "Wed", value: 43 },
      { date: "Thu", value: 45 },
      { date: "Fri", value: 48 },
      { date: "Sat", value: 49 },
      { date: "Sun", value: 50 }
    ];
  } else if (timeRange === "30d") {
    return [
      { date: "Week 1", value: 25 },
      { date: "Week 2", value: 32 },
      { date: "Week 3", value: 38 },
      { date: "Week 4", value: 46 },
      { date: "Week 5", value: 50 }
    ];
  } else {
    return [
      { date: "Jan", value: 0 },
      { date: "Feb", value: 6.5 },
      { date: "Mar", value: 12 },
      { date: "Apr", value: 8.5 },
      { date: "May", value: 15 },
      { date: "Jun", value: 22 },
      { date: "Jul", value: 28 },
      { date: "Aug", value: 34 },
      { date: "Sep", value: 29 },
      { date: "Oct", value: 37 },
      { date: "Nov", value: 42 },
      { date: "Dec", value: 50 }
    ];
  }
};

// Generate returns data based on time range
const generateReturnsData = (timeRange: "7d" | "30d" | "all") => {
  if (timeRange === "7d") {
    return [
      { month: "Mon", return: 1.2 },
      { month: "Tue", return: 1.8 },
      { month: "Wed", return: -0.9 },
      { month: "Thu", return: 2.1 },
      { month: "Fri", return: 2.5 },
      { month: "Sat", return: 0.8 },
      { month: "Sun", return: 1.2 }
    ];
  } else if (timeRange === "30d") {
    return [
      { month: "Week 1", return: 3.2 },
      { month: "Week 2", return: 5.4 },
      { month: "Week 3", return: -2.1 },
      { month: "Week 4", return: 4.5 },
      { month: "Week 5", return: 2.8 }
    ];
  } else {
    return [
      { month: "Jan", return: 4.5 },
      { month: "Feb", return: 6.5 },
      { month: "Mar", return: 5.2 },
      { month: "Apr", return: -3.1 },
      { month: "May", return: 6.0 },
      { month: "Jun", return: 6.1 },
      { month: "Jul", return: 4.9 },
      { month: "Aug", return: 4.7 },
      { month: "Sep", return: -3.7 },
      { month: "Oct", return: 6.2 },
      { month: "Nov", return: 3.6 },
      { month: "Dec", return: 5.6 }
    ];
  }
};

// Generate drawdown data based on time range
const generateDrawdownData = (timeRange: "7d" | "30d" | "all") => {
  if (timeRange === "7d") {
    return [
      { date: "Mon", drawdown: -1.2 },
      { date: "Tue", drawdown: -0.7 },
      { date: "Wed", drawdown: -1.8 },
      { date: "Thu", drawdown: -1.2 },
      { date: "Fri", drawdown: -0.8 },
      { date: "Sat", drawdown: -0.3 },
      { date: "Sun", drawdown: 0 }
    ];
  } else if (timeRange === "30d") {
    return [
      { date: "Week 1", drawdown: -2.8 },
      { date: "Week 2", drawdown: -1.5 },
      { date: "Week 3", drawdown: -3.2 },
      { date: "Week 4", drawdown: -1.8 },
      { date: "Week 5", drawdown: -0.9 }
    ];
  } else {
    return [
      { date: "Jan", drawdown: 0 },
      { date: "Feb", drawdown: -0.5 },
      { date: "Mar", drawdown: -1.2 },
      { date: "Apr", drawdown: -3.8 },
      { date: "May", drawdown: -1.5 },
      { date: "Jun", drawdown: 0 },
      { date: "Jul", drawdown: -0.8 },
      { date: "Aug", drawdown: -1.2 },
      { date: "Sep", drawdown: -5.3 },
      { date: "Oct", drawdown: -2.1 },
      { date: "Nov", drawdown: -0.9 },
      { date: "Dec", drawdown: 0 }
    ];
  }
};

export function PerformanceChart({
  type,
  timeRange
}: PerformanceChartProps) {
  // Get appropriate data based on time range
  const equityData = generateEquityData(timeRange);
  const returnsData = generateReturnsData(timeRange);
  const drawdownData = generateDrawdownData(timeRange);

  return <Card className="pt-6 mx-[20px]">
      <Tabs defaultValue="equity" className="w-full">
        <div className="px-6">
          <TabsList className="grid w-full max-w-[400px] grid-cols-3">
            <TabsTrigger value="equity">Equity Curve</TabsTrigger>
            <TabsTrigger value="returns">Returns</TabsTrigger>
            <TabsTrigger value="drawdown">Drawdown</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="equity" className="p-0 pt-4">
          <div className="px-6 py-2">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={equityData} margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5
            }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `${value}%`} />
                <Tooltip content={({
                active,
                payload
              }) => {
                if (active && payload && payload.length) {
                  return <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded bg-primary" />
                              <span className="font-medium">
                                {payload[0].value.toLocaleString()}%
                              </span>
                            </div>
                          </div>
                        </div>;
                }
                return null;
              }} />
                <Area type="monotone" dataKey="value" stroke="#26A69A" fill="#CCECE6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
        <TabsContent value="returns" className="p-0 pt-4">
          <div className="px-6 py-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={returnsData} margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5
            }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={value => `${value}%`} />
                <Tooltip content={({
                active,
                payload
              }) => {
                if (active && payload && payload.length) {
                  const value = payload[0].value;
                  const isPositive = typeof value === 'number' ? value > 0 : false;
                  return <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded ${isPositive ? "bg-green-500" : "bg-red-500"}`} />
                              <span className={`font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
                                {typeof value === 'number' && value > 0 ? "+" : ""}{value}%
                              </span>
                            </div>
                          </div>
                        </div>;
                }
                return null;
              }} />
                <Bar dataKey="return" fill="#8884d8">
                  {returnsData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.return >= 0 ? "#10b981" : "#ef4444"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
        <TabsContent value="drawdown" className="p-0 pt-4">
          <div className="px-6 py-2">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={drawdownData} margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5
            }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={value => `${value}%`} />
                <Tooltip content={({
                active,
                payload
              }) => {
                if (active && payload && payload.length) {
                  return <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded bg-red-500" />
                              <span className="font-medium text-red-500">
                                {payload[0].value}%
                              </span>
                            </div>
                          </div>
                        </div>;
                }
                return null;
              }} />
                <ReferenceLine y={0} stroke="#666" />
                <Area type="monotone" dataKey="drawdown" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </Card>;
}

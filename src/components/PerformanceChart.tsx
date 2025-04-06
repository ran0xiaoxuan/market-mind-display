import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
type ChartType = "equity" | "returns" | "drawdown";
type PerformanceChartProps = {
  type?: ChartType;
};

// Sample data for the equity curve
const equityData = [{
  date: "Jan",
  value: 10000
}, {
  date: "Feb",
  value: 10650
}, {
  date: "Mar",
  value: 11200
}, {
  date: "Apr",
  value: 10850
}, {
  date: "May",
  value: 11500
}, {
  date: "Jun",
  value: 12200
}, {
  date: "Jul",
  value: 12800
}, {
  date: "Aug",
  value: 13400
}, {
  date: "Sep",
  value: 12900
}, {
  date: "Oct",
  value: 13700
}, {
  date: "Nov",
  value: 14200
}, {
  date: "Dec",
  value: 15000
}];

// Sample data for monthly returns
const returnsData = [{
  month: "Jan",
  return: 4.5
}, {
  month: "Feb",
  return: 6.5
}, {
  month: "Mar",
  return: 5.2
}, {
  month: "Apr",
  return: -3.1
}, {
  month: "May",
  return: 6.0
}, {
  month: "Jun",
  return: 6.1
}, {
  month: "Jul",
  return: 4.9
}, {
  month: "Aug",
  return: 4.7
}, {
  month: "Sep",
  return: -3.7
}, {
  month: "Oct",
  return: 6.2
}, {
  month: "Nov",
  return: 3.6
}, {
  month: "Dec",
  return: 5.6
}];

// Sample data for drawdowns
const drawdownData = [{
  date: "Jan",
  drawdown: 0
}, {
  date: "Feb",
  drawdown: -0.5
}, {
  date: "Mar",
  drawdown: -1.2
}, {
  date: "Apr",
  drawdown: -3.8
}, {
  date: "May",
  drawdown: -1.5
}, {
  date: "Jun",
  drawdown: 0
}, {
  date: "Jul",
  drawdown: -0.8
}, {
  date: "Aug",
  drawdown: -1.2
}, {
  date: "Sep",
  drawdown: -5.3
}, {
  date: "Oct",
  drawdown: -2.1
}, {
  date: "Nov",
  drawdown: -0.9
}, {
  date: "Dec",
  drawdown: 0
}];

export function PerformanceChart({
  type
}: PerformanceChartProps) {
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
                <YAxis />
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
                                ${payload[0].value.toLocaleString()}
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


import { Card } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type PerformanceChartProps = {
  type?: "equity"; // Only equity type is needed now
  timeRange: "7d" | "30d" | "all";
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

export function PerformanceChart({
  type = "equity",
  timeRange
}: PerformanceChartProps) {
  // Get appropriate data based on time range
  const equityData = generateEquityData(timeRange);

  return (
    <div className="pt-6 mx-[20px]">
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
                const value = payload[0].value as number;
                const isPositive = value >= 0;
                
                return <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded bg-primary" />
                      <span className={`font-medium ${isPositive ? "text-positive" : "text-negative"}`}>
                        {value.toLocaleString()}%
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
    </div>
  );
}

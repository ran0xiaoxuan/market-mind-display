import { Card } from "@/components/ui/card";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState } from "react";

type PerformanceChartProps = {
  type?: "equity" | "returns" | "volatility" | "drawdown";
  timeRange: "7d" | "30d" | "all";
  height?: number;
  title?: string;
  description?: string;
};

// Generate more detailed data for different time ranges
const generateEquityData = (timeRange: "7d" | "30d" | "all") => {
  if (timeRange === "7d") {
    return [
      { date: "Mon", value: 42, benchmark: 39 },
      { date: "Tue", value: 44, benchmark: 40 },
      { date: "Wed", value: 43, benchmark: 42 },
      { date: "Thu", value: 45, benchmark: 43 },
      { date: "Fri", value: 48, benchmark: 44 },
      { date: "Sat", value: 49, benchmark: 45 },
      { date: "Sun", value: 50, benchmark: 46 }
    ];
  } else if (timeRange === "30d") {
    return [
      { date: "Week 1", value: 25, benchmark: 23 },
      { date: "Week 2", value: 32, benchmark: 29 },
      { date: "Week 3", value: 38, benchmark: 33 },
      { date: "Week 4", value: 46, benchmark: 38 },
      { date: "Week 5", value: 50, benchmark: 42 }
    ];
  } else {
    return [
      { date: "Jan", value: 0, benchmark: 0 },
      { date: "Feb", value: 6.5, benchmark: 5 },
      { date: "Mar", value: 12, benchmark: 9 },
      { date: "Apr", value: 8.5, benchmark: 7 },
      { date: "May", value: 15, benchmark: 11 },
      { date: "Jun", value: 22, benchmark: 16 },
      { date: "Jul", value: 28, benchmark: 21 },
      { date: "Aug", value: 34, benchmark: 25 },
      { date: "Sep", value: 29, benchmark: 23 },
      { date: "Oct", value: 37, benchmark: 28 },
      { date: "Nov", value: 42, benchmark: 32 },
      { date: "Dec", value: 50, benchmark: 38 }
    ];
  }
};

// Generate returns data
const generateReturnsData = (timeRange: "7d" | "30d" | "all") => {
  if (timeRange === "7d") {
    return [
      { date: "Mon", value: 1.2, benchmark: 0.8 },
      { date: "Tue", value: 1.8, benchmark: 1.1 },
      { date: "Wed", value: -0.9, benchmark: -0.5 },
      { date: "Thu", value: 2.1, benchmark: 1.4 },
      { date: "Fri", value: 0.8, benchmark: 0.5 },
      { date: "Sat", value: -0.3, benchmark: -0.2 },
      { date: "Sun", value: 1.3, benchmark: 0.9 }
    ];
  } else if (timeRange === "30d") {
    return [
      { date: "Week 1", value: 3.2, benchmark: 2.4 },
      { date: "Week 2", value: 5.4, benchmark: 3.9 },
      { date: "Week 3", value: -2.1, benchmark: -1.5 },
      { date: "Week 4", value: 3.8, benchmark: 2.6 },
      { date: "Week 5", value: 1.9, benchmark: 1.3 }
    ];
  } else {
    return [
      { date: "Jan", value: 3.5, benchmark: 2.8 },
      { date: "Feb", value: 2.8, benchmark: 2.1 },
      { date: "Mar", value: -1.2, benchmark: -0.9 },
      { date: "Apr", value: 3.1, benchmark: 2.3 },
      { date: "May", value: 2.5, benchmark: 1.8 },
      { date: "Jun", value: -0.8, benchmark: -0.6 },
      { date: "Jul", value: 4.2, benchmark: 3.1 },
      { date: "Aug", value: 3.7, benchmark: 2.7 },
      { date: "Sep", value: -2.3, benchmark: -1.7 },
      { date: "Oct", value: 1.9, benchmark: 1.4 },
      { date: "Nov", value: 3.8, benchmark: 2.8 },
      { date: "Dec", value: 2.1, benchmark: 1.6 }
    ];
  }
};

// Generate volatility data
const generateVolatilityData = (timeRange: "7d" | "30d" | "all") => {
  if (timeRange === "7d") {
    return [
      { date: "Mon", value: 0.8, benchmark: 0.5 },
      { date: "Tue", value: 1.2, benchmark: 0.6 },
      { date: "Wed", value: 0.9, benchmark: 0.7 },
      { date: "Thu", value: 1.5, benchmark: 0.9 },
      { date: "Fri", value: 1.1, benchmark: 0.6 },
      { date: "Sat", value: 0.7, benchmark: 0.4 },
      { date: "Sun", value: 0.5, benchmark: 0.3 }
    ];
  } else if (timeRange === "30d") {
    return [
      { date: "Week 1", value: 0.9, benchmark: 0.6 },
      { date: "Week 2", value: 1.3, benchmark: 0.7 },
      { date: "Week 3", value: 1.0, benchmark: 0.5 },
      { date: "Week 4", value: 1.2, benchmark: 0.8 },
      { date: "Week 5", value: 0.8, benchmark: 0.5 }
    ];
  } else {
    return [
      { date: "Jan", value: 0.9, benchmark: 0.5 },
      { date: "Feb", value: 1.1, benchmark: 0.6 },
      { date: "Mar", value: 1.3, benchmark: 0.7 },
      { date: "Apr", value: 1.0, benchmark: 0.6 },
      { date: "May", value: 0.8, benchmark: 0.5 },
      { date: "Jun", value: 1.2, benchmark: 0.7 },
      { date: "Jul", value: 1.4, benchmark: 0.8 },
      { date: "Aug", value: 1.1, benchmark: 0.7 },
      { date: "Sep", value: 0.9, benchmark: 0.6 },
      { date: "Oct", value: 1.2, benchmark: 0.7 },
      { date: "Nov", value: 1.0, benchmark: 0.6 },
      { date: "Dec", value: 0.8, benchmark: 0.5 }
    ];
  }
};

// Generate drawdown data
const generateDrawdownData = (timeRange: "7d" | "30d" | "all") => {
  if (timeRange === "7d") {
    return [
      { date: "Mon", value: -0.5, benchmark: -0.3 },
      { date: "Tue", value: -0.8, benchmark: -0.5 },
      { date: "Wed", value: -1.2, benchmark: -0.8 },
      { date: "Thu", value: -0.9, benchmark: -0.7 },
      { date: "Fri", value: -1.5, benchmark: -1.1 },
      { date: "Sat", value: -1.1, benchmark: -0.8 },
      { date: "Sun", value: -0.7, benchmark: -0.5 }
    ];
  } else if (timeRange === "30d") {
    return [
      { date: "Week 1", value: -1.2, benchmark: -0.9 },
      { date: "Week 2", value: -1.8, benchmark: -1.2 },
      { date: "Week 3", value: -2.5, benchmark: -1.8 },
      { date: "Week 4", value: -1.9, benchmark: -1.4 },
      { date: "Week 5", value: -1.5, benchmark: -1.1 }
    ];
  } else {
    return [
      { date: "Jan", value: -1.5, benchmark: -1.1 },
      { date: "Feb", value: -2.2, benchmark: -1.7 },
      { date: "Mar", value: -3.8, benchmark: -2.9 },
      { date: "Apr", value: -2.5, benchmark: -1.9 },
      { date: "May", value: -1.8, benchmark: -1.4 },
      { date: "Jun", value: -3.2, benchmark: -2.5 },
      { date: "Jul", value: -4.5, benchmark: -3.5 },
      { date: "Aug", value: -3.7, benchmark: -2.9 },
      { date: "Sep", value: -6.8, benchmark: -5.2 },
      { date: "Oct", value: -5.2, benchmark: -4.0 },
      { date: "Nov", value: -4.3, benchmark: -3.3 },
      { date: "Dec", value: -2.8, benchmark: -2.1 }
    ];
  }
};

const benchmarkOptions = [
  { value: "sp500", label: "S&P 500" },
  { value: "nasdaq", label: "NASDAQ" },
  { value: "dow", label: "Dow Jones" },
  { value: "russell", label: "Russell 2000" },
];

export function PerformanceChart({
  type = "equity",
  timeRange,
  height = 300,
  title,
  description
}: PerformanceChartProps) {
  const [selectedBenchmark, setSelectedBenchmark] = useState("sp500");
  
  // Get appropriate data based on type and time range
  let chartData;
  switch (type) {
    case "returns":
      chartData = generateReturnsData(timeRange);
      break;
    case "volatility":
      chartData = generateVolatilityData(timeRange);
      break;
    case "drawdown":
      chartData = generateDrawdownData(timeRange);
      break;
    case "equity":
    default:
      chartData = generateEquityData(timeRange);
  }

  const handleBenchmarkChange = (value: string) => {
    setSelectedBenchmark(value);
  };

  const renderChart = () => {
    switch (type) {
      case "returns":
        return (
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={(value) => `${value}%`} />
            <Tooltip content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const value = payload[0]?.value as number;
                const benchmarkValue = payload[1]?.value as number;
                const isPositive = value >= 0;
                const isBenchmarkPositive = benchmarkValue >= 0;
                
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded ${isPositive ? "bg-green-600" : "bg-red-600"}`} />
                        <span className={isPositive ? "text-green-600" : "text-red-600"}>
                          Strategy: {value?.toLocaleString ? value.toLocaleString() : 0}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded ${isBenchmarkPositive ? "bg-green-600" : "bg-red-600"}`} />
                        <span className={isBenchmarkPositive ? "text-green-600" : "text-red-600"}>
                          Benchmark: {benchmarkValue?.toLocaleString ? benchmarkValue.toLocaleString() : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }} />
            <Bar 
              dataKey="value" 
              fill="#6b7280" // Use a neutral color as default
              radius={[4, 4, 0, 0]}
              name="Strategy"
            >
              {chartData.map((entry: any, index: number) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.value >= 0 ? "#22c55e" : "#ef4444"} 
                />
              ))}
            </Bar>
            <Bar 
              dataKey="benchmark" 
              fill="#9E9EA1"
              radius={[4, 4, 0, 0]}
              name="Benchmark"
              opacity={0.6}
            >
              {chartData.map((entry: any, index: number) => (
                <Cell 
                  key={`cell-benchmark-${index}`} 
                  fill={entry.benchmark >= 0 ? "#4ade80" : "#f87171"} 
                />
              ))}
            </Bar>
            <Legend verticalAlign="bottom" height={36} />
          </BarChart>
        );

      case "volatility":
        return (
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={(value) => `${value}%`} />
            <Tooltip content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const strategyValue = payload[0]?.value;
                const benchmarkValue = payload[1]?.value;
                
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded bg-primary" />
                        <span className="font-medium">Strategy: {strategyValue !== undefined ? `${strategyValue}%` : '0%'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded bg-muted-foreground" />
                        <span className="font-medium">Benchmark: {benchmarkValue !== undefined ? `${benchmarkValue}%` : '0%'}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }} />
            <Line type="monotone" dataKey="value" stroke="#26A69A" strokeWidth={2} dot={{ r: 4 }} name="Strategy" />
            <Line type="monotone" dataKey="benchmark" stroke="#9e9e9e" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} name="Benchmark" />
            <Legend verticalAlign="bottom" height={36} />
          </LineChart>
        );

      case "drawdown":
        return (
          <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={(value) => `${value}%`} />
            <Tooltip content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const value = payload[0]?.value;
                const benchmarkValue = payload[1]?.value;
                
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded bg-red-600" />
                        <span className="font-medium text-red-600">
                          Strategy: {value !== undefined ? `${value.toLocaleString ? value.toLocaleString() : value}%` : '0%'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded bg-red-400" />
                        <span className="font-medium text-red-400">
                          Benchmark: {benchmarkValue !== undefined ? `${benchmarkValue.toLocaleString ? benchmarkValue.toLocaleString() : benchmarkValue}%` : '0%'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#ef4444" 
              fill="#fee2e2" 
              fillOpacity={0.3} 
              name="Strategy"
            />
            <Area 
              type="monotone" 
              dataKey="benchmark" 
              stroke="#f87171" 
              fill="#fecaca" 
              fillOpacity={0.2} 
              name="Benchmark"
              strokeDasharray="5 5"
            />
            <Legend verticalAlign="bottom" height={36} />
          </AreaChart>
        );
        
      case "equity":
      default:
        return (
          <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={(value) => `${value}%`} />
            <Tooltip content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const value = payload[0]?.value;
                const benchmarkValue = payload[1]?.value;
                const isPositive = value !== undefined && value >= 0;
                const isBenchmarkPositive = benchmarkValue !== undefined && benchmarkValue >= 0;
                
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded bg-primary" />
                        <span className={`font-medium ${isPositive ? "text-positive" : "text-negative"}`}>
                          Strategy: {value !== undefined ? `${value.toLocaleString ? value.toLocaleString() : value}%` : '0%'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded bg-muted-foreground" />
                        <span className={`font-medium ${isBenchmarkPositive ? "text-positive" : "text-negative"}`}>
                          Benchmark: {benchmarkValue !== undefined ? `${benchmarkValue.toLocaleString ? benchmarkValue.toLocaleString() : benchmarkValue}%` : '0%'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }} />
            <Area type="monotone" dataKey="value" stroke="#26A69A" fill="#CCECE6" fillOpacity={0.3} name="Strategy" />
            <Line type="monotone" dataKey="benchmark" stroke="#9e9e9e" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} name="Benchmark" />
            <Legend verticalAlign="bottom" height={36} />
          </AreaChart>
        );
    }
  };

  return (
    <div className={cn(title || description ? "pt-4" : "pt-6", "mx-[20px]")}>
      {(title || description) && (
        <div className="px-6 mb-2">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className="px-6 flex justify-end">
        <div className="w-48 mb-4">
          <Select value={selectedBenchmark} onValueChange={handleBenchmarkChange}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select benchmark" />
            </SelectTrigger>
            <SelectContent>
              {benchmarkOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="px-6 py-2">
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

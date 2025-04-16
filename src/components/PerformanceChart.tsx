import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell } from "recharts";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

type PerformanceChartProps = {
  type?: "equity" | "returns" | "volatility" | "drawdown";
  timeRange: "7d" | "30d" | "all";
  height?: number;
  title?: string;
  description?: string;
  showBenchmark?: boolean;
};

const benchmarks = [{
  id: "sp500",
  name: "S&P 500"
}, {
  id: "nasdaq",
  name: "NASDAQ"
}, {
  id: "dow",
  name: "Dow Jones"
}, {
  id: "russell",
  name: "Russell 2000"
}];

const generateEquityData = (timeRange: "7d" | "30d" | "all", benchmarkId?: string) => {
  let data;
  if (timeRange === "7d") {
    data = [{
      date: "Mon",
      value: 42
    }, {
      date: "Tue",
      value: 44
    }, {
      date: "Wed",
      value: 43
    }, {
      date: "Thu",
      value: 45
    }, {
      date: "Fri",
      value: 48
    }, {
      date: "Sat",
      value: 49
    }, {
      date: "Sun",
      value: 50
    }];
  } else if (timeRange === "30d") {
    data = [{
      date: "Week 1",
      value: 25
    }, {
      date: "Week 2",
      value: 32
    }, {
      date: "Week 3",
      value: 38
    }, {
      date: "Week 4",
      value: 46
    }, {
      date: "Week 5",
      value: 50
    }];
  } else {
    data = [{
      date: "Jan",
      value: 0
    }, {
      date: "Feb",
      value: 6.5
    }, {
      date: "Mar",
      value: 12
    }, {
      date: "Apr",
      value: 8.5
    }, {
      date: "May",
      value: 15
    }, {
      date: "Jun",
      value: 22
    }, {
      date: "Jul",
      value: 28
    }, {
      date: "Aug",
      value: 34
    }, {
      date: "Sep",
      value: 29
    }, {
      date: "Oct",
      value: 37
    }, {
      date: "Nov",
      value: 42
    }, {
      date: "Dec",
      value: 50
    }];
  }
  if (benchmarkId) {
    return data.map(item => {
      let benchmarkValue = 0;
      switch (benchmarkId) {
        case "sp500":
          benchmarkValue = item.value * 0.85 + Math.random() * 5;
          break;
        case "nasdaq":
          benchmarkValue = item.value * 0.9 + Math.random() * 6;
          break;
        case "dow":
          benchmarkValue = item.value * 0.8 + Math.random() * 4;
          break;
        case "russell":
          benchmarkValue = item.value * 0.75 + Math.random() * 3;
          break;
        default:
          benchmarkValue = item.value * 0.85;
      }
      return {
        ...item,
        benchmark: parseFloat(benchmarkValue.toFixed(1))
      };
    });
  }
  return data;
};

const generateReturnsData = (timeRange: "7d" | "30d" | "all") => {
  if (timeRange === "7d") {
    return [{
      date: "Mon",
      value: 1.2
    }, {
      date: "Tue",
      value: 1.8
    }, {
      date: "Wed",
      value: -0.9
    }, {
      date: "Thu",
      value: 2.1
    }, {
      date: "Fri",
      value: 0.8
    }, {
      date: "Sat",
      value: -0.3
    }, {
      date: "Sun",
      value: 1.3
    }];
  } else if (timeRange === "30d") {
    return [{
      date: "Week 1",
      value: 3.2
    }, {
      date: "Week 2",
      value: 5.4
    }, {
      date: "Week 3",
      value: -2.1
    }, {
      date: "Week 4",
      value: 3.8
    }, {
      date: "Week 5",
      value: 1.9
    }];
  } else {
    return [{
      date: "Jan",
      value: 3.5
    }, {
      date: "Feb",
      value: 2.8
    }, {
      date: "Mar",
      value: -1.2
    }, {
      date: "Apr",
      value: 3.1
    }, {
      date: "May",
      value: 2.5
    }, {
      date: "Jun",
      value: -0.8
    }, {
      date: "Jul",
      value: 4.2
    }, {
      date: "Aug",
      value: 3.7
    }, {
      date: "Sep",
      value: -2.3
    }, {
      date: "Oct",
      value: 1.9
    }, {
      date: "Nov",
      value: 3.8
    }, {
      date: "Dec",
      value: 2.1
    }];
  }
};

const generateVolatilityData = (timeRange: "7d" | "30d" | "all") => {
  if (timeRange === "7d") {
    return [{
      date: "Mon",
      value: 0.8,
      benchmark: 0.5
    }, {
      date: "Tue",
      value: 1.2,
      benchmark: 0.6
    }, {
      date: "Wed",
      value: 0.9,
      benchmark: 0.7
    }, {
      date: "Thu",
      value: 1.5,
      benchmark: 0.9
    }, {
      date: "Fri",
      value: 1.1,
      benchmark: 0.6
    }, {
      date: "Sat",
      value: 0.7,
      benchmark: 0.4
    }, {
      date: "Sun",
      value: 0.5,
      benchmark: 0.3
    }];
  } else if (timeRange === "30d") {
    return [{
      date: "Week 1",
      value: 0.9,
      benchmark: 0.6
    }, {
      date: "Week 2",
      value: 1.3,
      benchmark: 0.7
    }, {
      date: "Week 3",
      value: 1.0,
      benchmark: 0.5
    }, {
      date: "Week 4",
      value: 1.2,
      benchmark: 0.8
    }, {
      date: "Week 5",
      value: 0.8,
      benchmark: 0.5
    }];
  } else {
    return [{
      date: "Jan",
      value: 0.9,
      benchmark: 0.5
    }, {
      date: "Feb",
      value: 1.1,
      benchmark: 0.6
    }, {
      date: "Mar",
      value: 1.3,
      benchmark: 0.7
    }, {
      date: "Apr",
      value: 1.0,
      benchmark: 0.6
    }, {
      date: "May",
      value: 0.8,
      benchmark: 0.5
    }, {
      date: "Jun",
      value: 1.2,
      benchmark: 0.7
    }, {
      date: "Jul",
      value: 1.4,
      benchmark: 0.8
    }, {
      date: "Aug",
      value: 1.1,
      benchmark: 0.7
    }, {
      date: "Sep",
      value: 0.9,
      benchmark: 0.6
    }, {
      date: "Oct",
      value: 1.2,
      benchmark: 0.7
    }, {
      date: "Nov",
      value: 1.0,
      benchmark: 0.6
    }, {
      date: "Dec",
      value: 0.8,
      benchmark: 0.5
    }];
  }
};

const generateDrawdownData = (timeRange: "7d" | "30d" | "all") => {
  if (timeRange === "7d") {
    return [{
      date: "Mon",
      value: -0.5
    }, {
      date: "Tue",
      value: -0.8
    }, {
      date: "Wed",
      value: -1.2
    }, {
      date: "Thu",
      value: -0.9
    }, {
      date: "Fri",
      value: -1.5
    }, {
      date: "Sat",
      value: -1.1
    }, {
      date: "Sun",
      value: -0.7
    }];
  } else if (timeRange === "30d") {
    return [{
      date: "Week 1",
      value: -1.2
    }, {
      date: "Week 2",
      value: -1.8
    }, {
      date: "Week 3",
      value: -2.5
    }, {
      date: "Week 4",
      value: -1.9
    }, {
      date: "Week 5",
      value: -1.5
    }];
  } else {
    return [{
      date: "Jan",
      value: -1.5
    }, {
      date: "Feb",
      value: -2.2
    }, {
      date: "Mar",
      value: -3.8
    }, {
      date: "Apr",
      value: -2.5
    }, {
      date: "May",
      value: -1.8
    }, {
      date: "Jun",
      value: -3.2
    }, {
      date: "Jul",
      value: -4.5
    }, {
      date: "Aug",
      value: -3.7
    }, {
      date: "Sep",
      value: -6.8
    }, {
      date: "Oct",
      value: -5.2
    }, {
      date: "Nov",
      value: -4.3
    }, {
      date: "Dec",
      value: -2.8
    }];
  }
};

export function PerformanceChart({
  type = "equity",
  timeRange,
  height = 300,
  title,
  description,
  showBenchmark = true
}: PerformanceChartProps) {
  const [selectedBenchmark, setSelectedBenchmark] = useState<string | undefined>(showBenchmark ? "sp500" : undefined);

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
      chartData = generateEquityData(timeRange, selectedBenchmark);
  }

  const handleBenchmarkChange = (value: string) => {
    setSelectedBenchmark(value);
  };

  const renderChart = () => {
    switch (type) {
      case "returns":
        return <BarChart data={chartData} margin={{
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
              const value = payload[0].value as number;
              const isPositive = value >= 0;
              return <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded ${isPositive ? "bg-[#26A69A]" : "bg-red-600"}`} />
                        <span className={isPositive ? "text-[#26A69A]" : "text-red-600"}>
                          {value.toLocaleString()}%
                        </span>
                      </div>
                    </div>
                  </div>;
            }
            return null;
          }} />
            <Bar dataKey="value" fill="#6b7280" radius={[4, 4, 0, 0]}>
              {chartData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.value >= 0 ? "#22c55e" : "#ef4444"} />)}
            </Bar>
          </BarChart>;
      case "volatility":
        return <LineChart data={chartData} margin={{
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
                        <div className="h-2 w-2 rounded bg-[#26A69A]" />
                        <span className="font-medium">Strategy: {payload[0].value}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded bg-muted-foreground" />
                        <span className="font-medium">Benchmark: {payload[1].value}%</span>
                      </div>
                    </div>
                  </div>;
            }
            return null;
          }} />
            <Line type="monotone" dataKey="value" stroke="#26A69A" strokeWidth={2} dot={{
            r: 4
          }} />
            <Line type="monotone" dataKey="benchmark" stroke="#9e9e9e" strokeWidth={2} strokeDasharray="5 5" dot={{
            r: 4
          }} />
          </LineChart>;
      case "drawdown":
        return <AreaChart data={chartData} margin={{
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
              const value = payload[0].value as number;
              return <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded bg-red-600" />
                        <span className="font-medium text-red-600">
                          {value.toLocaleString()}%
                        </span>
                      </div>
                    </div>
                  </div>;
            }
            return null;
          }} />
            <Area type="monotone" dataKey="value" stroke="#ef4444" fill="#fee2e2" fillOpacity={0.3} />
          </AreaChart>;
      case "equity":
      default:
        return <AreaChart data={chartData} margin={{
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
              const value = payload[0].value as number;
              const isPositive = value >= 0;
              return <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded bg-[#26A69A]" />
                        <span className={`font-medium ${isPositive ? "text-[#26A69A]" : "text-red-600"}`}>
                          Strategy: {value.toLocaleString()}%
                        </span>
                      </div>
                      {selectedBenchmark && payload.length > 1 && <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded bg-[#9b87f5]" />
                          <span className="font-medium">
                            {benchmarks.find(b => b.id === selectedBenchmark)?.name}: {(payload[1].value as number).toLocaleString()}%
                          </span>
                        </div>}
                    </div>
                  </div>;
            }
            return null;
          }} />
            <Area type="monotone" dataKey="value" stroke="#26A69A" fill="#CCECE6" fillOpacity={0.3} />
            {selectedBenchmark && <Area type="monotone" dataKey="benchmark" stroke="#9b87f5" fill="#D6BCFA" fillOpacity={0.1} strokeDasharray="5 5" />}
          </AreaChart>;
    }
  };

  return <div className={cn(title || description ? "pt-4" : "pt-6", "mx-[20px]")}>
    <div className="flex justify-between items-center mb-2 px-0">
      <div className="flex items-center gap-4">
        {title && <h3 className="text-lg font-semibold">{title}</h3>}
        {type === "equity" && showBenchmark && (
          <div className="w-[180px]">
            <Select onValueChange={handleBenchmarkChange} defaultValue={selectedBenchmark}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select benchmark" />
              </SelectTrigger>
              <SelectContent>
                {benchmarks.map(benchmark => (
                  <SelectItem key={benchmark.id} value={benchmark.id}>
                    {benchmark.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
    
    <div className="px-6 py-2">
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
      
      {type === "equity" && selectedBenchmark && <div className="mt-2 flex justify-center">
        <div className="flex gap-6 items-center text-sm">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-[#26A69A]"></div>
            <span>Strategy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-[#9b87f5]"></div>
            <span>{benchmarks.find(b => b.id === selectedBenchmark)?.name}</span>
          </div>
        </div>
      </div>}
    </div>
  </div>;
}

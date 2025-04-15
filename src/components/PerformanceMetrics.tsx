import { Card } from "@/components/ui/card";

type PerformanceMetricsProps = {
  type: "equity" | "returns" | "drawdown";
  timeRange: "7d" | "30d" | "all";
};

// Generate metrics based on time range
const getEquityMetrics = (timeRange: "7d" | "30d" | "all") => {
  if (timeRange === "7d") {
    return [
      { label: "Total Return", value: "+3.5%", positive: true },
      { label: "Max Drawdown", value: "-1.8%", negative: true },
      { label: "Total Trades", value: "8" },
      { label: "Profitable Trades", value: "6", percentValue: "75%" },
    ];
  } else if (timeRange === "30d") {
    return [
      { label: "Total Return", value: "+12.5%", positive: true },
      { label: "Max Drawdown", value: "-3.2%", negative: true },
      { label: "Total Trades", value: "18" },
      { label: "Profitable Trades", value: "12", percentValue: "67%" },
    ];
  } else {
    return [
      { label: "Total Return", value: "+50.0%", positive: true },
      { label: "Max Drawdown", value: "-8.3%", negative: true },
      { label: "Total Trades", value: "25" },
      { label: "Profitable Trades", value: "17", percentValue: "68%" },
    ];
  }
};

// Generate returns metrics based on time range
const getReturnsMetrics = (timeRange: "7d" | "30d" | "all") => {
  if (timeRange === "7d") {
    return [
      { label: "Period", value: "Mon", returnValue: "+1.2%", benchmarkValue: "+0.5%", differenceValue: "+0.7%" },
      { label: "Tue", value: "Tue", returnValue: "+1.8%", benchmarkValue: "+0.7%", differenceValue: "+1.1%" },
      { label: "Wed", value: "Wed", returnValue: "-0.9%", benchmarkValue: "-0.3%", differenceValue: "-0.6%" },
    ];
  } else if (timeRange === "30d") {
    return [
      { label: "Period", value: "Week 1", returnValue: "+3.2%", benchmarkValue: "+1.0%", differenceValue: "+2.2%" },
      { label: "Week 2", value: "Week 2", returnValue: "+5.4%", benchmarkValue: "+1.7%", differenceValue: "+3.7%" },
      { label: "Week 3", value: "Week 3", returnValue: "-2.1%", benchmarkValue: "-0.8%", differenceValue: "-1.3%" },
    ];
  } else {
    return [
      { label: "Period", value: "Jan 2024", returnValue: "+8.0%", benchmarkValue: "+2.0%", differenceValue: "+6.0%" },
      { label: "Feb 2024", value: "Feb 2024", returnValue: "+3.7%", benchmarkValue: "+1.9%", differenceValue: "+1.8%" },
      { label: "Mar 2024", value: "Mar 2024", returnValue: "-2.7%", benchmarkValue: "-1.0%", differenceValue: "-1.7%" },
    ];
  }
};

// Generate drawdown metrics based on time range
const getDrawdownMetrics = (timeRange: "7d" | "30d" | "all") => {
  if (timeRange === "7d") {
    return [
      { label: "Maximum Drawdown", value: "-1.8%" },
      { label: "Average Drawdown", value: "-1.0%" },
      { label: "Recovery Time (Avg)", value: "2 days" },
      { label: "Current Drawdown", value: "-0.3%" },
    ];
  } else if (timeRange === "30d") {
    return [
      { label: "Maximum Drawdown", value: "-3.2%" },
      { label: "Average Drawdown", value: "-1.8%" },
      { label: "Recovery Time (Avg)", value: "5 days" },
      { label: "Current Drawdown", value: "-0.9%" },
    ];
  } else {
    return [
      { label: "Maximum Drawdown", value: "-8.3%" },
      { label: "Average Drawdown", value: "-3.2%" },
      { label: "Recovery Time (Avg)", value: "21 days" },
      { label: "Current Drawdown", value: "-1.2%" },
    ];
  }
};

export function PerformanceMetrics({ type, timeRange }: PerformanceMetricsProps) {
  const equityMetrics = getEquityMetrics(timeRange);
  const returnsMetrics = getReturnsMetrics(timeRange);
  const drawdownMetrics = getDrawdownMetrics(timeRange);

  if (type === "equity") {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {equityMetrics.map((metric) => {
          // Determine color based on value
          const isPositive = metric.value.startsWith("+");
          const isNegative = metric.value.startsWith("-");
          
          return (
            <div key={metric.label}>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className={`text-lg font-medium ${
                isPositive 
                  ? "text-green-600" 
                  : isNegative 
                    ? "text-red-600" 
                    : ""
              }`}>
                {metric.value}
              </p>
              {metric.percentValue && (
                <p className="text-xs text-muted-foreground">
                  {metric.percentValue}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (type === "returns") {
    return (
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="px-4 py-3 text-sm font-medium">Period</th>
                <th className="px-4 py-3 text-sm font-medium">Return</th>
                <th className="px-4 py-3 text-sm font-medium">Benchmark</th>
                <th className="px-4 py-3 text-sm font-medium">Difference</th>
              </tr>
            </thead>
            <tbody>
              {returnsMetrics.map((metric) => (
                <tr key={metric.value} className="border-b last:border-0">
                  <td className="px-4 py-3 text-sm">{metric.value}</td>
                  <td className={`px-4 py-3 text-sm ${metric.returnValue.startsWith("+") ? "text-positive" : "text-negative"}`}>
                    {metric.returnValue}
                  </td>
                  <td className={`px-4 py-3 text-sm ${metric.benchmarkValue.startsWith("+") ? "text-positive" : "text-negative"}`}>
                    {metric.benchmarkValue}
                  </td>
                  <td className={`px-4 py-3 text-sm ${metric.differenceValue.startsWith("+") ? "text-positive" : "text-negative"}`}>
                    {metric.differenceValue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {drawdownMetrics.map((metric) => (
        <div key={metric.label}>
          <p className="text-sm text-muted-foreground">{metric.label}</p>
          <p className={`text-lg font-medium ${
            metric.label.includes("Drawdown") ? "text-negative" : ""
          }`}>
            {metric.value}
          </p>
        </div>
      ))}
    </div>
  );
}

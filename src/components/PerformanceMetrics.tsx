import { Card } from "@/components/ui/card";

type PerformanceMetricsProps = {
  type: "equity" | "returns" | "drawdown";
};

const equityMetrics = [
  { label: "Total Growth", value: "+50.0%", positive: true },
  { label: "Max Drawdown", value: "-8.3%", negative: true },
  { label: "Total Trades", value: "25" },
  { label: "Profitable Trades", value: "17", percentValue: "68%" },
];

const returnsMetrics = [
  { label: "Period", value: "Jan 2024", returnValue: "+8.0%", benchmarkValue: "+2.0%", differenceValue: "+6.0%" },
  { label: "Feb 2024", value: "Feb 2024", returnValue: "+3.7%", benchmarkValue: "+1.9%", differenceValue: "+1.8%" },
  { label: "Mar 2024", value: "Mar 2024", returnValue: "-2.7%", benchmarkValue: "-1.0%", differenceValue: "-1.7%" },
];

const drawdownMetrics = [
  { label: "Maximum Drawdown", value: "-8.3%" },
  { label: "Average Drawdown", value: "-3.2%" },
  { label: "Recovery Time (Avg)", value: "21 days" },
  { label: "Current Drawdown", value: "-1.2%" },
];

export function PerformanceMetrics({ type }: PerformanceMetricsProps) {
  if (type === "equity") {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {equityMetrics.map((metric) => (
          <div key={metric.label}>
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className={`text-lg font-medium ${metric.positive ? "text-positive" : metric.negative ? "text-negative" : ""}`}>
              {metric.value}
            </p>
            {metric.percentValue && (
              <p className="text-xs text-muted-foreground">
                {metric.percentValue}
              </p>
            )}
          </div>
        ))}
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

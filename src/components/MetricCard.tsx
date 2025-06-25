
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  title: string;
  value: string | number;
  change?: {
    value: string;
    positive: boolean;
  };
  direction?: "up" | "down";
  showChart?: boolean;
  trades?: any[]; // Array of trade objects for backward compatibility
};

export function MetricCard({ title, value, change, direction, showChart = true }: MetricCardProps) {
  const isPositive = change?.positive || direction === "up";
  
  // Determine color based on value for Total Return
  let valueColor = "";
  if (title === "Total Return" && typeof value === "string") {
    if (value.startsWith("+")) {
      valueColor = "text-green-600";
    } else if (value.startsWith("-")) {
      valueColor = "text-red-600";
    }
  }

  // Color coding for Signal Success Rate
  if (title === "Signal Success Rate" && typeof value === "string") {
    const percentage = parseFloat(value.replace('%', ''));
    if (percentage >= 70) {
      valueColor = "text-green-600";
    } else if (percentage >= 50) {
      valueColor = "text-yellow-600";
    } else {
      valueColor = "text-red-600";
    }
  }

  return (
    <div className="rounded-md border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      </div>
      <div className="mt-2">
        <h2 className={cn("text-2xl font-bold", valueColor)}>{value}</h2>
      </div>
    </div>
  );
}


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
};

export function MetricCard({ title, value, change, direction, showChart = true }: MetricCardProps) {
  const isPositive = change?.positive || direction === "up";
  
  // Determine if value is positive or negative based on string prefix
  let valueColor = "";
  if (typeof value === "string") {
    if (value.startsWith("+")) {
      valueColor = "text-positive";
    } else if (value.startsWith("-")) {
      valueColor = "text-negative";
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

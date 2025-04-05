
import { ChevronUp, ChevronDown, BarChart3, ArrowRight } from "lucide-react";
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

  return (
    <div className="rounded-md border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {showChart && (
          <div className="h-4 w-4">
            {direction === "up" || direction === "down" ? (
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        )}
      </div>
      <div className="mt-2 flex items-baseline">
        <h2 className="text-3xl font-bold">{value}</h2>
        {change && (
          <p
            className={cn(
              "ml-2 text-sm",
              isPositive ? "text-positive" : "text-negative"
            )}
          >
            <span className="flex items-center">
              {isPositive ? (
                <ChevronUp className="mr-1 h-4 w-4" />
              ) : (
                <ChevronDown className="mr-1 h-4 w-4" />
              )}
              {change.value}
            </span>
          </p>
        )}
      </div>
      {change && <p className="mt-1 text-xs text-muted-foreground">from last month</p>}
    </div>
  );
}

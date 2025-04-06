
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

  return (
    <div className="rounded-md border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      </div>
      <div className="mt-2">
        <h2 className="text-2xl font-bold">{value}</h2>
      </div>
    </div>
  );
}

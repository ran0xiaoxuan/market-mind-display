import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
type MetricSummaryProps = {
  title: string;
  value: string | number;
  changeValue: string;
  changePositive: boolean;
  valueColor?: "positive" | "negative" | "neutral";
};
export function MetricSummary({
  title,
  value,
  changeValue,
  changePositive,
  valueColor = "neutral"
}: MetricSummaryProps) {
  // Determine the color class for the value
  const valueColorClass = valueColor === "positive" ? "text-green-600" : valueColor === "negative" ? "text-red-600" : "";
  return <div className="rounded-md border bg-card p-5">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="mt-2">
        <h2 className={cn("text-2xl font-bold", valueColorClass)}>{value}</h2>
        
      </div>
    </div>;
}
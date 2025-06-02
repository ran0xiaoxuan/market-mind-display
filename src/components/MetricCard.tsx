
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
  price?: number;
  volume?: number;
};

export function MetricCard({ title, value, change, direction, showChart = true, price, volume }: MetricCardProps) {
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

  // Calculate transaction amount as Price * Volume for Transaction Amount
  let displayValue = value;
  if (title === "Transaction Amount" && price !== undefined && volume !== undefined) {
    const transactionAmount = price * volume;
    displayValue = `$${transactionAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (title === "Transaction Amount" && typeof value === "number") {
    displayValue = `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (title === "Transaction Amount" && typeof value === "string" && !value.startsWith("$")) {
    displayValue = `$${value}`;
  }

  return (
    <div className="rounded-md border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      </div>
      <div className="mt-2">
        <h2 className={cn("text-2xl font-bold", valueColor)}>{displayValue}</h2>
      </div>
    </div>
  );
}

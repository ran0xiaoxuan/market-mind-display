
import { BarChart3 } from "lucide-react";

type ChartPlaceholderProps = {
  title: string;
  className?: string;
};

export function ChartPlaceholder({ title, className }: ChartPlaceholderProps) {
  return (
    <div className={cn("flex h-[300px] flex-col items-center justify-center rounded-md border border-dashed text-center", className)}>
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-medium">{title}</h3>
    </div>
  );
}

// Helper for class name concatenation
function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

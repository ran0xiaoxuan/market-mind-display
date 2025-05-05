import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "outline" | "pro" | "free";
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = "default", className, children }: BadgeProps) {
  // Now we can directly use the variant since we've added "pro" and "free" to the shadcn Badge component
  return (
    <ShadcnBadge variant={variant} className={cn(
      // Remove the animate-pulse class but keep the shadow
      variant === "pro" ? "shadow-sm" : "",
      className
    )}>
      {children}
    </ShadcnBadge>
  );
}

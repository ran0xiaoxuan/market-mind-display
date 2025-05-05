
import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "outline" | "pro" | "free";
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = "default", className, children }: BadgeProps) {
  // Custom styling for the pro badge
  if (variant === "pro") {
    return (
      <ShadcnBadge 
        variant="outline" 
        className={cn(
          "bg-gradient-to-r from-amber-400 to-amber-500 text-black font-medium border-amber-300 shadow-sm",
          className
        )}
      >
        {children}
      </ShadcnBadge>
    );
  }
  
  // Custom styling for the free badge
  if (variant === "free") {
    return (
      <ShadcnBadge 
        variant="outline" 
        className={cn(
          "bg-secondary text-muted-foreground border-gray-200",
          className
        )}
      >
        {children}
      </ShadcnBadge>
    );
  }

  // Default badge with existing behavior
  return (
    <ShadcnBadge variant={variant} className={className}>
      {children}
    </ShadcnBadge>
  );
}

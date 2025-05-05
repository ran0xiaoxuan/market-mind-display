
import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "outline" | "pro" | "free";
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = "default", className, children }: BadgeProps) {
  return (
    <ShadcnBadge variant={variant} className={cn(className)}>
      {children}
    </ShadcnBadge>
  );
}

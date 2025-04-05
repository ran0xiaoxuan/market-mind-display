
import { Badge as ShadcnBadge } from "@/components/ui/badge";

interface BadgeProps {
  variant?: "default" | "outline";
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = "default", className, children }: BadgeProps) {
  return (
    <ShadcnBadge variant={variant} className={className}>
      {children}
    </ShadcnBadge>
  );
}

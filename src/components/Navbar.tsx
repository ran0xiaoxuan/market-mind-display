
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "StratAlge", href: "/", className: "font-bold" },
  { name: "Dashboard", href: "/" },
  { name: "Strategies", href: "/strategies" },
  { name: "Backtest", href: "/backtest" },
  { name: "Analytics", href: "/analytics" },
  { name: "AI Strategy", href: "/ai-strategy" },
];

export function Navbar() {
  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex gap-6 md:gap-10">
          {navItems.map((item, index) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                item.className,
                index === 1 ? "text-primary" : "text-foreground"
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

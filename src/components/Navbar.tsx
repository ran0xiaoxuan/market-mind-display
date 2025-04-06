
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";

const navItems = [
  { name: "StratAlge", href: "/", className: "font-bold" },
  { name: "Dashboard", href: "/" },
  { name: "Strategies", href: "/strategies" },
  { name: "Backtest", href: "/backtest" },
  { name: "Analytics", href: "/analytics" },
  { name: "AI Strategy", href: "/ai-strategy" },
];

export function Navbar() {
  const location = useLocation();
  
  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 justify-between">
        <div className="flex gap-6 md:gap-10">
          {navItems.map((item, index) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                item.className,
                location.pathname === item.href && index !== 0 ? "text-primary" : "text-foreground"
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>
        <UserMenu />
      </div>
    </nav>
  );
}


import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";
import { Button } from "./ui/button";

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
  
  // We'll implement this properly when we have real auth
  const isAuthenticated = true;
  
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
        
        {isAuthenticated ? (
          <UserMenu />
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/auth/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link to="/auth/signup">
              <Button size="sm">
                Sign up
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

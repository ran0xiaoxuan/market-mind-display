
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";
import { Button } from "./ui/button";
import { Logo } from "./Logo";
import { Sparkles } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/" },
  { name: "Strategies", href: "/strategies" },
  { name: "Backtest", href: "/backtest" },
  { name: "Analytics", href: "/analytics" },
];

export function Navbar() {
  const location = useLocation();
  
  // We'll implement this properly when we have real auth
  const isAuthenticated = true;
  
  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 justify-between">
        <div className="flex gap-6 md:gap-10 items-center">
          <Logo />
          
          {/* Dashboard link */}
          <Link
            key="Dashboard"
            to="/"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary flex items-center h-10",
              location.pathname === "/" ? "text-primary" : "text-foreground"
            )}
          >
            Dashboard
          </Link>
          
          {/* AI Strategy button - now with black-white design and Sparkles icon */}
          <Link to="/ai-strategy">
            <Button 
              variant="ghost" 
              className={cn(
                "bg-gradient-to-r from-black via-gray-700 to-gray-900 text-white font-medium px-4 py-2 rounded-md transition-all shadow-md hover:shadow-lg flex items-center gap-2",
                location.pathname === "/ai-strategy" ? "ring-2 ring-gray-500" : ""
              )}
            >
              <Sparkles className="w-4 h-4" />
              AI Strategy
            </Button>
          </Link>
          
          {/* Remaining nav items excluding Dashboard since it's handled separately */}
          {navItems.slice(1).map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary flex items-center h-10",
                location.pathname === item.href ? "text-primary" : "text-foreground"
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

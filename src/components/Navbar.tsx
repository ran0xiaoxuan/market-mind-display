
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";
import { Brain } from "lucide-react";

type NavLinkProps = {
  to: string;
  onClick?: (path: string) => void;
  children: React.ReactNode;
  end?: boolean;
};

// Modified NavLink component that can intercept navigation attempts
const InterceptableNavLink = ({
  to,
  onClick,
  children,
  end
}: NavLinkProps) => {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(to);
    }
  };
  
  return <NavLink to={to} end={end} onClick={onClick ? handleClick : undefined} className={({
    isActive
  }) => cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", isActive ? "bg-secondary text-secondary-foreground" : "hover:bg-secondary/80 hover:text-secondary-foreground")}>
      {children}
    </NavLink>;
};

interface NavbarProps {
  onNavigate?: (path: string) => void;
}

export const Navbar = ({
  onNavigate
}: NavbarProps = {}) => {
  const { session } = useAuth();
  
  const NavItem = ({
    to,
    children,
    end
  }: Omit<NavLinkProps, 'onClick'>) => {
    // Special case for AI Strategy link - it doesn't use the standard styling
    if (to === "/ai-strategy") {
      return null; // We'll render it separately
    }
    
    // Standard styling for all other links
    return onNavigate ? <InterceptableNavLink to={to} onClick={onNavigate} end={end}>
        {children}
      </InterceptableNavLink> : <NavLink to={to} end={end} className={({
      isActive
    }) => cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", isActive ? "bg-secondary text-secondary-foreground" : "hover:bg-secondary/80 hover:text-secondary-foreground")}>
        {children}
      </NavLink>;
  };
  
  // Special AI Strategy NavLink with custom styling
  const AIStrategyNavItem = () => {
    const baseClasses = "px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2";
    
    // Custom styling for AI Strategy button
    return onNavigate ? (
      <InterceptableNavLink to="/ai-strategy" onClick={onNavigate}>
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          <span>AI Strategy</span>
        </div>
      </InterceptableNavLink>
    ) : (
      <NavLink 
        to="/ai-strategy" 
        className={({ isActive }) => cn(
          baseClasses,
          "bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 text-white",
          isActive ? "ring-2 ring-primary/30" : ""
        )}
      >
        <Brain className="h-4 w-4" />
        <span>AI Strategy</span>
      </NavLink>
    );
  };

  return <header className="border-b sticky top-0 z-30 bg-background shadow-sm">
      <div className="container max-w-full px-4 md:px-8 flex h-16 items-center justify-between">
        <div className="flex items-center">
          <div className="mr-6">
            <NavItem to="/" end>
              <Logo />
            </NavItem>
          </div>
          <nav className="flex items-center space-x-4">
            {session ? (
              <>
                <NavItem to="/dashboard">Dashboard</NavItem>
                <NavItem to="/strategies">Strategies</NavItem>
                <AIStrategyNavItem />
                <NavItem to="/backtest">Backtest</NavItem>
                <NavItem to="/analytics">Analytics</NavItem>
              </>
            ) : (
              <>
                <NavItem to="/login">Login</NavItem>
                <NavItem to="/signup">Sign Up</NavItem>
              </>
            )}
          </nav>
        </div>
        
        <div className="flex items-center">
          {session ? <UserMenu /> : <Button asChild className="ml-4 hover:scale-105 transition-transform">
              <NavItem to="/signup">Get Started</NavItem>
            </Button>}
        </div>
      </div>
    </header>;
};

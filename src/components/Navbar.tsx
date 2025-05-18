
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
  const {
    session
  } = useAuth();
  
  const NavItem = ({
    to,
    children,
    end
  }: Omit<NavLinkProps, 'onClick'>) => {
    // Standard styling for all links, including AI Strategy
    return onNavigate ? <InterceptableNavLink to={to} onClick={onNavigate} end={end}>
        {children}
      </InterceptableNavLink> : <NavLink to={to} end={end} className={({
      isActive
    }) => cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", isActive ? "bg-secondary text-secondary-foreground" : "hover:bg-secondary/80 hover:text-secondary-foreground")}>
        {children}
      </NavLink>;
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
            {session ? <>
                <NavItem to="/dashboard">Dashboard</NavItem>
                <NavItem to="/strategies">Strategies</NavItem>
                <NavItem to="/ai-strategy">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    <span>AI Strategy</span>
                  </div>
                </NavItem>
                <NavItem to="/backtest">Backtest</NavItem>
                <NavItem to="/analytics">Analytics</NavItem>
              </> : <>
                <NavItem to="/login">Login</NavItem>
                <NavItem to="/signup">Sign Up</NavItem>
              </>}
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

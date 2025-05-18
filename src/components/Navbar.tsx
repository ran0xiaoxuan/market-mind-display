
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";

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
  return <NavLink to={to === "/" ? "/dashboard" : to} // Redirect root to dashboard
  end={end} onClick={onClick ? handleClick : undefined} className={({
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
    // Ensure "/" routes go to dashboard
    const targetPath = to === "/" ? "/dashboard" : to;

    // Standard styling for all links - ensuring consistent spacing
    return onNavigate ? <InterceptableNavLink to={targetPath} onClick={onNavigate} end={end}>
        {children}
      </InterceptableNavLink> : <NavLink to={targetPath} end={end} className={({
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
          <nav className="flex items-center space-x-2">
            {session ? <>
                <NavItem to="/dashboard">Dashboard</NavItem>
                <NavItem to="/strategies">Strategies</NavItem>
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

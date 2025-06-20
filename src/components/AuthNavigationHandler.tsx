
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function AuthNavigationHandler({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // Handle navigation based on auth state
    if (session && user) {
      // Only redirect to dashboard if user is on auth pages or auth callback
      const authPages = ['/login', '/signup', '/forgot-password', '/auth/confirm', '/auth/callback'];
      if (authPages.includes(location.pathname)) {
        console.log('User already logged in, redirecting from auth page to dashboard');
        navigate('/dashboard', { replace: true });
      }
    } else {
      // User is not authenticated, check if they're trying to access protected routes
      const protectedRoutes = ['/dashboard', '/strategies', '/settings', '/backtest'];
      const isProtectedRoute = protectedRoutes.some(route => location.pathname.startsWith(route));
      
      if (isProtectedRoute) {
        console.log('User not authenticated, redirecting to login');
        navigate('/login', { replace: true });
      }
    }
  }, [user, session, isLoading, location.pathname, navigate]);

  return <>{children}</>;
}

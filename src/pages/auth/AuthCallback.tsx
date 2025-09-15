
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if this is an email confirmation callback
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const type = urlParams.get('type');
        const access_token = urlParams.get('access_token');
        const refresh_token = urlParams.get('refresh_token');

        console.log('Auth callback params:', { 
          token: !!token, 
          type, 
          access_token: !!access_token, 
          refresh_token: !!refresh_token 
        });

        // If we have auth tokens, this is a successful OAuth or email verification
        if (access_token && refresh_token) {
          console.log('Auth callback successful with tokens');
          try {
            await supabase.functions.invoke('referrals-sync', {
              headers: { Authorization: `Bearer ${access_token}` }
            });
          } catch (_) {}
          toast.success("Email confirmed successfully!");
          navigate('/dashboard', { replace: true });
          return;
        }

        // If we have a confirmation token, this is an email confirmation
        if (token && type === 'email') {
          console.log('Email confirmation callback detected');
          try {
            const { data: { session: s } } = await supabase.auth.getSession();
            if (s?.access_token) {
              await supabase.functions.invoke('referrals-sync', {
                headers: { Authorization: `Bearer ${s.access_token}` }
              });
            }
          } catch (_) {}
          toast.success("Email confirmed successfully!");
          navigate('/dashboard', { replace: true });
          return;
        }

        // If no special params but we have a session, user is authenticated
        if (!isLoading) {
          if (session) {
            console.log('User authenticated, redirecting to dashboard');
            try {
              const token = session.access_token;
              await supabase.functions.invoke('referrals-sync', {
                headers: { Authorization: `Bearer ${token}` }
              });
            } catch (_) {}
            navigate('/', { replace: true });
          } else {
            console.log('No session found, redirecting to login');
            navigate('/login', { replace: true });
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error("Authentication failed. Please try again.");
        navigate('/login', { replace: true });
      }
    };

    // Only run callback handling if not loading
    if (!isLoading) {
      handleAuthCallback();
    }
  }, [session, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}

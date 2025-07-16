import { createContext, useContext, useEffect, useState, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: any | null;
    data: any | null;
  }>;
  signInWithGoogle: () => Promise<{
    error: any | null;
    data: any | null;
  }>;
  signUp: (email: string, password: string, data?: { [key: string]: any }) => Promise<{
    error: any | null;
    data: any | null;
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{
    error: any | null;
    data: any | null;
  }>;
  resendConfirmation: (email: string) => Promise<{
    error: any | null;
    data: any | null;
  }>;
  verifyTurnstile: (token: string) => Promise<boolean>;
  validatePassword: (password: string) => { isValid: boolean; errors: string[] };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Password validation function
const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);
  const lastSignInUserRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth state change:', event, currentSession?.user?.email);
      
      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
      
      // Security: Log authentication events
      if (event === 'SIGNED_IN' && currentSession) {        
        console.log('User signed in successfully');
        
        // Only show toast if this is a different user or first sign in for this session
        const currentUserId = currentSession.user.id;
        if (lastSignInUserRef.current !== currentUserId) {
          lastSignInUserRef.current = currentUserId;
          toast({
            title: "Logged in successfully",
            description: "Welcome back!"
          });
        }
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('User signed out successfully');
        setIsSigningOut(false);
        lastSignInUserRef.current = null;
        setTimeout(() => {
          if (mounted) {
            toast({
              title: "Signed out",
              description: "You have been signed out successfully."
            });
          }
        }, 0);
      }

      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (mounted) {
        console.log('Initial session check:', currentSession?.user?.email);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);
        
        // Set the last signed in user to prevent duplicate toast on initial load
        if (currentSession?.user) {
          lastSignInUserRef.current = currentSession.user.id;
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isSigningOut]);

  const getErrorMessage = (error: any): string => {
    if (!error?.message) return "An unexpected error occurred. Please try again.";

    const message = error.message.toLowerCase();
    
    // Enhanced error message mapping
    if (message.includes("invalid login credentials") || message.includes("invalid email or password")) {
      return "The email or password you entered is incorrect. Please check your credentials and try again.";
    }
    if (message.includes("email not confirmed")) {
      return "Please check your email and click the confirmation link before signing in.";
    }
    if (message.includes("user already registered") || message.includes("user already exists")) {
      return "An account with this email already exists. Please try logging in instead.";
    }
    if (message.includes("password should be at least")) {
      return "Password must be at least 8 characters long.";
    }
    if (message.includes("invalid email")) {
      return "Please enter a valid email address.";
    }
    if (message.includes("signup is disabled")) {
      return "Account registration is currently disabled. Please contact support.";
    }
    if (message.includes("email rate limit exceeded") || message.includes("too many requests")) {
      return "Too many attempts. Please wait a few minutes before trying again.";
    }
    if (message.includes("user not found")) {
      return "No account found with this email address. Please check your email or sign up.";
    }
    if (message.includes("oauth")) {
      return "There was an issue with Google sign-in. Please try again.";
    }
    
    return error.message;
  };

  const verifyTurnstile = async (token: string): Promise<boolean> => {
    // Security: Check if we're in development environment
    const isDevelopment = window.location.hostname.includes('lovableproject.com') || 
                          window.location.hostname.includes('localhost');
    
    if (isDevelopment && token.startsWith('dev-')) {
      return true;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-turnstile', {
        body: { token }
      });
      
      if (error) {
        console.error('Turnstile verification error:', error);
        return false;
      }
      
      return data?.success === true;
    } catch (error) {
      console.error('Turnstile verification failed:', error);
      return false;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      
      if (result.error) {
        console.log('Sign in error:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error("Error signing in:", error);
      return { error, data: null };
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google OAuth flow...');
      
      const result = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      console.log('Google OAuth result:', result);
      return result;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      return { error, data: null };
    }
  };

  const signUp = async (email: string, password: string, data?: { [key: string]: any }) => {
    try {
      // Security: Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return {
          error: { message: passwordValidation.errors.join(', ') },
          data: null
        };
      }

      // Use auth/callback for proper token handling
      const result = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (!result.error && result.data.user && !result.data.session) {
        toast({
          title: "Account created successfully",
          description: "Please check your email to verify your account before signing in."
        });
      }
      
      return result;
    } catch (error) {
      console.error("Error signing up:", error);
      return { error, data: null };
    }
  };

  const signOut = async () => {
    try {
      console.log('Starting sign out process...');
      setIsSigningOut(true);
      
      // Sign out from Supabase first
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
      } else {
        console.log('Sign out successful');
      }
      
      // Clear local state after sign out
      setSession(null);
      setUser(null);
      
      // Use window.location for navigation since we can't use useNavigate here
      window.location.href = '/login';
    } catch (error) {
      console.error("Error signing out:", error);
      // Clear local state and navigate even if there's an exception
      setSession(null);
      setUser(null);
      setIsSigningOut(false);
      window.location.href = '/login';
      throw error;
    }
  };
  
  const resetPassword = async (email: string) => {
    try {
      // Use the current origin to ensure redirect URL matches current environment
      const currentOrigin = window.location.origin;
      const redirectUrl = `${currentOrigin}/auth/reset-password`;
      
      console.log('Sending password reset email with redirect URL:', redirectUrl);
      console.log('Current origin:', currentOrigin);
      
      const result = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      if (result.error) {
        console.error('Reset password error:', result.error);
      } else {
        console.log('Password reset email sent successfully');
        console.log('Users should check their email and click the reset link');
        console.log('The reset link will redirect to:', redirectUrl);
      }
      
      return result;
    } catch (error) {
      console.error("Error resetting password:", error);
      return { error, data: null };
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      const result = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      return result;
    } catch (error) {
      console.error("Error resending confirmation:", error);
      return { error, data: null };
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
    resendConfirmation,
    verifyTurnstile,
    validatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};


import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
      
      if (event === 'SIGNED_IN') {
        setTimeout(() => {
          toast({
            title: "Signed in successfully",
            description: "Welcome back!"
          });
          navigate('/');
        }, 0);
      }
      
      if (event === 'SIGNED_OUT') {
        setTimeout(() => {
          toast({
            title: "Signed out",
            description: "You have been signed out successfully."
          });
        }, 0);
      }

      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
    });

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

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
      const result = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      
      return result;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      return { error, data: null };
    }
  };

  const signUp = async (email: string, password: string, data?: { [key: string]: any }) => {
    try {
      const result = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data,
          emailRedirectTo: window.location.origin + '/auth/confirm'
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
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };
  
  const resetPassword = async (email: string) => {
    try {
      const result = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/auth/reset-password",
      });
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
          emailRedirectTo: window.location.origin + '/auth/confirm'
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

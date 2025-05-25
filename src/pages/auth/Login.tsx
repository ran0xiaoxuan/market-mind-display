
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, user } = useAuth();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        let errorMessage = "Please check your credentials and try again.";
        
        // Provide more specific error messages based on error type
        if (error.message?.includes("Invalid login credentials")) {
          errorMessage = "The email or password you entered is incorrect. Please try again.";
        } else if (error.message?.includes("Email not confirmed")) {
          errorMessage = "Please check your email and click the confirmation link before signing in.";
        } else if (error.message?.includes("Too many requests")) {
          errorMessage = "Too many login attempts. Please wait a few minutes before trying again.";
        } else if (error.message?.includes("User not found")) {
          errorMessage = "No account found with this email address. Please check your email or sign up.";
        } else if (error.message?.includes("Invalid email")) {
          errorMessage = "Please enter a valid email address.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast({
          title: "Login failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user is already logged in, redirect to home
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthLayout>
      <Card className="border shadow-sm">
        <CardHeader className="pb-0">
          <h1 className="text-xl font-semibold">Login</h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access your account
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="Enter your email address"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
            
            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}


import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp, user } = useAuth();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation with specific error messages
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter a password",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    if (!confirmPassword) {
      toast({
        title: "Confirm password required",
        description: "Please confirm your password",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please ensure both passwords are identical",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signUp(email, password, {
        full_name: name || email.split("@")[0],
        username: email.split("@")[0]
      });
      
      if (error) {
        let errorMessage = "Please check your information and try again.";
        
        // Provide more specific error messages based on error type
        if (error.message?.includes("User already registered")) {
          errorMessage = "An account with this email already exists. Please try logging in instead.";
        } else if (error.message?.includes("Password should be at least")) {
          errorMessage = "Password must be at least 8 characters long and contain a mix of letters and numbers.";
        } else if (error.message?.includes("Invalid email")) {
          errorMessage = "Please enter a valid email address.";
        } else if (error.message?.includes("Signup is disabled")) {
          errorMessage = "Account registration is currently disabled. Please contact support.";
        } else if (error.message?.includes("Email rate limit exceeded")) {
          errorMessage = "Too many signup attempts. Please wait a few minutes before trying again.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast({
          title: "Signup failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Signup failed",
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
          <h1 className="text-xl font-semibold">Create an account</h1>
          <p className="text-sm text-muted-foreground">
            Enter your information to create an account
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name (optional)
              </label>
              <Input 
                id="name" 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                disabled={isSubmitting}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email *
              </label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                disabled={isSubmitting}
                placeholder="Enter your email address"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password *
              </label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  disabled={isSubmitting}
                  placeholder="Create a password"
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
                  onClick={() => setShowPassword(!showPassword)} 
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters long
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium">
                Confirm Password *
              </label>
              <div className="relative">
                <Input 
                  id="confirm-password" 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                  disabled={isSubmitting}
                  placeholder="Confirm your password"
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
            
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

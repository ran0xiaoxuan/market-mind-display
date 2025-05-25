
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { resetPassword, user } = useAuth();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
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

    setIsSubmitting(true);
    
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        let errorMessage = "Failed to send reset link. Please try again.";
        
        // Provide more specific error messages
        if (error.message?.includes("User not found")) {
          errorMessage = "No account found with this email address. Please check your email or sign up for a new account.";
        } else if (error.message?.includes("Email rate limit exceeded")) {
          errorMessage = "Too many reset requests. Please wait a few minutes before trying again.";
        } else if (error.message?.includes("Invalid email")) {
          errorMessage = "Please enter a valid email address.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      } else {
        setSubmitted(true);
        toast({
          title: "Reset link sent",
          description: "Check your email for a password reset link."
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
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
          <h1 className="text-xl font-semibold">Forgot password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          {submitted ? (
            <div className="text-center space-y-4">
              <p>Check your email for a reset link.</p>
              <p className="text-sm text-muted-foreground">
                If you don't see it, check your spam folder.
              </p>
              <Button variant="outline" onClick={() => setSubmitted(false)} className="mt-2">
                Try again
              </Button>
            </div>
          ) : (
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
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
              
              <div className="text-center text-sm">
                Remember your password?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

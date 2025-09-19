
import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Mail, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Turnstile } from "@/components/Turnstile";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";

export default function ForgotPassword() {
  usePageTitle("Reset Password - StratAIge");

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset transient states on each submit
    setFormError(null);
    setIsEmailSent(false);
    
    if (!turnstileToken) {
      toast.error("Please complete the security verification");
      return;
    }
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      // 1) Check if email is registered via Edge Function
      const { data: checkData, error: checkError } = await supabase.functions.invoke('check-user-by-email', {
        body: { email }
      });

      if (checkError) {
        console.error('Email existence check error:', checkError);
        setFormError("Failed to verify email. Please try again.");
        toast.error("Failed to verify email. Please try again.");
        return;
      }

      if (!checkData?.exists) {
        // Requirement: Only registered emails can reset, otherwise show English prompt
        setFormError("This email is not registered.");
        toast.error("This email is not registered.");
        return;
      }

      // 2) Proceed to request reset email
      console.log('Sending password reset email to:', email);
      const { error } = await resetPassword(email);

      if (error) {
        console.error('Password reset error:', error);
        setFormError(error.message || "Failed to send reset email");
        toast.error(error.message || "Failed to send reset email");
      } else {
        console.log('Password reset email sent successfully');
        setIsEmailSent(true);
        toast.success("Password reset email sent successfully!");
      }
    } catch (err: any) {
      console.error('Password reset exception:', err);
      setFormError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Note: No separate success view. We keep the user on this page and show inline alerts.

  return (
    <AuthLayout>
      <Card className="border shadow-sm">
        <CardHeader className="pb-0">
          <h1 className="text-xl font-semibold text-center">Reset Your Password</h1>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {isEmailSent && (
              <Alert className="text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Reset Link Sent</p>
                    <p className="text-sm text-muted-foreground">We've sent a password reset link to <strong>{email}</strong>. Please check your inbox.</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {formError && (
              <Alert className="text-left" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-center">
              <Turnstile onVerify={setTurnstileToken} />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !turnstileToken}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Reset Link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>

            <div className="text-center">
              <Link 
                to="/login" 
                className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

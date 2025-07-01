
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

export default function ForgotPassword() {
  usePageTitle("Reset Password - StratAIge");

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      console.log('Sending password reset email to:', email);
      const { error } = await resetPassword(email);

      if (error) {
        console.error('Password reset error:', error);
        toast.error(error.message || "Failed to send reset email");
      } else {
        console.log('Password reset email sent successfully');
        setIsEmailSent(true);
        toast.success("Password reset email sent successfully!");
      }
    } catch (err: any) {
      console.error('Password reset exception:', err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <AuthLayout>
        <Card className="border shadow-sm">
          <CardHeader className="pb-0">
            <h1 className="text-xl font-semibold text-center">Check Your Email</h1>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium">Reset Link Sent</h3>
              <p className="text-sm text-muted-foreground">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Please check your email and click the "Reset Password" button. The link will open a new window where you can set your new password.
              </p>
              
              <Alert className="text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>Don't see the email?</strong> Check your spam or junk folder.</p>
                    <p><strong>Reset link not working?</strong> Make sure to click the button in the email, not copy the link. If it still doesn't work, try requesting a new link.</p>
                  </div>
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2 pt-4">
                <Button asChild className="w-full">
                  <Link to="/login">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEmailSent(false);
                    setEmail("");
                    setTurnstileToken(null);
                  }}
                  className="w-full"
                >
                  Send Another Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

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

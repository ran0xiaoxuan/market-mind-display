import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Turnstile } from "@/components/Turnstile";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const {
    resetPassword,
    user,
    verifyTurnstile
  } = useAuth();
  const {
    toast
  } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    if (!turnstileToken) {
      toast({
        title: "Verification required",
        description: "Please complete the security verification.",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      // Verify turnstile token
      const isValidCaptcha = await verifyTurnstile(turnstileToken);
      if (!isValidCaptcha) {
        toast({
          title: "Verification failed",
          description: "Security verification failed. Please try again.",
          variant: "destructive"
        });
        setTurnstileToken(null);
        return;
      }
      const {
        error
      } = await resetPassword(email);
      if (error) {
        let errorMessage = "Failed to send reset link. Please try again.";
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
          description: "The reset link has been sent successfully."
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

  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token);
  };

  const handleTurnstileError = () => {
    setTurnstileToken(null);
    toast({
      title: "Verification error",
      description: "Security verification failed. Please try again.",
      variant: "destructive"
    });
  };

  const handleTurnstileExpire = () => {
    setTurnstileToken(null);
  };

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <AuthLayout>
      <Card className="border shadow-sm">
        <CardHeader className="pb-0">
          <h1 className="text-xl font-semibold">Forgot password</h1>
          
        </CardHeader>
        <CardContent className="pt-6">
          {submitted ? <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium">Reset link sent!</h3>
              <p className="text-sm text-muted-foreground">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                If you don't see it, check your spam folder.
              </p>
              <Button variant="outline" onClick={() => {
            setSubmitted(false);
            setTurnstileToken(null);
          }} className="mt-4">
                Try again
              </Button>
            </div> : <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isSubmitting} placeholder="Enter your email address" />
              </div>

              <Turnstile onVerify={handleTurnstileVerify} onError={handleTurnstileError} onExpire={handleTurnstileExpire} className="flex justify-center" />
              
              <Button type="submit" className="w-full" disabled={isSubmitting || !turnstileToken}>
                {isSubmitting ? <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </> : "Send reset link"}
              </Button>
              
              <div className="text-center text-sm">
                Remember your password?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Log in
                </Link>
              </div>
            </form>}
        </CardContent>
      </Card>
    </AuthLayout>;
}

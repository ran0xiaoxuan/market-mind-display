import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Turnstile } from "@/components/Turnstile";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<{type: 'error' | 'success', message: string} | null>(null);
  
  const {
    resetPassword,
    user,
    verifyTurnstile
  } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setNotification({
        type: 'error',
        message: 'Please enter your email address'
      });
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setNotification({
        type: 'error',
        message: 'Please enter a valid email address'
      });
      return;
    }
    if (!turnstileToken) {
      setNotification({
        type: 'error',
        message: 'Please complete the security verification.'
      });
      return;
    }
    
    setIsSubmitting(true);
    setNotification(null);
    
    try {
      // Verify turnstile token
      const isValidCaptcha = await verifyTurnstile(turnstileToken);
      if (!isValidCaptcha) {
        setNotification({
          type: 'error',
          message: 'Security verification failed. Please try again.'
        });
        setTurnstileToken(null);
        return;
      }
      
      // Send password reset email directly
      const { error } = await resetPassword(email);
      
      if (error) {
        console.log('Reset password error:', error);
        
        if (error.message?.includes("Email rate limit exceeded")) {
          setNotification({
            type: 'error',
            message: 'Too many reset requests. Please wait a few minutes before trying again.'
          });
        } else if (error.message?.includes("User not found") || error.message?.includes("For security purposes")) {
          setNotification({
            type: 'error',
            message: 'If an account with this email exists, you will receive a password reset link.'
          });
        } else {
          setNotification({
            type: 'error',
            message: error.message || "Failed to send reset link. Please try again."
          });
        }
      } else {
        setSubmitted(true);
        setNotification({
          type: 'success',
          message: 'If an account with this email exists, you will receive a password reset link.'
        });
      }
    } catch (error: any) {
      console.error('Reset password exception:', error);
      setNotification({
        type: 'error',
        message: 'An unexpected error occurred. Please try again.'
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
    setNotification({
      type: 'error',
      message: 'Security verification failed. Please try again.'
    });
  };

  const handleTurnstileExpire = () => {
    setTurnstileToken(null);
  };

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthLayout>
      <Card className="border shadow-sm">
        <CardHeader className="pb-0">
          <h1 className="text-xl font-semibold">Forgot password</h1>
        </CardHeader>
        <CardContent className="pt-6">
          {submitted ? (
            <div className="text-center space-y-4">
              {notification && notification.type === 'success' && (
                <div className="flex items-center p-3 rounded-md text-sm bg-green-50 text-green-800 border border-green-200 mb-4">
                  <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  {notification.message}
                </div>
              )}
              
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
                setNotification(null);
              }} className="mt-4">
                Try again
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {notification && (
                <div className={`flex items-center p-3 rounded-md text-sm ${
                  notification.type === 'error' 
                    ? 'bg-red-50 text-red-800 border border-red-200' 
                    : 'bg-green-50 text-green-800 border border-green-200'
                }`}>
                  {notification.type === 'error' ? (
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  )}
                  {notification.message}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
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
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

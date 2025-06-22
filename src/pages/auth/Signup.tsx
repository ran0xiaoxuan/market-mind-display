
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Turnstile } from "@/components/Turnstile";
import { useAuth } from "@/contexts/AuthContext";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<{type: 'error' | 'success', message: string} | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  
  const {
    signUp,
    signInWithGoogle,
    user,
    verifyTurnstile,
    validatePassword
  } = useAuth();

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const validation = validatePassword(value);
    setPasswordErrors(validation.errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
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
    if (!password) {
      setNotification({
        type: 'error',
        message: 'Please enter a password'
      });
      return;
    }
    
    // Enhanced password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setNotification({
        type: 'error',
        message: passwordValidation.errors[0] // Show first error
      });
      return;
    }
    
    if (!confirmPassword) {
      setNotification({
        type: 'error',
        message: 'Please confirm your password'
      });
      return;
    }
    if (password !== confirmPassword) {
      setNotification({
        type: 'error',
        message: 'Please ensure both passwords are identical'
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
      
      const { error } = await signUp(email, password, {
        full_name: email.split("@")[0],
        username: email.split("@")[0]
      });
      
      if (error) {
        console.log('Signup error:', error);
        
        // Handle specific error cases
        if (error.message?.includes("User already registered") || 
            error.message?.includes("already registered") ||
            error.message?.includes("already exists") ||
            error.message?.includes("duplicate")) {
          setNotification({
            type: 'error',
            message: 'An account with this email already exists. Please try logging in instead.'
          });
        } else if (error.message?.includes("Password should be at least")) {
          setNotification({
            type: 'error',
            message: 'Password must be at least 8 characters long.'
          });
        } else if (error.message?.includes("Invalid email")) {
          setNotification({
            type: 'error',
            message: 'Please enter a valid email address.'
          });
        } else if (error.message?.includes("Signup is disabled")) {
          setNotification({
            type: 'error',
            message: 'Account registration is currently disabled. Please contact support.'
          });
        } else if (error.message?.includes("Email rate limit exceeded")) {
          setNotification({
            type: 'error',
            message: 'Too many signup attempts. Please wait a few minutes before trying again.'
          });
        } else {
          // Show the actual error message for other cases
          setNotification({
            type: 'error',
            message: error.message || 'An error occurred during signup. Please try again.'
          });
        }
      } else {
        setNotification({
          type: 'success',
          message: 'Account created successfully! Please check your email to verify your account.'
        });
      }
    } catch (error: any) {
      console.error('Signup exception:', error);
      setNotification({
        type: 'error',
        message: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setNotification(null);
    
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setNotification({
          type: 'error',
          message: 'There was an issue logging in with Google. Please try again.'
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'An unexpected error occurred with Google Log in.'
      });
    } finally {
      setIsGoogleLoading(false);
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
          <h1 className="text-xl font-semibold">Create an account</h1>
        </CardHeader>
        <CardContent className="pt-6">
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
            
            <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isSubmitting}>
              {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>}
              Continue with Google
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email *
                </label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isSubmitting} placeholder="Enter your email address" />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password *
                </label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => handlePasswordChange(e.target.value)} required disabled={isSubmitting} placeholder="Create a password" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)} disabled={isSubmitting}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground">Password requirements:</p>
                  <ul className="space-y-1">
                    <li className={`flex items-center ${password.length >= 8 ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="mr-1">{password.length >= 8 ? '✓' : '✗'}</span>
                      At least 8 characters
                    </li>
                    <li className={`flex items-center ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="mr-1">{/[A-Z]/.test(password) ? '✓' : '✗'}</span>
                      One uppercase letter
                    </li>
                    <li className={`flex items-center ${/[a-z]/.test(password) ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="mr-1">{/[a-z]/.test(password) ? '✓' : '✗'}</span>
                      One lowercase letter
                    </li>
                    <li className={`flex items-center ${/\d/.test(password) ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="mr-1">{/\d/.test(password) ? '✓' : '✗'}</span>
                      One number
                    </li>
                    <li className={`flex items-center ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password) ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="mr-1">{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password) ? '✓' : '✗'}</span>
                      One special character
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required disabled={isSubmitting} placeholder="Confirm your password" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={isSubmitting}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Turnstile onVerify={handleTurnstileVerify} onError={handleTurnstileError} onExpire={handleTurnstileExpire} className="flex justify-center" />
              
              <Button type="submit" className="w-full" disabled={isSubmitting || !turnstileToken || passwordErrors.length > 0}>
                {isSubmitting ? <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </> : "Create account"}
              </Button>
              
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Log in
                </Link>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

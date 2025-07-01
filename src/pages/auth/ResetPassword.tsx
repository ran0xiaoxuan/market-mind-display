
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface TokenParams {
  access_token?: string;
  refresh_token?: string;
  type?: string;
  token_hash?: string;
  error?: string;
  error_code?: string;
  error_description?: string;
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { validatePassword } = useAuth();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to extract tokens from URL parameters (query params and hash)
  const extractTokenParams = (): TokenParams => {
    const params: TokenParams = {};
    
    // Extract from query parameters
    const urlParams = new URLSearchParams(window.location.search);
    params.access_token = urlParams.get('access_token') || undefined;
    params.refresh_token = urlParams.get('refresh_token') || undefined;
    params.type = urlParams.get('type') || undefined;
    params.token_hash = urlParams.get('token_hash') || undefined;
    params.error = urlParams.get('error') || undefined;
    params.error_code = urlParams.get('error_code') || undefined;
    params.error_description = urlParams.get('error_description') || undefined;

    // Also check hash fragment (Supabase sometimes uses hash-based tokens)
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      params.access_token = params.access_token || hashParams.get('access_token') || undefined;
      params.refresh_token = params.refresh_token || hashParams.get('refresh_token') || undefined;
      params.type = params.type || hashParams.get('type') || undefined;
      params.token_hash = params.token_hash || hashParams.get('token_hash') || undefined;
      params.error = params.error || hashParams.get('error') || undefined;
      params.error_code = params.error_code || hashParams.get('error_code') || undefined;
      params.error_description = params.error_description || hashParams.get('error_description') || undefined;
    }

    return params;
  };

  useEffect(() => {
    const validateResetToken = async () => {
      console.log('Starting password reset validation...');
      console.log('Current URL:', window.location.href);
      console.log('Search params:', window.location.search);
      console.log('Hash:', window.location.hash);

      const tokenParams = extractTokenParams();
      console.log('Extracted token params:', tokenParams);

      // Check for error parameters first
      if (tokenParams.error) {
        console.error('URL contains error:', tokenParams.error, tokenParams.error_description);
        setError(`Reset link error: ${tokenParams.error_description || tokenParams.error}`);
        setIsValidating(false);
        return;
      }

      // Method 1: Try with access_token and refresh_token
      if (tokenParams.access_token && tokenParams.refresh_token && tokenParams.type === 'recovery') {
        console.log('Attempting Method 1: Using access_token and refresh_token');
        try {
          const { error } = await supabase.auth.setSession({
            access_token: tokenParams.access_token,
            refresh_token: tokenParams.refresh_token
          });

          if (error) {
            console.error('Method 1 failed:', error);
            // Try Method 2
            await tryTokenHashMethod(tokenParams);
          } else {
            console.log('Method 1 successful: Session set with tokens');
            setIsValidToken(true);
          }
        } catch (err) {
          console.error('Method 1 exception:', err);
          await tryTokenHashMethod(tokenParams);
        }
      }
      // Method 2: Try with token_hash (newer Supabase approach)
      else if (tokenParams.token_hash) {
        await tryTokenHashMethod(tokenParams);
      }
      // Method 3: Try to handle the session through Supabase's built-in handling
      else {
        console.log('Method 3: No direct tokens found, checking current session');
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Method 3 failed:', error);
            setError("Invalid or expired reset link. Please request a new password reset.");
          } else if (session) {
            console.log('Method 3 successful: Found existing session');
            setIsValidToken(true);
          } else {
            console.log('Method 3: No session found');
            setError("Invalid or expired reset link. Please request a new password reset.");
          }
        } catch (err) {
          console.error('Method 3 exception:', err);
          setError("An unexpected error occurred. Please try again.");
        }
      }

      setIsValidating(false);
    };

    const tryTokenHashMethod = async (tokenParams: TokenParams) => {
      console.log('Attempting Method 2: Using token_hash or verifyOtp');
      
      if (tokenParams.token_hash) {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenParams.token_hash,
            type: 'recovery'
          });

          if (error) {
            console.error('Method 2 failed:', error);
            setError("Invalid or expired reset link. Please request a new password reset.");
          } else {
            console.log('Method 2 successful: Token hash verified');
            setIsValidToken(true);
          }
        } catch (err) {
          console.error('Method 2 exception:', err);
          setError("An unexpected error occurred. Please try again.");
        }
      } else {
        setError("Invalid reset link format. Please request a new password reset.");
      }
    };

    validateResetToken();
  }, [searchParams]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors.join(', '));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Updating password...');
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password update error:', error);
        setError(error.message || "Failed to update password. Please try again.");
      } else {
        console.log('Password updated successfully');
        setIsSuccess(true);
        toast.success("Password updated successfully! You can now sign in with your new password.");
        
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryValidation = () => {
    setIsValidating(true);
    setError(null);
    window.location.reload();
  };

  if (isValidating) {
    return (
      <AuthLayout>
        <Card className="border shadow-sm">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              <h2 className="text-lg font-medium">Validating reset link...</h2>
              <p className="text-sm text-muted-foreground">
                Please wait while we verify your password reset request.
              </p>
            </div>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  if (!isValidToken) {
    return (
      <AuthLayout>
        <Card className="border shadow-sm">
          <CardHeader className="pb-0">
            <h1 className="text-xl font-semibold text-center">Reset Link Invalid</h1>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium">Link Expired or Invalid</h3>
              <p className="text-sm text-muted-foreground">
                {error || "The password reset link has expired or is invalid."}
              </p>
              <p className="text-sm text-muted-foreground">
                This can happen if the link was already used, expired, or if there's a configuration issue.
              </p>
              <div className="space-y-2 pt-4">
                <Button onClick={handleRetryValidation} variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button asChild className="w-full">
                  <a href="/forgot-password">Request New Reset Link</a>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <a href="/login">Back to Login</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  if (isSuccess) {
    return (
      <AuthLayout>
        <Card className="border shadow-sm">
          <CardHeader className="pb-0">
            <h1 className="text-xl font-semibold text-center">Password Updated!</h1>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium">Password Reset Successful</h3>
              <p className="text-sm text-muted-foreground">
                Your password has been successfully updated. You will be redirected to the login page shortly.
              </p>
              <div className="pt-4">
                <Button onClick={() => navigate('/login')} className="w-full">
                  Continue to Login
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
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Password must contain:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
                <li>One special character</li>
              </ul>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating Password...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

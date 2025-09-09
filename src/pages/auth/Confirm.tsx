
import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Confirm() {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    const tokenHash = searchParams.get('token_hash');

    console.log('Email confirmation params:', { token: !!token, type, tokenHash: !!tokenHash });

    // Handle both old format (token) and new format (token_hash)
    const confirmationToken = tokenHash || token;

    if (!confirmationToken || !type) {
      console.error('Missing confirmation parameters:', { token: !!confirmationToken, type });
      setError("Invalid confirmation link. Missing required parameters.");
      setIsLoading(false);
      return;
    }

    const confirmEmail = async () => {
      try {
        console.log('Attempting email confirmation with type:', type);
        
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: confirmationToken,
          type: type as any
        });

        console.log('Email confirmation result:', { data: !!data, error: error?.message });

        if (error) {
          console.error('Email confirmation error:', error);
          
          // Provide more specific error messages
          if (error.message.includes('expired')) {
            setError("This confirmation link has expired. Please request a new confirmation email.");
          } else if (error.message.includes('invalid')) {
            setError("This confirmation link is invalid or has already been used.");
          } else {
            setError(error.message || "Failed to confirm email");
          }
        } else {
          console.log('Email confirmed successfully');
          setIsConfirmed(true);
          toast.success("Email confirmed successfully!");
        }
      } catch (err: any) {
        console.error('Email confirmation exception:', err);
        setError("An unexpected error occurred during email confirmation.");
      } finally {
        setIsLoading(false);
      }
    };

    confirmEmail();
  }, [searchParams]);

  if (isLoading) {
    return (
      <AuthLayout>
        <Card className="border shadow-sm">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              <h2 className="text-lg font-medium">Confirming your email...</h2>
              <p className="text-sm text-muted-foreground">
                Please wait while we verify your email address.
              </p>
            </div>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  if (isConfirmed) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AuthLayout>
      <Card className="border shadow-sm">
        <CardHeader className="pb-0">
          <h1 className="text-xl font-semibold text-center">Email Confirmation</h1>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium">Confirmation Failed</h3>
            <p className="text-sm text-muted-foreground">
              {error || "We couldn't confirm your email address."}
            </p>
            <p className="text-sm text-muted-foreground">
              The link may have expired or already been used. Please try requesting a new confirmation email.
            </p>
            <div className="space-y-2 pt-4">
              <Button asChild className="w-full">
                <a href="/login">Go to Login</a>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <a href="/signup">Create New Account</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

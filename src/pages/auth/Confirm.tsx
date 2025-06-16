
import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Confirm() {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (!token || !type) {
      setError("Invalid confirmation link");
      setIsLoading(false);
      return;
    }

    const confirmEmail = async () => {
      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as any
        });

        if (error) {
          console.error('Email confirmation error:', error);
          setError(error.message || "Failed to confirm email");
        } else {
          setIsConfirmed(true);
          toast({
            title: "Email confirmed",
            description: "Your email has been successfully confirmed."
          });
        }
      } catch (err: any) {
        console.error('Email confirmation error:', err);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    confirmEmail();
  }, [searchParams, toast]);

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
    return <Navigate to="/auth/confirmed" replace />;
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

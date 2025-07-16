
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TimezoneSettings } from "./TimezoneSettings";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import { Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function AccountSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { user } = useAuth();

  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast.error("No email address found for your account");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

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

  const handleSendAnother = () => {
    setIsEmailSent(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          {isEmailSent ? (
            <div className="text-center space-y-4">
              <div className="text-green-600 mb-4">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h3 className="text-lg font-medium">Reset Link Sent</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                We've sent a password reset link to <strong>{user?.email}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Please check your email and click the reset link to create a new password.
              </p>
              <Button onClick={handleSendAnother} variant="outline" className="w-full">
                Send Another Email
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Click the button below to send a password reset link to your email address: <strong>{user?.email}</strong>
              </p>

              <Button 
                onClick={handlePasswordReset}
                className="w-full" 
                disabled={isLoading || !user?.email}
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
            </div>
          )}
        </CardContent>
      </Card>

      <TimezoneSettings />

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Delete Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Warning:</strong> This action cannot be undone. Deleting your account will permanently remove:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>All your trading strategies</li>
                <li>Profile information</li>
                <li>Account settings and preferences</li>
                <li>Notification settings</li>
              </ul>
              <p className="pt-2">
                Please make sure you have backed up any important data before proceeding.
              </p>
            </div>

            <Button 
              onClick={() => setShowDeleteDialog(true)}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete My Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteAccountDialog 
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </div>
  );
}

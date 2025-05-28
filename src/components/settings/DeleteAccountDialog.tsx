
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { user, signOut } = useAuth();

  const handleDeleteAccount = async () => {
    if (confirmationText !== "DELETE") {
      toast({
        title: "Confirmation required",
        description: "Please type 'DELETE' to confirm account deletion.",
        variant: "destructive"
      });
      return;
    }

    setIsDeleting(true);
    
    try {
      // Delete user data from our tables first
      if (user) {
        // Delete strategies and related data
        const { error: strategiesError } = await supabase
          .from('strategies')
          .delete()
          .eq('user_id', user.id);

        if (strategiesError) {
          console.error('Error deleting strategies:', strategiesError);
        }

        // Delete backtests
        const { error: backtestsError } = await supabase
          .from('backtests')
          .delete()
          .eq('user_id', user.id);

        if (backtestsError) {
          console.error('Error deleting backtests:', backtestsError);
        }

        // Delete strategy applications
        const { error: applicationsError } = await supabase
          .from('strategy_applications')
          .delete()
          .eq('user_id', user.id);

        if (applicationsError) {
          console.error('Error deleting strategy applications:', applicationsError);
        }

        // Delete profile
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);

        if (profileError) {
          console.error('Error deleting profile:', profileError);
        }
      }

      // Delete the auth user (this will cascade to related auth data)
      const { error: authError } = await supabase.auth.admin.deleteUser(user?.id || '');
      
      if (authError) {
        console.error('Error deleting auth user:', authError);
        toast({
          title: "Delete failed",
          description: "Failed to delete your account. Please try again or contact support.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted."
      });

      // Sign out and redirect
      await signOut();
      
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Delete failed",
        description: "An unexpected error occurred. Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Account</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              This action cannot be undone. This will permanently delete your account
              and remove all your data from our servers, including:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>All your trading strategies</li>
              <li>Backtest history and results</li>
              <li>Profile information</li>
              <li>Account settings</li>
            </ul>
            <div className="pt-2">
              <Label htmlFor="confirmation">
                Type <strong>DELETE</strong> to confirm:
              </Label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Type DELETE here"
                className="mt-1"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmationText("")}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={confirmationText !== "DELETE" || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete Account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

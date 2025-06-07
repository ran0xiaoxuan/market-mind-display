
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

    if (!user) {
      toast({
        title: "Authentication error",
        description: "No user session found. Please log in again.",
        variant: "destructive"
      });
      return;
    }

    setIsDeleting(true);
    
    try {
      console.log('Starting account deletion for user:', user.id);
      
      // Get the current session to send the JWT token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No active session found');
      }

      console.log('Calling delete-user-account function...');

      // Call the Edge Function to delete the user account
      const { data, error } = await supabase.functions.invoke('delete-user-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Error calling delete-user-account function:', error);
        
        // Handle different types of errors
        if (error.message?.includes('Failed to fetch')) {
          throw new Error('Network error. Please check your connection and try again.');
        } else if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
          throw new Error('Authentication failed. Please log in again.');
        } else {
          throw new Error(error.message || 'Failed to delete account');
        }
      }

      // Check if the response indicates an error
      if (data?.error) {
        throw new Error(data.error);
      }

      console.log('Account deletion response:', data);

      toast({
        title: "Account deleted successfully",
        description: "Your account and all data have been permanently deleted."
      });

      // Close the dialog first
      onOpenChange(false);
      
      // Clear the confirmation text
      setConfirmationText("");
      
      // Add a small delay before signing out to ensure the toast is shown
      setTimeout(async () => {
        await signOut();
      }, 1000);
      
    } catch (error: any) {
      console.error('Error deleting account:', error);
      
      let errorMessage = "An unexpected error occurred. Please try again or contact support.";
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Delete failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
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
              and all your data from our servers, including:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>All your trading strategies</li>
              <li>Backtest history and results</li>
              <li>Profile information</li>
              <li>Account settings</li>
              <li>Notification preferences</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Note: You will be automatically signed out after deletion.
            </p>
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
                disabled={isDeleting}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={() => setConfirmationText("")}
            disabled={isDeleting}
          >
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

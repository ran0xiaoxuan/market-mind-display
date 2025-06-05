
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";
import { Upload, Undo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { Switch } from "@/components/ui/switch";
import { DeleteAccountDialog } from "./DeleteAccountDialog";

// Max file size: 1MB
const MAX_FILE_SIZE = 1024 * 1024; // 1MB in bytes

export function AccountSettings() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || DEFAULT_AVATAR_URL);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isPro, setIsPro] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Extract initials for avatar fallback
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || "User";
  const initialsForAvatar = username.charAt(0).toUpperCase();

  // Load user profile and subscription status
  useEffect(() => {
    const loadUserProfile = async () => {
      console.log('Loading user profile...', { userId: user?.id, userEmail: user?.email });
      
      if (!user) {
        console.log('No user found, setting loading to false');
        setIsLoadingProfile(false);
        return;
      }

      try {
        // Check if profile exists, if not create one
        console.log('Fetching profile for user:', user.id);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', user.id)
          .single();

        console.log('Profile fetch result:', { profile, error });

        if (error && error.code === 'PGRST116') {
          // Profile doesn't exist, create one
          console.log('Profile does not exist, creating new profile');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              subscription_tier: 'free'
            });

          if (insertError) {
            console.error('Error creating profile:', insertError);
          } else {
            console.log('Profile created successfully');
          }
          setIsPro(false);
        } else if (error) {
          console.error('Error fetching profile:', error);
          setIsPro(false);
        } else {
          const isProUser = profile?.subscription_tier === 'pro';
          console.log('Profile loaded successfully:', { subscription_tier: profile?.subscription_tier, isProUser });
          setIsPro(isProUser);
          
          // If user is Pro, ensure the status is properly updated in the database
          if (isProUser) {
            await syncProStatusToDatabase();
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        setIsPro(false);
      } finally {
        console.log('Setting loading to false');
        setIsLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, [user]);

  // Sync Pro status to database when user is in Pro mode
  const syncProStatusToDatabase = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_tier: 'pro',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error syncing Pro status to database:', error);
      } else {
        console.log('Pro status synced to database successfully');
      }
    } catch (error) {
      console.error('Error syncing Pro status:', error);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setUploadError(""); // Clear any previous errors

    if (file) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`File size exceeds the 1MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
        toast({
          title: "File too large",
          description: "Maximum file size is 1MB. Please select a smaller image.",
          variant: "destructive"
        });
        return;
      }

      // Create a temporary URL for preview
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);

      // Automatically upload the file when selected
      await uploadAvatar(file);
    }
  };

  const uploadAvatar = async (file: File) => {
    setIsUpdating(true);
    try {
      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `avatars/${user?.id}/${fileName}`;

      // Upload the file to Supabase Storage
      const {
        error: uploadError,
        data
      } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      // Get the public URL
      const {
        data: urlData
      } = supabase.storage.from('avatars').getPublicUrl(filePath);
      if (!urlData.publicUrl) throw new Error("Failed to get public URL");
      console.log("Avatar uploaded successfully:", urlData.publicUrl);

      // Update user metadata with the new avatar URL
      const {
        error: updateError
      } = await supabase.auth.updateUser({
        data: {
          avatar_url: urlData.publicUrl
        }
      });
      if (updateError) throw updateError;
      setAvatarUrl(urlData.publicUrl);
      toast({
        title: "Avatar uploaded",
        description: "Your avatar has been updated successfully."
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      setUploadError(error.message || "Failed to upload your avatar");
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload your avatar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetAvatar = async () => {
    setIsUpdating(true);
    try {
      setAvatarUrl(DEFAULT_AVATAR_URL);
      const {
        error
      } = await supabase.auth.updateUser({
        data: {
          avatar_url: DEFAULT_AVATAR_URL
        }
      });
      if (error) throw error;
      toast({
        title: "Avatar reset",
        description: "Your avatar has been reset to the default image."
      });
    } catch (error) {
      console.error("Error resetting avatar:", error);
      toast({
        title: "Reset failed",
        description: "Failed to reset your avatar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    // Validate email format
    if (!validateEmail(email)) {
      toast({
        title: "Invalid email format",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUpdating(true);
    try {
      // Check if email has changed
      const emailChanged = email !== user.email;
      
      // Update email if changed
      if (emailChanged) {
        console.log('Updating email from', user.email, 'to', email);
        
        const { error: emailError } = await supabase.auth.updateUser({
          email: email
        });
        
        if (emailError) {
          console.error('Email update error:', emailError);
          
          // Provide user-friendly error messages
          if (emailError.message.includes('email rate limit exceeded')) {
            throw new Error('Too many email change requests. Please wait a few minutes before trying again.');
          } else if (emailError.message.includes('email already exists')) {
            throw new Error('This email address is already registered to another account.');
          } else {
            throw emailError;
          }
        }
        
        toast({
          title: "Email update initiated",
          description: "Please check both your old and new email addresses for confirmation links to complete the email change."
        });
      } else {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully."
        });
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleUpdatePassword = async () => {
    if (!user) return;
    
    // Validate inputs
    if (!currentPassword) {
      toast({
        title: "Current password required",
        description: "Please enter your current password to change it.",
        variant: "destructive"
      });
      return;
    }
    
    if (!newPassword) {
      toast({
        title: "New password required",
        description: "Please enter a new password.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      toast({
        title: "Password requirements not met",
        description: passwordValidation.errors.join('. '),
        variant: "destructive"
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirm password must match.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword === currentPassword) {
      toast({
        title: "Same password",
        description: "New password must be different from current password.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUpdating(true);
    try {
      // First verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword
      });
      
      if (signInError) {
        throw new Error("Current password is incorrect");
      }
      
      // If current password is correct, update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) {
        if (updateError.message.includes('password should be at least')) {
          throw new Error('Password must meet minimum security requirements');
        }
        throw updateError;
      }
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully."
      });

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update your password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleSubscriptionStatus = async () => {
    setIsUpdating(true);
    try {
      const newTier = isPro ? 'free' : 'pro';
      
      // Update the profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_tier: newTier,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);
      
      if (error) throw error;
      
      setIsPro(!isPro);
      
      // If switching to Pro, sync the status to ensure it's properly recorded
      if (newTier === 'pro') {
        await syncProStatusToDatabase();
      }
      
      toast({
        title: `Subscription status updated`,
        description: `You are now on the ${newTier} plan.`
      });

      // Force a small delay to ensure the real-time update propagates
      setTimeout(() => {
        console.log('Subscription status change broadcasted via real-time');
        // Refresh the page after the status change
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error("Error updating subscription status:", error);
      toast({
        title: "Update failed",
        description: "Failed to update subscription status.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="space-y-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Subscription Plan */}
      <div>
        <h2 className="text-xl font-medium">Subscription Plan</h2>
        <p className="text-sm text-muted-foreground mb-4">Your current plan and subscription details</p>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={isPro ? "pro" : "free"} 
                  className={isPro ? "text-xs px-3 py-1" : "text-xs px-2 py-0.5"}
                >
                  {isPro ? 'Pro' : 'Free'}
                </Badge>
              </div>
              {!isPro && (
                <Button variant="default" className="bg-amber-500 hover:bg-amber-600">Upgrade to Pro</Button>
              )}
            </div>
            
            {/* Show Pro Plan Feature card only for Free users */}
            {!isPro && (
              <div className="mt-4 p-4 bg-amber-50 rounded-md border border-amber-100 shadow-sm">
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-amber-800 text-sm font-medium mb-2">Pro Plan Feature:</p>
                    <p className="text-amber-700 text-sm">Get real-time trading signals delivered directly to your preferred platforms.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">Email Notifications</Badge>
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">Discord Alerts</Badge>
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">Telegram Signals</Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Developer testing toggle - only visible in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm">Developer Mode</h3>
                    <p className="text-xs text-muted-foreground">Toggle between Free and Pro for testing</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{isPro ? 'Pro' : 'Free'}</span>
                    <Switch 
                      checked={isPro} 
                      onCheckedChange={toggleSubscriptionStatus}
                      disabled={isUpdating}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Profile */}
      <div>
        <h2 className="text-xl font-medium">Profile</h2>
        <p className="text-sm text-muted-foreground mb-4">Update your personal information</p>
        
        <div className="grid gap-4">
          <div>
            <label htmlFor="email" className="block text-sm mb-2">Email</label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email address"
              disabled={isUpdating}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Changing your email will require confirmation from both old and new email addresses
            </p>
          </div>
          
          <div>
            <Button 
              variant="default" 
              className="bg-black text-white mt-2" 
              onClick={handleSaveProfile} 
              disabled={isUpdating || !email || email === user?.email || !validateEmail(email)}
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-medium">Change Password</h2>
        <p className="text-sm text-muted-foreground mb-4">Update your account password</p>
        
        <div className="grid gap-4">
          <div>
            <label htmlFor="current-password" className="block text-sm mb-2">Current Password</label>
            <Input 
              id="current-password" 
              type="password" 
              value={currentPassword} 
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              disabled={isUpdating}
            />
          </div>
          
          <div>
            <label htmlFor="new-password" className="block text-sm mb-2">New Password</label>
            <Input 
              id="new-password" 
              type="password" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter your new password"
              disabled={isUpdating}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Must be at least 8 characters with uppercase, lowercase, and number
            </p>
          </div>
          
          <div>
            <label htmlFor="confirm-password" className="block text-sm mb-2">Confirm New Password</label>
            <Input 
              id="confirm-password" 
              type="password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              disabled={isUpdating}
            />
          </div>
          
          <div>
            <Button 
              variant="default" 
              className="bg-black text-white mt-2" 
              onClick={handleUpdatePassword} 
              disabled={isUpdating || !currentPassword || !newPassword || !confirmPassword}
            >
              {isUpdating ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-medium text-destructive">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mb-4">Irreversible account actions</p>
        
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">Delete Account</div>
                <div className="text-sm text-muted-foreground">Permanently delete your account and all your data</div>
              </div>
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
                disabled={isUpdating}
              >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <DeleteAccountDialog 
        open={showDeleteDialog} 
        onOpenChange={setShowDeleteDialog} 
      />
    </div>
  );
}

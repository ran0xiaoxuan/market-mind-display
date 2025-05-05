
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";
import { Upload, Undo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function AccountSettings() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.user_metadata?.username || user?.email?.split('@')[0] || "");
  const [email, setEmail] = useState(user?.email || "");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || DEFAULT_AVATAR_URL);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Extract initials for avatar fallback
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || "User";
  const initialsForAvatar = username.charAt(0).toUpperCase();

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  const handleResetAvatar = async () => {
    setIsUpdating(true);
    try {
      setAvatarUrl(DEFAULT_AVATAR_URL);
      
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: DEFAULT_AVATAR_URL }
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

  const handleUpdateAvatar = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl }
      });
      
      if (error) throw error;
      
      toast({
        title: "Avatar updated",
        description: "Your avatar has been updated successfully."
      });
    } catch (error) {
      console.error("Error updating avatar:", error);
      toast({
        title: "Update failed",
        description: "Failed to update your avatar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { username: name }
      });
      
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirm password must match.",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (error) throw error;
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully."
      });
      
      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      toast({
        title: "Update failed",
        description: "Failed to update your password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return <div className="space-y-12">
      {/* Subscription Plan */}
      <div>
        <h2 className="text-xl font-medium">Subscription Plan</h2>
        <p className="text-sm text-muted-foreground mb-4">Your current plan and subscription details</p>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs px-2 py-0.5">Free</Badge>
              </div>
              <Button variant="default" className="bg-amber-500 hover:bg-amber-600">Upgrade to Pro</Button>
            </div>
            
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
          </CardContent>
        </Card>
      </div>
      
      {/* Profile */}
      <div>
        <h2 className="text-xl font-medium">Profile</h2>
        <p className="text-sm text-muted-foreground mb-4">Update your personal information</p>
        
        <div className="grid gap-4">
          <div>
            <label htmlFor="name" className="block text-sm mb-2">Name</label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm mb-2">Email</label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} disabled />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
          </div>
          
          <div>
            <Button 
              variant="default" 
              className="bg-black text-white mt-2"
              onClick={handleSaveProfile}
              disabled={isUpdating}
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Profile Picture */}
      <div>
        <h2 className="text-xl font-medium">Profile Picture</h2>
        <p className="text-sm text-muted-foreground mb-4">Update your profile picture</p>
        
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarUrl} alt={username} />
            <AvatarFallback className="bg-primary text-primary-foreground">{initialsForAvatar}</AvatarFallback>
          </Avatar>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="avatar-upload" className="cursor-pointer">
                <Button variant="outline" className="gap-2" asChild>
                  <span>
                    <Upload className="h-4 w-4" />
                    Choose File
                  </span>
                </Button>
              </label>
              <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <p className="text-xs text-muted-foreground">
                Recommended size: 200 x 200 pixels. Max file size: 1MB.
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="default"
                onClick={handleUpdateAvatar}
                disabled={isUpdating}
              >
                {isUpdating ? "Updating..." : "Update Avatar"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleResetAvatar}
                disabled={isUpdating}
                className="gap-2"
              >
                <Undo className="h-4 w-4" />
                Reset to Default
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Password */}
      <div>
        <h2 className="text-xl font-medium">Password</h2>
        <p className="text-sm text-muted-foreground mb-4">Change your password</p>
        
        <div className="grid gap-4">
          <div>
            <label htmlFor="current-password" className="block text-sm mb-2">Current Password</label>
            <Input id="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          </div>
          
          <div>
            <label htmlFor="new-password" className="block text-sm mb-2">New Password</label>
            <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          
          <div>
            <label htmlFor="confirm-password" className="block text-sm mb-2">Confirm New Password</label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
          
          <div>
            <Button 
              variant="default" 
              className="bg-black text-white mt-2"
              onClick={handleUpdatePassword}
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Danger Zone */}
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
              <Button variant="destructive">Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}


import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";
import { Upload, Lock, Link2Off } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AccountSettings() {
  const [name, setName] = useState("ranxiaoxuan");
  const [email, setEmail] = useState("ran0xiaoxuan@gmail.com");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR_URL);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
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
            
            <div className="mt-4 p-4 bg-amber-50 rounded-md border border-amber-100">
              <p className="text-amber-800 text-sm font-medium">Pro Plan feature:</p>
              <div className="mt-2 text-amber-700 text-sm flex gap-2 items-center">
                Live trading via API connection.
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
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          
          
          
          <div>
            <Button variant="outline" className="mt-2">Save Changes</Button>
          </div>
        </div>
      </div>
      
      {/* Profile Picture */}
      <div>
        <h2 className="text-xl font-medium">Profile Picture</h2>
        <p className="text-sm text-muted-foreground mb-4">Update your profile picture</p>
        
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarUrl} alt="Profile" />
            <AvatarFallback className="bg-red-500 text-white text-lg">RA</AvatarFallback>
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
            <Button variant="default">Update Avatar</Button>
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
            <Button variant="outline" className="mt-2">Update Password</Button>
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


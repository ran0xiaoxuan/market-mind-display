
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { HelpCircle } from "lucide-react";
import { toast } from "sonner";

export function AccountSettings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [newsLetters, setNewsLetters] = useState(true);

  const handleSave = () => {
    toast.success("Account settings saved successfully");
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-2">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Full Name</label>
            <Input id="name" defaultValue="John Smith" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <Input id="email" defaultValue="john@example.com" type="email" />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1">Username</label>
            <Input id="username" defaultValue="johnsmith" />
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-2">Subscription</h2>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="font-medium">Advanced Plan</p>
            <p className="text-sm text-muted-foreground">Get trading signals delivered to your email, Discord, and Telegram in real time.</p>
          </div>
          <Badge>Active</Badge>
        </div>
        <Button>Manage Subscription</Button>
      </div>

      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-2">Security</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Two-factor Authentication</p>
              <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
            </div>
            <Switch 
              checked={twoFactorEnabled}
              onCheckedChange={setTwoFactorEnabled}
            />
          </div>
          
          <div>
            <Button variant="outline">Change Password</Button>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-2">Email Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">News and Updates</p>
              <p className="text-sm text-muted-foreground">Receive news about product updates and feature releases</p>
            </div>
            <Switch 
              checked={newsLetters}
              onCheckedChange={setNewsLetters}
            />
          </div>
        </div>
      </div>

      <Button onClick={handleSave}>Save Changes</Button>
    </div>
  );
}

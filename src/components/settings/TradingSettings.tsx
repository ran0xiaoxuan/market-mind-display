
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { setOpenAIApiKey } from "@/services/moonshotService";

export function TradingSettings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [isUpdatingApiKey, setIsUpdatingApiKey] = useState(false);

  const handleUpdateApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter a valid OpenAI API key",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingApiKey(true);
    try {
      await setOpenAIApiKey(apiKey);
      toast({
        title: "API Key Updated",
        description: "Your OpenAI API key has been successfully updated",
      });
      setApiKey("");
    } catch (error) {
      console.error("Failed to update API key:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update your API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingApiKey(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="notifications" className="font-medium">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications for important trading events
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="email" className="font-medium">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
              disabled={!notificationsEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>OpenAI API Settings</CardTitle>
          <CardDescription>Update your OpenAI API key for AI-powered features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">OpenAI API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your OpenAI API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your API key is used securely for AI-powered features. It is never stored in the browser.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpdateApiKey} disabled={isUpdatingApiKey}>
            {isUpdatingApiKey ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update API Key"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}


import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TradingSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    discordWebhook: "",
    telegramBotToken: "",
    telegramChatId: "",
    emailNotifications: true,
    discordNotifications: false,
    telegramNotifications: false
  });

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your trading settings have been updated successfully."
    });
  };

  const handleVerifyDiscord = () => {
    toast({
      title: "Discord webhook verified",
      description: "Your Discord webhook is working correctly."
    });
  };

  const handleVerifyTelegram = () => {
    toast({
      title: "Telegram bot verified", 
      description: "Your Telegram bot is working correctly."
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Discord Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="discord-webhook">Discord Webhook URL</Label>
            <Input
              id="discord-webhook"
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={settings.discordWebhook}
              onChange={(e) => setSettings(prev => ({ ...prev, discordWebhook: e.target.value }))}
            />
          </div>
          <Button onClick={handleVerifyDiscord} variant="outline">
            Verify Discord Webhook
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Telegram Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="telegram-token">Bot Token</Label>
            <Input
              id="telegram-token"
              type="password"
              placeholder="Your bot token"
              value={settings.telegramBotToken}
              onChange={(e) => setSettings(prev => ({ ...prev, telegramBotToken: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="telegram-chat">Chat ID</Label>
            <Input
              id="telegram-chat"
              placeholder="Your chat ID"
              value={settings.telegramChatId}
              onChange={(e) => setSettings(prev => ({ ...prev, telegramChatId: e.target.value }))}
            />
          </div>
          <Button onClick={handleVerifyTelegram} variant="outline">
            Verify Telegram Bot
          </Button>
        </CardContent>
      </Card>

      <Separator />
      
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default TradingSettings;

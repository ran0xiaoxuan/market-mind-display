import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Bell, Mail, MessageSquare, Send, Lock, Check, LinkIcon, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { getNotificationSettings, saveNotificationSettings, verifyDiscordWebhook, verifyTelegramBot, NotificationSettings } from "@/services/notificationService";
export function TradingSettings() {
  const {
    user
  } = useAuth();
  const isPro = user?.user_metadata?.is_pro === true;
  const [isLoading, setIsLoading] = useState(false);
  const [isDiscordVerified, setIsDiscordVerified] = useState(false);
  const [isTelegramVerified, setIsTelegramVerified] = useState(false);
  const form = useForm<NotificationSettings>({
    defaultValues: {
      email_enabled: false,
      discord_enabled: false,
      telegram_enabled: false,
      discord_webhook_url: "",
      telegram_bot_token: "",
      telegram_chat_id: "",
      entry_signals: true,
      exit_signals: true,
      stop_loss_alerts: true,
      take_profit_alerts: true
    }
  });

  // Load existing settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getNotificationSettings();
        if (settings) {
          form.reset(settings);
          setIsDiscordVerified(!!settings.discord_webhook_url);
          setIsTelegramVerified(!!settings.telegram_bot_token && !!settings.telegram_chat_id);
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    };
    if (isPro) {
      loadSettings();
    }
  }, [isPro, form]);
  const handleSubmit = async (values: NotificationSettings) => {
    if (!isPro) {
      toast.error("This feature is only available for Pro users");
      return;
    }
    setIsLoading(true);
    try {
      await saveNotificationSettings(values);
      toast.success("Notification preferences saved successfully");
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error("Failed to save notification preferences");
    } finally {
      setIsLoading(false);
    }
  };
  const verifyDiscordWebhookHandler = async () => {
    const webhook = form.getValues("discord_webhook_url");
    if (!webhook) {
      toast.error("Please enter a Discord webhook URL");
      return;
    }
    setIsLoading(true);
    try {
      const result = await verifyDiscordWebhook(webhook);
      if (result.verified) {
        setIsDiscordVerified(true);
        toast.success("Discord webhook verified successfully");
      } else {
        toast.error("Discord webhook verification failed");
      }
    } catch (error) {
      console.error('Discord verification error:', error);
      toast.error("Failed to verify Discord webhook");
    } finally {
      setIsLoading(false);
    }
  };
  const verifyTelegramBotHandler = async () => {
    const botToken = form.getValues("telegram_bot_token");
    const chatId = form.getValues("telegram_chat_id");
    if (!botToken || !chatId) {
      toast.error("Please enter both Telegram bot token and chat ID");
      return;
    }
    setIsLoading(true);
    try {
      const result = await verifyTelegramBot(botToken, chatId);
      if (result.verified) {
        setIsTelegramVerified(true);
        toast.success("Telegram bot verified successfully");
      } else {
        toast.error("Telegram bot verification failed");
      }
    } catch (error) {
      console.error('Telegram verification error:', error);
      toast.error("Failed to verify Telegram bot");
    } finally {
      setIsLoading(false);
    }
  };
  const disconnectDiscord = () => {
    form.setValue("discord_webhook_url", "");
    setIsDiscordVerified(false);
    toast.success("Discord webhook disconnected");
  };
  const disconnectTelegram = () => {
    form.setValue("telegram_bot_token", "");
    form.setValue("telegram_chat_id", "");
    setIsTelegramVerified(false);
    toast.success("Telegram bot disconnected");
  };

  // Render content based on Pro status
  const renderNotificationSettings = () => {
    if (!isPro) {
      return <>
          <div className="flex items-center gap-3 mb-4">
            <Lock className="h-5 w-5 text-amber-500" />
            <div>
              <h3 className="font-medium text-amber-800">Pro Feature</h3>
              <p className="text-amber-700 text-sm">
                Upgrade to Pro to receive real-time trading signals on your preferred platforms
              </p>
            </div>
          </div>
          <Button variant="default" className="bg-amber-500 hover:bg-amber-600 mb-6">Upgrade to Pro</Button>
          
          <div className="opacity-60 pointer-events-none">
            <Form {...form}>
              <form className="space-y-8">
                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive trading signals via email</p>
                    </div>
                  </div>
                  <FormField control={form.control} name="email_enabled" render={({
                  field
                }) => <FormItem>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>} />
                </div>
                
                {/* Discord Integration */}
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src="/lovable-uploads/bd9113c5-0c5b-4033-b957-cb8ee9f027a0.png" alt="Discord Logo" className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Discord Notifications</p>
                        <p className="text-sm text-muted-foreground">Send trading signals to a Discord channel</p>
                      </div>
                    </div>
                    <FormField control={form.control} name="discord_enabled" render={({
                    field
                  }) => <FormItem>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>} />
                  </div>
                  
                  {form.watch("discord_enabled") && <FormField control={form.control} name="discord_webhook_url" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Discord Webhook URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://discord.com/api/webhooks/..." {...field} />
                          </FormControl>
                          <FormDescription>
                            Create a webhook in your Discord server settings and paste the URL here
                          </FormDescription>
                        </FormItem>} />}
                </div>
                
                {/* Telegram Integration */}
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src="/lovable-uploads/5990fa67-2bb1-4831-936e-a14f75fcbc74.png" alt="Telegram Logo" className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Telegram Notifications</p>
                        <p className="text-sm text-muted-foreground">Send trading signals to a Telegram chat</p>
                      </div>
                    </div>
                    <FormField control={form.control} name="telegram_enabled" render={({
                    field
                  }) => <FormItem>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>} />
                  </div>
                  
                  {form.watch("telegram_enabled") && <div className="space-y-4">
                      <FormField control={form.control} name="telegram_bot_token" render={({
                    field
                  }) => <FormItem>
                            <FormLabel>Telegram Bot Token</FormLabel>
                            <FormControl>
                              <Input placeholder="123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ" {...field} />
                            </FormControl>
                            <FormDescription>
                              Create a bot with @BotFather and paste the token here
                            </FormDescription>
                          </FormItem>} />
                      
                      <FormField control={form.control} name="telegram_chat_id" render={({
                    field
                  }) => <FormItem>
                            <FormLabel>Telegram Chat ID</FormLabel>
                            <FormControl>
                              <Input placeholder="-100123456789" {...field} />
                            </FormControl>
                            <FormDescription>
                              The ID of the chat where signals should be sent
                            </FormDescription>
                          </FormItem>} />
                    </div>}
                </div>
              </form>
            </Form>
          </div>
        </>;
    }
    return <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive trading signals via email</p>
              </div>
            </div>
            <FormField control={form.control} name="email_enabled" render={({
            field
          }) => <FormItem>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>} />
          </div>
          
          {/* Discord Integration */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/lovable-uploads/bd9113c5-0c5b-4033-b957-cb8ee9f027a0.png" alt="Discord Logo" className="h-5 w-5" />
                <div>
                  <p className="font-medium">Discord Notifications</p>
                  <p className="text-sm text-muted-foreground">Send trading signals to a Discord channel</p>
                </div>
              </div>
              <FormField control={form.control} name="discord_enabled" render={({
              field
            }) => <FormItem>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>} />
            </div>
            
            {form.watch("discord_enabled") && <div className="space-y-2 rounded-md bg-slate-50 p-4 border border-slate-200">
                <FormField control={form.control} name="discord_webhook_url" render={({
              field
            }) => <FormItem>
                      <FormLabel>Discord Webhook URL</FormLabel>
                      <div className="flex space-x-2">
                        <FormControl className="flex-1">
                          <Input placeholder="https://discord.com/api/webhooks/..." {...field} disabled={isDiscordVerified} />
                        </FormControl>
                        {isDiscordVerified ? <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={disconnectDiscord}>
                            <Trash2 className="h-4 w-4" />
                          </Button> : <Button type="button" onClick={verifyDiscordWebhookHandler} disabled={isLoading || !field.value} className="whitespace-nowrap bg-indigo-500 hover:bg-indigo-600">
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Verify
                          </Button>}
                      </div>
                      <div className="flex items-center mt-1">
                        {isDiscordVerified && <div className="flex items-center text-sm text-green-600">
                            <Check className="mr-1 h-4 w-4" />
                            Webhook verified
                          </div>}
                      </div>
                      <FormDescription>
                        Create a webhook in your Discord server settings and paste the URL here
                      </FormDescription>
                    </FormItem>} />
                
                {isDiscordVerified && <div className="mt-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="text-xs">
                          How to customize Discord notifications
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium">Customize Your Discord Notifications</h4>
                          <p className="text-sm text-muted-foreground">
                            You can customize the appearance of your notifications in Discord by setting a username and avatar for your webhook.
                          </p>
                          <a href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks" target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">
                            Learn more about Discord webhooks
                          </a>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>}
              </div>}
          </div>
          
          {/* Telegram Integration */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/lovable-uploads/5990fa67-2bb1-4831-936e-a14f75fcbc74.png" alt="Telegram Logo" className="h-5 w-5" />
                <div>
                  <p className="font-medium">Telegram Notifications</p>
                  <p className="text-sm text-muted-foreground">Send trading signals to a Telegram chat</p>
                </div>
              </div>
              <FormField control={form.control} name="telegram_enabled" render={({
              field
            }) => <FormItem>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>} />
            </div>
            
            {form.watch("telegram_enabled") && <div className="space-y-4 rounded-md bg-slate-50 p-4 border border-slate-200">
                <div className="space-y-4">
                  <FormField control={form.control} name="telegram_bot_token" render={({
                field
              }) => <FormItem>
                        <FormLabel>Telegram Bot Token</FormLabel>
                        <FormControl>
                          <Input placeholder="123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ" {...field} disabled={isTelegramVerified} />
                        </FormControl>
                        <FormDescription>
                          Create a bot with @BotFather and paste the token here
                        </FormDescription>
                      </FormItem>} />
                  
                  <FormField control={form.control} name="telegram_chat_id" render={({
                field
              }) => <FormItem>
                        <FormLabel>Telegram Chat ID</FormLabel>
                        <div className="flex space-x-2">
                          <FormControl className="flex-1">
                            <Input placeholder="-100123456789" {...field} disabled={isTelegramVerified} />
                          </FormControl>
                          {isTelegramVerified ? <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={disconnectTelegram}>
                              <Trash2 className="h-4 w-4" />
                            </Button> : <Button type="button" onClick={verifyTelegramBotHandler} disabled={isLoading || !field.value || !form.getValues("telegram_bot_token")} className="whitespace-nowrap bg-sky-500 hover:bg-sky-600">
                              <LinkIcon className="mr-2 h-4 w-4" />
                              Verify
                            </Button>}
                        </div>
                        <div className="flex items-center mt-1">
                          {isTelegramVerified && <div className="flex items-center text-sm text-green-600">
                              <Check className="mr-1 h-4 w-4" />
                              Bot verified
                            </div>}
                        </div>
                        <FormDescription>
                          The ID of the chat where signals should be sent
                        </FormDescription>
                      </FormItem>} />
                </div>
                
                {isTelegramVerified && <div className="mt-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="text-xs">
                          How to set up your Telegram bot
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium">Telegram Bot Setup Guide</h4>
                          <p className="text-sm text-muted-foreground">
                            Start a chat with your bot and make sure to add it as an admin to your channel or group to receive notifications.
                          </p>
                          <a href="https://core.telegram.org/bots/tutorial" target="_blank" rel="noopener noreferrer" className="text-sm text-sky-600 hover:underline">
                            Learn more about Telegram bots
                          </a>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>}
              </div>}
          </div>
          
          {/* Save Button */}
          <div className="pt-4">
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Notification Settings"}
            </Button>
          </div>
        </form>
      </Form>;
  };

  // Signal notification types section
  const renderSignalNotificationTypes = () => {
    if (!isPro) {
      return <>
          <div className="flex items-center gap-3 mb-4">
            <Lock className="h-5 w-5 text-amber-500" />
            <div>
              <h3 className="font-medium text-amber-800">Pro Feature</h3>
              <p className="text-amber-700 text-sm">
                Upgrade to Pro to customize your notification preferences
              </p>
            </div>
          </div>
          <Button variant="default" className="bg-amber-500 hover:bg-amber-600 mb-6">Upgrade to Pro</Button>
          
          <div className="opacity-60 pointer-events-none">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Entry Signals</p>
                  <p className="text-sm text-muted-foreground">Notify when a new trade opportunity is detected</p>
                </div>
                <Switch defaultChecked={false} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Exit Signals</p>
                  <p className="text-sm text-muted-foreground">Notify when a position should be closed</p>
                </div>
                <Switch defaultChecked={false} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Stop Loss Alerts</p>
                  <p className="text-sm text-muted-foreground">Notify when stop loss is triggered</p>
                </div>
                <Switch defaultChecked={false} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Take Profit Alerts</p>
                  <p className="text-sm text-muted-foreground">Notify when take profit is triggered</p>
                </div>
                <Switch defaultChecked={false} />
              </div>
            </div>
          </div>
        </>;
    }
    return <Form {...form}>
        <div className="space-y-4">
          <FormField control={form.control} name="entry_signals" render={({
          field
        }) => <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Entry Signals</p>
                  <p className="text-sm text-muted-foreground">Notify when a new trade opportunity is detected</p>
                </div>
                <FormItem>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              </div>} />
          
          <FormField control={form.control} name="exit_signals" render={({
          field
        }) => <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Exit Signals</p>
                  <p className="text-sm text-muted-foreground">Notify when a position should be closed</p>
                </div>
                <FormItem>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              </div>} />
          
          <FormField control={form.control} name="stop_loss_alerts" render={({
          field
        }) => <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Stop Loss Alerts</p>
                  <p className="text-sm text-muted-foreground">Notify when stop loss is triggered</p>
                </div>
                <FormItem>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              </div>} />
          
          <FormField control={form.control} name="take_profit_alerts" render={({
          field
        }) => <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Take Profit Alerts</p>
                  <p className="text-sm text-muted-foreground">Notify when take profit is triggered</p>
                </div>
                <FormItem>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              </div>} />
        </div>
      </Form>;
  };
  return <div className="space-y-12">
      <div>
        <h2 className="text-xl font-medium mb-2">Trading Signal Notifications</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Choose how you want to be notified when trading signals are generated
        </p>
        
        <Card className={isPro ? "" : "border-amber-200 bg-gradient-to-r from-amber-50 to-white"}>
          <CardHeader className={isPro ? "pb-0" : "hidden"}>
            <CardTitle className="text-lg">Notification Platforms</CardTitle>
            <CardDescription>Connect your accounts to receive alerts on your preferred platforms</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {renderNotificationSettings()}
          </CardContent>
        </Card>
      </div>
      
      {isPro}
    </div>;
}
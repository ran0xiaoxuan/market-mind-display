import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Bell, Mail, MessageSquare, Send, Lock, Check, LinkIcon, Trash2, HelpCircle, ExternalLink, Copy, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { getNotificationSettings, saveNotificationSettings, verifyDiscordWebhook, verifyTelegramBot, NotificationSettings } from "@/services/notificationService";
import { TestSignalGenerator } from "@/components/TestSignalGenerator";

export function TradingSettings() {
  const { user } = useAuth();
  const { tier: subscriptionTier, isLoading: subscriptionLoading } = useUserSubscription();
  const isPro = subscriptionTier === 'pro' || subscriptionTier === 'premium';
  
  const [isLoading, setIsLoading] = useState(false);
  const [isDiscordVerified, setIsDiscordVerified] = useState(false);
  const [isTelegramVerified, setIsTelegramVerified] = useState(false);
  const [showDiscordHelp, setShowDiscordHelp] = useState(false);
  const [showTelegramHelp, setShowTelegramHelp] = useState(false);
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
      if (!isPro) return; // Don't load settings for free users
      
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
    
    if (!subscriptionLoading) {
      loadSettings();
    }
  }, [isPro, subscriptionLoading, form]);

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
    if (!isPro) {
      toast.error("This feature is only available for Pro users");
      return;
    }
    
    const webhookUrl = form.getValues("discord_webhook_url");
    if (!webhookUrl) {
      toast.error("Please enter a Discord webhook URL");
      return;
    }
    setIsLoading(true);
    try {
      const result = await verifyDiscordWebhook(webhookUrl);
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
    if (!isPro) {
      toast.error("This feature is only available for Pro users");
      return;
    }
    
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
    if (!isPro) {
      toast.error("This feature is only available for Pro users");
      return;
    }
    form.setValue("discord_webhook_url", "");
    setIsDiscordVerified(false);
    toast.success("Discord webhook disconnected");
  };

  const disconnectTelegram = () => {
    if (!isPro) {
      toast.error("This feature is only available for Pro users");
      return;
    }
    form.setValue("telegram_bot_token", "");
    form.setValue("telegram_chat_id", "");
    setIsTelegramVerified(false);
    toast.success("Telegram bot disconnected");
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const maskSensitiveValue = (value: string, type: 'webhook' | 'token' | 'chatId') => {
    if (!value) return '';
    switch (type) {
      case 'webhook':
        const webhookMatch = value.match(/https:\/\/discord\.com\/api\/webhooks\/(\d+)\/([\w-]+)/);
        if (webhookMatch) {
          return `https://discord.com/api/webhooks/${webhookMatch[1]}/****`;
        }
        return '****';
      case 'token':
        return value.substring(0, 12) + '****';
      case 'chatId':
        if (value.length > 6) {
          return value.substring(0, 3) + '****' + value.substring(value.length - 3);
        }
        return '****';
      default:
        return '****';
    }
  };

  const DiscordHelpSection = () => (
    <Collapsible open={showDiscordHelp} onOpenChange={setShowDiscordHelp}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs w-full justify-between" disabled={!isPro}>
          <span>How to find Discord Webhook URL</span>
          <HelpCircle className="h-3 w-3" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 p-4 bg-muted/50 rounded-md border border-border">
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium text-foreground mb-2">Step-by-Step Guide:</h4>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Open Discord and go to your server (or create one if needed)</li>
              <li>Right-click on your server name → <strong>Server Settings</strong></li>
              <li>In the left sidebar, click <strong>Integrations</strong></li>
              <li>Click <strong>Webhooks</strong> tab</li>
              <li>Click <strong>"Create Webhook"</strong> or <strong>"New Webhook"</strong></li>
              <li>Choose the channel where you want to receive trading signals</li>
              <li>Give your webhook a name (e.g., "Trading Signals")</li>
              <li>Click <strong>"Copy Webhook URL"</strong></li>
            </ol>
          </div>
          
          <div className="border-t border-border pt-3">
            <h5 className="font-medium text-foreground mb-1">Example URL format:</h5>
            <div className="bg-muted p-2 rounded text-xs font-mono flex items-center justify-between">
              <span>https://discord.com/api/webhooks/123456789/abcdef...</span>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard("https://discord.com/api/webhooks/123456789/abcdef...")} className="h-6 w-6 p-0">
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="border-t border-border pt-3">
            <h5 className="font-medium text-foreground mb-1">Troubleshooting:</h5>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
              <li>Make sure you have "Manage Webhooks" permission in the server</li>
              <li>The URL should start with "https://discord.com/api/webhooks/"</li>
              <li>Don't share your webhook URL publicly - it gives access to your channel</li>
            </ul>
          </div>
          
          <div className="flex justify-center">
            <Button variant="outline" size="sm" asChild>
              <a href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks" target="_blank" rel="noopener noreferrer" className="text-xs">
                <ExternalLink className="mr-2 h-3 w-3" />
                Discord Webhooks Guide
              </a>
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );

  const TelegramHelpSection = () => (
    <Collapsible open={showTelegramHelp} onOpenChange={setShowTelegramHelp}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs w-full justify-between" disabled={!isPro}>
          <span>How to find Telegram Bot Token & Chat ID</span>
          <HelpCircle className="h-3 w-3" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 p-4 bg-muted/50 rounded-md border border-border">
        <div className="space-y-6 text-sm">
          <div>
            <h4 className="font-medium text-foreground mb-2">Getting Bot Token:</h4>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Open Telegram and search for <strong>@BotFather</strong></li>
              <li>Start a chat with BotFather by clicking "Start"</li>
              <li>Send the command: <code className="bg-muted px-1 rounded">/newbot</code></li>
              <li>Follow the prompts to choose a name for your bot</li>
              <li>Choose a username ending in "bot" (e.g., "mytradingbot")</li>
              <li>Copy the token provided by BotFather</li>
            </ol>
            
            <div className="mt-3">
              <h5 className="font-medium text-foreground mb-1">Example Token format:</h5>
              <div className="bg-muted p-2 rounded text-xs font-mono flex items-center justify-between">
                <span>123456789:ABCdefGhIjkLmnOpqrStUvWxYz</span>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard("123456789:ABCdefGhIjkLmnOpqrStUvWxYz")} className="h-6 w-6 p-0">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="font-medium text-foreground mb-2">Getting Chat ID:</h4>
            
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-3 mb-4">
              <h5 className="font-medium text-green-800 dark:text-green-300 mb-2">✅ EASIEST METHOD: Use @get_id_bot</h5>
              <ol className="list-decimal list-inside space-y-1 text-green-700 dark:text-green-400 text-sm">
                <li>Search for <strong>@get_id_bot</strong> in Telegram</li>
                <li>Start a chat and send any message (like "hello")</li>
                <li>The bot will immediately reply with your chat ID</li>
                <li>Copy the number it provides (e.g., 123456789)</li>
              </ol>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <h5 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Alternative: Manual API Method</h5>
              <div className="space-y-3 text-blue-700 dark:text-blue-400 text-sm">
                <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded p-2">
                  <p className="font-medium text-yellow-800 dark:text-yellow-300">⚠️ IMPORTANT: Send a message to your bot first!</p>
                  <p className="text-yellow-700 dark:text-yellow-400 text-xs mt-1">Search for your bot in Telegram and send it any message (like "hello"). Without this step, the API will return empty results.</p>
                </div>
                
                <ol className="list-decimal list-inside space-y-1">
                  <li>After messaging your bot, replace YOUR_BOT_TOKEN in this URL:</li>
                  <li className="ml-4 font-mono text-xs bg-muted p-2 rounded break-all">
                    https://api.telegram.org/bot[YOUR_BOT_TOKEN]/getUpdates
                  </li>
                  <li>Visit the URL in your browser</li>
                  <li>Look for <code className="bg-muted px-1 rounded">"chat":{'{'}"id":123456789{'}'}</code> in the response</li>
                  <li>The number after "id": is your chat ID</li>
                </ol>
                
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded p-2">
                  <p className="text-red-800 dark:text-red-300 text-xs"><strong>If you see empty result like</strong> <code>{'{'}"ok": true, "result": []{' }'}</code></p>
                  <p className="text-red-700 dark:text-red-400 text-xs">This means you haven't sent a message to your bot yet. Go back to step 1!</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h5 className="font-medium text-foreground mb-2">For Group Chats:</h5>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                <li>Add your bot to the group</li>
                <li>Make your bot an admin (required for sending messages)</li>
                <li>Send a message in the group mentioning your bot (e.g., "@yourbotname hello")</li>
                <li>Use the same API URL method above</li>
                <li>Group IDs are usually negative numbers (e.g., -100123456789)</li>
              </ol>
            </div>
            
            <div className="mt-3">
              <h5 className="font-medium text-foreground mb-1">Example Chat ID formats:</h5>
              <div className="space-y-1">
                <div className="bg-muted p-2 rounded text-xs font-mono flex items-center justify-between">
                  <span>Personal: 123456789</span>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard("123456789")} className="h-6 w-6 p-0">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="bg-muted p-2 rounded text-xs font-mono flex items-center justify-between">
                  <span>Group: -100123456789</span>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard("-100123456789")} className="h-6 w-6 p-0">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-3">
            <h5 className="font-medium text-foreground mb-1">Important Notes:</h5>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
              <li>Keep your bot token secure - don't share it publicly</li>
              <li>You MUST send a message to your bot before using the API method</li>
              <li>For groups, make sure your bot has permission to send messages</li>
              <li>Personal chat IDs are positive numbers, group IDs are negative</li>
            </ul>
          </div>
          
          <div className="flex justify-center">
            <Button variant="outline" size="sm" asChild>
              <a href="https://core.telegram.org/bots/tutorial" target="_blank" rel="noopener noreferrer" className="text-xs">
                <ExternalLink className="mr-2 h-3 w-3" />
                Telegram Bots Guide
              </a>
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );

  // Show loading state while checking subscription
  if (subscriptionLoading) {
    return (
      <div className="space-y-12">
        <div>
          <h2 className="text-xl font-medium mb-2">Trading Signal Notifications</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Loading subscription information...
          </p>
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Free user experience
  if (!isPro) {
    return (
      <div className="space-y-12">
        <div>
          <h2 className="text-xl font-medium mb-2">Trading Signal Notifications</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Get real-time trading signals delivered to your preferred platforms
          </p>
          
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-amber-900 mb-2">Unlock Pro Notifications</h3>
                  <p className="text-amber-800 text-lg max-w-2xl mx-auto">
                    Get instant trading signals delivered to Discord, Telegram, and Email the moment your strategies trigger
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  <div className="bg-white/60 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-center gap-3 mb-3">
                      <Mail className="h-6 w-6 text-amber-600" />
                      <h4 className="font-semibold text-amber-900">Email Alerts</h4>
                    </div>
                    <p className="text-sm text-amber-700">
                      Professional email notifications with detailed signal information and market context
                    </p>
                  </div>
                  
                  <div className="bg-white/60 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-center gap-3 mb-3">
                      <img src="/lovable-uploads/bd9113c5-0c5b-4033-b957-cb8ee9f027a0.png" alt="Discord" className="h-6 w-6" />
                      <h4 className="font-semibold text-amber-900">Discord Integration</h4>
                    </div>
                    <p className="text-sm text-amber-700">
                      Real-time signals sent directly to your Discord server with rich embed formatting
                    </p>
                  </div>
                  
                  <div className="bg-white/60 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-center gap-3 mb-3">
                      <img src="/lovable-uploads/5990fa67-2bb1-4831-936e-a14f75fcbc74.png" alt="Telegram" className="h-6 w-6" />
                      <h4 className="font-semibold text-amber-900">Telegram Bots</h4>
                    </div>
                    <p className="text-sm text-amber-700">
                      Instant mobile notifications through Telegram with customizable bot integration
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-8 py-3">
                    <Crown className="mr-2 h-5 w-5" />
                    Upgrade to Pro
                  </Button>
                  
                  <p className="text-sm text-amber-700">
                    Join thousands of traders getting real-time signal notifications
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Pro user experience
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-xl font-medium mb-2">Trading Signal Notifications</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Choose how you want to be notified when trading signals are generated
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Notification Platforms
            </CardTitle>
            <CardDescription>Connect your accounts to receive alerts on your preferred platforms</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
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
                  <FormField
                    control={form.control}
                    name="email_enabled"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
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
                    <FormField
                      control={form.control}
                      name="discord_enabled"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {form.watch("discord_enabled") && (
                    <div className="space-y-2 rounded-md bg-muted/50 p-4 border border-border">
                      <DiscordHelpSection />
                      
                      <FormField
                        control={form.control}
                        name="discord_webhook_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discord Webhook URL</FormLabel>
                            <div className="flex space-x-2">
                              <FormControl className="flex-1">
                                <Input
                                  placeholder="https://discord.com/api/webhooks/..."
                                  {...field}
                                  value={isDiscordVerified ? maskSensitiveValue(field.value, 'webhook') : field.value}
                                  disabled={isDiscordVerified}
                                />
                              </FormControl>
                              {!isDiscordVerified && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={verifyDiscordWebhookHandler}
                                  disabled={isLoading || !field.value}
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              )}
                              {isDiscordVerified && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-10 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={disconnectDiscord}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <div className="flex items-center mt-1">
                              {isDiscordVerified && (
                                <div className="flex items-center text-sm text-green-600">
                                  <Check className="mr-1 h-4 w-4" />
                                  Webhook verified and secured
                                </div>
                              )}
                            </div>
                            <FormDescription>
                              {isDiscordVerified ? "Your Discord webhook is connected and secured" : "Paste your Discord webhook URL here to receive trading signals"}
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
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
                    <FormField
                      control={form.control}
                      name="telegram_enabled"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {form.watch("telegram_enabled") && (
                    <div className="space-y-4 rounded-md bg-muted/50 p-4 border border-border">
                      <TelegramHelpSection />
                      
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="telegram_bot_token"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telegram Bot Token</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ"
                                  {...field}
                                  value={isTelegramVerified ? maskSensitiveValue(field.value, 'token') : field.value}
                                  disabled={isTelegramVerified}
                                />
                              </FormControl>
                              <FormDescription>
                                {isTelegramVerified ? "Your bot token is secured" : "Get this from @BotFather when creating your bot"}
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="telegram_chat_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telegram Chat ID</FormLabel>
                              <div className="flex space-x-2">
                                <FormControl className="flex-1">
                                  <Input
                                    placeholder="-100123456789 or 123456789"
                                    {...field}
                                    value={isTelegramVerified ? maskSensitiveValue(field.value, 'chatId') : field.value}
                                    disabled={isTelegramVerified}
                                  />
                                </FormControl>
                                {!isTelegramVerified && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={verifyTelegramBotHandler}
                                    disabled={isLoading || !form.getValues("telegram_bot_token") || !field.value}
                                  >
                                    <Send className="h-4 w-4" />
                                  </Button>
                                )}
                                {isTelegramVerified && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={disconnectTelegram}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <div className="flex items-center mt-1">
                                {isTelegramVerified && (
                                  <div className="flex items-center text-sm text-green-600">
                                    <Check className="mr-1 h-4 w-4" />
                                    Bot verified and secured
                                  </div>
                                )}
                              </div>
                              <FormDescription>
                                {isTelegramVerified ? "Your Telegram bot is connected and secured" : "The chat or group where signals will be sent"}
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Save Button */}
                <div className="pt-4">
                  <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Notification Settings"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-medium mb-2">Test Notifications</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Generate test signals to verify your notification setup is working correctly
        </p>
        
        <TestSignalGenerator />
      </div>
    </div>
  );
}

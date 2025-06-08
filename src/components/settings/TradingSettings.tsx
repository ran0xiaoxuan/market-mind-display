
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Bell, Mail, MessageSquare, Send, Lock, Check, LinkIcon, Trash2, HelpCircle, ExternalLink, Copy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { getNotificationSettings, saveNotificationSettings, NotificationSettings } from "@/services/notificationService";

export function TradingSettings() {
  const { user } = useAuth();
  const isPro = user?.user_metadata?.is_pro === true;
  const [isLoading, setIsLoading] = useState(false);
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
      try {
        const settings = await getNotificationSettings();
        if (settings) {
          form.reset(settings);
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const DiscordHelpSection = () => {
    return (
      <Collapsible open={showDiscordHelp} onOpenChange={setShowDiscordHelp}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs w-full justify-between">
            <span>How to find Discord Webhook URL</span>
            <HelpCircle className="h-3 w-3" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 p-4 bg-slate-50 rounded-md border">
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-indigo-800 mb-2">Step-by-Step Guide:</h4>
              <ol className="list-decimal list-inside space-y-2 text-slate-700">
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
            
            <div className="border-t pt-3">
              <h5 className="font-medium text-slate-800 mb-1">Example URL format:</h5>
              <div className="bg-slate-100 p-2 rounded text-xs font-mono flex items-center justify-between">
                <span>https://discord.com/api/webhooks/123456789/abcdef...</span>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard("https://discord.com/api/webhooks/123456789/abcdef...")} className="h-6 w-6 p-0">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="border-t pt-3">
              <h5 className="font-medium text-slate-800 mb-1">Troubleshooting:</h5>
              <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs">
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
  };

  const TelegramHelpSection = () => {
    return (
      <Collapsible open={showTelegramHelp} onOpenChange={setShowTelegramHelp}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs w-full justify-between">
            <span>How to find Telegram Bot Token & Chat ID</span>
            <HelpCircle className="h-3 w-3" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 p-4 bg-slate-50 rounded-md border">
          <div className="space-y-6 text-sm">
            {/* Bot Token Section */}
            <div>
              <h4 className="font-medium text-sky-800 mb-2">Getting Bot Token:</h4>
              <ol className="list-decimal list-inside space-y-2 text-slate-700">
                <li>Open Telegram and search for <strong>@BotFather</strong></li>
                <li>Start a chat with BotFather by clicking "Start"</li>
                <li>Send the command: <code className="bg-slate-200 px-1 rounded">/newbot</code></li>
                <li>Follow the prompts to choose a name for your bot</li>
                <li>Choose a username ending in "bot" (e.g., "mytradingbot")</li>
                <li>Copy the token provided by BotFather</li>
              </ol>
              
              <div className="mt-3">
                <h5 className="font-medium text-slate-800 mb-1">Example Token format:</h5>
                <div className="bg-slate-100 p-2 rounded text-xs font-mono flex items-center justify-between">
                  <span>123456789:ABCdefGhIjkLmnOpqrStUvWxYz</span>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard("123456789:ABCdefGhIjkLmnOpqrStUvWxYz")} className="h-6 w-6 p-0">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Chat ID Section */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-sky-800 mb-2">Getting Chat ID:</h4>
              
              <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                <h5 className="font-medium text-green-800 mb-2">✅ EASIEST METHOD: Use @get_id_bot</h5>
                <ol className="list-decimal list-inside space-y-1 text-green-700 text-sm">
                  <li>Search for <strong>@get_id_bot</strong> in Telegram</li>
                  <li>Start a chat and send any message (like "hello")</li>
                  <li>The bot will immediately reply with your chat ID</li>
                  <li>Copy the number it provides (e.g., 123456789)</li>
                </ol>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <h5 className="font-medium text-blue-800 mb-2">Alternative: Manual API Method</h5>
                <div className="space-y-3 text-blue-700 text-sm">
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                    <p className="font-medium text-yellow-800">⚠️ IMPORTANT: Send a message to your bot first!</p>
                    <p className="text-yellow-700 text-xs mt-1">Search for your bot in Telegram and send it any message (like "hello"). Without this step, the API will return empty results.</p>
                  </div>
                  
                  <ol className="list-decimal list-inside space-y-1">
                    <li>After messaging your bot, replace YOUR_BOT_TOKEN in this URL:</li>
                    <li className="ml-4 font-mono text-xs bg-blue-100 p-2 rounded break-all">
                      https://api.telegram.org/bot[YOUR_BOT_TOKEN]/getUpdates
                    </li>
                    <li>Visit the URL in your browser</li>
                    <li>Look for <code className="bg-blue-200 px-1 rounded">"chat":{"id":123456789}</code> in the response</li>
                    <li>The number after "id": is your chat ID</li>
                  </ol>
                  
                  <div className="bg-red-50 border border-red-200 rounded p-2">
                    <p className="text-red-800 text-xs"><strong>If you see empty result like</strong> <code>{"ok": true, "result": []}</code></p>
                    <p className="text-red-700 text-xs">This means you haven't sent a message to your bot yet. Go back to step 1!</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h5 className="font-medium text-slate-800 mb-2">For Group Chats:</h5>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 text-xs">
                  <li>Add your bot to the group</li>
                  <li>Make your bot an admin (required for sending messages)</li>
                  <li>Send a message in the group mentioning your bot (e.g., "@yourbotname hello")</li>
                  <li>Use the same API URL method above</li>
                  <li>Group IDs are usually negative numbers (e.g., -100123456789)</li>
                </ol>
              </div>
              
              <div className="mt-3">
                <h5 className="font-medium text-slate-800 mb-1">Example Chat ID formats:</h5>
                <div className="space-y-1">
                  <div className="bg-slate-100 p-2 rounded text-xs font-mono flex items-center justify-between">
                    <span>Personal: 123456789</span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard("123456789")} className="h-6 w-6 p-0">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="bg-slate-100 p-2 rounded text-xs font-mono flex items-center justify-between">
                    <span>Group: -100123456789</span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard("-100123456789")} className="h-6 w-6 p-0">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-3">
              <h5 className="font-medium text-slate-800 mb-1">Important Notes:</h5>
              <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs">
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
  };

  // Render content based on Pro status
  const renderNotificationSettings = () => {
    if (!isPro) {
      return (
        <>
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
                    <FormField 
                      control={form.control} 
                      name="discord_webhook_url" 
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discord Webhook URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://discord.com/api/webhooks/..." {...field} />
                          </FormControl>
                          <FormDescription>
                            Create a webhook in your Discord server settings and paste the URL here
                          </FormDescription>
                        </FormItem>
                      )} 
                    />
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
                    <div className="space-y-4">
                      <FormField 
                        control={form.control} 
                        name="telegram_bot_token" 
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telegram Bot Token</FormLabel>
                            <FormControl>
                              <Input placeholder="123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ" {...field} />
                            </FormControl>
                            <FormDescription>
                              Create a bot with @BotFather and paste the token here
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
                            <FormControl>
                              <Input placeholder="-100123456789" {...field} />
                            </FormControl>
                            <FormDescription>
                              The ID of the chat where signals should be sent
                            </FormDescription>
                          </FormItem>
                        )} 
                      />
                    </div>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </>
      );
    }

    return (
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
              <div className="space-y-2 rounded-md bg-slate-50 p-4 border border-slate-200">
                <DiscordHelpSection />
                
                <FormField 
                  control={form.control} 
                  name="discord_webhook_url" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discord Webhook URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://discord.com/api/webhooks/..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Paste your Discord webhook URL here to receive trading signals
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
              <div className="space-y-4 rounded-md bg-slate-50 p-4 border border-slate-200">
                <TelegramHelpSection />
                
                <div className="space-y-4">
                  <FormField 
                    control={form.control} 
                    name="telegram_bot_token" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telegram Bot Token</FormLabel>
                        <FormControl>
                          <Input placeholder="123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ" {...field} />
                        </FormControl>
                        <FormDescription>
                          Get this from @BotFather when creating your bot
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
                        <FormControl>
                          <Input placeholder="-100123456789 or 123456789" {...field} />
                        </FormControl>
                        <FormDescription>
                          The chat or group where signals will be sent
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
    );
  };

  // Signal notification types section
  const renderSignalNotificationTypes = () => {
    if (!isPro) {
      return (
        <>
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
        </>
      );
    }

    return (
      <Form {...form}>
        <div className="space-y-4">
          <FormField 
            control={form.control} 
            name="entry_signals" 
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Entry Signals</p>
                  <p className="text-sm text-muted-foreground">Notify when a new trade opportunity is detected</p>
                </div>
                <FormItem>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              </div>
            )} 
          />
          
          <FormField 
            control={form.control} 
            name="exit_signals" 
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Exit Signals</p>
                  <p className="text-sm text-muted-foreground">Notify when a position should be closed</p>
                </div>
                <FormItem>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              </div>
            )} 
          />
          
          <FormField 
            control={form.control} 
            name="stop_loss_alerts" 
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Stop Loss Alerts</p>
                  <p className="text-sm text-muted-foreground">Notify when stop loss is triggered</p>
                </div>
                <FormItem>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              </div>
            )} 
          />
          
          <FormField 
            control={form.control} 
            name="take_profit_alerts" 
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Take Profit Alerts</p>
                  <p className="text-sm text-muted-foreground">Notify when take profit is triggered</p>
                </div>
                <FormItem>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              </div>
            )} 
          />
        </div>
      </Form>
    );
  };

  return (
    <div className="space-y-12">
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
      
      <div>
        <h2 className="text-xl font-medium mb-2">Signal Types</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Choose which types of trading signals you want to receive
        </p>
        
        <Card className={isPro ? "" : "border-amber-200 bg-gradient-to-r from-amber-50 to-white"}>
          <CardContent className="p-6">
            {renderSignalNotificationTypes()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

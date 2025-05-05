import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Bell, Mail, MessageSquare, Send, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface NotificationPreferences {
  email: boolean;
  discord: boolean;
  telegram: boolean;
  discordWebhook: string;
  telegramBotToken: string;
  telegramChatId: string;
}

export function TradingSettings() {
  const { user } = useAuth();
  const isPro = user?.user_metadata?.is_pro === true;
  const [isLoading, setIsLoading] = useState(false);
  
  // Form with default values - all set to false initially
  const form = useForm<NotificationPreferences>({
    defaultValues: {
      email: false,
      discord: false,
      telegram: false,
      discordWebhook: "",
      telegramBotToken: "",
      telegramChatId: "",
    }
  });

  const handleSubmit = (values: NotificationPreferences) => {
    setIsLoading(true);
    
    // Simulate saving preferences
    setTimeout(() => {
      console.log("Saving notification preferences:", values);
      toast.success("Notification preferences saved successfully");
      setIsLoading(false);
    }, 1000);
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Discord Integration */}
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Discord Notifications</p>
                        <p className="text-sm text-muted-foreground">Send trading signals to a Discord channel</p>
                      </div>
                    </div>
                    <FormField
                      control={form.control}
                      name="discord"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {form.watch("discord") && (
                    <FormField
                      control={form.control}
                      name="discordWebhook"
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
                      <Send className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Telegram Notifications</p>
                        <p className="text-sm text-muted-foreground">Send trading signals to a Telegram chat</p>
                      </div>
                    </div>
                    <FormField
                      control={form.control}
                      name="telegram"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {form.watch("telegram") && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="telegramBotToken"
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
                        name="telegramChatId"
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
                
                {/* Save Button */}
                <div className="pt-4">
                  <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Notification Settings"}
                  </Button>
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Switch 
                      checked={field.value} 
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          {/* Discord Integration */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Discord Notifications</p>
                  <p className="text-sm text-muted-foreground">Send trading signals to a Discord channel</p>
                </div>
              </div>
              <FormField
                control={form.control}
                name="discord"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          {form.watch("discord") && (
            <FormField
              control={form.control}
              name="discordWebhook"
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
              <Send className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Telegram Notifications</p>
                <p className="text-sm text-muted-foreground">Send trading signals to a Telegram chat</p>
              </div>
            </div>
            <FormField
              control={form.control}
              name="telegram"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Switch 
                      checked={field.value} 
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          {form.watch("telegram") && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="telegramBotToken"
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
                name="telegramChatId"
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
        
        {/* Save Button */}
        <div className="pt-4">
          <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Notification Settings"}
          </Button>
        </div>
      </form>
    );
  };

  // Signal notification types section with conditional rendering
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
    );
  };

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-xl font-medium mb-2">Trading Signal Notifications</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Choose how you want to be notified when trading signals are generated
        </p>
        
        <Card className={isPro ? "border-green-200 bg-gradient-to-r from-green-50 to-white" : "border-amber-200 bg-gradient-to-r from-amber-50 to-white"}>
          <CardContent className="p-6">
            {renderNotificationSettings()}
          </CardContent>
        </Card>
      </div>
      
      <div>
        <h2 className="text-xl font-medium mb-2">Signal Notification Settings</h2>
        <p className="text-sm text-muted-foreground mb-6">Configure which types of signals to send</p>
        
        <Card className={isPro ? "border-green-200 bg-gradient-to-r from-green-50 to-white" : "border-amber-200 bg-gradient-to-r from-amber-50 to-white"}>
          <CardContent className="p-6">
            {renderSignalNotificationTypes()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

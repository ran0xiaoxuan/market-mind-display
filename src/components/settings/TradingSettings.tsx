
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  getNotificationSettings, 
  saveNotificationSettings, 
  verifyDiscordWebhook, 
  verifyTelegramBot,
  NotificationSettings 
} from '@/services/notificationService';
import { Bell, Discord, Send, Mail, CheckCircle, XCircle } from 'lucide-react';

const TradingSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [discordVerified, setDiscordVerified] = useState(false);
  const [telegramVerified, setTelegramVerified] = useState(false);
  
  const { register, handleSubmit, reset, watch, setValue } = useForm<NotificationSettings>({
    defaultValues: {
      emailEnabled: true,
      discordEnabled: false,
      telegramEnabled: false,
      entrySignals: true,
      exitSignals: true,
      stopLossAlerts: true,
      takeProfitAlerts: true,
      discordWebhookUrl: '',
      telegramBotToken: '',
      telegramChatId: ''
    }
  });

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getNotificationSettings();
        if (settings) {
          reset(settings);
          // Check verification status
          if (settings.discordWebhookUrl) {
            const isDiscordValid = await verifyDiscordWebhook(settings.discordWebhookUrl);
            setDiscordVerified(isDiscordValid);
          }
          if (settings.telegramBotToken && settings.telegramChatId) {
            const isTelegramValid = await verifyTelegramBot(settings.telegramBotToken, settings.telegramChatId);
            setTelegramVerified(isTelegramValid);
          }
        }
      } catch (error) {
        console.error('Failed to load notification settings:', error);
        toast.error('Failed to load notification settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [reset]);

  // Watch for changes to verify webhooks
  const discordWebhookUrl = watch('discordWebhookUrl');
  const telegramBotToken = watch('telegramBotToken');
  const telegramChatId = watch('telegramChatId');

  const verifyDiscordConnection = async () => {
    if (!discordWebhookUrl) return;
    
    try {
      const isValid = await verifyDiscordWebhook(discordWebhookUrl);
      setDiscordVerified(isValid);
      if (isValid) {
        toast.success('Discord webhook verified successfully');
      } else {
        toast.error('Discord webhook verification failed');
      }
    } catch (error) {
      setDiscordVerified(false);
      toast.error('Failed to verify Discord webhook');
    }
  };

  const verifyTelegramConnection = async () => {
    if (!telegramBotToken || !telegramChatId) return;
    
    try {
      const isValid = await verifyTelegramBot(telegramBotToken, telegramChatId);
      setTelegramVerified(isValid);
      if (isValid) {
        toast.success('Telegram bot verified successfully');
      } else {
        toast.error('Telegram bot verification failed');
      }
    } catch (error) {
      setTelegramVerified(false);
      toast.error('Failed to verify Telegram bot');
    }
  };

  const onSubmit = async (data: NotificationSettings) => {
    setIsSaving(true);
    try {
      await saveNotificationSettings(data);
      toast.success('Notification settings saved successfully');
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      toast.error('Failed to save notification settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Loading notification settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notification Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure how you want to receive trading notifications
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Email Notifications</CardTitle>
            </div>
            <CardDescription>
              Receive notifications via email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailEnabled">Enable email notifications</Label>
              <Switch
                id="emailEnabled"
                checked={watch('emailEnabled')}
                onCheckedChange={(checked) => setValue('emailEnabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Discord Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Discord className="h-5 w-5" />
              <CardTitle>Discord Notifications</CardTitle>
            </div>
            <CardDescription>
              Send notifications to a Discord channel via webhook
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="discordEnabled">Enable Discord notifications</Label>
              <Switch
                id="discordEnabled"
                checked={watch('discordEnabled')}
                onCheckedChange={(checked) => setValue('discordEnabled', checked)}
              />
            </div>
            
            {watch('discordEnabled') && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="discordWebhookUrl">Discord Webhook URL</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="discordWebhookUrl"
                      {...register('discordWebhookUrl')}
                      placeholder="https://discord.com/api/webhooks/..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={verifyDiscordConnection}
                      className="flex items-center space-x-1"
                    >
                      {discordVerified ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span>Verify</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Telegram Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Send className="h-5 w-5" />
              <CardTitle>Telegram Notifications</CardTitle>
            </div>
            <CardDescription>
              Send notifications via Telegram bot
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="telegramEnabled">Enable Telegram notifications</Label>
              <Switch
                id="telegramEnabled"
                checked={watch('telegramEnabled')}
                onCheckedChange={(checked) => setValue('telegramEnabled', checked)}
              />
            </div>
            
            {watch('telegramEnabled') && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="telegramBotToken">Bot Token</Label>
                  <Input
                    id="telegramBotToken"
                    {...register('telegramBotToken')}
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telegramChatId">Chat ID</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="telegramChatId"
                      {...register('telegramChatId')}
                      placeholder="-1234567890"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={verifyTelegramConnection}
                      className="flex items-center space-x-1"
                    >
                      {telegramVerified ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span>Verify</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Types */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notification Types</CardTitle>
            </div>
            <CardDescription>
              Choose which types of notifications to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="entrySignals">Entry signals</Label>
              <Switch
                id="entrySignals"
                checked={watch('entrySignals')}
                onCheckedChange={(checked) => setValue('entrySignals', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="exitSignals">Exit signals</Label>
              <Switch
                id="exitSignals"
                checked={watch('exitSignals')}
                onCheckedChange={(checked) => setValue('exitSignals', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="stopLossAlerts">Stop loss alerts</Label>
              <Switch
                id="stopLossAlerts"
                checked={watch('stopLossAlerts')}
                onCheckedChange={(checked) => setValue('stopLossAlerts', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="takeProfitAlerts">Take profit alerts</Label>
              <Switch
                id="takeProfitAlerts"
                checked={watch('takeProfitAlerts')}
                onCheckedChange={(checked) => setValue('takeProfitAlerts', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TradingSettings;

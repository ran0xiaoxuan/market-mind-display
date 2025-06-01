
import { supabase } from "@/integrations/supabase/client";
import { NotificationRateLimiter } from "@/components/RateLimiter";

export interface NotificationSettings {
  email_enabled: boolean;
  discord_enabled: boolean;
  telegram_enabled: boolean;
  discord_webhook_url?: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  entry_signals: boolean;
  exit_signals: boolean;
  stop_loss_alerts: boolean;
  take_profit_alerts: boolean;
}

export const getNotificationSettings = async () => {
  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
};

export const saveNotificationSettings = async (settings: Partial<NotificationSettings>) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data: existingSettings } = await supabase
    .from('notification_settings')
    .select('id')
    .eq('user_id', user.user.id)
    .single();

  if (existingSettings) {
    const { data, error } = await supabase
      .from('notification_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('notification_settings')
      .insert({
        user_id: user.user.id,
        ...settings
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export const verifyDiscordWebhook = async (webhookUrl: string) => {
  const { data, error } = await supabase.functions.invoke('verify-discord-webhook', {
    body: { webhookUrl }
  });

  if (error) throw error;
  return data;
};

export const verifyTelegramBot = async (botToken: string, chatId: string) => {
  const { data, error } = await supabase.functions.invoke('verify-telegram-bot', {
    body: { botToken, chatId }
  });

  if (error) throw error;
  return data;
};

export const createTradingSignal = async (strategyId: string, signalType: string, signalData: any) => {
  const { data, error } = await supabase
    .from('trading_signals')
    .insert({
      strategy_id: strategyId,
      signal_type: signalType,
      signal_data: signalData
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Enhanced notification sending with rate limiting
export const sendNotificationWithRateLimit = async (
  userId: string,
  notificationType: 'email' | 'discord' | 'telegram',
  signalId: string,
  ...args: any[]
) => {
  const rateLimiter = NotificationRateLimiter.getInstance();
  
  if (!rateLimiter.canSendNotification(userId, notificationType)) {
    const timeUntilReset = rateLimiter.getTimeUntilReset(userId, notificationType);
    const minutesUntilReset = Math.ceil(timeUntilReset / (1000 * 60));
    
    throw new Error(`Rate limit exceeded for ${notificationType}. Try again in ${minutesUntilReset} minutes.`);
  }

  // Send the notification based on type
  switch (notificationType) {
    case 'email':
      return await supabase.functions.invoke('send-email-notification', {
        body: { signalId, userEmail: args[0], signalData: args[1], signalType: args[2] }
      });
    case 'discord':
      return await supabase.functions.invoke('send-discord-notification', {
        body: { signalId, webhookUrl: args[0], signalData: args[1], signalType: args[2] }
      });
    case 'telegram':
      return await supabase.functions.invoke('send-telegram-notification', {
        body: { signalId, botToken: args[0], chatId: args[1], signalData: args[2], signalType: args[3] }
      });
    default:
      throw new Error(`Unknown notification type: ${notificationType}`);
  }
};

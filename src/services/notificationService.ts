
import { supabase } from '@/integrations/supabase/client';

export interface NotificationSettings {
  id: string;
  userId: string;
  emailEnabled: boolean;
  discordEnabled: boolean;
  telegramEnabled: boolean;
  entrySignals: boolean;
  exitSignals: boolean;
  stopLossAlerts: boolean;
  takeProfitAlerts: boolean;
  discordWebhookUrl?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  createdAt: string;
  updatedAt: string;
}

export const getNotificationSettings = async (): Promise<NotificationSettings | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No settings found, return null to create default
      return null;
    }
    console.error('Error fetching notification settings:', error);
    throw error;
  }

  return {
    id: data.id,
    userId: data.user_id,
    emailEnabled: data.email_enabled,
    discordEnabled: data.discord_enabled,
    telegramEnabled: data.telegram_enabled,
    entrySignals: data.entry_signals,
    exitSignals: data.exit_signals,
    stopLossAlerts: data.stop_loss_alerts,
    takeProfitAlerts: data.take_profit_alerts,
    discordWebhookUrl: data.discord_webhook_url,
    telegramBotToken: data.telegram_bot_token,
    telegramChatId: data.telegram_chat_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

export const saveNotificationSettings = async (settings: Partial<NotificationSettings>): Promise<NotificationSettings> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  const updateData: any = {
    user_id: user.id,
    updated_at: new Date().toISOString()
  };

  if (settings.emailEnabled !== undefined) updateData.email_enabled = settings.emailEnabled;
  if (settings.discordEnabled !== undefined) updateData.discord_enabled = settings.discordEnabled;
  if (settings.telegramEnabled !== undefined) updateData.telegram_enabled = settings.telegramEnabled;
  if (settings.entrySignals !== undefined) updateData.entry_signals = settings.entrySignals;
  if (settings.exitSignals !== undefined) updateData.exit_signals = settings.exitSignals;
  if (settings.stopLossAlerts !== undefined) updateData.stop_loss_alerts = settings.stopLossAlerts;
  if (settings.takeProfitAlerts !== undefined) updateData.take_profit_alerts = settings.takeProfitAlerts;
  if (settings.discordWebhookUrl !== undefined) updateData.discord_webhook_url = settings.discordWebhookUrl;
  if (settings.telegramBotToken !== undefined) updateData.telegram_bot_token = settings.telegramBotToken;
  if (settings.telegramChatId !== undefined) updateData.telegramChatId = settings.telegramChatId;

  const { data, error } = await supabase
    .from('notification_settings')
    .upsert(updateData)
    .select()
    .single();

  if (error) {
    console.error('Error saving notification settings:', error);
    throw error;
  }

  return {
    id: data.id,
    userId: data.user_id,
    emailEnabled: data.email_enabled,
    discordEnabled: data.discord_enabled,
    telegramEnabled: data.telegram_enabled,
    entrySignals: data.entry_signals,
    exitSignals: data.exit_signals,
    stopLossAlerts: data.stop_loss_alerts,
    takeProfitAlerts: data.take_profit_alerts,
    discordWebhookUrl: data.discord_webhook_url,
    telegramBotToken: data.telegram_bot_token,
    telegramChatId: data.telegram_chat_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

export const verifyDiscordWebhook = async (webhookUrl: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-discord-webhook', {
      body: { webhookUrl }
    });

    if (error) {
      console.error('Error verifying Discord webhook:', error);
      return false;
    }

    return data?.isValid || false;
  } catch (error) {
    console.error('Error verifying Discord webhook:', error);
    return false;
  }
};

export const verifyTelegramBot = async (botToken: string, chatId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-telegram-bot', {
      body: { botToken, chatId }
    });

    if (error) {
      console.error('Error verifying Telegram bot:', error);
      return false;
    }

    return data?.isValid || false;
  } catch (error) {
    console.error('Error verifying Telegram bot:', error);
    return false;
  }
};

export const sendNotification = async (
  type: 'email' | 'discord' | 'telegram',
  message: string,
  subject?: string
): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  try {
    let functionName: string;
    let body: any;

    switch (type) {
      case 'email':
        functionName = 'send-email-notification';
        body = { message, subject };
        break;
      case 'discord':
        functionName = 'send-discord-notification';
        body = { message };
        break;
      case 'telegram':
        functionName = 'send-telegram-notification';
        body = { message };
        break;
      default:
        throw new Error('Invalid notification type');
    }

    const { data, error } = await supabase.functions.invoke(functionName, { body });

    if (error) {
      console.error(`Error sending ${type} notification:`, error);
      return false;
    }

    return data?.success || false;
  } catch (error) {
    console.error(`Error sending ${type} notification:`, error);
    return false;
  }
};

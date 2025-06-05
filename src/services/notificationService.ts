
import { supabase } from "@/integrations/supabase/client";

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
      // No settings found, return null
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

export const updateNotificationSettings = async (settings: Partial<Omit<NotificationSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<NotificationSettings> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  const updateData: any = {};
  
  if (settings.emailEnabled !== undefined) updateData.email_enabled = settings.emailEnabled;
  if (settings.discordEnabled !== undefined) updateData.discord_enabled = settings.discordEnabled;
  if (settings.telegramEnabled !== undefined) updateData.telegram_enabled = settings.telegramEnabled;
  if (settings.entrySignals !== undefined) updateData.entry_signals = settings.entrySignals;
  if (settings.exitSignals !== undefined) updateData.exit_signals = settings.exitSignals;
  if (settings.stopLossAlerts !== undefined) updateData.stop_loss_alerts = settings.stopLossAlerts;
  if (settings.takeProfitAlerts !== undefined) updateData.take_profit_alerts = settings.takeProfitAlerts;
  if (settings.discordWebhookUrl !== undefined) updateData.discord_webhook_url = settings.discordWebhookUrl;
  if (settings.telegramBotToken !== undefined) updateData.telegram_bot_token = settings.telegramBotToken;
  if (settings.telegramChatId !== undefined) updateData.telegram_chat_id = settings.telegramChatId;

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('notification_settings')
    .upsert({
      ...updateData,
      user_id: user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error updating notification settings:', error);
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

export const sendNotification = async (signalId: string, signalData: any, signalType: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No authenticated user for notification');
    return;
  }

  try {
    const settings = await getNotificationSettings();
    
    if (!settings) {
      console.log('No notification settings found for user');
      return;
    }

    const notifications = [];

    // Send email notification if enabled
    if (settings.emailEnabled) {
      try {
        const { error } = await supabase.functions.invoke('send-email-notification', {
          body: { signalId, signalData: { ...signalData, userId: user.id }, signalType }
        });
        
        if (error) {
          console.error('Email notification error:', error);
        } else {
          notifications.push('email');
        }
      } catch (error) {
        console.error('Email notification failed:', error);
      }
    }

    // Send Discord notification if enabled and webhook URL is set
    if (settings.discordEnabled && settings.discordWebhookUrl) {
      try {
        const { error } = await supabase.functions.invoke('send-discord-notification', {
          body: { 
            webhookUrl: settings.discordWebhookUrl,
            signalId, 
            signalData: { ...signalData, userId: user.id }, 
            signalType 
          }
        });
        
        if (error) {
          console.error('Discord notification error:', error);
        } else {
          notifications.push('discord');
        }
      } catch (error) {
        console.error('Discord notification failed:', error);
      }
    }

    // Send Telegram notification if enabled and bot token/chat ID are set
    if (settings.telegramEnabled && settings.telegramBotToken && settings.telegramChatId) {
      try {
        const { error } = await supabase.functions.invoke('send-telegram-notification', {
          body: { 
            botToken: settings.telegramBotToken,
            chatId: settings.telegramChatId,
            signalId, 
            signalData: { ...signalData, userId: user.id }, 
            signalType 
          }
        });
        
        if (error) {
          console.error('Telegram notification error:', error);
        } else {
          notifications.push('telegram');
        }
      } catch (error) {
        console.error('Telegram notification failed:', error);
      }
    }

    console.log(`Sent ${notifications.length} notifications:`, notifications);

  } catch (error) {
    console.error('Error sending notifications:', error);
  }
};

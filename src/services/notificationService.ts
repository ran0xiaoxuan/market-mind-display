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
  try {
    console.log('Starting Discord webhook verification for:', webhookUrl);
    
    // Basic client-side validation
    if (!webhookUrl.trim()) {
      throw new Error('Please enter a Discord webhook URL');
    }
    
    if (!webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      throw new Error('Invalid Discord webhook URL format. URL should start with: https://discord.com/api/webhooks/');
    }

    const { data, error } = await supabase.functions.invoke('verify-discord-webhook', {
      body: { webhookUrl: webhookUrl.trim() }
    });

    console.log('Discord verification response:', { data, error });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message || 'Failed to verify Discord webhook');
    }

    if (data && data.error) {
      throw new Error(data.error);
    }

    if (!data || !data.verified) {
      throw new Error('Discord webhook verification failed');
    }

    return data;
  } catch (error) {
    console.error('Discord webhook verification error:', error);
    throw error;
  }
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

// Enhanced notification sending with rate limiting and better error handling
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

  try {
    let result;
    
    // Send the notification based on type
    switch (notificationType) {
      case 'email':
        result = await supabase.functions.invoke('send-email-notification', {
          body: { signalId, userEmail: args[0], signalData: args[1], signalType: args[2] }
        });
        break;
      case 'discord':
        result = await supabase.functions.invoke('send-discord-notification', {
          body: { signalId, webhookUrl: args[0], signalData: args[1], signalType: args[2] }
        });
        break;
      case 'telegram':
        result = await supabase.functions.invoke('send-telegram-notification', {
          body: { signalId, botToken: args[0], chatId: args[1], signalData: args[2], signalType: args[3] }
        });
        break;
      default:
        throw new Error(`Unknown notification type: ${notificationType}`);
    }

    if (result.error) {
      throw new Error(result.error.message || `Failed to send ${notificationType} notification`);
    }

    console.log(`${notificationType} notification sent successfully:`, result.data);
    return result;

  } catch (error) {
    console.error(`Error sending ${notificationType} notification:`, error);
    
    // Log the error but don't prevent other notifications from being sent
    try {
      await supabase
        .from('notification_logs')
        .insert({
          user_id: userId,
          signal_id: signalId,
          notification_type: notificationType,
          status: 'failed',
          error_message: error.message
        });
    } catch (logError) {
      console.error('Error logging notification failure:', logError);
    }
    
    throw error;
  }
};

// Helper function to test email notifications - UPDATED VERSION
export const testEmailNotification = async (userEmail: string, signalData: any, signalType: string) => {
  try {
    console.log('Starting test email notification...');
    console.log('Target email:', userEmail);
    console.log('Signal data:', signalData);
    console.log('Signal type:', signalType);

    const requestPayload = {
      signalId: 'test-' + Date.now(),
      userEmail: userEmail,
      signalData: {
        ...signalData,
        strategyName: signalData.strategyName || 'Test Strategy'
      },
      signalType: signalType
    };

    console.log('Calling send-email-notification with payload:', requestPayload);

    // Call the edge function with simplified error handling
    const { data, error } = await supabase.functions.invoke('send-email-notification', {
      body: requestPayload
    });

    console.log('Edge function response data:', data);
    console.log('Edge function response error:', error);

    if (error) {
      console.error('Edge function returned error:', error);
      throw new Error(error.message || 'Failed to send test email via edge function');
    }

    if (data && data.error) {
      console.error('Edge function returned data error:', data.error);
      throw new Error(data.error || 'Failed to send test email');
    }

    console.log('Email sent successfully!');
    return data;

  } catch (error) {
    console.error('Error in testEmailNotification:', error);
    throw error;
  }
};

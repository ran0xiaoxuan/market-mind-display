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

    console.log('Calling verify-discord-webhook function...');

    const { data, error } = await supabase.functions.invoke('verify-discord-webhook', {
      body: { webhookUrl: webhookUrl.trim() }
    });

    console.log('Discord verification response:', { data, error });

    if (error) {
      console.error('Supabase function error:', error);
      
      // Handle specific error types
      if (error.message?.includes('Failed to send a request')) {
        throw new Error('Unable to connect to verification service. Please try again.');
      } else if (error.message?.includes('Failed to fetch')) {
        throw new Error('Network error occurred. Please check your connection and try again.');
      } else {
        throw new Error(error.message || 'Failed to verify Discord webhook');
      }
    }

    if (data && data.error) {
      throw new Error(data.error);
    }

    if (!data || !data.verified) {
      throw new Error('Discord webhook verification failed');
    }

    console.log('Discord webhook verified successfully');
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

// Enhanced function to send notifications with proper signal handling
export const sendNotificationForSignal = async (
  signalId: string,
  userId: string,
  signalData: any,
  signalType: string
) => {
  try {
    console.log('Starting notification delivery for signal:', signalId);
    console.log('Signal data:', signalData);

    // Get user's notification settings
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!settings) {
      console.log('No notification settings found for user:', userId);
      return;
    }

    console.log('User notification settings:', settings);

    // Check if this type of signal should be sent
    const shouldSendEntry = signalType === 'entry' && settings.entry_signals;
    const shouldSendExit = signalType === 'exit' && settings.exit_signals;
    
    if (!shouldSendEntry && !shouldSendExit) {
      console.log(`Signal type ${signalType} not enabled for notifications`);
      return;
    }

    // Prepare enhanced signal data
    const enhancedSignalData = {
      ...signalData,
      signalId: signalId,
      userId: userId,
      timestamp: new Date().toISOString()
    };

    const notifications = [];

    // Send Discord notification
    if (settings.discord_enabled && settings.discord_webhook_url) {
      console.log('Sending Discord notification...');
      try {
        const discordResult = await supabase.functions.invoke('send-discord-notification', {
          body: {
            webhookUrl: settings.discord_webhook_url,
            signalData: enhancedSignalData,
            signalType: signalType
          }
        });
        
        if (discordResult.error) {
          console.error('Discord notification failed:', discordResult.error);
        } else {
          console.log('Discord notification sent successfully');
          notifications.push('discord');
        }
      } catch (error) {
        console.error('Discord notification error:', error);
      }
    }

    // Send Telegram notification
    if (settings.telegram_enabled && settings.telegram_bot_token && settings.telegram_chat_id) {
      console.log('Sending Telegram notification...');
      try {
        const telegramResult = await supabase.functions.invoke('send-telegram-notification', {
          body: {
            botToken: settings.telegram_bot_token,
            chatId: settings.telegram_chat_id,
            signalData: enhancedSignalData,
            signalType: signalType
          }
        });
        
        if (telegramResult.error) {
          console.error('Telegram notification failed:', telegramResult.error);
        } else {
          console.log('Telegram notification sent successfully');
          notifications.push('telegram');
        }
      } catch (error) {
        console.error('Telegram notification error:', error);
      }
    }

    // Send Email notification
    if (settings.email_enabled) {
      console.log('Sending Email notification...');
      try {
        const { data: user } = await supabase.auth.getUser();
        if (user.user?.email) {
          const emailResult = await supabase.functions.invoke('send-email-notification', {
            body: {
              userEmail: user.user.email,
              signalData: enhancedSignalData,
              signalType: signalType
            }
          });
          
          if (emailResult.error) {
            console.error('Email notification failed:', emailResult.error);
          } else {
            console.log('Email notification sent successfully');
            notifications.push('email');
          }
        }
      } catch (error) {
        console.error('Email notification error:', error);
      }
    }

    console.log(`Notifications sent via: ${notifications.join(', ')}`);
    return notifications;

  } catch (error) {
    console.error('Error in sendNotificationForSignal:', error);
    throw error;
  }
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
          body: { webhookUrl: args[0], signalData: args[1], signalType: args[2] }
        });
        break;
      case 'telegram':
        result = await supabase.functions.invoke('send-telegram-notification', {
          body: { botToken: args[0], chatId: args[1], signalData: args[2], signalType: args[3] }
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

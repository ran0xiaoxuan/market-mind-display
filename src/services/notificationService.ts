
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

// Enhanced notification sending with better error handling and logging
export const sendNotificationWithRateLimit = async (
  userId: string,
  notificationType: 'email' | 'discord' | 'telegram',
  signalData: any,
  signalType: string,
  ...args: any[]
) => {
  const rateLimiter = NotificationRateLimiter.getInstance();
  
  if (!rateLimiter.canSendNotification(userId, notificationType)) {
    const timeUntilReset = rateLimiter.getTimeUntilReset(userId, notificationType);
    const minutesUntilReset = Math.ceil(timeUntilReset / (1000 * 60));
    
    throw new Error(`Rate limit exceeded for ${notificationType}. Try again in ${minutesUntilReset} minutes.`);
  }

  console.log(`Sending ${notificationType} notification for signal type: ${signalType}`);
  console.log('Signal data:', signalData);

  try {
    let result;
    
    // Send the notification based on type
    switch (notificationType) {
      case 'email':
        result = await supabase.functions.invoke('send-email-notification', {
          body: { 
            userEmail: args[0], 
            signalData: signalData, 
            signalType: signalType 
          }
        });
        break;
      case 'discord':
        result = await supabase.functions.invoke('send-discord-notification', {
          body: { 
            webhookUrl: args[0], 
            signalData: signalData, 
            signalType: signalType 
          }
        });
        break;
      case 'telegram':
        result = await supabase.functions.invoke('send-telegram-notification', {
          body: { 
            botToken: args[0], 
            chatId: args[1], 
            signalData: signalData, 
            signalType: signalType 
          }
        });
        break;
      default:
        throw new Error(`Unknown notification type: ${notificationType}`);
    }

    console.log(`${notificationType} notification result:`, result);

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
          signal_id: signalData.signalId || `${notificationType}-${Date.now()}`,
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

// Enhanced signal processing with notification sending
export const processSignalAndNotify = async (strategyId: string, signalType: string, signalData: any) => {
  try {
    console.log('Processing signal and sending notifications:', { strategyId, signalType, signalData });

    // Get user ID from strategy
    const { data: strategy } = await supabase
      .from('strategies')
      .select('user_id, name, target_asset, signal_notifications_enabled')
      .eq('id', strategyId)
      .single();

    if (!strategy) {
      throw new Error('Strategy not found');
    }

    if (!strategy.signal_notifications_enabled) {
      console.log('Signal notifications disabled for strategy:', strategyId);
      return;
    }

    const userId = strategy.user_id;

    // Get user's notification settings
    const { data: notificationSettings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!notificationSettings) {
      console.log('No notification settings found for user:', userId);
      return;
    }

    // Check if this signal type should be sent
    const shouldSendEntry = signalType === 'entry' && notificationSettings.entry_signals;
    const shouldSendExit = signalType === 'exit' && notificationSettings.exit_signals;
    
    if (!shouldSendEntry && !shouldSendExit) {
      console.log(`Signal type ${signalType} notifications disabled for user:`, userId);
      return;
    }

    // Enhance signal data with strategy info
    const enhancedSignalData = {
      ...signalData,
      userId: userId,
      strategyId: strategyId,
      strategyName: strategy.name,
      targetAsset: strategy.target_asset,
      signalId: `signal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    console.log('Enhanced signal data:', enhancedSignalData);

    // Send notifications based on user preferences
    const promises = [];

    if (notificationSettings.discord_enabled && notificationSettings.discord_webhook_url) {
      console.log('Sending Discord notification...');
      promises.push(
        sendNotificationWithRateLimit(
          userId,
          'discord',
          enhancedSignalData,
          signalType,
          notificationSettings.discord_webhook_url
        ).catch(error => {
          console.error('Discord notification failed:', error);
          return { type: 'discord', error: error.message };
        })
      );
    }

    if (notificationSettings.telegram_enabled && notificationSettings.telegram_bot_token && notificationSettings.telegram_chat_id) {
      console.log('Sending Telegram notification...');
      promises.push(
        sendNotificationWithRateLimit(
          userId,
          'telegram',
          enhancedSignalData,
          signalType,
          notificationSettings.telegram_bot_token,
          notificationSettings.telegram_chat_id
        ).catch(error => {
          console.error('Telegram notification failed:', error);
          return { type: 'telegram', error: error.message };
        })
      );
    }

    if (notificationSettings.email_enabled) {
      console.log('Sending Email notification...');
      // Get user email
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        promises.push(
          sendNotificationWithRateLimit(
            userId,
            'email',
            enhancedSignalData,
            signalType,
            user.email
          ).catch(error => {
            console.error('Email notification failed:', error);
            return { type: 'email', error: error.message };
          })
        );
      }
    }

    if (promises.length === 0) {
      console.log('No notifications to send - all channels disabled');
      return;
    }

    // Wait for all notifications to complete
    const results = await Promise.all(promises);
    console.log('Notification results:', results);

    // Log summary
    const successful = results.filter(r => !r.error).length;
    const failed = results.filter(r => r.error).length;
    console.log(`Notifications sent: ${successful} successful, ${failed} failed`);

    return results;

  } catch (error) {
    console.error('Error processing signal and notifications:', error);
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

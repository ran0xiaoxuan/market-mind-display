
import { supabase } from "@/integrations/supabase/client";
import { processSignalAndNotify } from "./notificationService";

// Test notification service to help debug notification issues
export const testNotificationSystem = async () => {
  try {
    console.log('=== Testing Notification System ===');

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('Current user:', user.id);

    // Get user's strategies
    const { data: strategies } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', user.id)
      .eq('signal_notifications_enabled', true)
      .limit(1);

    if (!strategies || strategies.length === 0) {
      throw new Error('No strategies with notifications enabled found');
    }

    const strategy = strategies[0];
    console.log('Testing with strategy:', strategy.name);

    // Get user's notification settings
    const { data: notificationSettings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!notificationSettings) {
      throw new Error('No notification settings found');
    }

    console.log('Notification settings:', {
      discord_enabled: notificationSettings.discord_enabled,
      telegram_enabled: notificationSettings.telegram_enabled,
      email_enabled: notificationSettings.email_enabled,
      entry_signals: notificationSettings.entry_signals,
      exit_signals: notificationSettings.exit_signals
    });

    // Create test signal data
    const testSignalData = {
      price: 150.25,
      reason: 'Test signal for debugging',
      timestamp: new Date().toISOString()
    };

    console.log('Sending test entry signal...');

    // Test sending notifications
    const result = await processSignalAndNotify(strategy.id, 'entry', testSignalData);
    
    console.log('Test notification result:', result);
    console.log('=== Notification Test Complete ===');

    return {
      success: true,
      strategy: strategy.name,
      result: result
    };

  } catch (error) {
    console.error('Notification test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Test individual notification channels
export const testDiscordNotification = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: settings } = await supabase
      .from('notification_settings')
      .select('discord_webhook_url')
      .eq('user_id', user.id)
      .single();

    if (!settings?.discord_webhook_url) {
      throw new Error('Discord webhook not configured');
    }

    const testData = {
      userId: user.id,
      strategyName: 'Test Strategy',
      targetAsset: 'AAPL',
      price: 150.25,
      reason: 'Discord test notification',
      signalId: 'test-' + Date.now()
    };

    const { data, error } = await supabase.functions.invoke('send-discord-notification', {
      body: {
        webhookUrl: settings.discord_webhook_url,
        signalData: testData,
        signalType: 'entry'
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Discord test failed:', error);
    throw error;
  }
};

export const testTelegramNotification = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: settings } = await supabase
      .from('notification_settings')
      .select('telegram_bot_token, telegram_chat_id')
      .eq('user_id', user.id)
      .single();

    if (!settings?.telegram_bot_token || !settings?.telegram_chat_id) {
      throw new Error('Telegram bot not configured');
    }

    const testData = {
      userId: user.id,
      strategyName: 'Test Strategy',
      targetAsset: 'AAPL',
      price: 150.25,
      reason: 'Telegram test notification',
      signalId: 'test-' + Date.now()
    };

    const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
      body: {
        botToken: settings.telegram_bot_token,
        chatId: settings.telegram_chat_id,
        signalData: testData,
        signalType: 'entry'
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Telegram test failed:', error);
    throw error;
  }
};

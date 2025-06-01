
import { supabase } from "@/integrations/supabase/client";

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
  const { data: existingSettings } = await supabase
    .from('notification_settings')
    .select('id')
    .single();

  if (existingSettings) {
    const { data, error } = await supabase
      .from('notification_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('notification_settings')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
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

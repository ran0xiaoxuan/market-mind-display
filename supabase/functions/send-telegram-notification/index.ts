
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TelegramNotificationRequest {
  botToken: string;
  chatId: string;
  signalData: any;
  signalType: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { botToken, chatId, signalData, signalType }: TelegramNotificationRequest = await req.json()

    console.log('Processing Telegram notification for signal type:', signalType)
    console.log('Signal data:', signalData)
    console.log('Bot token (first 10 chars):', botToken?.substring(0, 10))
    console.log('Chat ID:', chatId)

    // Validate required parameters
    if (!botToken) {
      console.error('Bot token is missing');
      throw new Error('Bot token is required');
    }
    if (!chatId) {
      console.error('Chat ID is missing');
      throw new Error('Chat ID is required');
    }

    // Get strategy details to include timeframe
    let timeframe = 'Unknown';
    let targetAsset = signalData.targetAsset || signalData.asset || 'Unknown';
    let price = signalData.price || 'N/A';

    if (signalData.strategyId) {
      const { data: strategy } = await supabaseClient
        .from('strategies')
        .select('timeframe, target_asset, target_asset_name')
        .eq('id', signalData.strategyId)
        .single();
      
      if (strategy) {
        timeframe = strategy.timeframe;
        if (strategy.target_asset) {
          targetAsset = strategy.target_asset_name || strategy.target_asset;
        }
      }
    }

    // Use the price from signal data if available
    if (signalData.currentPrice) {
      price = signalData.currentPrice;
    } else if (signalData.price) {
      price = signalData.price;
    }

    // Get user's timezone preference (default to UTC if not set)
    let userTimezone = 'UTC';
    if (signalData.userId) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('timezone')
        .eq('id', signalData.userId)
        .single();
      
      if (profile?.timezone) {
        userTimezone = profile.timezone;
      }
    }

    // Create user-friendly time in user's timezone
    const now = new Date();
    const timeString = now.toLocaleString("en-US", {
      timeZone: userTimezone,
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Create Telegram message with HTML formatting instead of Markdown
    let telegramMessage = `🚨 <b>StratAIge Trading Signal</b>

📊 <b>Signal Type:</b> ${signalType.toUpperCase()}
📈 <b>Strategy:</b> ${signalData.strategyName || 'Trading Strategy'}
💰 <b>Asset:</b> ${targetAsset}
💵 <b>Price:</b> $${price}
⏰ <b>Timeframe:</b> ${timeframe}
🕐 <b>Time:</b> ${timeString}`;

    if (signalData.profitPercentage) {
      telegramMessage += `\n💹 <b>P&L:</b> ${signalData.profitPercentage.toFixed(2)}%`;
    }

    console.log('Sending Telegram message:', telegramMessage);

    // Send to Telegram Bot API with proper error handling
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const telegramPayload = {
      chat_id: chatId,
      text: telegramMessage,
      parse_mode: 'HTML'  // Changed from MarkdownV2 to HTML for better compatibility
    };

    console.log('Telegram API payload:', JSON.stringify(telegramPayload, null, 2));

    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(telegramPayload)
    });

    const telegramResult = await telegramResponse.json();
    console.log('Telegram API response status:', telegramResponse.status);
    console.log('Telegram API response:', telegramResult);

    let status = 'failed';
    let errorMessage = null;

    if (telegramResponse.ok && telegramResult.ok) {
      status = 'sent';
      console.log('Telegram message sent successfully');
    } else {
      // More detailed error logging
      errorMessage = `Telegram API error (${telegramResponse.status}): ${telegramResult.description || telegramResult.error_code || 'Unknown error'}`;
      console.error('Telegram API error details:', {
        status: telegramResponse.status,
        statusText: telegramResponse.statusText,
        result: telegramResult,
        botToken: botToken?.substring(0, 12) + '***',
        chatId: chatId
      });
      
      // Check for common Telegram API errors
      if (telegramResult.error_code === 400) {
        if (telegramResult.description?.includes('chat not found')) {
          errorMessage = 'Chat not found. Please verify your chat ID is correct.';
        } else if (telegramResult.description?.includes('bot was blocked')) {
          errorMessage = 'Bot was blocked by the user. Please unblock the bot and try again.';
        } else if (telegramResult.description?.includes('not enough rights')) {
          errorMessage = 'Bot does not have permission to send messages to this chat.';
        }
      } else if (telegramResult.error_code === 401) {
        errorMessage = 'Invalid bot token. Please verify your bot token is correct.';
      } else if (telegramResult.error_code === 403) {
        errorMessage = 'Bot was blocked or does not have permission to send messages.';
      }
    }

    // Log the notification attempt
    const { error: logError } = await supabaseClient
      .from('notification_logs')
      .insert({
        user_id: signalData.userId,
        signal_id: signalData.signalId || 'telegram-' + Date.now(),
        notification_type: 'telegram',
        status: status,
        error_message: errorMessage
      });

    if (logError) {
      console.error('Error logging Telegram notification:', logError);
    }

    if (status === 'failed') {
      throw new Error(errorMessage || 'Failed to send Telegram message');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Telegram notification sent successfully',
        telegramResponse: telegramResult 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

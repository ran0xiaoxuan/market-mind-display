
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
      throw new Error('Bot token is required');
    }
    if (!chatId) {
      throw new Error('Chat ID is required');
    }

    // Get strategy details to include timeframe
    let timeframe = 'Unknown';
    if (signalData.strategyId) {
      const { data: strategy } = await supabaseClient
        .from('strategies')
        .select('timeframe')
        .eq('id', signalData.strategyId)
        .single();
      
      if (strategy) {
        timeframe = strategy.timeframe;
      }
    }

    // Create user-friendly time in Eastern timezone
    const now = new Date();
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const timeString = easternTime.toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Create Telegram message with proper escaping for Markdown
    let telegramMessage = `🚨 *StratAIge Trading Signal*

📊 *Signal Type:* ${signalType.toUpperCase()}
📈 *Strategy:* ${(signalData.strategyName || 'Trading Strategy').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&')}
💰 *Asset:* ${(signalData.targetAsset || signalData.asset || 'Unknown').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&')}
💵 *Price:* $${signalData.price || 'N/A'}
⏰ *Timeframe:* ${timeframe}
🕐 *Time:* ${timeString}`;

    if (signalData.profitPercentage) {
      telegramMessage += `\n💹 *P&L:* ${signalData.profitPercentage.toFixed(2)}%`;
    }

    console.log('Sending Telegram message:', telegramMessage);

    // Send to Telegram Bot API with proper error handling
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const telegramPayload = {
      chat_id: chatId,
      text: telegramMessage,
      parse_mode: 'MarkdownV2'
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
    console.log('Telegram API response:', telegramResult);

    let status = 'failed';
    let errorMessage = null;

    if (telegramResponse.ok && telegramResult.ok) {
      status = 'sent';
      console.log('Telegram message sent successfully');
    } else {
      errorMessage = `Telegram API error: ${telegramResult.description || telegramResult.error_code || 'Unknown error'}`;
      console.error('Telegram API error:', errorMessage);
      console.error('Full error response:', telegramResult);
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

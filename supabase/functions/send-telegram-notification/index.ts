
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
    console.log('Signal data:', JSON.stringify(signalData, null, 2))
    console.log('Bot token provided:', botToken ? 'Yes' : 'No')
    console.log('Chat ID provided:', chatId ? 'Yes' : 'No')

    if (!botToken) {
      throw new Error('Telegram bot token is required')
    }

    if (!chatId) {
      throw new Error('Telegram chat ID is required')
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

    // Create Telegram message with improved formatting
    let telegramMessage = `
🚨 *StratAIge Trading Signal*

📊 *Signal Type:* ${signalType.toUpperCase()}
📈 *Strategy:* ${signalData.strategyName || 'Trading Strategy'}
💰 *Asset:* ${signalData.targetAsset || signalData.asset || 'Unknown'}
💵 *Price:* $${signalData.price || 'N/A'}
⏰ *Timeframe:* ${timeframe}
🕐 *Time:* ${timeString}`;

    // Add profit information for exit signals
    if (signalType === 'exit' && signalData.profitPercentage !== null && signalData.profitPercentage !== undefined) {
      telegramMessage += `\n💹 *P&L:* ${signalData.profitPercentage.toFixed(2)}%`;
    }

    // Add reason/signal description if available
    if (signalData.reason) {
      telegramMessage += `\n📝 *Reason:* ${signalData.reason}`;
    }

    telegramMessage = telegramMessage.trim();

    console.log('Sending Telegram message:', telegramMessage);

    // Send to Telegram Bot API
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: telegramMessage,
        parse_mode: 'Markdown'
      })
    })

    const telegramResult = await telegramResponse.json()
    console.log('Telegram API response status:', telegramResponse.status);
    console.log('Telegram API response:', JSON.stringify(telegramResult, null, 2));

    const status = telegramResponse.ok ? 'sent' : 'failed'
    const errorMessage = telegramResponse.ok ? null : `Telegram API error: ${telegramResult.description || 'Unknown error'}`

    // Log the notification attempt
    const { error: logError } = await supabaseClient
      .from('notification_logs')
      .insert({
        user_id: signalData.userId,
        signal_id: signalData.signalId || 'telegram-' + Date.now(),
        notification_type: 'telegram',
        status: status,
        error_message: errorMessage
      })

    if (logError) {
      console.error('Error logging Telegram notification:', logError)
    }

    if (!telegramResponse.ok) {
      throw new Error(`Telegram API error: ${telegramResult.description || 'Unknown error'}`)
    }

    console.log('Telegram notification sent successfully')

    return new Response(
      JSON.stringify({ success: true, message: 'Telegram notification sent successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending Telegram notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

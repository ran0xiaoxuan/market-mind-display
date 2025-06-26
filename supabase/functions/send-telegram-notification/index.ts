
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

    // Create Telegram message with improved formatting
    const telegramMessage = `
🚨 *StratAIge Trading Signal*

📊 *Signal Type:* ${signalType.toUpperCase()}
📈 *Strategy:* ${signalData.strategyName || 'Trading Strategy'}
💰 *Asset:* ${signalData.targetAsset || signalData.asset || 'Unknown'}
💵 *Price:* $${signalData.price || 'N/A'}
⏰ *Time:* ${new Date().toLocaleString()}

${signalData.reason ? `📋 *Reason:* ${signalData.reason}` : ''}
${signalData.profitPercentage ? `💹 *P&L:* ${signalData.profitPercentage.toFixed(2)}%` : ''}
    `.trim()

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
    const status = telegramResponse.ok ? 'sent' : 'failed'
    const errorMessage = telegramResponse.ok ? null : `Telegram API error: ${telegramResult.description || 'Unknown error'}`

    // Log the notification attempt
    const { error: logError } = await supabaseClient
      .from('notification_logs')
      .insert({
        user_id: signalData.userId,
        signal_id: 'telegram-' + Date.now(),
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

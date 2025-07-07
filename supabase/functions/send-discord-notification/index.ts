
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DiscordNotificationRequest {
  webhookUrl: string;
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

    const { webhookUrl, signalData, signalType }: DiscordNotificationRequest = await req.json()

    console.log('Processing Discord notification for signal type:', signalType)
    console.log('Signal data:', JSON.stringify(signalData, null, 2))
    console.log('Webhook URL provided:', webhookUrl ? 'Yes' : 'No')

    if (!webhookUrl) {
      throw new Error('Discord webhook URL is required')
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

    // Create Discord embed message with improved formatting
    const discordMessage = {
      embeds: [{
        title: `🚨 StratAIge Trading Signal - ${signalType.toUpperCase()}`,
        color: signalType === 'entry' ? 0x00ff00 : signalType === 'exit' ? 0xff0000 : 0xffff00,
        fields: [
          {
            name: "📊 Strategy",
            value: signalData.strategyName || "Trading Strategy",
            inline: true
          },
          {
            name: "💰 Asset",
            value: signalData.targetAsset || signalData.asset || "Unknown",
            inline: true
          },
          {
            name: "💵 Price",
            value: `$${signalData.price || 'N/A'}`,
            inline: true
          },
          {
            name: "⏰ Timeframe",
            value: timeframe,
            inline: true
          },
          {
            name: "🕐 Time",
            value: timeString,
            inline: true
          }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: "StratAIge Trading Platform",
          icon_url: "https://via.placeholder.com/20x20/1f77b4/ffffff?text=S"
        }
      }]
    }

    // Add profit information for exit signals
    if (signalType === 'exit' && signalData.profitPercentage !== null && signalData.profitPercentage !== undefined) {
      discordMessage.embeds[0].fields.push({
        name: "💹 P&L",
        value: `${signalData.profitPercentage.toFixed(2)}%`,
        inline: true
      });
    }

    // Add reason/signal description if available
    if (signalData.reason) {
      discordMessage.embeds[0].fields.push({
        name: "📝 Signal Reason",
        value: signalData.reason,
        inline: false
      });
    }

    console.log('Sending Discord message:', JSON.stringify(discordMessage, null, 2));

    // Send to Discord webhook
    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordMessage)
    })

    const responseText = await discordResponse.text();
    console.log('Discord API response status:', discordResponse.status);
    console.log('Discord API response:', responseText);

    const status = discordResponse.ok ? 'sent' : 'failed'
    const errorMessage = discordResponse.ok ? null : `Discord API error: ${discordResponse.status} - ${responseText}`

    // Log the notification attempt
    const { error: logError } = await supabaseClient
      .from('notification_logs')
      .insert({
        user_id: signalData.userId,
        signal_id: signalData.signalId || 'discord-' + Date.now(),
        notification_type: 'discord',
        status: status,
        error_message: errorMessage
      })

    if (logError) {
      console.error('Error logging Discord notification:', logError)
    }

    if (!discordResponse.ok) {
      throw new Error(`Discord webhook failed: ${discordResponse.status} - ${responseText}`)
    }

    console.log('Discord notification sent successfully')

    return new Response(
      JSON.stringify({ success: true, message: 'Discord notification sent successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending Discord notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

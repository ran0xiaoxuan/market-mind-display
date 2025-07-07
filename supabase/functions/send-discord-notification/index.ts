
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
    console.log('Signal data:', signalData)

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

    // Create Discord embed message with improved formatting
    const color = signalType === 'entry' ? 0x00ff00 : signalType === 'exit' ? 0xff0000 : 0xffff00;
    
    const discordMessage = {
      embeds: [{
        title: `🚨 Trading Signal Alert - ${signalType.toUpperCase()}`,
        color: color,
        fields: [
          {
            name: "Strategy",
            value: signalData.strategyName || "Trading Strategy",
            inline: true
          },
          {
            name: "Asset",
            value: signalData.targetAsset || signalData.asset || "Unknown",
            inline: true
          },
          {
            name: "Price",
            value: `$${signalData.price || 'N/A'}`,
            inline: true
          },
          {
            name: "Timeframe",
            value: timeframe,
            inline: true
          }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: "StratAIge Trading Platform"
        }
      }]
    }

    // Add profit information for exit signals
    if (signalType === 'exit' && signalData.profitPercentage) {
      discordMessage.embeds[0].fields.push({
        name: "P&L",
        value: `${signalData.profitPercentage.toFixed(2)}%`,
        inline: true
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

    const status = discordResponse.ok ? 'sent' : 'failed'
    let errorMessage = null;

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      errorMessage = `Discord API error: ${discordResponse.status} - ${errorText}`;
      console.error('Discord API error:', errorMessage);
    }

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
      throw new Error(errorMessage)
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


import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { webhookUrl } = await req.json()

    console.log('Verifying Discord webhook:', webhookUrl)

    // Test the webhook with a simple message
    const testMessage = {
      embeds: [{
        title: "🔧 Webhook Verification",
        description: "Your Discord webhook has been successfully verified!",
        color: 0x00ff00,
        timestamp: new Date().toISOString(),
        footer: {
          text: "Trading Signal Bot - Verification"
        }
      }]
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    })

    if (!response.ok) {
      throw new Error(`Webhook verification failed: ${response.status}`)
    }

    console.log('Discord webhook verified successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Discord webhook verified successfully',
        verified: true 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error verifying Discord webhook:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        verified: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

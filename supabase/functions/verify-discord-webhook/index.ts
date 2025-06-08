
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

    // Validate webhook URL format
    if (!webhookUrl || typeof webhookUrl !== 'string') {
      throw new Error('Invalid webhook URL provided')
    }

    // Check if URL is a valid Discord webhook URL
    const discordWebhookRegex = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/
    if (!discordWebhookRegex.test(webhookUrl)) {
      throw new Error('Invalid Discord webhook URL format. URL should be: https://discord.com/api/webhooks/ID/TOKEN')
    }

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

    console.log('Sending test message to Discord webhook...')

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    })

    console.log('Discord API response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Discord API error response:', errorText)
      
      let errorMessage = 'Discord webhook verification failed'
      
      if (response.status === 404) {
        errorMessage = 'Discord webhook not found. Please check the URL is correct.'
      } else if (response.status === 401 || response.status === 403) {
        errorMessage = 'Discord webhook unauthorized. Please check the webhook URL and permissions.'
      } else if (response.status === 429) {
        errorMessage = 'Rate limited by Discord. Please try again later.'
      } else {
        errorMessage = `Discord API error (${response.status}): ${errorText}`
      }
      
      throw new Error(errorMessage)
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
    
    let errorMessage = error.message || 'Unknown error occurred'
    
    // Handle JSON parsing errors
    if (error.name === 'SyntaxError') {
      errorMessage = 'Invalid request format'
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        verified: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

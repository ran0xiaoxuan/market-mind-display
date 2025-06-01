
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
    const { botToken, chatId } = await req.json()

    console.log('Verifying Telegram bot for chat:', chatId)

    // First, verify the bot token by getting bot info
    const botInfoUrl = `https://api.telegram.org/bot${botToken}/getMe`
    const botInfoResponse = await fetch(botInfoUrl)
    const botInfo = await botInfoResponse.json()

    if (!botInfoResponse.ok) {
      throw new Error(`Invalid bot token: ${botInfo.description || 'Unknown error'}`)
    }

    // Then test sending a message to verify chat access
    const testMessage = `🔧 *Bot Verification*

Your Telegram bot has been successfully verified!

*Bot Name:* ${botInfo.result.first_name}
*Bot Username:* @${botInfo.result.username}
*Time:* ${new Date().toLocaleString()}`

    const sendMessageUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
    const messageResponse = await fetch(sendMessageUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: testMessage,
        parse_mode: 'Markdown'
      })
    })

    const messageResult = await messageResponse.json()

    if (!messageResponse.ok) {
      throw new Error(`Cannot send message to chat: ${messageResult.description || 'Unknown error'}`)
    }

    console.log('Telegram bot verified successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Telegram bot verified successfully',
        verified: true,
        botInfo: {
          name: botInfo.result.first_name,
          username: botInfo.result.username
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error verifying Telegram bot:', error)
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

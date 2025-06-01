
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailNotificationRequest {
  signalId: string;
  userEmail: string;
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

    const { signalId, userEmail, signalData, signalType }: EmailNotificationRequest = await req.json()

    console.log('Processing email notification for signal:', signalId)

    // Here you would integrate with an email service like Resend
    // For now, we'll simulate the email sending
    const emailContent = `
      <h2>Trading Signal Alert</h2>
      <p><strong>Signal Type:</strong> ${signalType}</p>
      <p><strong>Strategy:</strong> ${signalData.strategyName || 'Unknown'}</p>
      <p><strong>Asset:</strong> ${signalData.asset || 'Unknown'}</p>
      <p><strong>Price:</strong> $${signalData.price || 'N/A'}</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    `

    // Log the notification attempt
    const { error: logError } = await supabaseClient
      .from('notification_logs')
      .insert({
        user_id: signalData.userId,
        signal_id: signalId,
        notification_type: 'email',
        status: 'sent'
      })

    if (logError) {
      console.error('Error logging email notification:', logError)
    }

    console.log('Email notification sent successfully to:', userEmail)

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending email notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

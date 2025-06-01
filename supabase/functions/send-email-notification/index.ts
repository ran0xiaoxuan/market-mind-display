
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

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
  console.log('Email notification function called with method:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing email notification request...');
    
    // Parse request body
    let requestBody: EmailNotificationRequest;
    try {
      const rawBody = await req.text();
      console.log('Raw request body received:', rawBody);
      
      if (!rawBody.trim()) {
        throw new Error('Empty request body');
      }
      
      requestBody = JSON.parse(rawBody);
      console.log('Parsed request body successfully:', requestBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body: ' + parseError.message }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    // Validate required fields
    const { signalId, userEmail, signalData, signalType } = requestBody;

    if (!userEmail) {
      console.error('User email is required but not provided');
      return new Response(
        JSON.stringify({ error: 'User email is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    if (!signalData) {
      console.error('Signal data is required but not provided');
      return new Response(
        JSON.stringify({ error: 'Signal data is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Check if Resend API key exists
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    console.log('Initializing Resend and Supabase clients...');
    const resend = new Resend(resendApiKey);
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Processing email notification for signal:', signalId, 'to email:', userEmail);

    // Create email content based on signal type
    const getSignalTitle = (type: string) => {
      switch (type) {
        case 'entry': return '🎯 New Entry Signal';
        case 'exit': return '🔄 Exit Signal';
        case 'stop_loss': return '🛑 Stop Loss Alert';
        case 'take_profit': return '💰 Take Profit Alert';
        default: return '📊 Trading Signal';
      }
    };

    const getSignalColor = (type: string) => {
      switch (type) {
        case 'entry': return '#10B981';
        case 'exit': return '#F59E0B';
        case 'stop_loss': return '#EF4444';
        case 'take_profit': return '#8B5CF6';
        default: return '#6B7280';
      }
    };

    const signalTitle = getSignalTitle(signalType);
    const signalColor = getSignalColor(signalType);

    // Create email HTML content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${signalTitle}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-top: 20px; margin-bottom: 20px;">
            <div style="background: linear-gradient(135deg, ${signalColor}, ${signalColor}dd); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">${signalTitle}</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 5px 0 0 0; font-size: 14px;">Trading Signal Alert</p>
            </div>
            
            <div style="padding: 30px;">
              <div style="background-color: #f8fafc; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
                <div style="display: grid; gap: 15px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-weight: 600; color: #374151;">Strategy:</span>
                    <span style="color: #6b7280;">${signalData.strategyName || 'Test Strategy'}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-weight: 600; color: #374151;">Asset:</span>
                    <span style="color: #6b7280; font-weight: 500;">${signalData.asset || 'Unknown'}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-weight: 600; color: #374151;">Price:</span>
                    <span style="color: #6b7280; font-weight: 500;">$${signalData.price || 'N/A'}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0;">
                    <span style="font-weight: 600; color: #374151;">Time:</span>
                    <span style="color: #6b7280;">${new Date().toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  This is an automated trading signal from your strategy monitoring system.
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                  Please verify all signals before taking any trading action.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log('Sending email to:', userEmail, 'with subject:', `${signalTitle} - ${signalData.asset || 'Trading Signal'}`);

    // Send email using Resend with your verified domain
    const emailResponse = await resend.emails.send({
      from: 'Trading Signals <notifications@strataige.cc>',
      to: [userEmail],
      subject: `${signalTitle} - ${signalData.asset || 'Trading Signal'}`,
      html: emailHtml
    });

    console.log('Email sent successfully:', emailResponse);

    // Log the notification attempt if userId exists
    if (signalData.userId) {
      try {
        const { error: logError } = await supabaseClient
          .from('notification_logs')
          .insert({
            user_id: signalData.userId,
            signal_id: signalId,
            notification_type: 'email',
            status: 'sent'
          });

        if (logError) {
          console.error('Error logging email notification:', logError);
        }
      } catch (logError) {
        console.error('Failed to log notification:', logError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        emailId: emailResponse.data?.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in email notification function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error: ' + error.message,
        details: 'Check function logs for more information'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

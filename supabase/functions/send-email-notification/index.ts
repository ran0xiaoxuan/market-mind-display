
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

  let requestBody: EmailNotificationRequest | null = null;
  
  try {
    console.log('Processing email notification request...');
    
    // Parse request body once
    const rawBody = await req.text();
    console.log('Raw request body:', rawBody);
    
    try {
      requestBody = JSON.parse(rawBody);
      console.log('Parsed request body:', requestBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
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
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    const resend = new Resend(resendApiKey);
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Validate request body structure
    if (!requestBody || typeof requestBody !== 'object') {
      console.error('Request body is not a valid object:', requestBody);
      return new Response(
        JSON.stringify({ error: 'Invalid request body format' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    const { signalId, userEmail, signalData, signalType } = requestBody;

    if (!userEmail) {
      console.error('User email is required but not provided. Request body:', requestBody);
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
        case 'entry': return '#10B981'; // green
        case 'exit': return '#F59E0B'; // amber
        case 'stop_loss': return '#EF4444'; // red
        case 'take_profit': return '#8B5CF6'; // purple
        default: return '#6B7280'; // gray
      }
    };

    const signalTitle = getSignalTitle(signalType);
    const signalColor = getSignalColor(signalType);

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
            <!-- Header -->
            <div style="background: linear-gradient(135deg, ${signalColor}, ${signalColor}dd); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">${signalTitle}</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 5px 0 0 0; font-size: 14px;">Trading Signal Alert</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <div style="background-color: #f8fafc; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
                <div style="display: grid; gap: 15px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-weight: 600; color: #374151;">Strategy:</span>
                    <span style="color: #6b7280;">${signalData.strategyName || 'Unknown'}</span>
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
              
              ${signalData.conditions && signalData.conditions.length > 0 ? `
                <div style="margin-bottom: 25px;">
                  <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">Signal Conditions:</h3>
                  <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
                    ${signalData.conditions.map((condition: string) => `<li style="margin-bottom: 5px;">${condition}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
              
              ${signalData.confidence ? `
                <div style="margin-bottom: 25px;">
                  <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 16px;">Confidence Level:</h3>
                  <div style="background-color: #f3f4f6; border-radius: 6px; padding: 8px;">
                    <div style="background-color: ${signalColor}; height: 8px; border-radius: 4px; width: ${Math.round(signalData.confidence * 100)}%;"></div>
                    <span style="color: #6b7280; font-size: 14px; margin-top: 5px; display: block;">${Math.round(signalData.confidence * 100)}%</span>
                  </div>
                </div>
              ` : ''}
              
              <!-- Footer -->
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

    console.log('Sending email to:', userEmail);

    // Send email using Resend with your verified domain
    const emailResponse = await resend.emails.send({
      from: 'Trading Signals <notifications@strataige.cc>',
      to: [userEmail],
      subject: `${signalTitle} - ${signalData.asset || 'Trading Signal'}`,
      html: emailHtml
    });

    console.log('Email sent successfully:', emailResponse);

    // Log the notification attempt only if signalData.userId exists
    if (signalData.userId) {
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
    }

    console.log('Email notification sent successfully to:', userEmail);

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
    console.error('Error sending email notification:', error);
    
    // Log the failed notification if we have enough data
    if (requestBody?.signalData?.userId) {
      try {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await supabaseClient
          .from('notification_logs')
          .insert({
            user_id: requestBody.signalData.userId,
            signal_id: requestBody.signalId,
            notification_type: 'email',
            status: 'failed',
            error_message: error.message
          });
      } catch (logError) {
        console.error('Error logging failed email notification:', logError);
      }
    }

    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check function logs for more information'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

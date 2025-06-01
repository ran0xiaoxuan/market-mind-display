
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
  console.log('=== Email Notification Function Started ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    console.log('Invalid method:', req.method);
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405 
      }
    );
  }

  try {
    console.log('Processing email notification request...');
    
    // Get and validate environment variables first
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('Environment check:');
    console.log('- RESEND_API_KEY exists:', !!resendApiKey);
    console.log('- SUPABASE_URL exists:', !!supabaseUrl);
    console.log('- SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseServiceKey);

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Email service not configured - missing RESEND_API_KEY' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // Parse request body with comprehensive error handling
    let requestBody: EmailNotificationRequest;
    try {
      const bodyText = await req.text();
      console.log('Raw request body:', bodyText);
      
      if (!bodyText || bodyText.trim() === '') {
        throw new Error('Request body is empty');
      }
      
      requestBody = JSON.parse(bodyText);
      console.log('Parsed request body:', requestBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body', 
          details: parseError.message 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    // Validate required fields
    const { signalId, userEmail, signalData, signalType } = requestBody;

    console.log('Validating request fields:');
    console.log('- signalId:', signalId);
    console.log('- userEmail:', userEmail);
    console.log('- signalType:', signalType);
    console.log('- signalData:', signalData);

    if (!userEmail) {
      console.error('User email is required but not provided');
      return new Response(
        JSON.stringify({ error: 'userEmail is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    if (!signalData) {
      console.error('Signal data is required but not provided');
      return new Response(
        JSON.stringify({ error: 'signalData is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Initialize Resend
    console.log('Initializing Resend...');
    const resend = new Resend(resendApiKey);

    // Initialize Supabase client if available
    let supabaseClient = null;
    if (supabaseUrl && supabaseServiceKey) {
      console.log('Initializing Supabase client...');
      supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    }

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

    const signalTitle = getSignalTitle(signalType || 'entry');
    const signalColor = getSignalColor(signalType || 'entry');

    // Create comprehensive email HTML content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${signalTitle}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, ${signalColor}, ${signalColor}dd); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">${signalTitle}</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 5px 0 0 0; font-size: 14px;">Trading Signal Alert from Strataige</p>
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
                  This is an automated trading signal from your Strataige strategy monitoring system.
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

    const emailSubject = `${signalTitle} - ${signalData.asset || 'Trading Signal'}`;
    const fromEmail = 'notifications@strataige.cc';

    console.log('Preparing to send email:');
    console.log('- From:', fromEmail);
    console.log('- To:', userEmail);
    console.log('- Subject:', emailSubject);

    // Send email using Resend with comprehensive error handling
    try {
      console.log('Calling Resend API...');
      const emailResponse = await resend.emails.send({
        from: fromEmail,
        to: [userEmail],
        subject: emailSubject,
        html: emailHtml
      });

      console.log('Resend API response:', emailResponse);

      if (emailResponse.error) {
        console.error('Resend API returned error:', emailResponse.error);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to send email via Resend', 
            details: emailResponse.error,
            from: fromEmail,
            to: userEmail
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }

      console.log('Email sent successfully! Email ID:', emailResponse.data?.id);

      // Log the notification attempt if possible
      if (supabaseClient && signalData.userId) {
        try {
          console.log('Logging notification to database...');
          const { error: logError } = await supabaseClient
            .from('notification_logs')
            .insert({
              user_id: signalData.userId,
              signal_id: signalId || 'test-' + Date.now(),
              notification_type: 'email',
              status: 'sent'
            });

          if (logError) {
            console.error('Error logging email notification:', logError);
          } else {
            console.log('Successfully logged notification to database');
          }
        } catch (logError) {
          console.error('Failed to log notification:', logError);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email sent successfully',
          emailId: emailResponse.data?.id,
          from: fromEmail,
          to: userEmail
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );

    } catch (resendError) {
      console.error('Error calling Resend API:', resendError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send email', 
          details: resendError.message,
          type: 'resend_api_error',
          from: fromEmail,
          to: userEmail
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

  } catch (error) {
    console.error('Unexpected error in email notification function:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        type: 'unexpected_error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});


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
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200
    });
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
    
    // Get environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    console.log('Environment check:');
    console.log('- RESEND_API_KEY exists:', !!resendApiKey);
    console.log('- RESEND_API_KEY length:', resendApiKey ? resendApiKey.length : 0);

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

    // Parse request body
    let requestBody: EmailNotificationRequest;
    try {
      const bodyText = await req.text();
      console.log('Raw request body length:', bodyText.length);
      console.log('Raw request body preview:', bodyText.substring(0, 200));
      
      if (!bodyText || bodyText.trim() === '') {
        throw new Error('Request body is empty');
      }
      
      requestBody = JSON.parse(bodyText);
      console.log('Parsed request body successfully');
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
    console.log('- signalData exists:', !!signalData);

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
    console.log('Initializing Resend with API key...');
    const resend = new Resend(resendApiKey);

    // Create email content
    const getSignalTitle = (type: string) => {
      switch (type) {
        case 'entry': return '🎯 New Entry Signal';
        case 'exit': return '🔄 Exit Signal';
        case 'stop_loss': return '🛑 Stop Loss Alert';
        case 'take_profit': return '💰 Take Profit Alert';
        default: return '📊 Trading Signal';
      }
    };

    const signalTitle = getSignalTitle(signalType || 'entry');
    const emailSubject = `${signalTitle} - ${signalData.asset || 'Test Signal'}`;
    const fromEmail = 'onboarding@resend.dev';

    // Create email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1f2937;">${signalTitle}</h1>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Strategy:</strong> ${signalData.strategyName || 'Test Strategy'}</p>
          <p><strong>Asset:</strong> ${signalData.asset || 'Unknown'}</p>
          <p><strong>Price:</strong> $${signalData.price || 'N/A'}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>This is a test email from your Strataige notification system.</p>
        <p style="color: #6b7280; font-size: 14px;">Signal ID: ${signalId}</p>
      </div>
    `;

    console.log('Email details:');
    console.log('- From:', fromEmail);
    console.log('- To:', userEmail);
    console.log('- Subject:', emailSubject);

    try {
      console.log('Calling Resend API...');
      const emailResponse = await resend.emails.send({
        from: fromEmail,
        to: [userEmail],
        subject: emailSubject,
        html: emailHtml
      });

      console.log('Resend API response:', JSON.stringify(emailResponse, null, 2));

      if (emailResponse.error) {
        console.error('Resend API returned error:', emailResponse.error);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to send email via Resend', 
            details: emailResponse.error
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }

      console.log('Email sent successfully! Email ID:', emailResponse.data?.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email sent successfully',
          emailId: emailResponse.data?.id,
          resendResponse: emailResponse.data
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );

    } catch (resendError) {
      console.error('Error calling Resend API:', resendError);
      console.error('Resend error details:', JSON.stringify(resendError, null, 2));
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send email', 
          details: resendError.message,
          resendError: resendError
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
        stack: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});


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
    
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

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

    // Create email content with improved deliverability
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
    
    // Use a proper sender name and email (will use default until custom domain is set up)
    const fromEmail = 'Strataige <notifications@resend.dev>';
    const replyToEmail = 'noreply@resend.dev';

    // Create professional email HTML with improved deliverability
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${signalTitle}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container { 
            background-color: white; 
            padding: 30px; 
            border-radius: 8px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #e9ecef; 
            padding-bottom: 20px; 
            margin-bottom: 20px;
          }
          .signal-data { 
            background-color: #f8f9fa; 
            padding: 20px; 
            border-radius: 6px; 
            margin: 20px 0;
            border-left: 4px solid #007bff;
          }
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #e9ecef; 
            font-size: 12px; 
            color: #6c757d;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 10px 0;
          }
          .signal-meta {
            font-size: 11px;
            color: #6c757d;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #1f2937; margin: 0;">${signalTitle}</h1>
            <p style="margin: 5px 0 0 0; color: #6c757d;">Strataige Trading Platform</p>
          </div>
          
          <div class="signal-data">
            <h3 style="margin-top: 0; color: #495057;">Signal Details</h3>
            <p><strong>Strategy:</strong> ${signalData.strategyName || 'Test Strategy'}</p>
            <p><strong>Asset:</strong> ${signalData.asset || 'Unknown'}</p>
            <p><strong>Price:</strong> $${signalData.price || 'N/A'}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Signal Type:</strong> ${signalType || 'entry'}</p>
          </div>

          <p>This trading signal was generated by your Strataige strategy. Please review the signal details and take appropriate action based on your trading plan.</p>
          
          <div style="text-align: center;">
            <a href="https://app.strataige.com/dashboard" class="button">View Dashboard</a>
          </div>

          <div class="signal-meta">
            <p><strong>Signal ID:</strong> ${signalId}</p>
            <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
          </div>

          <div class="footer">
            <p><strong>Strataige Trading Platform</strong></p>
            <p>This email was sent to ${userEmail} because you have notifications enabled for your trading strategies.</p>
            <p>
              <a href="https://app.strataige.com/settings" style="color: #007bff;">Manage Notifications</a> | 
              <a href="mailto:support@strataige.com" style="color: #007bff;">Contact Support</a>
            </p>
            <p style="margin-top: 15px;">
              © ${new Date().getFullYear()} Strataige. All rights reserved.<br>
              If you no longer wish to receive these emails, you can 
              <a href="https://app.strataige.com/settings" style="color: #007bff;">update your notification preferences</a>.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create plain text version for better deliverability
    const emailText = `
${signalTitle}

Strategy: ${signalData.strategyName || 'Test Strategy'}
Asset: ${signalData.asset || 'Unknown'}
Price: $${signalData.price || 'N/A'}
Time: ${new Date().toLocaleString()}
Signal Type: ${signalType || 'entry'}

This trading signal was generated by your Strataige strategy.

View your dashboard: https://app.strataige.com/dashboard

Signal ID: ${signalId}
Generated: ${new Date().toISOString()}

---
Strataige Trading Platform
© ${new Date().getFullYear()} Strataige. All rights reserved.

Manage your notifications: https://app.strataige.com/settings
    `;

    console.log('Email details:');
    console.log('- From:', fromEmail);
    console.log('- Reply-To:', replyToEmail);
    console.log('- To:', userEmail);
    console.log('- Subject:', emailSubject);

    try {
      console.log('Calling Resend API with improved deliverability settings...');
      const emailResponse = await resend.emails.send({
        from: fromEmail,
        to: [userEmail],
        replyTo: replyToEmail,
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
        headers: {
          'X-Entity-Ref-ID': signalId,
          'X-Mailer': 'Strataige-Platform',
          'List-Unsubscribe': '<https://app.strataige.com/settings>',
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
        tags: [
          {
            name: 'category',
            value: 'trading-signal'
          },
          {
            name: 'signal-type',
            value: signalType || 'entry'
          }
        ]
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
          deliverabilityFeatures: {
            hasTextVersion: true,
            hasUnsubscribeHeader: true,
            hasProfessionalFormatting: true,
            hasReplyTo: true,
            hasEmailTags: true
          }
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
          details: resendError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

  } catch (error) {
    console.error('Unexpected error in email notification function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

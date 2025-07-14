
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailNotificationRequest {
  userEmail: string;
  signalData: any;
  signalType: string;
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

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

    const { userEmail, signalData, signalType }: EmailNotificationRequest = await req.json()

    console.log('Processing email notification for signal type:', signalType)
    console.log('Signal data received:', signalData)

    // Extract data from the enhanced signal data that was prepared in the notification service
    const strategyName = signalData.strategyName || 'Trading Strategy';
    const targetAsset = signalData.targetAsset || 'Unknown';
    const timeframe = signalData.timeframe || 'Unknown';
    const price = signalData.currentPrice || signalData.price || 'N/A';
    const userTimezone = signalData.userTimezone || 'UTC';

    console.log('Extracted data - Strategy:', strategyName, 'Asset:', targetAsset, 'Price:', price, 'Timezone:', userTimezone);

    // Format time according to user's timezone
    const now = new Date();
    const timeString = now.toLocaleString("en-US", {
      timeZone: userTimezone,
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Create the email HTML content
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StratAIge Trading Signal</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .signal-alert {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 30px;
        }
        .signal-title {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
        }
        .signal-type {
            font-size: 18px;
            margin: 5px 0 0 0;
            opacity: 0.9;
        }
        .signal-details {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: #4a5568;
        }
        .detail-value {
            color: #2d3748;
        }
        .profit-positive {
            color: #38a169;
            font-weight: bold;
        }
        .profit-negative {
            color: #e53e3e;
            font-weight: bold;
        }
        .community-section {
            background-color: #f7fafc;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin-bottom: 30px;
        }
        .community-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #2d3748;
        }
        .community-links {
            display: block;
            text-align: center;
            margin-bottom: 15px;
        }
        .community-link {
            display: inline-block;
            margin: 10px;
            padding: 12px 20px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            color: white;
            min-width: 100px;
            text-align: center;
        }
        .discord-link {
            background-color: #5865f2;
        }
        .x-link {
            background-color: #000000;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 14px;
        }
        .footer-links {
            margin-top: 10px;
        }
        .footer-link {
            color: #4299e1;
            text-decoration: none;
            margin: 0 10px;
        }
        .footer-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="signal-alert">
            <h1 class="signal-title">🚨 StratAIge Trading Signal Alert</h1>
            <p class="signal-type">${signalType.toUpperCase()} Signal</p>
        </div>
        
        <div class="signal-details">
            <div class="detail-row">
                <span class="detail-label">Strategy:</span>
                <span class="detail-value">${strategyName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Asset:</span>
                <span class="detail-value">${targetAsset}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Price:</span>
                <span class="detail-value">${price !== 'N/A' ? `$${price}` : 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Timeframe:</span>
                <span class="detail-value">${timeframe}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Time (${userTimezone}):</span>
                <span class="detail-value">${timeString}</span>
            </div>
            ${signalData.profitPercentage ? `
            <div class="detail-row">
                <span class="detail-label">P&L:</span>
                <span class="detail-value ${signalData.profitPercentage >= 0 ? 'profit-positive' : 'profit-negative'}">
                    ${signalData.profitPercentage.toFixed(2)}%
                </span>
            </div>
            ` : ''}
        </div>
        
        <div class="community-section">
            <h3 class="community-title">Join Our Community</h3>
            <div class="community-links">
                <a href="https://discord.com/invite/EEEnGUwDEF" class="community-link discord-link">
                    Discord
                </a>
                <a href="https://x.com/StratAIge_cc" class="community-link x-link">
                    X (Twitter)
                </a>
            </div>
            <p style="margin: 0; color: #718096; font-size: 14px;">
                Connect with other traders and get the latest updates
            </p>
        </div>
        
        <div class="footer">
            <p>This signal was generated by your StratAIge trading strategy.</p>
            <div class="footer-links">
                <a href="https://www.strataige.cc/terms-of-service" class="footer-link">Terms of Service</a>
                <a href="https://www.strataige.cc/privacy-policy" class="footer-link">Privacy Policy</a>
            </div>
            <p style="margin-top: 15px; font-size: 12px;">
                © 2024 StratAIge. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
    `;

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: 'StratAIge <notifications@strataige.cc>',
      to: [userEmail],
      subject: `🚨 StratAIge ${signalType.toUpperCase()} Signal - ${strategyName}`,
      html: emailHtml
    });

    const status = emailResponse.error ? 'failed' : 'sent';
    const errorMessage = emailResponse.error ? `Email API error: ${emailResponse.error.message}` : null;

    // Fix: Only log if we have a valid UUID signal_id, otherwise skip logging
    if (signalData.signalId && signalData.signalId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      const { error: logError } = await supabaseClient
        .from('notification_logs')
        .insert({
          user_id: signalData.userId,
          signal_id: signalData.signalId,
          notification_type: 'email',
          status: status,
          error_message: errorMessage
        });

      if (logError) {
        console.error('Error logging email notification:', logError);
      }
    } else {
      console.log('Skipping notification log - invalid or missing signal_id:', signalData.signalId)
    }

    if (emailResponse.error) {
      throw new Error(`Email API error: ${emailResponse.error.message}`);
    }

    console.log('Email notification sent successfully with strategy:', strategyName, 'price:', price, 'timezone:', userTimezone);

    return new Response(
      JSON.stringify({ success: true, message: 'Email notification sent successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error sending email notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

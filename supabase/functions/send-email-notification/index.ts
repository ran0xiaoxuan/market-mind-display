
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

    // Get strategy details to include timeframe
    let timeframe = 'Unknown';
    if (signalData.strategyId) {
      const { data: strategy } = await supabaseClient
        .from('strategies')
        .select('timeframe')
        .eq('id', signalData.strategyId)
        .single();
      
      if (strategy) {
        timeframe = strategy.timeframe;
      }
    }

    // Create user-friendly time in market timezone (EST/EDT)
    const now = new Date();
    const marketTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    
    // Determine if we're in EST or EDT
    const isEST = marketTime.getTimezoneOffset() === 300; // EST is UTC-5 (300 minutes)
    const timezoneAbbr = isEST ? 'EST' : 'EDT';
    
    const timeString = marketTime.toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }) + ` ${timezoneAbbr}`;

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
        .logo {
            max-width: 180px;
            height: auto;
            margin-bottom: 20px;
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
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 15px;
        }
        .community-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 12px 20px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.2s;
            width: 120px;
            height: 44px;
        }
        .discord-link {
            background-color: #5865f2;
            color: white;
        }
        .x-link {
            background-color: #000000;
            color: white;
        }
        .social-icon {
            width: 20px;
            height: 20px;
            fill: currentColor;
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
        @media (max-width: 600px) {
            .community-links {
                flex-direction: column;
                align-items: center;
            }
            .community-link {
                width: 200px;
                margin-bottom: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://www.strataige.cc/wp-content/uploads/2024/12/strataige-logo.png" alt="StratAIge Logo" class="logo" />
        </div>
        
        <div class="signal-alert">
            <h1 class="signal-title">🚨 Trading Signal Alert</h1>
            <p class="signal-type">${signalType.toUpperCase()} Signal</p>
        </div>
        
        <div class="signal-details">
            <div class="detail-row">
                <span class="detail-label">Strategy:</span>
                <span class="detail-value">${signalData.strategyName || 'Trading Strategy'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Asset:</span>
                <span class="detail-value">${signalData.targetAsset || signalData.asset || 'Unknown'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Price:</span>
                <span class="detail-value">$${signalData.price || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Timeframe:</span>
                <span class="detail-value">${timeframe}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Time:</span>
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
                    <svg class="social-icon" viewBox="0 0 24 24">
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9554 2.4189-2.1568 2.4189z"/>
                    </svg>
                </a>
                <a href="https://x.com/StratAIge_cc" class="community-link x-link">
                    <svg class="social-icon" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
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
      subject: `🚨 StratAIge ${signalType.toUpperCase()} Signal - ${signalData.strategyName || 'Trading Strategy'}`,
      html: emailHtml
    });

    const status = emailResponse.error ? 'failed' : 'sent';
    const errorMessage = emailResponse.error ? `Email API error: ${emailResponse.error.message}` : null;

    // Log the notification attempt
    const { error: logError } = await supabaseClient
      .from('notification_logs')
      .insert({
        user_id: signalData.userId,
        signal_id: 'email-' + Date.now(),
        notification_type: 'email',
        status: status,
        error_message: errorMessage
      });

    if (logError) {
      console.error('Error logging email notification:', logError);
    }

    if (emailResponse.error) {
      throw new Error(`Email API error: ${emailResponse.error.message}`);
    }

    console.log('Email notification sent successfully');

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

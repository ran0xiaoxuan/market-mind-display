
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Sending test email notification...');

    // Mock signal data for testing
    const mockSignalData = {
      strategyName: 'AAPL RSI Strategy (Test)',
      targetAsset: 'AAPL',
      price: 182.45,
      profitPercentage: 5.67,
      userId: 'test-user-id'
    };

    const signalType = 'entry';
    const userEmail = 'ran0xiaoxuan@gmail.com';

    // Create user-friendly time in Eastern timezone
    const now = new Date();
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const timeString = easternTime.toLocaleString("en-US", {
      timeZone: "America/New_York",
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
            display: inline-block;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.2s;
        }
        .discord-link {
            background-color: #5865f2;
            color: white;
        }
        .x-link {
            background-color: #000000;
            color: white;
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
            <img src="https://fjbdvtlfgqbvgamomixo.supabase.co/storage/v1/object/public/avatars/strataige-logo.png" alt="StratAIge Logo" class="logo" />
        </div>
        
        <div class="signal-alert">
            <h1 class="signal-title">🚨 Trading Signal Alert</h1>
            <p class="signal-type">${signalType.toUpperCase()} Signal (TEST EMAIL)</p>
        </div>
        
        <div class="signal-details">
            <div class="detail-row">
                <span class="detail-label">Strategy:</span>
                <span class="detail-value">${mockSignalData.strategyName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Asset:</span>
                <span class="detail-value">${mockSignalData.targetAsset}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Price:</span>
                <span class="detail-value">$${mockSignalData.price}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Timeframe:</span>
                <span class="detail-value">Daily</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${timeString}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">P&L:</span>
                <span class="detail-value profit-positive">
                    +${mockSignalData.profitPercentage.toFixed(2)}%
                </span>
            </div>
        </div>
        
        <div class="community-section">
            <h3 class="community-title">Join Our Community</h3>
            <div class="community-links">
                <a href="https://discord.com/invite/EEEnGUwDEF" class="community-link discord-link">
                    Join Discord
                </a>
                <a href="https://x.com/StratAIge_cc" class="community-link x-link">
                    Follow on X
                </a>
            </div>
            <p style="margin: 0; color: #718096; font-size: 14px;">
                Connect with other traders and get the latest updates
            </p>
        </div>
        
        <div class="footer">
            <p>This is a test email for signal template verification.</p>
            <div class="footer-links">
                <a href="https://strataige.lovable.app/terms" class="footer-link">Terms of Service</a>
                <a href="https://strataige.lovable.app/privacy" class="footer-link">Privacy Policy</a>
            </div>
            <p style="margin-top: 15px; font-size: 12px;">
                © 2024 StratAIge. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
    `;

    // Send test email using Resend
    const emailResponse = await resend.emails.send({
      from: 'StratAIge <notifications@strataige.cc>',
      to: [userEmail],
      subject: '🚨 TEST - StratAIge ENTRY Signal Template Verification',
      html: emailHtml
    });

    if (emailResponse.error) {
      throw new Error(`Email API error: ${emailResponse.error.message}`);
    }

    console.log('Test email sent successfully to:', userEmail);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Test email sent successfully to ${userEmail}`,
        emailId: emailResponse.data?.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error sending test email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

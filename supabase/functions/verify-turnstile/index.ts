
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-my-custom-header',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface TurnstileVerifyRequest {
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('=== Turnstile Verify Function Started ===');
  console.log('Request method:', req.method);
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Method not allowed',
        message: 'Only POST requests are supported'
      }),
      { 
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }

  try {
    console.log('Processing Turnstile verification...');
    
    const body = await req.json();
    const { token }: TurnstileVerifyRequest = body;
    
    console.log('Token received:', !!token);
    
    if (!token) {
      console.error('No token provided');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token is required' 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    const secretKey = Deno.env.get('TURNSTILE_SECRET_KEY');
    console.log('Secret key exists:', !!secretKey);
    
    if (!secretKey) {
      console.error('TURNSTILE_SECRET_KEY not found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error' 
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    console.log('Verifying token with Cloudflare...');
    
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const outcome = await result.json();
    console.log('Turnstile verification result:', outcome);

    return new Response(
      JSON.stringify({ 
        success: outcome.success,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
    
  } catch (error: any) {
    console.error('Error verifying Turnstile token:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Verification failed',
        details: error?.message || 'Unknown error'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
};

console.log('=== Starting verify-turnstile function ===');
serve(handler);

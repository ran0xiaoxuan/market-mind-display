
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const handler = async (req: Request): Promise<Response> => {
  console.log('Turnstile key request received:', req.method, req.url);
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return new Response(
      JSON.stringify({ 
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
    console.log('Processing POST request for Turnstile site key...');
    console.log('Environment check - TURNSTILE_SITE_KEY exists:', !!Deno.env.get('TURNSTILE_SITE_KEY'));
    
    const siteKey = Deno.env.get('TURNSTILE_SITE_KEY');
    
    if (!siteKey) {
      console.error('TURNSTILE_SITE_KEY environment variable not set');
      return new Response(
        JSON.stringify({ 
          error: 'Site key not configured',
          message: 'TURNSTILE_SITE_KEY environment variable is missing'
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    console.log('Site key found, length:', siteKey.length);
    console.log('Returning site key successfully');
    
    return new Response(
      JSON.stringify({ siteKey }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  } catch (error: any) {
    console.error('Unexpected error in get-turnstile-key:', error);
    console.error('Error type:', typeof error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'Failed to retrieve site key',
        details: error?.message || 'Unknown error'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
};

console.log('Starting get-turnstile-key function...');
serve(handler);

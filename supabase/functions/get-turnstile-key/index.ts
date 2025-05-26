
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const handler = async (req: Request): Promise<Response> => {
  console.log('=== Turnstile Key Function Started ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
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
        message: 'Only POST requests are supported',
        method: req.method
      }),
      { 
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }

  try {
    console.log('Processing POST request for Turnstile site key...');
    
    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const siteKey = Deno.env.get('TURNSTILE_SITE_KEY');
    
    console.log('Environment check:');
    console.log('- SUPABASE_URL exists:', !!supabaseUrl);
    console.log('- TURNSTILE_SITE_KEY exists:', !!siteKey);
    console.log('- Current environment:', supabaseUrl ? 'Production' : 'Local');
    
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

    console.log('Site key found, returning successfully');
    console.log('Site key length:', siteKey.length);
    
    const response = {
      siteKey,
      environment: supabaseUrl ? 'production' : 'local',
      timestamp: new Date().toISOString()
    };
    
    console.log('Returning response:', response);
    
    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
    
  } catch (error: any) {
    console.error('=== ERROR in get-turnstile-key ===');
    console.error('Error type:', typeof error);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'Failed to retrieve site key',
        details: error?.message || 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
};

console.log('=== Starting get-turnstile-key function ===');
console.log('Deno version:', Deno.version.deno);
console.log('Function deployment timestamp:', new Date().toISOString());

serve(handler);

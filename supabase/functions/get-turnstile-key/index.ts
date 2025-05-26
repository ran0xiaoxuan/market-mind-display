
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
    console.log('- SUPABASE_URL value:', supabaseUrl);
    console.log('- TURNSTILE_SITE_KEY exists:', !!siteKey);
    console.log('- TURNSTILE_SITE_KEY length:', siteKey?.length || 0);
    
    if (!siteKey) {
      console.error('TURNSTILE_SITE_KEY environment variable not set');
      return new Response(
        JSON.stringify({ 
          error: 'Site key not configured',
          message: 'TURNSTILE_SITE_KEY environment variable is missing',
          debug: {
            hasSupabaseUrl: !!supabaseUrl,
            environment: supabaseUrl ? 'production' : 'local'
          }
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    console.log('Site key found, returning successfully');
    
    const response = {
      siteKey,
      environment: supabaseUrl ? 'production' : 'local',
      timestamp: new Date().toISOString(),
      debug: {
        functionWorking: true,
        requestMethod: req.method,
        hasEnvironmentVars: {
          supabaseUrl: !!supabaseUrl,
          siteKey: !!siteKey
        }
      }
    };
    
    console.log('Returning response:', {
      ...response,
      siteKey: `${siteKey.substring(0, 10)}...`
    });
    
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
        timestamp: new Date().toISOString(),
        debug: {
          errorType: typeof error,
          errorName: error?.name || 'Unknown'
        }
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
console.log('Environment variables available:');
console.log('- SUPABASE_URL:', !!Deno.env.get('SUPABASE_URL'));
console.log('- TURNSTILE_SITE_KEY:', !!Deno.env.get('TURNSTILE_SITE_KEY'));

serve(handler);

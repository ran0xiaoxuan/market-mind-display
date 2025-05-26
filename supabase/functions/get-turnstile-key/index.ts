
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  console.log('Turnstile key request received:', req.method);
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching TURNSTILE_SITE_KEY from environment...');
    const siteKey = Deno.env.get('TURNSTILE_SITE_KEY');
    
    console.log('Site key found:', siteKey ? 'Yes' : 'No');
    
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
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'Failed to retrieve site key'
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

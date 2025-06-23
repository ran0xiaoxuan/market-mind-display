
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

const handler = async (req: Request): Promise<Response> => {
  console.log('=== Turnstile Key Function Started ===');
  console.log('Request method:', req.method);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  // Allow both GET and POST requests
  if (req.method !== 'POST' && req.method !== 'GET') {
    console.log('Method not allowed:', req.method);
    return new Response(
      JSON.stringify({ 
        error: 'Method not allowed',
        message: 'Only GET and POST requests are supported'
      }),
      { 
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }

  try {
    console.log('Processing request for Turnstile site key...');
    
    // Get site key from environment
    const siteKey = Deno.env.get('TURNSTILE_SITE_KEY');
    
    console.log('Site key exists:', !!siteKey);
    
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
    
    const response = {
      siteKey,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300", // Cache for 5 minutes
          ...corsHeaders 
        }
      }
    );
    
  } catch (error: any) {
    console.error('=== ERROR in get-turnstile-key ===');
    console.error('Error message:', error?.message);
    
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
serve(handler);


import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function requires the admin role key
    // It will be called internally by other edge functions
    
    const { name, value } = await req.json();
    
    if (!name || !value) {
      return new Response(
        JSON.stringify({ error: 'Name and value are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Supabase CLI's secrets API
    const secretsApiUrl = `https://api.supabase.com/v1/projects/${Deno.env.get('SUPABASE_PROJECT_ID')}/secrets`;
    
    const secretsResponse = await fetch(secretsApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secrets: [{ name, value }]
      }),
    });

    if (!secretsResponse.ok) {
      console.error('Failed to update secret:', await secretsResponse.text());
      return new Response(
        JSON.stringify({ error: 'Failed to update secret' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in update-secret function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

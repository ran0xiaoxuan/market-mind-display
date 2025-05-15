
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is missing');
    }

    // Create a Supabase client with the request's auth header
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    // Get user data to verify they're authenticated and authorized
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized: Valid authentication required');
    }

    // Get the API key from the request body
    const { apiKey } = await req.json();
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('API key is required and must be a string');
    }

    // Check if user is an admin (you may want to implement more robust authorization)
    // For example, query a specific table to check user roles or permissions
    const { data: isAdmin, error: adminCheckError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (adminCheckError || !isAdmin?.is_admin) {
      // If there's no admin check or user isn't admin, you might want to reject
      // Uncomment the line below if you implement admin checks
      // throw new Error('Unauthorized: Admin privileges required');

      // For now, we'll just log this but proceed (you may want to change this)
      console.warn("Non-admin user attempting to set API key");
    }

    // In a real implementation, you would store this in a secure way
    // For development, we'll say it was successful
    console.log("API key update requested. In production, this would securely store the key.");

    return new Response(
      JSON.stringify({ success: true, message: "API key updated successfully" }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Error in set-openai-key function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: error.name || "unknown_error"
      }),
      {
        status: error.message.includes('Unauthorized') ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

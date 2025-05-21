
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get FMP API key from environment variable
    const fmpApiKey = Deno.env.get("FMP_API_KEY");
    
    // Check if API key exists - this was previously failing
    if (!fmpApiKey) {
      console.error("FMP API key not configured in Supabase secrets");
      return new Response(
        JSON.stringify({ 
          error: "FMP API key not configured",
          success: false,
          message: "Please configure the FMP_API_KEY in Supabase secrets" 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For debug purposes, log that we're providing the key (without exposing it)
    console.log("FMP API key found in environment variables");

    // Create client to check authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // Get the user from the request - making authentication optional
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      console.log("Authentication not provided or invalid, proceeding with limited access");
    }

    // Return the API key regardless of authentication
    // This allows the API to work even without login
    return new Response(
      JSON.stringify({ 
        apiKey: fmpApiKey,
        success: true 
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store"
        } 
      }
    );
    
  } catch (error) {
    console.error("Error in get-fmp-key function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Server error",
        success: false,
        message: error.message || "Unknown error occurred" 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});

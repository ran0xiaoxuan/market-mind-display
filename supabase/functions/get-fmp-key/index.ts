
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

    // Create client to check authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // Get the user from the request
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError) {
      console.error("Auth error in get-fmp-key:", userError);
      return new Response(
        JSON.stringify({ 
          error: "Authentication error", 
          success: false,
          message: userError.message 
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!user) {
      console.error("No authenticated user found");
      return new Response(
        JSON.stringify({ 
          error: "Unauthorized", 
          success: false,
          message: "Authentication required" 
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Providing FMP API key to user: ${user.id}`);
    
    // Return the API key
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

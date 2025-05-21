
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Configure CORS headers to be permissive for development
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req) => {
  console.log("get-fmp-key function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }
  
  try {
    // Get FMP API key from environment variable
    const fmpApiKey = Deno.env.get("FMP_API_KEY");
    console.log("FMP API key availability:", fmpApiKey ? "Available" : "Not available");
    
    if (!fmpApiKey) {
      console.error("FMP API key not configured in Supabase secrets");
      return new Response(
        JSON.stringify({ 
          error: "FMP API key not configured",
          success: false,
          message: "Please configure the FMP_API_KEY in Supabase secrets" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Return the API key
    console.log("Successfully providing FMP API key to client");
    
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
          "Cache-Control": "no-store, max-age=0"
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


import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Configure more permissive CORS headers for better compatibility
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Allow all origins
  "Access-Control-Allow-Headers": "*", // Allow all headers
  "Access-Control-Allow-Methods": "GET, OPTIONS, POST", // Allow all required methods
  "Access-Control-Max-Age": "86400", // Cache preflight requests for 24 hours
};

serve(async (req) => {
  console.log("[get-fmp-key] Function called with method:", req.method);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("[get-fmp-key] Handling CORS preflight request");
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }
  
  try {
    // Get FMP API key from environment variable
    const fmpApiKey = Deno.env.get("FMP_API_KEY");
    console.log("[get-fmp-key] API key availability:", fmpApiKey ? "Available" : "Not available");
    
    if (!fmpApiKey) {
      console.error("[get-fmp-key] FMP API key not configured in Supabase secrets");
      return new Response(
        JSON.stringify({ 
          error: "FMP API key not configured",
          success: false,
          message: "Please configure the FMP_API_KEY in Supabase secrets",
          errorType: "missing_key"
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Validate the API key format (basic check)
    if (typeof fmpApiKey !== 'string' || fmpApiKey.trim().length < 10) {
      console.error("[get-fmp-key] FMP API key appears to be invalid");
      return new Response(
        JSON.stringify({ 
          error: "Invalid API key format",
          success: false,
          message: "The FMP_API_KEY environment variable contains an invalid API key",
          errorType: "invalid_key_format"
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Return the API key in the expected format
    console.log("[get-fmp-key] Successfully providing FMP API key to client");
    
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
    console.error("[get-fmp-key] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Server error",
        success: false,
        message: error.message || "Unknown error occurred",
        errorType: "server_error",
        stack: Deno.env.get("ENVIRONMENT") === "development" ? error.stack : undefined
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

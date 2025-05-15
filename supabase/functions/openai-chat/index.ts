
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY_NEW') || Deno.env.get('OPENAI_API_KEY');
const API_URL = "https://api.openai.com/v1/chat/completions";

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
    // Validate API key first
    if (!OPENAI_API_KEY) {
      console.error("Missing OpenAI API key in environment variables");
      return new Response(
        JSON.stringify({
          error: "Missing API key configuration",
          type: "api_key_error",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const { messages, model = "gpt-3.5-turbo", stream = false, temperature = 0.7, max_tokens } = await req.json();

    console.log("Sending request to OpenAI:", { messages, model, stream });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        stream,
        ...(max_tokens && { max_tokens }),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { raw: errorText };
      }
      
      console.error("OpenAI API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      return new Response(
        JSON.stringify({
          error: `OpenAI API error: ${response.status} ${response.statusText}`,
          details: errorData,
          type: "api_error"
        }),
        {
          status: 502, // Forward error but as a 502 Bad Gateway
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    console.log("OpenAI API response:", data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in openai-chat function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: error.name || "unknown_error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

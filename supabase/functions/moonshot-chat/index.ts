
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const MOONSHOT_API_KEY = Deno.env.get('MOONSHOT_API_KEY');
const API_URL = "https://api.moonshot.cn/v1/chat/completions";

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
    const { messages, model = "moonshot-v1-8k", stream = false, temperature = 0.7, max_tokens } = await req.json();

    console.log("Sending request to Moonshot AI:", { messages, model, stream });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MOONSHOT_API_KEY}`,
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
      const errorData = await response.json();
      console.error("Moonshot API error:", errorData);
      throw new Error(`Moonshot API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log("Moonshot API response:", data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in moonshot-chat function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

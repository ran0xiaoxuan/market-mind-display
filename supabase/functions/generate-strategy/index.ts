
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// OpenAI API configuration
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Standard timeframe formats to ensure consistency
const STANDARD_TIMEFRAMES = {
  "1m": "1 Minute",
  "5m": "5 Minutes", 
  "15m": "15 Minutes",
  "30m": "30 Minutes",
  "1h": "1 Hour",
  "4h": "4 Hours",
  "Daily": "Daily",
  "Weekly": "Weekly",
  "Monthly": "Monthly"
};

serve(async (req) => {
  console.log('Edge function called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing strategy generation request...');
    
    // Check if API key exists
    if (!openaiApiKey) {
      console.error("Missing OpenAI API key in environment variables");
      return new Response(
        JSON.stringify({
          error: "OpenAI API key is not configured",
          type: "api_key_error",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Parse request body with timeout
    let requestData;
    try {
      const body = await req.text();
      console.log('Request body received, length:', body.length);
      requestData = JSON.parse(body);
      console.log('Request data parsed:', requestData);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({
          error: "Invalid request format",
          type: "parameter_error",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    const { assetType, selectedAsset, strategyDescription } = requestData;
    
    if (!assetType || !selectedAsset || !strategyDescription) {
      console.error('Missing required parameters:', { assetType, selectedAsset, strategyDescription });
      return new Response(
        JSON.stringify({
          error: "Missing required parameters: assetType, selectedAsset, or strategyDescription",
          type: "parameter_error",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    console.log('Generating strategy for:', { assetType, selectedAsset, strategyDescription });
    
    // Build enhanced prompt for OpenAI
    const systemPrompt = `You are a trading strategy assistant that helps create detailed trading strategies. 
You will be given an asset type, an asset name, and a strategy description. 
Generate a complete trading strategy with entry rules, exit rules, and risk management for stocks.

## IMPORTANT FORMATTING REQUIREMENTS:
1. ALWAYS include the asset symbol (e.g., "AAPL", "MSFT") in the strategy name/title.
2. Write a concise strategy description of 60-80 words that explains:
   - The core principles behind the strategy
   - Why this strategy is suitable for the specific asset
   - The market conditions under which the strategy works best
   - The expected timeframe for results
   - The risk/reward profile of the strategy

## TIMEFRAME FORMAT:
- Always use "Daily" for daily timeframes, never use "1d"
- Other valid timeframes: "Weekly", "Monthly", "1h", "4h", "15m", "30m", "5m", "1m"
- Use these exact values: "1m", "5m", "15m", "30m", "1h", "4h", "Daily", "Weekly", "Monthly"

## RULE GROUPS EXPLANATION (VERY IMPORTANT):
When creating trading rules, use BOTH the AND group and OR group effectively:

1. AND Group:
   - All conditions in this group MUST be met simultaneously
   - Use for primary, essential conditions that must ALL be true
   - Example: "Price is above 200 SMA" AND "RSI is above 50"

2. OR Group: 
   - MUST CONTAIN AT LEAST 2 CONDITIONS
   - At least N conditions from this group must be met (where N is the requiredConditions)
   - Use for confirmatory signals where any subset can validate the trade
   - Example: EITHER "Volume increases by 20%" OR "MACD crosses above signal line"

IMPORTANT: Don't put all conditions in just one group. Distribute them logically between AND and OR groups for a more sophisticated strategy. ALWAYS PUT AT LEAST 2 CONDITIONS IN THE OR GROUP.

Always return your response as a valid JSON object with these properties:
- name: The strategy name (MUST include the asset symbol)
- description: A concise explanation of what the strategy does (60-80 words)
- timeframe: The trading timeframe - MUST be one of: "1m", "5m", "15m", "30m", "1h", "4h", "Daily", "Weekly", "Monthly"
- targetAsset: The symbol of the asset to trade
- entryRules: An array of rule groups for entry
- exitRules: Same structure as entryRules but for exit conditions
- riskManagement: {
  stopLoss: percentage as string
  takeProfit: percentage as string
  singleBuyVolume: amount as string with $ prefix
  maxBuyVolume: amount as string with $ prefix
}`;

    const userPrompt = `Asset Type: ${assetType}
Asset Name: ${selectedAsset}
Strategy Description: ${strategyDescription}

Generate a detailed trading strategy as a JSON object. Remember to include "${selectedAsset}" in the strategy name and provide a concise description explaining why this strategy is suitable for ${selectedAsset}.

IMPORTANT: Make effective use of BOTH the AND group and OR group in your trading rules. Put essential conditions in the AND group, and put AT LEAST 2 CONDITIONS in the OR group where only some need to be true.

REMEMBER: Use "Daily" for daily timeframes, never use "1d". 
Use ONLY these exact timeframe values: "1m", "5m", "15m", "30m", "1h", "4h", "Daily", "Weekly", "Monthly"`;

    console.log("Sending request to OpenAI...");
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
    
    try {
      // Create the request to OpenAI API
      const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: userPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        if (response.status === 401) {
          return new Response(
            JSON.stringify({
              error: "Invalid OpenAI API key",
              type: "api_key_error",
            }),
            {
              status: 401,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
          );
        }
        
        return new Response(
          JSON.stringify({
            error: `OpenAI API error: ${response.status} ${response.statusText}`,
            type: "api_error",
            details: errorText
          }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      const openaiResponse = await response.json();
      console.log("Received response from OpenAI");

      // Extract strategy data from response
      const aiResponseText = openaiResponse.choices[0]?.message?.content;
      if (!aiResponseText) {
        console.error("No content in OpenAI response");
        return new Response(
          JSON.stringify({
            error: "Invalid response from OpenAI",
            type: "parsing_error",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      // Parse the JSON response from the AI
      try {
        // Find JSON in the response (in case AI wraps it in markdown)
        let jsonMatch = aiResponseText.match(/```json\s*([\s\S]*?)\s*```/);
        let strategyJSON;
        
        if (jsonMatch && jsonMatch[1]) {
          strategyJSON = JSON.parse(jsonMatch[1]);
        } else {
          strategyJSON = JSON.parse(aiResponseText);
        }

        console.log("Successfully parsed strategy JSON");
        
        // Ensure timeframe is in the correct standardized format
        if (strategyJSON.timeframe === "1d") {
          strategyJSON.timeframe = "Daily";
        }

        return new Response(
          JSON.stringify(strategyJSON),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      } catch (parseError) {
        console.error("Error parsing OpenAI response:", parseError);
        
        return new Response(
          JSON.stringify({
            error: "Failed to parse strategy data from AI response",
            type: "parsing_error",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error("Request timeout");
        return new Response(
          JSON.stringify({
            error: "Request timed out. Please try again with a simpler description.",
            type: "timeout_error",
          }),
          {
            status: 408,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      console.error("Network error calling OpenAI:", fetchError);
      return new Response(
        JSON.stringify({
          error: "Network error connecting to OpenAI",
          type: "connection_error",
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  } catch (error) {
    console.error("Error in generate-strategy function:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        type: error.name || "unknown_error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

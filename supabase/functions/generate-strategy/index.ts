
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// OpenAI API configuration
const OPENAI_API_URL = "https://api.gptsapi.net/v1/chat/completions";
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

// CORS headers
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
    // Check if API key exists
    if (!openaiApiKey) {
      console.error("Missing OpenAI API key in environment variables");
      return new Response(
        JSON.stringify({
          error: "API key is required",
          type: "api_key_error",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Parse request body
    const requestData = await req.json();
    const { assetType, selectedAsset, strategyDescription } = requestData;
    
    if (!assetType || !selectedAsset || !strategyDescription) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters",
          type: "parameter_error",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Build enhanced prompt for OpenAI
    const systemPrompt = `You are a trading strategy assistant that helps create detailed trading strategies. 
You will be given an asset type, an asset name, and a strategy description. 
Generate a complete trading strategy with entry rules, exit rules, and risk management for stocks.

## IMPORTANT FORMATTING REQUIREMENTS:
1. ALWAYS include the asset symbol (e.g., "AAPL", "MSFT") in the strategy name/title.
2. Write a detailed strategy description of at least 100-150 words that explains:
   - The core principles behind the strategy
   - Why this strategy is suitable for the specific asset
   - The market conditions under which the strategy works best
   - The key indicators used and why they're relevant for this asset
   - The expected timeframe for results
   - The risk/reward profile of the strategy

## EXAMPLE TITLE AND DESCRIPTION:
Name: "AAPL Momentum Crossover Strategy with Volume Confirmation"

Description: "This strategy for Apple Inc. (AAPL) leverages the stock's characteristic volatility patterns and strong momentum trends that typically follow product announcements and earnings reports. The approach combines multiple technical indicators to identify optimal entry and exit points while managing risk effectively. By utilizing a dual moving average system with RSI confirmation, the strategy aims to capture AAPL's frequent momentum swings while filtering out false signals through volume analysis. This makes it particularly effective during periods of market uncertainty when AAPL often behaves as a safe-haven tech stock. The strategy is designed for medium-term positions spanning 2-4 weeks, aligning with AAPL's typical price action cycles. The risk management parameters are calibrated specifically for AAPL's historical volatility profile, with stop-loss levels accounting for the stock's average daily movement range over the past two years."

Always return your response as a valid JSON object with these properties:
- name: The strategy name (MUST include the asset symbol)
- description: A detailed explanation of what the strategy does (at least 100 words)
- market: "Equities" for stocks
- timeframe: The trading timeframe (e.g., "Daily", "4-Hour", "15-Minute")
- targetAsset: The symbol of the asset to trade
- entryRules: An array of rule groups for entry, each with:
  - id: unique identifier
  - logic: "AND" or "OR" 
  - requiredConditions: number (only required for OR logic)
  - inequalities: array of inequality objects with:
    - id: unique identifier
    - left: {type, indicator, parameters, value, valueType}
    - condition: string describing condition
    - right: {type, indicator, parameters, value, valueType}
    - explanation: string explaining the rule
- exitRules: Same structure as entryRules but for exit conditions
- riskManagement: {
  stopLoss: percentage as string
  takeProfit: percentage as string
  singleBuyVolume: amount as string
  maxBuyVolume: amount as string
}`;

    const userPrompt = `Asset Type: ${assetType}
Asset Name: ${selectedAsset}
Strategy Description: ${strategyDescription}

Generate a detailed trading strategy as a JSON object. Remember to include "${selectedAsset}" in the strategy name and provide a comprehensive description explaining why this strategy is suitable for ${selectedAsset}.`;

    console.log("Sending request to OpenAI with prompts:", { systemPrompt, userPrompt });
    console.log("API Key available:", !!openaiApiKey);
    
    // Create the request to OpenAI API
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // Using OpenAI's model
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
        stream: false
      })
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
          type: "api_error",
          details: errorData
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const openaiResponse = await response.json();
    console.log("Received response from OpenAI:", openaiResponse);

    // Extract strategy data from response
    const aiResponseText = openaiResponse.choices[0]?.message?.content;
    if (!aiResponseText) {
      return new Response(
        JSON.stringify({
          error: "Invalid response from OpenAI",
          type: "parsing_error",
          rawResponse: openaiResponse
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
        // Extract JSON from markdown code block
        strategyJSON = JSON.parse(jsonMatch[1]);
      } else {
        // Try parsing the whole response as JSON
        strategyJSON = JSON.parse(aiResponseText);
      }

      console.log("Successfully parsed strategy JSON:", strategyJSON);

      return new Response(
        JSON.stringify(strategyJSON),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      console.log("Raw response:", aiResponseText);
      
      // Try to extract as much as possible even from malformed JSON
      try {
        // Simple attempt to fix common JSON issues
        const fixedJson = aiResponseText
          .replace(/(\w+):/g, '"$1":')  // Fix unquoted keys
          .replace(/'/g, '"');          // Replace single quotes with double quotes
        
        const fallbackJSON = JSON.parse(fixedJson);
        console.log("Managed to parse with fixes:", fallbackJSON);
        
        return new Response(
          JSON.stringify(fallbackJSON),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      } catch (secondError) {
        // If all parsing fails, return detailed error
        return new Response(
          JSON.stringify({
            error: "Failed to parse strategy data from OpenAI response",
            type: "parsing_error",
            rawResponse: aiResponseText
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
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

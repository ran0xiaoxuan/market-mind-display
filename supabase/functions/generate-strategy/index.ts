
// Import necessary dependencies
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define the function that will generate strategies based on AI input
const generateStrategy = async (assetType: string, selectedAsset: string, strategyDescription: string) => {
  const MOONSHOT_API_KEY = Deno.env.get("MOONSHOT_API_KEY");
  
  if (!MOONSHOT_API_KEY) {
    console.error("MOONSHOT_API_KEY is not set");
    throw new Error("MOONSHOT_API_KEY environment variable is not configured. Please add it to your Supabase project.");
  }
  
  // Create a careful, structured prompt for the AI
  const prompt = `
    Generate a detailed algorithmic trading strategy for ${assetType}, specifically for ${selectedAsset}. 
    The strategy should match this description: "${strategyDescription}".
    
    Please format your response as a valid JSON object with the following structure:
    {
      "name": "Strategy name",
      "description": "Brief strategy description",
      "market": "Market type (e.g. Crypto, Equities)",
      "timeframe": "The timeframe (e.g. Daily, 4h, 1h)",
      "targetAsset": "The target asset (e.g. BTC/USD, AAPL)",
      "entryRules": [
        {
          "id": 1,
          "logic": "AND",
          "inequalities": [
            {
              "id": 1,
              "left": {
                "type": "indicator", // Options: indicator, price, value
                "indicator": "SMA", // Example indicators: SMA, EMA, RSI, MACD, Bollinger Bands, Stochastic, Ichimoku
                "parameters": { "period": "20" } // Parameters specific to the indicator
              },
              "condition": "Crosses Above", // Or other conditions like Greater Than, Less Than, etc.
              "right": {
                "type": "indicator", // Options: indicator, price, value
                "indicator": "SMA",
                "parameters": { "period": "50" }
              },
              "explanation": "Detailed explanation of why this rule is important and what it signals"
            }
          ]
        }
      ],
      "exitRules": [
        {
          "id": 1,
          "logic": "AND",
          "inequalities": [
            {
              "id": 1,
              "left": {
                "type": "indicator",
                "indicator": "SMA",
                "parameters": { "period": "20" }
              },
              "condition": "Crosses Below",
              "right": {
                "type": "indicator",
                "indicator": "SMA",
                "parameters": { "period": "50" }
              },
              "explanation": "Detailed explanation of why this exit rule is important"
            }
          ]
        }
      ],
      "riskManagement": {
        "stopLoss": "5", // percentage
        "takeProfit": "15", // percentage
        "singleBuyVolume": "2000", // dollars
        "maxBuyVolume": "10000" // dollars
      }
    }
    
    IMPORTANT GUIDELINES:
    1. For the OR logic groups, include at least 2 conditions and specify how many conditions ('requiredConditions') should be met.
    2. Provide detailed explanations for each rule to help users understand the rationale.
    3. Use a diverse set of indicators and conditions appropriate for ${assetType}.
    4. Make sure all indicators have appropriate parameters.
    5. Ensure risk management values are reasonable and aligned with the strategy.
    6. Include a mix of price-based, indicator-based, and volume-based signals where appropriate.
    
    Return only the JSON object, nothing else.
  `;

  try {
    console.log("Sending request to Moonshot API with key:", MOONSHOT_API_KEY.substring(0, 5) + "...");
    // Call the Moonshot AI API with improved error handling
    const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MOONSHOT_API_KEY}`
      },
      body: JSON.stringify({
        model: "moonshot-v1-8k", // Using Moonshot's primary model
        messages: [{
          role: "user",
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Moonshot API Error:", errorData);
      throw new Error(`API Error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log("Moonshot API Response received");
    
    // Extract the content from the response
    const content = data.choices?.[0]?.message?.content || "";
    console.log("Content extracted:", content.substring(0, 100) + "...");
    
    // Parse JSON from content
    try {
      const strategyJson = JSON.parse(content);
      console.log("Successfully parsed strategy JSON");
      return strategyJson;
    } catch (parseError) {
      console.error("Error parsing JSON from Moonshot response:", parseError);
      console.log("Raw content received:", content);
      
      // Try to extract JSON if it's surrounded by markdown code blocks or other text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extractedJson = JSON.parse(jsonMatch[0]);
          console.log("Successfully extracted JSON from response using regex");
          return extractedJson;
        } catch (extractError) {
          console.error("Failed to extract JSON using regex:", extractError);
          throw new Error("Failed to parse valid JSON from Moonshot response");
        }
      }
      
      throw new Error("Failed to parse JSON from Moonshot response");
    }
  } catch (error) {
    console.error("Error generating strategy with Moonshot:", error);
    throw error;
  }
};

// Define the serving function for the edge function
serve(async (req) => {
  // Set CORS headers for browser clients
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  
  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Parse request body
    const requestData = await req.json();
    const { assetType, selectedAsset, strategyDescription } = requestData;
    
    // Validate input
    if (!assetType || !selectedAsset || !strategyDescription) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Generate strategy
    console.log("Generating strategy for:", { assetType, selectedAsset, strategyDescription });
    const strategy = await generateStrategy(assetType, selectedAsset, strategyDescription);
    
    // Return the generated strategy
    return new Response(JSON.stringify(strategy), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in edge function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error occurred",
        details: error.toString(),
        help: "Make sure MOONSHOT_API_KEY is properly configured in your Supabase project."
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

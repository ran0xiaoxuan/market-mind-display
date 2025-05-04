
// Import necessary dependencies
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define the function that will generate strategies based on AI input
const generateStrategy = async (assetType: string, selectedAsset: string, strategyDescription: string) => {
  console.log("Starting generateStrategy function with:", { assetType, selectedAsset, strategyDescription });
  
  const BAILIAN_API_KEY = Deno.env.get("BAILIAN_API_KEY");
  
  if (!BAILIAN_API_KEY) {
    console.error("BAILIAN_API_KEY environment variable is not set");
    throw new Error("API key configuration error: BAILIAN_API_KEY is not set");
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
        },
        {
          "id": 2,
          "logic": "OR",
          "requiredConditions": 1, // Number of conditions that must be met (important for OR groups)
          "inequalities": [
            {
              "id": 1,
              "left": {
                "type": "indicator",
                "indicator": "RSI",
                "parameters": { "period": "14" }
              },
              "condition": "Less Than",
              "right": {
                "type": "value",
                "value": "30"
              },
              "explanation": "Detailed explanation of why this rule is important and what it signals"
            },
            {
              "id": 2,
              "left": {
                "type": "indicator",
                "indicator": "MACD",
                "parameters": { "fast": "12", "slow": "26", "signal": "9" }
              },
              "condition": "Crosses Above",
              "right": {
                "type": "value",
                "value": "0"
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
        },
        {
          "id": 2,
          "logic": "OR",
          "requiredConditions": 1, // Number of conditions that must be met (important for OR groups)
          "inequalities": [
            {
              "id": 1,
              "left": {
                "type": "indicator",
                "indicator": "RSI",
                "parameters": { "period": "14" }
              },
              "condition": "Greater Than",
              "right": {
                "type": "value",
                "value": "70"
              },
              "explanation": "Detailed explanation of why this exit rule is important"
            },
            {
              "id": 2,
              "left": {
                "type": "price",
                "value": "Close"
              },
              "condition": "Less Than",
              "right": {
                "type": "value",
                "value": "Stop Loss"
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
    console.log("Calling Bailian AI API...");
    
    // Call the AI API
    const response = await fetch("https://api.bailian.tech/openapi/api/v1/text/generation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${BAILIAN_API_KEY}`
      },
      body: JSON.stringify({
        model: "ERNIE-Bot-4",
        messages: [{
          role: "user",
          content: prompt
        }],
        temperature: 0.7,
        top_p: 0.9,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("AI API Error Response Status:", response.status);
      console.error("AI API Error Response Body:", errorData);
      throw new Error(`API Error: ${response.status} - ${errorData}`);
    }

    console.log("Received successful response from Bailian AI");
    const data = await response.json();
    
    // Extract the content from the response
    const content = data.result || "";
    console.log("AI response content preview:", content.substring(0, 200) + "...");
    
    // Extract the JSON from the content
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No valid JSON found in AI response:", content);
      throw new Error("No valid JSON found in the AI response");
    }
    
    try {
      const strategyJson = JSON.parse(jsonMatch[0]);
      console.log("Successfully parsed strategy JSON");
      
      // Validate the required fields
      if (!strategyJson.name || !strategyJson.market || !strategyJson.timeframe) {
        console.error("Strategy JSON is missing required fields:", strategyJson);
        throw new Error("Generated strategy is missing required fields");
      }
      
      return strategyJson;
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw JSON content:", jsonMatch[0]);
      throw new Error("Failed to parse JSON from AI response");
    }
  } catch (error) {
    console.error("Error in generateStrategy function:", error);
    throw error;
  }
};

// Define the serving function for the edge function
serve(async (req) => {
  console.log("Edge function request received:", req.method);
  
  // Set CORS headers for browser clients
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle OPTIONS request
  if (req.method === "OPTIONS") {
    console.log("Responding to OPTIONS request with CORS headers");
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  
  // Only accept POST requests
  if (req.method !== "POST") {
    console.error(`Invalid request method: ${req.method}`);
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Parse request body
    const requestData = await req.json();
    console.log("Request data:", requestData);
    
    const { assetType, selectedAsset, strategyDescription } = requestData;
    
    // Validate input
    if (!assetType || !selectedAsset || !strategyDescription) {
      console.error("Missing required parameters:", { assetType, selectedAsset, strategyDescription });
      return new Response(
        JSON.stringify({ 
          error: "Missing required parameters",
          details: {
            assetType: assetType ? "✓" : "✗",
            selectedAsset: selectedAsset ? "✓" : "✗",
            strategyDescription: strategyDescription ? "✓" : "✗"
          }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Generate strategy
    console.log("Generating strategy for:", { assetType, selectedAsset, strategyDescription });
    const strategy = await generateStrategy(assetType, selectedAsset, strategyDescription);
    console.log("Strategy generated successfully");
    
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
        timestamp: new Date().toISOString(),
        path: "generate-strategy"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

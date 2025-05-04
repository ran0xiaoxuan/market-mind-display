
// Import necessary dependencies
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define the function that will generate strategies based on AI input
const generateStrategy = async (assetType: string, selectedAsset: string, strategyDescription: string, retryCount = 0) => {
  const BAILIAN_API_KEY = Deno.env.get("BAILIAN_API_KEY");
  
  // Validate API key
  if (!BAILIAN_API_KEY) {
    console.error("BAILIAN_API_KEY is not set in environment variables");
    throw new Error("API configuration error: Missing API key");
  }
  
  console.log(`Generating strategy for ${assetType}, ${selectedAsset} with description: ${strategyDescription}`);
  console.log(`Attempt: ${retryCount + 1}`);
  
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
    // Set timeout for the fetch request (15 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    // Call the AI API with timeout
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
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    // Check for HTTP errors
    if (!response.ok) {
      const statusCode = response.status;
      const errorData = await response.text();
      console.error(`API Error (${statusCode}):`, errorData);
      
      // Handle specific error cases
      if (statusCode === 401 || statusCode === 403) {
        throw new Error("API authentication failed. Please check your API key.");
      } else if (statusCode === 429) {
        throw new Error("API rate limit exceeded. Please try again later.");
      } else if (statusCode >= 500) {
        // Implement retry logic for server errors
        if (retryCount < 2) { // Max 3 attempts (0, 1, 2)
          console.log(`Retrying after server error (attempt ${retryCount + 1})...`);
          return await generateStrategy(assetType, selectedAsset, strategyDescription, retryCount + 1);
        }
        throw new Error("AI service unavailable. Please try again later.");
      }
      
      throw new Error(`API Error: ${statusCode} - ${errorData}`);
    }

    const data = await response.json();
    console.log("AI API Response received, verifying content...");
    
    // Extract the content from the response
    const content = data.result || "";
    
    // Log warning if content seems empty or invalid
    if (!content || content.length < 50) {
      console.warn("Warning: API returned unusually short content:", content);
    }
    
    // Extract the JSON from the content
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No valid JSON found in the AI response:", content);
      throw new Error("Failed to parse AI response");
    }
    
    try {
      const strategyJson = JSON.parse(jsonMatch[0]);
      
      // Validate the required fields of the strategy
      if (!strategyJson.name || !strategyJson.market || !strategyJson.timeframe) {
        console.error("Missing required fields in strategy:", strategyJson);
        throw new Error("Invalid strategy format: missing required fields");
      }
      
      // Validate that we have at least some entry and exit rules
      if (!Array.isArray(strategyJson.entryRules) || strategyJson.entryRules.length === 0 ||
          !Array.isArray(strategyJson.exitRules) || strategyJson.exitRules.length === 0) {
        console.error("Missing entry or exit rules in strategy:", strategyJson);
        throw new Error("Invalid strategy format: missing trading rules");
      }
      
      console.log("Strategy successfully generated and validated");
      return strategyJson;
    } catch (parseError) {
      console.error("Error parsing JSON from AI response:", parseError);
      console.error("Raw content from AI:", content);
      throw new Error("Failed to parse strategy data");
    }
  } catch (error) {
    // Check if this is an abort error (timeout)
    if (error.name === 'AbortError') {
      console.error("Request timed out");
      
      // Implement retry for timeouts
      if (retryCount < 2) { // Max 3 attempts (0, 1, 2)
        console.log(`Retrying after timeout (attempt ${retryCount + 1})...`);
        return await generateStrategy(assetType, selectedAsset, strategyDescription, retryCount + 1);
      }
      
      throw new Error("Strategy generation timed out after multiple attempts");
    }
    
    console.error(`Error generating strategy (attempt ${retryCount + 1}):`, error);
    throw error;
  }
};

// Define the serving function for the edge function
serve(async (req) => {
  const startTime = Date.now();
  
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
    return new Response(JSON.stringify({ 
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED" 
    }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Validate API key first to fail fast
    const BAILIAN_API_KEY = Deno.env.get("BAILIAN_API_KEY");
    if (!BAILIAN_API_KEY) {
      console.error("FATAL ERROR: BAILIAN_API_KEY environment variable is not set");
      return new Response(JSON.stringify({ 
        error: "AI service configuration error",
        code: "API_KEY_MISSING",
        message: "The server is not properly configured to use the AI service"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      return new Response(JSON.stringify({ 
        error: "Invalid request format", 
        code: "INVALID_JSON",
        message: "The request body must be valid JSON" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const { assetType, selectedAsset, strategyDescription } = requestData;
    
    // Validate input
    if (!assetType || !selectedAsset || !strategyDescription) {
      console.error("Missing required parameters:", { assetType, selectedAsset, strategyDescription });
      return new Response(
        JSON.stringify({ 
          error: "Missing required parameters",
          code: "MISSING_PARAMS",
          message: "Asset type, selected asset, and strategy description are all required"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Generate strategy
    console.log("Starting strategy generation for:", { assetType, selectedAsset, strategyDescription });
    const strategy = await generateStrategy(assetType, selectedAsset, strategyDescription);
    
    const elapsed = Date.now() - startTime;
    console.log(`Strategy generated successfully in ${elapsed}ms`);
    
    // Return the generated strategy
    return new Response(JSON.stringify(strategy), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`Error in edge function after ${elapsed}ms:`, error);
    
    // Extract and sanitize the error message
    let errorMessage = error.message || "Unknown error occurred";
    const errorCode = error.code || "UNKNOWN_ERROR";
    
    // Determine appropriate status code based on error
    let statusCode = 500;
    if (errorMessage.includes("authentication failed") || errorMessage.includes("API key")) {
      statusCode = 401;
      errorCode = "AUTH_ERROR";
    } else if (errorMessage.includes("rate limit")) {
      statusCode = 429;
      errorCode = "RATE_LIMIT";
    }
    
    // Don't expose potential API keys or sensitive info in error messages
    if (errorMessage.includes(Deno.env.get("BAILIAN_API_KEY") || "")) {
      errorMessage = "Internal server error";
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        code: errorCode,
        timestamp: new Date().toISOString(),
        processingTime: elapsed
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

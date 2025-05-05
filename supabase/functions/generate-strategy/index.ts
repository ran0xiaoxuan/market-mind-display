
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
    // Add more detailed logging
    console.log(`Starting Moonshot API request for ${selectedAsset} (${assetType})`);
    console.log("Strategy description:", strategyDescription.substring(0, 100) + (strategyDescription.length > 100 ? "..." : ""));
    
    // Call the Moonshot AI API with improved error handling and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${MOONSHOT_API_KEY}`
        },
        body: JSON.stringify({
          model: "moonshot-v1-32k", // Using Moonshot's larger context model
          messages: [{
            role: "user",
            content: prompt
          }],
          temperature: 0.7,
          max_tokens: 4000,
          response_format: { type: "json_object" }
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      // Log response status for debugging
      console.log(`Moonshot API response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Moonshot API Error (${response.status}):`, errorText);
        
        // Provide more detailed error message based on status code
        if (response.status === 401) {
          throw new Error("Invalid API key. Please verify your MOONSHOT_API_KEY is correct and not expired.");
        } else if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later or check your API plan limits.");
        } else if (response.status >= 500) {
          throw new Error("Moonshot API server error. This is likely temporary, please try again later.");
        } else {
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
      }

      // Parse the JSON response
      const data = await response.json();
      console.log("Moonshot API response received successfully");
      
      // Check if the data has the expected structure
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error("Unexpected API response structure:", JSON.stringify(data));
        throw new Error("Unexpected response format from Moonshot API. The response doesn't contain the expected fields.");
      }
      
      // Extract the content from the response
      const content = data.choices?.[0]?.message?.content || "";
      console.log("Content received length:", content.length);
      console.log("Content excerpt:", content.substring(0, 100) + "...");
      
      // Parse JSON from content
      try {
        // Try parsing the content directly
        const strategyJson = JSON.parse(content);
        console.log("Successfully parsed strategy JSON");
        return strategyJson;
      } catch (parseError) {
        console.error("Error parsing JSON from Moonshot response:", parseError);
        
        // Try to extract JSON if it's surrounded by markdown code blocks or other text
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const extractedJson = JSON.parse(jsonMatch[0]);
            console.log("Successfully extracted JSON from response using regex");
            return extractedJson;
          } catch (extractError) {
            console.error("Failed to extract JSON using regex:", extractError);
            
            // As a last resort, try to build a minimal valid response based on user inputs
            console.log("Creating fallback response with user inputs");
            return createFallbackStrategy(assetType, selectedAsset, strategyDescription);
          }
        }
        
        throw new Error("Failed to parse JSON from Moonshot response. The API may be experiencing issues.");
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error("Request timeout after 30 seconds");
        throw new Error("The AI service request timed out. Please try again later.");
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error("Error generating strategy with Moonshot:", error);
    throw error;
  }
};

// Helper function to create a fallback strategy when all parsing attempts fail
function createFallbackStrategy(assetType: string, selectedAsset: string, strategyDescription: string) {
  return {
    name: `${selectedAsset} Trading Strategy`,
    description: strategyDescription,
    market: assetType === "stocks" ? "Equities" : "Crypto",
    timeframe: "Daily",
    targetAsset: selectedAsset,
    entryRules: [{
      id: 1,
      logic: "AND",
      inequalities: [{
        id: 1,
        left: { 
          type: "indicator",
          indicator: "SMA",
          parameters: { period: "20" }
        },
        condition: "Crosses Above",
        right: {
          type: "indicator",
          indicator: "SMA",
          parameters: { period: "50" }
        },
        explanation: "When the short-term moving average crosses above the long-term moving average, it indicates a potential uptrend."
      }]
    }],
    exitRules: [{
      id: 1,
      logic: "AND",
      inequalities: [{
        id: 1,
        left: {
          type: "indicator",
          indicator: "SMA",
          parameters: { period: "20" }
        },
        condition: "Crosses Below",
        right: {
          type: "indicator",
          indicator: "SMA",
          parameters: { period: "50" }
        },
        explanation: "When the short-term moving average crosses below the long-term moving average, it indicates a potential downtrend."
      }]
    }],
    riskManagement: {
      stopLoss: "5",
      takeProfit: "15",
      singleBuyVolume: "2000",
      maxBuyVolume: "10000"
    }
  };
}

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
    // Parse request body with proper error handling
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new Response(JSON.stringify({ 
        error: "Invalid request body", 
        details: "The request body could not be parsed as JSON." 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const { assetType, selectedAsset, strategyDescription } = requestData;
    
    // Validate input
    if (!assetType || !selectedAsset || !strategyDescription) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required parameters",
          details: {
            assetType: assetType ? "✓" : "✗ missing",
            selectedAsset: selectedAsset ? "✓" : "✗ missing", 
            strategyDescription: strategyDescription ? "✓" : "✗ missing"
          }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Generate strategy with timeout handling
    console.log("Generating strategy for:", { assetType, selectedAsset, strategyDescription });
    
    try {
      const strategy = await generateStrategy(assetType, selectedAsset, strategyDescription);
      
      // Return the generated strategy
      return new Response(JSON.stringify(strategy), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (genError) {
      // Handle specific timeout errors
      if (genError.message && genError.message.includes("timed out")) {
        return new Response(
          JSON.stringify({ 
            error: "Request timed out",
            details: "The AI service took too long to respond. Please try again with a simpler request.",
            type: "timeout_error"
          }),
          {
            status: 504,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // Re-throw for general error handling
      throw genError;
    }
  } catch (error) {
    console.error("Error in edge function:", error);
    
    // Determine if this is an API key issue
    const errorMessage = error.message || "Unknown error occurred";
    const isApiKeyIssue = errorMessage.includes("API key") || 
                          errorMessage.includes("MOONSHOT_API_KEY") ||
                          errorMessage.includes("401");
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.toString(),
        help: isApiKeyIssue 
          ? "Make sure MOONSHOT_API_KEY is properly configured in your Supabase project's secrets. You can update this in the Supabase dashboard under Settings > API > Edge Function Secrets."
          : "Try again later or check the Edge Function logs in the Supabase dashboard for more details.",
        type: isApiKeyIssue ? "api_key_error" : "general_error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

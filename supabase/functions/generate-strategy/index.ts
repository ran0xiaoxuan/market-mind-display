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
    
    // Build enhanced prompt for OpenAI with better instructions about rule groups and operators
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

## EXAMPLE TITLE AND DESCRIPTION:
Name: "AAPL Momentum Crossover Strategy with Volume Confirmation"

Description: "This strategy for Apple Inc. (AAPL) leverages momentum trends following product announcements. By combining moving averages with RSI confirmation, it captures AAPL's momentum while filtering false signals through volume analysis. Effective during market uncertainty when AAPL behaves as a safe-haven tech stock. Designed for 2-4 week positions, aligning with AAPL's price cycles, with stop-loss levels calibrated to historical volatility."

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

## IMPORTANT FORMAT FOR RULES:
For each rule, make sure the left and right sides are properly formatted with:
- type: Must be either "INDICATOR", "PRICE", or "VALUE" - never leave this empty or unknown
- indicator: Required name of the indicator (e.g., "SMA", "RSI") when type is "INDICATOR"
- parameters: Required appropriate parameters for the indicator (e.g., period, source)
- value: Required actual value when type is "VALUE"
- condition: MUST be one of the following specific values: "CROSSES_ABOVE", "CROSSES_BELOW", "GREATER_THAN", "LESS_THAN", "EQUAL", "GREATER_THAN_OR_EQUAL", "LESS_THAN_OR_EQUAL"
- Do NOT include valueType field unless absolutely necessary for special cases

Always return your response as a valid JSON object with these properties:
- name: The strategy name (MUST include the asset symbol)
- description: A concise explanation of what the strategy does (60-80 words)
- timeframe: The trading timeframe - MUST be one of: "1m", "5m", "15m", "30m", "1h", "4h", "Daily", "Weekly", "Monthly"
- targetAsset: The symbol of the asset to trade
- entryRules: An array of rule groups for entry, each with:
  - id: unique identifier
  - logic: "AND" or "OR" 
  - requiredConditions: number (only required for OR logic)
  - inequalities: array of inequality objects with:
    - id: unique identifier
    - left: {type, indicator, parameters, value} (type must be "INDICATOR", "PRICE", or "VALUE")
    - condition: MUST be one of: "CROSSES_ABOVE", "CROSSES_BELOW", "GREATER_THAN", "LESS_THAN", "EQUAL", "GREATER_THAN_OR_EQUAL", "LESS_THAN_OR_EQUAL"
    - right: {type, indicator, parameters, value} (type must be "INDICATOR", "PRICE", or "VALUE")
    - explanation: string explaining the rule
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

MOST IMPORTANT: Every inequality MUST have a valid condition from this list: "CROSSES_ABOVE", "CROSSES_BELOW", "GREATER_THAN", "LESS_THAN", "EQUAL", "GREATER_THAN_OR_EQUAL", "LESS_THAN_OR_EQUAL". Do not leave any condition field empty or with invalid values.

REMEMBER: Use "Daily" for daily timeframes, never use "1d". 
Use ONLY these exact timeframe values: "1m", "5m", "15m", "30m", "1h", "4h", "Daily", "Weekly", "Monthly"`;

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
      
      // Ensure timeframe is in the correct standardized format
      if (strategyJSON.timeframe === "1d") {
        strategyJSON.timeframe = "Daily";
      } else if (!Object.keys(STANDARD_TIMEFRAMES).includes(strategyJSON.timeframe)) {
        // Try to normalize other non-standard formats to our standard list
        const lowerTimeframe = strategyJSON.timeframe.toLowerCase();
        
        // Map variants to standard formats
        if (lowerTimeframe.includes("minute") || lowerTimeframe.includes("minutes")) {
          if (lowerTimeframe.includes("1 ")) strategyJSON.timeframe = "1m";
          else if (lowerTimeframe.includes("5 ")) strategyJSON.timeframe = "5m";
          else if (lowerTimeframe.includes("15 ")) strategyJSON.timeframe = "15m";
          else if (lowerTimeframe.includes("30 ")) strategyJSON.timeframe = "30m";
          else strategyJSON.timeframe = "15m"; // Default if no match
        } 
        else if (lowerTimeframe.includes("hour") || lowerTimeframe.includes("hours")) {
          if (lowerTimeframe.includes("1 ") || lowerTimeframe === "hourly") strategyJSON.timeframe = "1h";
          else if (lowerTimeframe.includes("4 ")) strategyJSON.timeframe = "4h";
          else strategyJSON.timeframe = "1h"; // Default if no match
        }
        else if (lowerTimeframe.includes("day") || lowerTimeframe === "daily") {
          strategyJSON.timeframe = "Daily";
        }
        else if (lowerTimeframe.includes("week") || lowerTimeframe === "weekly") {
          strategyJSON.timeframe = "Weekly";
        }
        else if (lowerTimeframe.includes("month") || lowerTimeframe === "monthly") {
          strategyJSON.timeframe = "Monthly";
        }
        else {
          // If still can't match, default to Daily
          console.warn(`Could not map timeframe "${strategyJSON.timeframe}" to standard format, defaulting to Daily`);
          strategyJSON.timeframe = "Daily";
        }
      }
      
      // Process the strategy rules to ensure all types and conditions are set correctly
      if (strategyJSON.entryRules && Array.isArray(strategyJSON.entryRules)) {
        strategyJSON.entryRules.forEach(ruleGroup => {
          if (ruleGroup.inequalities && Array.isArray(ruleGroup.inequalities)) {
            ruleGroup.inequalities.forEach(inequality => {
              // Ensure left side has correct type
              if (inequality.left) {
                // Default to VALUE if type is missing or unknown
                if (!inequality.left.type || inequality.left.type === 'unknown' || inequality.left.type === '') {
                  inequality.left.type = inequality.left.indicator ? "INDICATOR" : "VALUE";
                }
                // Remove valueType if present
                if (inequality.left.valueType) {
                  delete inequality.left.valueType;
                }
              }
              
              // Ensure right side has correct type
              if (inequality.right) {
                // Default to VALUE if type is missing or unknown
                if (!inequality.right.type || inequality.right.type === 'unknown' || inequality.right.type === '') {
                  inequality.right.type = inequality.right.indicator ? "INDICATOR" : "VALUE";
                }
                // Remove valueType if present
                if (inequality.right.valueType) {
                  delete inequality.right.valueType;
                }
              }
              
              // Ensure condition is valid
              if (!inequality.condition || inequality.condition === '') {
                // Default to GREATER_THAN as a fallback
                inequality.condition = 'GREATER_THAN';
              } else if (!['CROSSES_ABOVE', 'CROSSES_BELOW', 'GREATER_THAN', 'LESS_THAN', 'EQUAL', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN_OR_EQUAL'].includes(inequality.condition)) {
                // Map any invalid conditions to valid ones
                const conditionMap = {
                  '>': 'GREATER_THAN',
                  '<': 'LESS_THAN',
                  '=': 'EQUAL',
                  '>=': 'GREATER_THAN_OR_EQUAL',
                  '<=': 'LESS_THAN_OR_EQUAL',
                  'CROSS_ABOVE': 'CROSSES_ABOVE',
                  'CROSS_BELOW': 'CROSSES_BELOW'
                };
                inequality.condition = conditionMap[inequality.condition] || 'GREATER_THAN';
              }
            });
          }
        });
      }

      // Apply the same fixes to exit rules
      if (strategyJSON.exitRules && Array.isArray(strategyJSON.exitRules)) {
        strategyJSON.exitRules.forEach(ruleGroup => {
          if (ruleGroup.inequalities && Array.isArray(ruleGroup.inequalities)) {
            ruleGroup.inequalities.forEach(inequality => {
              // Ensure left side has correct type
              if (inequality.left) {
                if (!inequality.left.type || inequality.left.type === 'unknown' || inequality.left.type === '') {
                  inequality.left.type = inequality.left.indicator ? "INDICATOR" : "VALUE";
                }
                if (inequality.left.valueType) {
                  delete inequality.left.valueType;
                }
              }
              
              // Ensure right side has correct type
              if (inequality.right) {
                if (!inequality.right.type || inequality.right.type === 'unknown' || inequality.right.type === '') {
                  inequality.right.type = inequality.right.indicator ? "INDICATOR" : "VALUE";
                }
                if (inequality.right.valueType) {
                  delete inequality.right.valueType;
                }
              }
              
              // Ensure condition is valid
              if (!inequality.condition || inequality.condition === '') {
                // Default to GREATER_THAN as a fallback
                inequality.condition = 'GREATER_THAN';
              } else if (!['CROSSES_ABOVE', 'CROSSES_BELOW', 'GREATER_THAN', 'LESS_THAN', 'EQUAL', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN_OR_EQUAL'].includes(inequality.condition)) {
                // Map any invalid conditions to valid ones
                const conditionMap = {
                  '>': 'GREATER_THAN',
                  '<': 'LESS_THAN',
                  '=': 'EQUAL',
                  '>=': 'GREATER_THAN_OR_EQUAL',
                  '<=': 'LESS_THAN_OR_EQUAL',
                  'CROSS_ABOVE': 'CROSSES_ABOVE',
                  'CROSS_BELOW': 'CROSSES_BELOW'
                };
                inequality.condition = conditionMap[inequality.condition] || 'GREATER_THAN';
              }
            });
          }
        });
      }

      // Ensure risk management values are properly formatted
      if (strategyJSON.riskManagement) {
        // Format volume values with $ prefix
        if (strategyJSON.riskManagement.singleBuyVolume) {
          strategyJSON.riskManagement.singleBuyVolume = strategyJSON.riskManagement.singleBuyVolume.startsWith('$') ? 
            strategyJSON.riskManagement.singleBuyVolume : 
            '$' + strategyJSON.riskManagement.singleBuyVolume.replace(/%/g, '').trim();
        }
        
        if (strategyJSON.riskManagement.maxBuyVolume) {
          strategyJSON.riskManagement.maxBuyVolume = strategyJSON.riskManagement.maxBuyVolume.startsWith('$') ? 
            strategyJSON.riskManagement.maxBuyVolume : 
            '$' + strategyJSON.riskManagement.maxBuyVolume.replace(/%/g, '').trim();
        }
        
        // Ensure percentage values have % symbol
        if (strategyJSON.riskManagement.stopLoss && !strategyJSON.riskManagement.stopLoss.includes('%')) {
          strategyJSON.riskManagement.stopLoss += '%';
        }
        
        if (strategyJSON.riskManagement.takeProfit && !strategyJSON.riskManagement.takeProfit.includes('%')) {
          strategyJSON.riskManagement.takeProfit += '%';
        }
      }

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
        
        // Ensure timeframe is in the correct standardized format
        if (fallbackJSON.timeframe === "1d") {
          fallbackJSON.timeframe = "Daily";
        } else if (!Object.keys(STANDARD_TIMEFRAMES).includes(fallbackJSON.timeframe)) {
          // Try to normalize other non-standard formats to our standard list
          const lowerTimeframe = fallbackJSON.timeframe.toLowerCase();
          
          // Map variants to standard formats
          if (lowerTimeframe.includes("minute") || lowerTimeframe.includes("minutes")) {
            if (lowerTimeframe.includes("1 ")) fallbackJSON.timeframe = "1m";
            else if (lowerTimeframe.includes("5 ")) fallbackJSON.timeframe = "5m";
            else if (lowerTimeframe.includes("15 ")) fallbackJSON.timeframe = "15m";
            else if (lowerTimeframe.includes("30 ")) fallbackJSON.timeframe = "30m";
            else fallbackJSON.timeframe = "15m"; // Default if no match
          } 
          else if (lowerTimeframe.includes("hour") || lowerTimeframe.includes("hours")) {
            if (lowerTimeframe.includes("1 ") || lowerTimeframe === "hourly") fallbackJSON.timeframe = "1h";
            else if (lowerTimeframe.includes("4 ")) fallbackJSON.timeframe = "4h";
            else fallbackJSON.timeframe = "1h"; // Default if no match
          }
          else if (lowerTimeframe.includes("day") || lowerTimeframe === "daily") {
            fallbackJSON.timeframe = "Daily";
          }
          else if (lowerTimeframe.includes("week") || lowerTimeframe === "weekly") {
            fallbackJSON.timeframe = "Weekly";
          }
          else if (lowerTimeframe.includes("month") || lowerTimeframe === "monthly") {
            fallbackJSON.timeframe = "Monthly";
          }
          else {
            // If still can't match, default to Daily
            console.warn(`Could not map timeframe "${fallbackJSON.timeframe}" to standard format, defaulting to Daily`);
            fallbackJSON.timeframe = "Daily";
          }
        }
        
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


import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

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
    console.log('=== Strategy Generation Function Started ===');
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    // Validate API key first
    if (!OPENAI_API_KEY) {
      console.error("Missing OpenAI API key in environment variables");
      return new Response(
        JSON.stringify({
          error: "OpenAI API key not configured",
          type: "api_key_error",
          details: "The OpenAI API key is missing from the environment variables"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log('OpenAI API key is configured');

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log('Request body:', body);
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          type: "validation_error",
          details: error.message
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Handle health check
    if (body.healthCheck) {
      console.log('Health check request received');
      return new Response(
        JSON.stringify({
          status: "healthy",
          message: "OpenAI API key is configured and service is ready"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Validate required fields
    const { assetType, asset, description } = body;
    
    if (!assetType || !asset || !description) {
      console.error('Missing required fields:', { assetType, asset, description });
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          type: "validation_error",
          details: "assetType, asset, and description are required"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log(`Generating strategy for ${asset} (${assetType}): ${description}`);

    // Create the system prompt for strategy generation
    const systemPrompt = `You are an expert trading strategy generator. Generate a comprehensive trading strategy based on the user's requirements.

You must respond with a valid JSON object that follows this exact structure:
{
  "name": "Strategy Name",
  "description": "Detailed strategy description",
  "timeframe": "1d",
  "targetAsset": "ASSET_SYMBOL",
  "entryRules": [
    {
      "logic": "AND",
      "requiredConditions": 1,
      "inequalities": [
        {
          "id": 1,
          "left": {
            "type": "INDICATOR",
            "indicator": "RSI",
            "parameters": {"period": "14"},
            "valueType": "Value"
          },
          "condition": "LESS_THAN",
          "right": {
            "type": "VALUE",
            "value": "30"
          },
          "explanation": "RSI indicates oversold condition"
        }
      ]
    }
  ],
  "exitRules": [
    {
      "logic": "OR",
      "requiredConditions": 1,
      "inequalities": [
        {
          "id": 1,
          "left": {
            "type": "INDICATOR",
            "indicator": "RSI", 
            "parameters": {"period": "14"},
            "valueType": "Value"
          },
          "condition": "GREATER_THAN",
          "right": {
            "type": "VALUE",
            "value": "70"
          },
          "explanation": "RSI indicates overbought condition"
        }
      ]
    }
  ]
}

CRITICAL RULE ABOUT OR GROUPS:
- OR groups MUST always contain at least 2 conditions (inequalities)
- If you would create an OR group with only 1 condition, place that condition in the AND group instead
- Never create an OR group with just a single inequality
- The AND group can contain multiple conditions that all must be met
- The OR group should only exist when you have multiple alternative conditions (at least 2)

Available indicators: RSI, MACD, Moving Average, SMA, EMA, Bollinger Bands, Stochastic, ADX, VWAP, ATR
Available conditions: GREATER_THAN, LESS_THAN, GREATER_THAN_OR_EQUAL, LESS_THAN_OR_EQUAL, EQUAL, NOT_EQUAL
Available timeframes: 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w
Available side types: INDICATOR, PRICE, VALUE

Make sure all indicators have proper parameters and valueType when needed.`;

    const userPrompt = `Create a trading strategy for ${asset} (${assetType}) based on this description: ${description}

Requirements:
- Generate realistic entry and exit conditions
- Use appropriate technical indicators
- Include clear explanations for each rule
- Make the strategy suitable for the specified asset type
- Ensure the JSON is valid and follows the exact structure provided
- IMPORTANT: Only create OR groups if you have at least 2 conditions. If you only have 1 condition for an OR group, put it in the AND group instead`;

    console.log('Sending request to OpenAI...');

    // Make request to OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    console.log('OpenAI response status:', openAIResponse.status);
    console.log('OpenAI response headers:', Object.fromEntries(openAIResponse.headers.entries()));

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', {
        status: openAIResponse.status,
        statusText: openAIResponse.statusText,
        body: errorText
      });
      
      let errorType = "api_error";
      let errorMessage = `OpenAI API error: ${openAIResponse.status} ${openAIResponse.statusText}`;
      
      if (openAIResponse.status === 401) {
        errorType = "api_key_error";
        errorMessage = "Invalid OpenAI API key";
      } else if (openAIResponse.status === 429) {
        errorType = "rate_limit_error";
        errorMessage = "OpenAI API rate limit exceeded";
      } else if (openAIResponse.status >= 500) {
        errorType = "service_unavailable";
        errorMessage = "OpenAI service is temporarily unavailable";
      }
      
      return new Response(
        JSON.stringify({
          error: errorMessage,
          type: errorType,
          details: errorText
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const openAIData = await openAIResponse.json();
    console.log('OpenAI response received:', openAIData);

    if (!openAIData.choices || !openAIData.choices[0] || !openAIData.choices[0].message) {
      console.error('Invalid OpenAI response structure:', openAIData);
      return new Response(
        JSON.stringify({
          error: "Invalid response from OpenAI",
          type: "parsing_error",
          details: "OpenAI returned an unexpected response format"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const generatedContent = openAIData.choices[0].message.content;
    console.log('Generated content:', generatedContent);

    // Parse the generated strategy
    let strategy;
    try {
      // Try to extract JSON from the response
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      strategy = JSON.parse(jsonMatch[0]);
      console.log('Parsed strategy:', strategy);
    } catch (parseError) {
      console.error('Error parsing generated strategy:', parseError);
      console.error('Generated content was:', generatedContent);
      
      return new Response(
        JSON.stringify({
          error: "Failed to parse generated strategy",
          type: "parsing_error",
          details: `JSON parsing failed: ${parseError.message}`,
          rawContent: generatedContent
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate the strategy structure
    if (!strategy.name || !strategy.description || !strategy.entryRules || !strategy.exitRules) {
      console.error('Invalid strategy structure:', strategy);
      return new Response(
        JSON.stringify({
          error: "Generated strategy has invalid structure",
          type: "validation_error",
          details: "Strategy is missing required fields (name, description, entryRules, exitRules)"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Strategy generated successfully:', strategy.name);

    return new Response(JSON.stringify(strategy), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in generate-strategy function:", error);
    console.error("Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: `Internal server error: ${error.message}`,
        type: "unknown_error",
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

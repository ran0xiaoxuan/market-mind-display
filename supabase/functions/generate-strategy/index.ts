
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== Generate Strategy Function Started ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);

  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Processing strategy generation request...');
    
    const requestBody = await req.json().catch(() => ({}));
    console.log('Request body received:', Object.keys(requestBody));
    
    const { assetType, selectedAsset, strategyDescription, healthCheck } = requestBody;
    
    // Health check endpoint
    if (healthCheck) {
      console.log('Health check requested');
      return new Response(
        JSON.stringify({ healthy: true, status: 'AI service is operational', timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate required parameters
    if (!assetType || !selectedAsset || !strategyDescription) {
      console.log('Missing required parameters:', { assetType, selectedAsset, strategyDescription });
      return new Response(
        JSON.stringify({
          message: 'Missing required parameters: assetType, selectedAsset, and strategyDescription are required',
          type: 'validation_error',
          retryable: false
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.log('OpenAI API key not configured');
      return new Response(
        JSON.stringify({
          message: 'AI service is not properly configured. Please contact support.',
          type: 'api_key_error',
          retryable: false
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Define valid indicators
    const validIndicators = [
      "SMA", "EMA", "WMA", "DEMA", "TEMA", "TRIMA", "KAMA", "VWMA",
      "RSI", "Stochastic", "StochRSI", "CCI", "Williams %R", "Ultimate Oscillator", 
      "MACD", "Awesome Oscillator", "Momentum", "CMO", "MFI", "OBV",
      "ADX", "DMI", "Ichimoku Cloud", "PSAR", "VWAP", "Supertrend", "TTM Squeeze",
      "Bollinger Bands", "ATR", "Keltner Channel", "Donchian Channel", "Chandelier Exit",
      "Volume", "Chaikin Money Flow", "On Balance Volume", "Volume Oscillator", 
      "Volume Weighted Moving Average", "Heikin Ashi"
    ]

    const prompt = `You are an expert trading strategy generator. Create a detailed trading strategy based on the user's description.

CRITICAL CONSTRAINT: You MUST ONLY use indicators from this exact list:
${validIndicators.join(", ")}

Asset Type: ${assetType}
Selected Asset: ${selectedAsset}
Strategy Description: ${strategyDescription}

Generate a comprehensive trading strategy with this exact JSON structure:

{
  "name": "Strategy Name",
  "description": "Detailed strategy description",
  "timeframe": "Daily",
  "targetAsset": "${selectedAsset}",
  "entryRules": [
    {
      "id": 1,
      "logic": "AND",
      "inequalities": [
        {
          "id": 1,
          "left": {
            "type": "INDICATOR",
            "indicator": "RSI",
            "parameters": {"period": "14"},
            "value": "",
            "valueType": "number"
          },
          "condition": "GREATER_THAN",
          "right": {
            "type": "VALUE",
            "indicator": "",
            "parameters": {},
            "value": "30",
            "valueType": "number"
          },
          "explanation": "RSI above 30 indicates potential bullish momentum"
        }
      ]
    }
  ],
  "exitRules": [
    {
      "id": 1,
      "logic": "OR",
      "requiredConditions": 1,
      "inequalities": [
        {
          "id": 1,
          "left": {
            "type": "INDICATOR",
            "indicator": "RSI",
            "parameters": {"period": "14"},
            "value": "",
            "valueType": "number"
          },
          "condition": "LESS_THAN",
          "right": {
            "type": "VALUE",
            "indicator": "",
            "parameters": {},
            "value": "70",
            "valueType": "number"
          },
          "explanation": "RSI below 70 indicates potential exit signal"
        }
      ]
    }
  ],
  "riskManagement": {
    "stopLoss": "5",
    "takeProfit": "10",
    "singleBuyVolume": "1000",
    "maxBuyVolume": "5000"
  }
}

Valid conditions: GREATER_THAN, LESS_THAN, EQUAL, GREATER_THAN_OR_EQUAL, LESS_THAN_OR_EQUAL, CROSSES_ABOVE, CROSSES_BELOW

IMPORTANT RULES:
1. ONLY use indicators from the provided list
2. For OR groups: requiredConditions must be less than total inequalities
3. For AND groups: do not include requiredConditions field
4. Return ONLY valid JSON, no additional text

Return ONLY the JSON object.`;

    console.log('Making request to OpenAI...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a professional trading strategy generator. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('OpenAI API error:', response.status, errorText);
        
        return new Response(
          JSON.stringify({
            message: `OpenAI API error: ${response.status}`,
            type: 'api_error',
            retryable: true
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const data = await response.json();
      console.log('OpenAI response received');
      
      const content = data.choices[0]?.message?.content;
      if (!content) {
        console.error('No content in OpenAI response');
        return new Response(
          JSON.stringify({
            message: 'No response from AI service',
            type: 'api_error',
            retryable: true
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Parse the JSON response
      let strategy;
      try {
        const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        strategy = JSON.parse(cleanContent);
        console.log('Strategy parsed successfully');
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        return new Response(
          JSON.stringify({
            message: 'Invalid response format from AI service',
            type: 'parsing_error',
            retryable: true
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Basic validation
      if (!strategy.name || !strategy.entryRules || !strategy.exitRules) {
        console.error('Invalid strategy structure');
        return new Response(
          JSON.stringify({
            message: 'Generated strategy has invalid structure',
            type: 'validation_error',
            retryable: true
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('Strategy generation completed successfully');
      return new Response(
        JSON.stringify(strategy),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', fetchError);
      
      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({
            message: 'Request timed out. Please try again.',
            type: 'timeout_error',
            retryable: true
          }),
          { 
            status: 408,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      return new Response(
        JSON.stringify({
          message: 'Network error occurred',
          type: 'connection_error',
          retryable: true
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Error in generate-strategy function:', error);
    
    return new Response(
      JSON.stringify({
        message: 'An unexpected error occurred',
        type: 'unknown_error',
        retryable: true
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

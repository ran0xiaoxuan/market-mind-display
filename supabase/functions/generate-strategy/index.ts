
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== Generate Strategy Function Started ===');
  console.log('Method:', req.method, 'URL:', req.url);
  console.log('Timestamp:', new Date().toISOString());

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Processing strategy generation request...');
    
    // Parse request body with better error handling
    let requestBody;
    try {
      const rawBody = await req.text();
      console.log('Request body length:', rawBody.length);
      console.log('Raw request body:', rawBody);
      
      if (!rawBody.trim()) {
        return new Response(JSON.stringify({
          message: 'Request body is empty',
          type: 'validation_error',
          retryable: false
        }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      requestBody = JSON.parse(rawBody);
      console.log('Request parsed:', {
        hasAssetType: !!requestBody.assetType,
        hasSelectedAsset: !!requestBody.selectedAsset,
        hasStrategyDescription: !!requestBody.strategyDescription,
        hasHealthCheck: !!requestBody.healthCheck
      });
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(JSON.stringify({
        message: 'Invalid JSON in request body',
        type: 'validation_error',
        retryable: false
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const { assetType, selectedAsset, strategyDescription, healthCheck } = requestBody;
    
    // Health check endpoint
    if (healthCheck) {
      console.log('Health check requested');
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      
      let openaiHealthy = false;
      try {
        if (openaiApiKey) {
          const testResponse = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${openaiApiKey}` },
          });
          openaiHealthy = testResponse.ok;
        }
      } catch (error) {
        console.log('OpenAI test failed:', error.message);
      }
      
      const healthStatus = {
        healthy: true,
        status: 'AI service is operational',
        timestamp: new Date().toISOString(),
        openaiConfigured: !!openaiApiKey,
        openaiHealthy: openaiHealthy
      };
      
      console.log('Health check completed:', healthStatus);
      return new Response(JSON.stringify(healthStatus), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate required parameters
    if (!assetType || !selectedAsset || !strategyDescription) {
      const missing = [];
      if (!assetType) missing.push('assetType');
      if (!selectedAsset) missing.push('selectedAsset');
      if (!strategyDescription) missing.push('strategyDescription');
      
      console.error('Missing required parameters:', missing);
      return new Response(JSON.stringify({
        message: `Missing required parameters: ${missing.join(', ')}`,
        type: 'validation_error',
        retryable: false
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    if (strategyDescription.length < 10) {
      return new Response(JSON.stringify({
        message: 'Strategy description must be at least 10 characters long',
        type: 'validation_error',
        retryable: false
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('OpenAI API key not found');
      return new Response(JSON.stringify({
        message: 'AI service is not configured properly',
        type: 'api_key_error',
        retryable: false
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Indicator list matching exactly what's in AvailableIndicators component
    const validIndicators = [
      // Moving Averages
      "SMA", "EMA", "WMA", "TRIMA", "KAMA",
      // Oscillators
      "RSI", "Stochastic", "StochRSI", "CCI", "Williams %R", "Ultimate Oscillator", 
      "MACD", "Awesome Oscillator", "Momentum", "CMO", "MFI",
      // Trend Indicators
      "ADX", "DMI", "Ichimoku Cloud", "PSAR", "VWAP", "Supertrend", "TTM Squeeze",
      // Volatility Indicators
      "Bollinger Bands", "ATR", "Keltner Channel", "Donchian Channel", "Chandelier Exit",
      // Volume Indicators
      "Volume", "Chaikin Money Flow", "Volume Oscillator",
      // Price Patterns
      "Heikin Ashi"
    ];

    const prompt = `You are an expert trading strategy generator. Create a trading strategy for ${selectedAsset} (${assetType}) based STRICTLY on this user request: "${strategyDescription}"

IMPORTANT RULES:
1. Generate strategy based ONLY on the user's description - do not default to RSI/MACD unless specifically requested
2. Use indicators that are relevant to the user's request from this list: ${validIndicators.join(", ")}
3. If the user requests features not supported by the available indicators, mention this limitation in the description
4. Make the strategy name and description specific to the user's request

TIMEFRAME SELECTION:
Available timeframes: "1 minute", "5 minutes", "15 minutes", "30 minutes", "1 hour", "4 hours", "Daily", "Weekly", "Monthly"

- Analyze the user's description for timeframe keywords and select appropriately
- Default to "Daily" only if strategy type cannot be determined

CONDITION VALUES:
You MUST use these EXACT condition values (these are the only valid options):
- "GREATER_THAN" for greater than (>)
- "LESS_THAN" for less than (<)
- "EQUAL" for equal (=)
- "GREATER_THAN_OR_EQUAL" for greater than or equal (≥)
- "LESS_THAN_OR_EQUAL" for less than or equal (≤)
- "CROSSES_ABOVE" for crosses above
- "CROSSES_BELOW" for crosses below

DO NOT use any other condition formats like ">" or "<" or "EQUALS" - only use the exact strings listed above.

STRATEGY LOGIC ANALYSIS:
Analyze the user's description to determine appropriate entry and exit logic structures, indicator parameters, conditions, and thresholds.

Return ONLY this JSON structure:
{
  "name": "Descriptive strategy name based on user request",
  "description": "Strategy description that explains how it implements the user's request. If any requested features aren't supported by available indicators, mention this limitation.",
  "timeframe": "Selected timeframe from available options based on user description or strategy type",
  "targetAsset": "${selectedAsset}",
  "entryRules": [
    {
      "id": 1,
      "logic": "Determined based on user description (AND/OR)",
      "inequalities": [
        {
          "id": 1,
          "left": {"type": "INDICATOR", "indicator": "IndicatorChosenBasedOnUserRequest", "parameters": {"period": "DeterminedFromUserDescriptionOrAppropriateDefault"}, "value": "", "valueType": "number"},
          "condition": "Use ONLY the exact condition values listed above (GREATER_THAN, LESS_THAN, etc.)",
          "right": {"type": "VALUE", "indicator": "", "parameters": {}, "value": "ThresholdBasedOnUserDescriptionOrIndicatorDefaults", "valueType": "number"},
          "explanation": "Clear explanation of this condition based on user's strategy intent"
        }
      ]
    }
  ],
  "exitRules": [
    {
      "id": 1,
      "logic": "DeterminedBasedOnUserDescription (typically OR for exits)",
      "requiredConditions": "DeterminedBasedOnUserIntent (1 for typical exits, higher for complex requirements)",
      "inequalities": [
        {
          "id": 1,
          "left": {"type": "INDICATOR", "indicator": "IndicatorChosenBasedOnUserRequest", "parameters": {"period": "DeterminedFromUserDescriptionOrAppropriateDefault"}, "value": "", "valueType": "number"},
          "condition": "Use ONLY the exact condition values listed above (GREATER_THAN, LESS_THAN, etc.)",
          "right": {"type": "VALUE", "indicator": "", "parameters": {}, "value": "ThresholdBasedOnUserDescriptionOrIndicatorDefaults", "valueType": "number"},
          "explanation": "Clear explanation of this exit condition based on user's strategy intent"
        }
      ]
    }
  ]
}

Carefully analyze the user's description to create a strategy that truly reflects their intent, using appropriate logic structures, parameters, conditions, and thresholds rather than following a rigid template. Remember to use ONLY the exact condition values specified above.`;

    console.log('Calling OpenAI API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a trading strategy generator. Analyze user requests carefully and create appropriate strategies. Return only valid JSON that matches the specified structure exactly. Use ONLY the exact condition values provided in the prompt.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({
          message: 'AI service is busy. Please wait and try again.',
          type: 'rate_limit_error',
          retryable: true
        }), { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      return new Response(JSON.stringify({
        message: `OpenAI API error: ${response.status}`,
        type: 'api_error',
        retryable: true
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in OpenAI response');
      return new Response(JSON.stringify({
        message: 'No response from AI service',
        type: 'api_error',
        retryable: true
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Parse and validate strategy
    let strategy;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      strategy = JSON.parse(cleanContent);
      
      // Basic validation
      if (!strategy.name || !strategy.entryRules || !strategy.exitRules) {
        throw new Error('Invalid strategy structure');
      }

      console.log('Strategy generated successfully:', strategy.name);
      
      return new Response(JSON.stringify(strategy), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (parseError) {
      console.error('Failed to parse strategy:', parseError);
      return new Response(JSON.stringify({
        message: 'AI generated invalid strategy format',
        type: 'parsing_error',
        retryable: true
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({
      message: 'An unexpected error occurred',
      type: 'unknown_error',
      retryable: true
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})

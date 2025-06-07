
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
  console.log('Timestamp:', new Date().toISOString());

  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Processing strategy generation request...');
    
    // Enhanced request body parsing with detailed error handling
    let requestBody;
    try {
      const rawBody = await req.text();
      console.log('Raw request body length:', rawBody.length);
      console.log('Raw request body preview:', rawBody.substring(0, 200));
      
      if (!rawBody.trim()) {
        console.error('Empty request body received');
        return new Response(
          JSON.stringify({
            message: 'Request body is empty',
            type: 'validation_error',
            retryable: false
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      requestBody = JSON.parse(rawBody);
      console.log('Request body parsed successfully:', {
        hasAssetType: !!requestBody.assetType,
        hasSelectedAsset: !!requestBody.selectedAsset,
        hasStrategyDescription: !!requestBody.strategyDescription,
        hasHealthCheck: !!requestBody.healthCheck,
        descriptionLength: requestBody.strategyDescription?.length || 0
      });
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({
          message: 'Invalid JSON in request body',
          type: 'validation_error',
          retryable: false
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { assetType, selectedAsset, strategyDescription, healthCheck } = requestBody;
    
    // Enhanced health check endpoint
    if (healthCheck) {
      console.log('Health check requested - performing comprehensive check');
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      
      // Test OpenAI connectivity
      let openaiHealthy = false;
      try {
        if (openaiApiKey) {
          const testResponse = await fetch('https://api.openai.com/v1/models', {
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
            },
          });
          openaiHealthy = testResponse.ok;
          console.log('OpenAI API test result:', testResponse.status);
        }
      } catch (error) {
        console.log('OpenAI API test failed:', error.message);
      }
      
      const healthStatus = {
        healthy: true,
        status: 'AI service is operational',
        timestamp: new Date().toISOString(),
        openaiConfigured: !!openaiApiKey,
        openaiHealthy: openaiHealthy,
        environment: 'production',
        version: '2.0.0'
      };
      
      console.log('Health check completed:', healthStatus);
      
      return new Response(
        JSON.stringify(healthStatus),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Enhanced parameter validation
    const missingParams = [];
    if (!assetType) missingParams.push('assetType');
    if (!selectedAsset) missingParams.push('selectedAsset');
    if (!strategyDescription) missingParams.push('strategyDescription');
    
    if (missingParams.length > 0) {
      console.log('Missing required parameters:', missingParams);
      return new Response(
        JSON.stringify({
          message: `Missing required parameters: ${missingParams.join(', ')}`,
          type: 'validation_error',
          retryable: false,
          details: [`Required fields: ${missingParams.join(', ')}`]
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (strategyDescription.length < 10) {
      console.log('Strategy description too short:', strategyDescription.length);
      return new Response(
        JSON.stringify({
          message: 'Strategy description must be at least 10 characters long',
          type: 'validation_error',
          retryable: false,
          details: ['Please provide a more detailed strategy description']
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    console.log('OpenAI API key status:', openaiApiKey ? 'present' : 'missing');
    
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({
          message: 'AI service is not properly configured. Please contact support.',
          type: 'api_key_error',
          retryable: false,
          details: ['OpenAI API key is missing from server configuration']
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

    console.log('Making request to OpenAI API...');
    console.log('Request details:', {
      model: 'gpt-4o-mini',
      promptLength: prompt.length,
      timestamp: new Date().toISOString()
    });
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Request timeout triggered (50 seconds)');
        controller.abort();
      }, 50000); // 50 second timeout

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
      console.log('OpenAI API response received');
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('OpenAI API error details:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 500)
        });
        
        // Handle specific API errors
        if (response.status === 429) {
          return new Response(
            JSON.stringify({
              message: 'AI service is currently busy. Please wait a moment and try again.',
              type: 'rate_limit_error',
              retryable: true,
              details: ['Service is experiencing high demand', 'Wait 30-60 seconds before retrying']
            }),
            { 
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        if (response.status === 401) {
          return new Response(
            JSON.stringify({
              message: 'AI service authentication failed. Please contact support.',
              type: 'api_key_error',
              retryable: false,
              details: ['Invalid or expired API key']
            }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        return new Response(
          JSON.stringify({
            message: `OpenAI API error: ${response.status} - ${response.statusText}`,
            type: 'api_error',
            retryable: true,
            details: [`API returned status ${response.status}`, 'Try again in a few moments']
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const data = await response.json();
      console.log('OpenAI response data structure:', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length || 0,
        hasUsage: !!data.usage,
        model: data.model
      });
      
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        console.error('No content in OpenAI response:', {
          dataKeys: Object.keys(data),
          choices: data.choices
        });
        return new Response(
          JSON.stringify({
            message: 'No response from AI service',
            type: 'api_error',
            retryable: true,
            details: ['AI service returned empty response', 'Try again with different strategy description']
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('OpenAI content received:', {
        contentLength: content.length,
        contentPreview: content.substring(0, 100) + '...'
      });

      // Parse the JSON response
      let strategy;
      try {
        const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        console.log('Cleaned content length:', cleanContent.length);
        
        strategy = JSON.parse(cleanContent);
        console.log('Strategy parsed successfully:', {
          name: strategy.name,
          hasEntryRules: !!strategy.entryRules,
          hasExitRules: !!strategy.exitRules,
          hasRiskManagement: !!strategy.riskManagement
        });
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        console.error('Raw content sample:', content.substring(0, 500));
        return new Response(
          JSON.stringify({
            message: 'Invalid response format from AI service',
            type: 'parsing_error',
            retryable: true,
            details: ['AI service returned malformed JSON', 'Try simplifying your strategy description']
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Enhanced validation
      const validationErrors = [];
      if (!strategy.name) validationErrors.push('Missing strategy name');
      if (!strategy.entryRules || !Array.isArray(strategy.entryRules)) validationErrors.push('Missing or invalid entry rules');
      if (!strategy.exitRules || !Array.isArray(strategy.exitRules)) validationErrors.push('Missing or invalid exit rules');
      if (!strategy.riskManagement) validationErrors.push('Missing risk management');
      
      if (validationErrors.length > 0) {
        console.error('Strategy validation failed:', validationErrors);
        console.error('Strategy structure:', Object.keys(strategy));
        return new Response(
          JSON.stringify({
            message: 'Generated strategy has invalid structure',
            type: 'validation_error',
            retryable: true,
            details: validationErrors
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('Strategy generation completed successfully:', {
        name: strategy.name,
        entryRulesCount: strategy.entryRules.length,
        exitRulesCount: strategy.exitRules.length,
        timestamp: new Date().toISOString()
      });
      
      return new Response(
        JSON.stringify(strategy),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (fetchError) {
      console.error('Fetch error details:', {
        name: fetchError.name,
        message: fetchError.message,
        stack: fetchError.stack
      });
      
      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({
            message: 'Request timed out. Please try with a simpler strategy description.',
            type: 'timeout_error',
            retryable: true,
            details: ['Request exceeded 50 second limit', 'Try reducing complexity of strategy description']
          }),
          { 
            status: 408,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      return new Response(
        JSON.stringify({
          message: 'Network error occurred while contacting AI service',
          type: 'connection_error',
          retryable: true,
          details: ['Unable to reach OpenAI API', 'Check service status and try again']
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Unexpected error in generate-strategy function:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({
        message: 'An unexpected error occurred',
        type: 'unknown_error',
        retryable: true,
        details: ['Internal server error', 'Please try again or contact support']
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

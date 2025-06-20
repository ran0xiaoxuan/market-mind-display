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

    // Generate strategy using OpenAI
    const validIndicators = [
      // Moving Averages
      "SMA", "EMA", "WMA", "DEMA", "TEMA", "TRIMA", "KAMA", "VWMA",
      // Oscillators
      "RSI", "Stochastic", "StochRSI", "CCI", "Williams %R", "Ultimate Oscillator", 
      "MACD", "Awesome Oscillator", "Momentum", "CMO", "MFI", "OBV",
      // Trend Indicators
      "ADX", "DMI", "Ichimoku Cloud", "PSAR", "VWAP", "Supertrend", "TTM Squeeze",
      // Volatility Indicators
      "Bollinger Bands", "ATR", "Keltner Channel", "Donchian Channel", "Chandelier Exit",
      // Volume Indicators
      "Volume", "Chaikin Money Flow", "On Balance Volume", "Volume Oscillator", "Volume Weighted Moving Average",
      // Price Patterns
      "Heikin Ashi", "Engulfing", "Hammer", "Doji", "Morning Star", "Evening Star"
    ];

    const prompt = `You are an expert trading strategy generator. Create a trading strategy for ${selectedAsset} (${assetType}) based STRICTLY on this user request: "${strategyDescription}"

IMPORTANT RULES:
1. Generate strategy based ONLY on the user's description - do not default to RSI/MACD unless specifically requested
2. Use indicators that are relevant to the user's request from this list: ${validIndicators.join(", ")}
3. If the user requests features not supported by the available indicators, mention this limitation in the description
4. For risk management: stopLoss percentage MUST be less than takeProfit percentage, and singleBuyVolume MUST be less than maxBuyVolume
5. If the user provides specific risk management requirements in their description, follow those requirements
6. If no specific risk management is mentioned, set values that suit the strategy type and asset volatility
7. Make the strategy name and description specific to the user's request

TIMEFRAME SELECTION:
Available timeframes: "1 minute", "5 minutes", "15 minutes", "30 minutes", "1 hour", "4 hours", "Daily", "Weekly", "Monthly"

- Analyze the user's description for timeframe keywords:
  - "scalping", "second", "minute", "very fast", "intraday" → use "1 minute"
  - "5 min", "5 minute", "quick scalping" → use "5 minutes"
  - "15 min", "15 minute", "short scalping" → use "15 minutes"
  - "30 min", "30 minute", "half hour" → use "30 minutes"
  - "day trading", "hourly", "1 hour", "short term" → use "1 hour"
  - "4 hour", "4h", "medium intraday" → use "4 hours"
  - "swing trading", "daily", "medium term" → use "Daily"
  - "position trading", "weekly", "long term", "investment" → use "Weekly"
  - "buy and hold", "monthly", "very long term" → use "Monthly"

- If no timeframe is explicitly mentioned, select based on strategy type:
  - High-frequency/scalping strategies → "1 minute" or "5 minutes"
  - Momentum/breakout strategies → "15 minutes" or "1 hour"
  - Mean reversion strategies → "1 hour" or "Daily"
  - Trend following strategies → "Daily" or "4 hours"
  - Value/fundamental strategies → "Weekly" or "Monthly"

- Default to "Daily" only if strategy type cannot be determined

STRATEGY LOGIC ANALYSIS:
Analyze the user's description to determine:

1. ENTRY LOGIC STRUCTURE:
   - If user mentions "all conditions must be met", "and", "both", "together" → use "AND" logic
   - If user mentions "any condition", "or", "either", "alternative" → use "OR" logic
   - If user mentions complex combinations → create multiple rule groups as needed
   - Default to "AND" for single-condition strategies, "OR" for multi-alternative strategies

2. EXIT LOGIC STRUCTURE:
   - If user mentions "stop loss OR take profit", "either condition" → use "OR" logic with requiredConditions: 1
   - If user mentions "both conditions must be met" → use "AND" logic
   - If user mentions multiple exit scenarios → use "OR" logic with appropriate requiredConditions
   - Default to "OR" with requiredConditions: 1 for typical exit strategies

3. INDICATOR PARAMETERS:
   - Extract specific periods from user description (e.g., "14-day RSI", "20-period moving average")
   - Use common defaults based on indicator type if not specified:
     * RSI, Stochastic: 14
     * Moving Averages: 20 for short-term, 50 for medium-term, 200 for long-term
     * MACD: 12,26,9
     * Bollinger Bands: 20,2
   - Adjust parameters based on timeframe (shorter periods for shorter timeframes)

4. CONDITIONS AND THRESHOLDS:
   - For RSI: overbought (>70), oversold (<30), or custom levels from user
   - For price vs MA: above/below based on trend direction in user description
   - For momentum indicators: analyze if user wants bullish (>) or bearish (<) signals
   - For volume: analyze if user wants high volume (>) or low volume (<) confirmation
   - Use appropriate comparison operators based on the logical intent of the strategy

5. REQUIRED CONDITIONS FOR OR GROUPS:
   - If user wants "any one condition" → requiredConditions: 1
   - If user wants "at least 2 out of 3" → requiredConditions: 2
   - If user wants "majority" → requiredConditions: more than half
   - Default to 1 for typical OR exit conditions

Analyze the user's request and determine the most appropriate structure, parameters, and logic based on their specific description.

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
          "condition": "DeterminedBasedOnLogicalIntent (GREATER_THAN/LESS_THAN/EQUALS/etc)",
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
          "condition": "DeterminedBasedOnLogicalIntent (opposite of entry or specific exit condition)",
          "right": {"type": "VALUE", "indicator": "", "parameters": {}, "value": "ThresholdBasedOnUserDescriptionOrIndicatorDefaults", "valueType": "number"},
          "explanation": "Clear explanation of this exit condition based on user's strategy intent"
        }
      ]
    }
  ],
  "riskManagement": {
    "stopLoss": "percentage (must be less than takeProfit, based on user description or strategy type)",
    "takeProfit": "percentage (must be greater than stopLoss, based on user description or strategy type)",
    "singleBuyVolume": "dollar amount (must be less than maxBuyVolume, based on user description or reasonable defaults)",
    "maxBuyVolume": "dollar amount (must be greater than singleBuyVolume, based on user description or reasonable defaults)"
  }
}

Carefully analyze the user's description to create a strategy that truly reflects their intent, using appropriate logic structures, parameters, conditions, and thresholds rather than following a rigid template.`;

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
          { role: 'system', content: 'You are a trading strategy generator. Analyze user requests carefully and create appropriate strategies. Return only valid JSON that matches the specified structure exactly.' },
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
      if (!strategy.name || !strategy.entryRules || !strategy.exitRules || !strategy.riskManagement) {
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

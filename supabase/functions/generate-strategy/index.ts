
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { assetType, selectedAsset, strategyDescription } = await req.json()
    
    // Health check endpoint
    if (req.body && JSON.stringify(req.body).includes('healthCheck')) {
      return new Response(
        JSON.stringify({ healthy: true, status: 'AI service is operational' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Define valid indicators that actually exist in our system
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

CRITICAL CONSTRAINT: You MUST ONLY use indicators from this exact list of valid indicators:
${validIndicators.join(", ")}

DO NOT use any indicators not in this list. Examples of FORBIDDEN indicators include:
- Earnings Surprise
- Earnings Date 
- Revenue Growth
- P/E Ratio
- Any fundamental analysis indicators
- Any custom or non-standard technical indicators

Asset Type: ${assetType}
Selected Asset: ${selectedAsset}
Strategy Description: ${strategyDescription}

Generate a comprehensive trading strategy with the following structure:

{
  "name": "Strategy Name",
  "description": "Detailed strategy description",
  "timeframe": "Daily/Hourly/4H etc",
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
            "indicator": "RSI", // MUST be from the valid indicators list
            "parameters": {"period": "14"},
            "value": "",
            "valueType": "number"
          },
          "condition": "CROSSES_ABOVE",
          "right": {
            "type": "VALUE",
            "indicator": "",
            "parameters": {},
            "value": "30",
            "valueType": "number"
          },
          "explanation": "RSI crosses above 30 indicating bullish momentum"
        }
      ]
    }
  ],
  "exitRules": [
    {
      "id": 1,
      "logic": "OR",
      "inequalities": [
        {
          "id": 1,
          "left": {
            "type": "INDICATOR", 
            "indicator": "RSI", // MUST be from the valid indicators list
            "parameters": {"period": "14"},
            "value": "",
            "valueType": "number"
          },
          "condition": "CROSSES_BELOW",
          "right": {
            "type": "VALUE",
            "indicator": "",
            "parameters": {},
            "value": "70",
            "valueType": "number"
          },
          "explanation": "RSI crosses below 70 indicating potential reversal"
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

Valid condition types: CROSSES_ABOVE, CROSSES_BELOW, GREATER_THAN, LESS_THAN, EQUAL, GREATER_THAN_OR_EQUAL, LESS_THAN_OR_EQUAL

IMPORTANT RULES:
1. ONLY use indicators from the provided valid indicators list
2. For left side of conditions, use type "INDICATOR" or "PRICE" 
3. For right side, use "INDICATOR", "PRICE", or "VALUE"
4. Include proper parameters for each indicator (period, etc.)
5. Provide clear explanations for each condition
6. Create realistic and practical trading rules
7. Ensure entry and exit rules make logical sense together

Return ONLY the JSON object, no additional text.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
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
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', errorText)
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    // Parse the JSON response
    let strategy
    try {
      // Clean up the response if it has markdown formatting
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      strategy = JSON.parse(cleanContent)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content)
      throw new Error('Invalid JSON response from AI service')
    }

    // Validate that only valid indicators are used
    const validateIndicators = (rules) => {
      for (const ruleGroup of rules) {
        for (const inequality of ruleGroup.inequalities) {
          if (inequality.left.type === 'INDICATOR' && !validIndicators.includes(inequality.left.indicator)) {
            throw new Error(`Invalid indicator used: ${inequality.left.indicator}. Must use only valid indicators.`)
          }
          if (inequality.right.type === 'INDICATOR' && !validIndicators.includes(inequality.right.indicator)) {
            throw new Error(`Invalid indicator used: ${inequality.right.indicator}. Must use only valid indicators.`)
          }
        }
      }
    }

    // Validate entry and exit rules
    validateIndicators(strategy.entryRules || [])
    validateIndicators(strategy.exitRules || [])

    return new Response(
      JSON.stringify(strategy),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-strategy function:', error)
    
    // Return structured error response
    const errorResponse = {
      message: error.message || 'Strategy generation failed',
      type: error.message?.includes('API key') ? 'api_key_error' : 
            error.message?.includes('Invalid indicator') ? 'validation_error' :
            error.message?.includes('JSON') ? 'parsing_error' : 'unknown_error',
      retryable: !error.message?.includes('API key'),
      details: error.message?.includes('Invalid indicator') ? 
        ['Please check that all indicators are from the supported list'] : undefined
    }

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

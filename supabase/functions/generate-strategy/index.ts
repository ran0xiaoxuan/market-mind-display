
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt } = await req.json()

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found')
    }

    const systemPrompt = `You are an expert trading strategy generator. Create detailed trading strategies based on user requests.

IMPORTANT RULES FOR RULE GROUPS:
1. AVOID creating OR Groups with only 1 condition - this defeats the purpose of OR logic
2. If the entire strategy has only 1 condition total, put it in the AND Group
3. OR Groups should have at least 2 conditions to be meaningful for confirmation signals
4. AND Groups are for essential criteria that must all be met
5. OR Groups are for alternative confirmatory signals where any subset can validate the decision

For each strategy, provide:
1. Strategy name and description
2. Target asset and timeframe
3. Entry rules (organized into AND and OR groups)
4. Exit rules (organized into AND and OR groups)

Structure your response as JSON with this format:
{
  "name": "Strategy Name",
  "description": "Detailed description",
  "timeframe": "Daily|4h|1h|30m|15m|5m|1m",
  "targetAsset": "AAPL|MSFT|GOOGL|TSLA|AMZN|etc",
  "targetAssetName": "Apple Inc.|Microsoft|etc",
  "entryRules": [
    {
      "logic": "AND",
      "inequalities": [
        {
          "left": {"type": "INDICATOR", "indicator": "RSI", "parameters": {"period": "14"}},
          "condition": "Less Than",
          "right": {"type": "VALUE", "value": "30"},
          "explanation": "RSI below 30 indicates oversold condition"
        }
      ]
    },
    {
      "logic": "OR",
      "requiredConditions": 1,
      "inequalities": [
        {
          "left": {"type": "INDICATOR", "indicator": "MACD", "parameters": {"fast": "12", "slow": "26", "signal": "9"}},
          "condition": "Crosses Above",
          "right": {"type": "VALUE", "value": "0"},
          "explanation": "MACD crossing above zero indicates upward momentum"
        },
        {
          "left": {"type": "INDICATOR", "indicator": "Volume", "parameters": {}},
          "condition": "Greater Than",
          "right": {"type": "INDICATOR", "indicator": "Volume SMA", "parameters": {"period": "20"}},
          "explanation": "Volume above average confirms the move"
        }
      ]
    }
  ],
  "exitRules": [
    {
      "logic": "AND", 
      "inequalities": [
        {
          "left": {"type": "INDICATOR", "indicator": "RSI", "parameters": {"period": "14"}},
          "condition": "Greater Than",
          "right": {"type": "VALUE", "value": "70"},
          "explanation": "RSI above 70 indicates overbought condition"
        }
      ]
    }
  ]
}

RULE GROUP GUIDELINES:
- AND Groups: Use for essential conditions that ALL must be met
- OR Groups: Use for confirmatory signals where at least N conditions should be met
- NEVER create OR groups with only 1 condition - use AND group instead
- If you have multiple single conditions, consider grouping them logically
- OR groups should have requiredConditions set (typically 1 for "any of" or higher for "majority of")

SUPPORTED INDICATORS:
- RSI (period)
- MACD (fast, slow, signal)
- Moving Average/SMA/EMA (period)
- Bollinger Bands (period, deviation)
- Stochastic (k, d)
- Volume
- Price (Close, Open, High, Low)

SUPPORTED CONDITIONS:
- Greater Than, Less Than, Equal To
- Crosses Above, Crosses Below
- Greater Than or Equal, Less Than or Equal

Always provide clear explanations for each rule explaining the trading logic.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    // Try to parse the JSON response
    let strategy
    try {
      // Extract JSON from the response (in case it's wrapped in markdown)
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content
      strategy = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError)
      throw new Error('Invalid JSON response from OpenAI')
    }

    return new Response(JSON.stringify({ strategy }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

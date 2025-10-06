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
    const { assetType, asset, description, accountCapital = 10000 } = body;
    
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
    console.log(`Account capital: $${accountCapital}`);

    // Create the system prompt for strategy generation
    const systemPrompt = `You are an expert trading strategy generator. Generate a comprehensive trading strategy based on the user's requirements.

You must respond with a valid JSON object that follows this exact structure:

IMPORTANT: Note the correct use of OR groups in the examples below:
- OR group with 2 conditions → requiredConditions = 1 (at least 1 must be true)
- OR group with 3+ conditions → requiredConditions can be 1, 2, etc. but NEVER equal to total conditions
- If all conditions must be met → use AND group instead

EXAMPLE 1 - Simple Oscillator Strategy (shows correct OR group with 2 conditions, requiredConditions = 1):
{
  "name": "RSI Oversold Strategy",
  "description": "Buy when RSI indicates oversold, sell when overbought",
  "timeframe": "1d",
  "targetAsset": "AAPL",
  "riskTolerance": "moderate",
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
            "parameters": {
              "period": "14",
              "source": "Close"
            },
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
            "parameters": {
              "period": "14",
              "source": "Close"
            },
            "valueType": "Value"
          },
          "condition": "GREATER_THAN",
          "right": {
            "type": "VALUE",
            "value": "70"
          },
          "explanation": "RSI indicates overbought condition"
        },
        {
          "id": 2,
          "left": {
            "type": "PRICE",
            "value": "Close"
          },
          "condition": "CROSSES_BELOW",
          "right": {
            "type": "INDICATOR",
            "indicator": "SMA",
            "parameters": {
              "period": "20",
              "source": "Close"
            },
            "valueType": "Value"
          },
          "explanation": "Price crosses below moving average"
        }
      ]
    }
  ]
}

EXAMPLE 2 - Trend Following with New Indicators:
{
  "name": "ADX Trend Strategy",
  "description": "Enter when strong trend confirmed by ADX and price above VWAP",
  "timeframe": "1h",
  "targetAsset": "TSLA",
  "riskTolerance": "aggressive",
  "entryRules": [
    {
      "logic": "AND",
      "requiredConditions": 2,
      "inequalities": [
        {
          "id": 1,
          "left": {
            "type": "INDICATOR",
            "indicator": "ADX",
            "parameters": {
              "adxSmoothing": "14",
              "diLength": "14"
            },
            "valueType": "Value"
          },
          "condition": "GREATER_THAN",
          "right": {
            "type": "VALUE",
            "value": "25"
          },
          "explanation": "Strong trend confirmed by ADX"
        },
        {
          "id": 2,
          "left": {
            "type": "PRICE",
            "value": "Close"
          },
          "condition": "GREATER_THAN",
          "right": {
            "type": "INDICATOR",
            "indicator": "VWAP",
            "parameters": {
              "source": "Close"
            },
            "valueType": "Value"
          },
          "explanation": "Price is above VWAP, indicating institutional support"
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
            "indicator": "ADX",
            "parameters": {
              "adxSmoothing": "14",
              "diLength": "14"
            },
            "valueType": "Value"
          },
          "condition": "LESS_THAN",
          "right": {
            "type": "VALUE",
            "value": "20"
          },
          "explanation": "Trend weakening"
        }
      ]
    }
  ]
}

CRITICAL CONDITION MAPPING - YOU MUST BE EXTREMELY PRECISE:

When the user mentions these terms in their description, map them EXACTLY as follows:

**"greater than" / "above" / "higher than"** → GREATER_THAN (>)
**"greater than or equal" / "at least" / "equal or above"** → GREATER_THAN_OR_EQUAL (≥)
**"crosses above" / "crosses over" / "breaks above"** → CROSSES_ABOVE (crossover upward)

**"less than" / "below" / "lower than"** → LESS_THAN (<)
**"less than or equal" / "at most" / "equal or below"** → LESS_THAN_OR_EQUAL (≤)
**"crosses below" / "crosses under" / "breaks below"** → CROSSES_BELOW (crossover downward)

**"equal to" / "equals" / "is"** → EQUAL (=)
**"not equal to" / "not equals"** → NOT_EQUAL (≠)

CRITICAL DISTINCTION RULES:
1. CROSSES_ABOVE vs GREATER_THAN: "Crosses above" implies a directional movement from below to above. "Greater than" is a static comparison at a point in time.
2. CROSSES_BELOW vs LESS_THAN: "Crosses below" implies a directional movement from above to below. "Less than" is a static comparison at a point in time.
3. If the user says "RSI crosses above 30", use CROSSES_ABOVE. If they say "RSI is above 30", use GREATER_THAN.
4. If the user says "Price breaks below the moving average", use CROSSES_BELOW. If they say "Price is below the moving average", use LESS_THAN.
5. When in doubt between static comparison and crossover, analyze the context carefully.

CRITICAL RULE GROUP REQUIREMENTS (in order of priority):
1. If you would create an OR group with only 1 condition, place that condition in the AND group instead.
2. OR groups MUST always contain at least 2 conditions
3. Never create an OR group with just a single inequality
4. **CRITICAL OR GROUP LOGIC**: For OR groups, requiredConditions MUST be LESS THAN the total number of inequalities in that group
   - If requiredConditions equals the number of inequalities, use AND group instead
   - Example: OR group with 3 inequalities → requiredConditions can be 1 or 2, NOT 3
   - Example: OR group with 2 inequalities → requiredConditions can only be 1, NOT 2
   - If all conditions must be met, use AND group with requiredConditions equal to the number of inequalities

CRITICAL VALIDATION RULES:
1. When using SMA/EMA/WMA indicators compared to VALUE type: The value MUST be within 30% of the target asset's current price range. For example, if the asset trades around $100, acceptable values would be between $70-$130.
2. When using PRICE type: You MUST only use "Open", "High", "Low", or "Close" as the value. No other content is allowed (no HL2, HLC3, OHLC4, etc.).

INDICATOR PARAMETER SPECIFICATIONS - YOU MUST INCLUDE ALL REQUIRED PARAMETERS:

=== MOVING AVERAGES ===

SMA (Simple Moving Average):
- parameters: {"period": "number", "source": "Open|High|Low|Close|HL2|HLC3|OHLC4"}
- valueType: "Value"
- default: period=20, source=Close

EMA (Exponential Moving Average):
- parameters: {"period": "number", "source": "Open|High|Low|Close|HL2|HLC3|OHLC4"}
- valueType: "Value"
- default: period=20, source=Close

WMA (Weighted Moving Average):
- parameters: {"period": "number", "source": "Open|High|Low|Close|HL2|HLC3|OHLC4"}
- valueType: "Value"
- default: period=20, source=Close

DEMA (Double Exponential Moving Average):
- parameters: {"period": "number", "source": "Open|High|Low|Close|HL2|HLC3|OHLC4"}
- valueType: "Value"
- default: period=14, source=Close

TEMA (Triple Exponential Moving Average):
- parameters: {"period": "number", "source": "Open|High|Low|Close|HL2|HLC3|OHLC4"}
- valueType: "Value"
- default: period=14, source=Close

HMA (Hull Moving Average):
- parameters: {"period": "number", "source": "Open|High|Low|Close|HL2|HLC3|OHLC4"}
- valueType: "Value"
- default: period=14, source=Close

VWAP (Volume Weighted Average Price):
- parameters: {"source": "Open|High|Low|Close|HL2|HLC3|OHLC4"}
- valueType: "Value"
- default: source=Close
- note: Best for intraday trading, resets daily

=== OSCILLATORS ===

RSI (Relative Strength Index):
- parameters: {"period": "number", "source": "Open|High|Low|Close|HL2|HLC3|OHLC4"}
- valueType: "Value"
- default: period=14, source=Close
- range: 0-100 (typical thresholds: 30/70)

Stochastic:
- parameters: {"k": "number", "d": "number", "slowing": "number"}
- valueType: "K Value" or "D Value"
- default: k=14, d=3, slowing=3
- range: 0-100 (typical thresholds: 20/80)

Stochastic RSI:
- parameters: {"rsiPeriod": "number", "stochasticLength": "number", "k": "number", "d": "number"}
- valueType: "K Value" or "D Value"
- default: rsiPeriod=14, stochasticLength=14, k=3, d=3
- range: 0-100 (typical thresholds: 20/80)
- note: k and d are smoothing periods for the stochastic calculation

CCI (Commodity Channel Index):
- parameters: {"period": "number", "source": "Open|High|Low|Close|HL2|HLC3|OHLC4"}
- valueType: "Value"
- default: period=20, source=Close
- range: unbounded (typical thresholds: -100/+100)

MACD (Moving Average Convergence Divergence):
- parameters: {"fast": "number", "slow": "number", "signal": "number", "source": "Open|High|Low|Close|HL2|HLC3|OHLC4"}
- valueType: "MACD Value" or "Signal Value" or "Histogram Value"
- default: fast=12, slow=26, signal=9, source=Close

MFI (Money Flow Index):
- parameters: {"period": "number"}
- valueType: "Value"
- default: period=14
- range: 0-100 (typical thresholds: 20/80)

ROC (Rate of Change):
- parameters: {"period": "number", "source": "Open|High|Low|Close|HL2|HLC3|OHLC4"}
- valueType: "Value"
- default: period=14, source=Close

Williams %R:
- parameters: {"period": "number"}
- valueType: "Value"
- default: period=14
- range: -100 to 0 (typical thresholds: -80/-20)

CMO (Chande Momentum Oscillator):
- parameters: {"period": "number", "source": "Open|High|Low|Close|HL2|HLC3|OHLC4"}
- valueType: "Value"
- default: period=14, source=Close
- range: -100 to +100 (typical thresholds: -50/+50)

=== TREND INDICATORS ===

ADX (Average Directional Index):
- parameters: {"adxSmoothing": "number", "diLength": "number"}
- valueType: "Value"
- default: adxSmoothing=14, diLength=14
- range: 0-100 (>25 indicates strong trend)
- note: Measures trend strength, not direction

SuperTrend:
- parameters: {"atrPeriod": "number", "multiplier": "number"}
- valueType: "Value"
- default: atrPeriod=10, multiplier=3
- note: Dynamic support/resistance indicator

=== VOLATILITY INDICATORS ===

Bollinger Bands:
- parameters: {"period": "number", "deviation": "number", "source": "Open|High|Low|Close|HL2|HLC3|OHLC4"}
- valueType: "Upper Band" or "Middle Band" or "Lower Band"
- default: period=20, deviation=2, source=Close

ATR (Average True Range):
- parameters: {"period": "number"}
- valueType: "Value"
- default: period=14
- note: Measures volatility, not direction

NATR (Normalized Average True Range):
- parameters: {"period": "number", "source": "Open|High|Low|Close|HL2|HLC3|OHLC4"}
- valueType: "Value"
- default: period=14, source=Close
- note: ATR expressed as percentage

Keltner Channel:
- parameters: {"period": "number", "atrPeriod": "number", "multiplier": "number"}
- valueType: "Upper Band" or "Middle Band" or "Lower Band"
- default: period=20, atrPeriod=20, multiplier=2

Donchian Channel:
- parameters: {"period": "number"}
- valueType: "Upper Band" or "Middle Band" or "Lower Band"
- default: period=20
- note: Used in Turtle Trading system

=== VOLUME INDICATORS ===

OBV (On Balance Volume):
- parameters: none
- valueType: "Value"
- note: Cumulative volume indicator

CMF (Chaikin Money Flow):
- parameters: {"period": "number"}
- valueType: "Value"
- default: period=20
- range: -1 to +1 (>0.25 strong buying, <-0.25 strong selling)

Available conditions: GREATER_THAN, LESS_THAN, GREATER_THAN_OR_EQUAL, LESS_THAN_OR_EQUAL, EQUAL, NOT_EQUAL, CROSSES_ABOVE, CROSSES_BELOW
Available timeframes: 5m, 15m, 30m, 1h, 4h, 1d
Available side types: INDICATOR, PRICE, VALUE

IMPORTANT: DO NOT use 1m (1 minute), 1w (weekly), or monthly timeframes as they are not supported for backtesting.

SUPPORTED INDICATORS (25 total):
Moving Averages: SMA, EMA, WMA, DEMA, TEMA, HMA, VWAP
Oscillators: RSI, Stochastic, Stochastic RSI, CCI, MACD, MFI, ROC, Williams %R, CMO
Trend Indicators: ADX, SuperTrend
Volatility Indicators: Bollinger Bands, ATR, NATR, Keltner Channel, Donchian Channel
Volume Indicators: OBV, CMF

IMPORTANT NOTES:
1. When using any indicator, you MUST include ALL required parameters as specified above
2. Always specify the appropriate valueType for multi-value indicators (MACD, Bollinger Bands, Stochastic, etc.)
3. For simple indicators with a single output, use valueType: "Value"
4. All parameters should use reasonable default values from the specifications above
5. OBV has no parameters - just specify the indicator name
6. VWAP is best for intraday strategies (1m-1h timeframes)
7. ADX measures trend strength, not direction - values >25 indicate strong trend
8. Channel indicators (Bollinger, Keltner, Donchian) have three value types: Upper/Middle/Lower Band`;

    const userPrompt = `Create a trading strategy for ${asset} (${assetType}) based on this description: ${description}

User's Investment Profile:
- Account Capital: $${accountCapital}

IMPORTANT - Risk Tolerance Analysis:
You MUST analyze the user's description and determine their risk tolerance. Look for keywords and phrases:
- CONSERVATIVE/DEFENSIVE indicators: "safe", "low risk", "stable", "defensive", "conservative", "protect capital", "avoid losses", "long-term"
- AGGRESSIVE/OFFENSIVE indicators: "aggressive", "high risk", "quick profits", "momentum", "volatile", "short-term", "active trading"
- MODERATE/BALANCED indicators: "balanced", "moderate", "steady growth", or no specific risk keywords mentioned

Based on your analysis, respond with a JSON that MUST include a "riskTolerance" field at the root level with one of these exact values: "conservative", "moderate", or "aggressive"

When designing this strategy, align it with the inferred risk tolerance:
- For CONSERVATIVE strategies: Multiple confirmation signals, stable indicators (longer-period moving averages, ADX for trend confirmation), defensive approach
- For MODERATE strategies: Balance between opportunity and safety, mix of trend and oscillator indicators
- For AGGRESSIVE strategies: Volatile indicators, momentum-based entries, strategies that capture quick moves

Requirements:
- Generate realistic entry and exit conditions that match the user's risk tolerance
- Use appropriate technical indicators from the 25 supported indicators (Moving Averages, Oscillators, Trend, Volatility, Volume)
- Include COMPLETE parameter specifications for each indicator as detailed in the specifications
- Include clear explanations for each rule
- Make the strategy suitable for the specified asset type, timeframe, and user's risk profile
- Ensure the JSON is valid and follows the exact structure provided
- REMEMBER: OR groups must contain at least 2 conditions - if you have only 1 condition, use AND logic instead
- **CRITICAL OR GROUP LOGIC**: In OR groups, requiredConditions MUST be LESS THAN the total number of inequalities. If requiredConditions equals the number of inequalities, use AND group instead.
  * OR group with 3 conditions → requiredConditions can be 1 or 2 only (NOT 3)
  * OR group with 2 conditions → requiredConditions can only be 1 (NOT 2)
  * If all conditions must be met, always use AND group
- CRITICAL: Always include ALL required parameters and valueType for each indicator as specified above
- VALIDATION: When using moving averages (SMA/EMA/WMA/DEMA/TEMA/HMA) compared to VALUE, ensure the value is within 30% of the asset's typical price range
- VALIDATION: When using PRICE type, only use "Open", "High", "Low", or "Close" as values
- CONDITION PRECISION: Pay extremely close attention to the user's exact wording for conditions. Distinguish carefully between static comparisons (>, <, ≥, ≤) and crossover conditions (crosses above, crosses below)
- INDICATOR SELECTION: Choose indicators that make sense together (e.g., trend + momentum + volume confirmation)
- STRATEGY COHERENCE: For trend-following strategies, use ADX, SuperTrend, or moving averages; for mean reversion, use oscillators like RSI, Stochastic, or Williams %R`;

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

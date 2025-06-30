
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

CRITICAL: CONDITION CONTENT MUST MATCH EXPLANATION EXACTLY

The most important rule is that every condition you create must do EXACTLY what its explanation says. For example:
- If explanation says "RSI below 30", the condition must be: RSI < 30 (not RSI < some other indicator)
- If explanation says "RSI below 30 AND CCI below -100", you need TWO separate conditions: RSI < 30 AND CCI < -100
- If explanation says "MACD crosses above signal line", the condition must involve MACD crossing above its signal line
- If explanation says "price above 50-day SMA", the condition must be: Price > SMA(50)

CRITICAL: MULTI-COMPONENT INDICATOR SPECIFICATION

When using indicators that have multiple components, you MUST specify which exact component is being used:

1. MACD Indicator Components:
   - "MACD" (the main MACD line) - use indicator: "MACD", valueType: "MACD Value"
   - "MACD Signal" (the signal line) - use indicator: "MACD", valueType: "Signal Value"  
   - "MACD Histogram" (the histogram bars) - use indicator: "MACD", valueType: "Histogram Value"

2. Stochastic Indicator Components:
   - "%K" (fast stochastic line) - use indicator: "Stochastic", valueType: "K Value"
   - "%D" (slow stochastic line) - use indicator: "Stochastic", valueType: "D Value"

3. Bollinger Bands Components:
   - "Upper Band" - use indicator: "Bollinger Bands", valueType: "Upper Band"
   - "Middle Band" - use indicator: "Bollinger Bands", valueType: "Middle Band"
   - "Lower Band" - use indicator: "Bollinger Bands", valueType: "Lower Band"

4. Ichimoku Cloud Components:
   - "Conversion Line" - use indicator: "Ichimoku Cloud", valueType: "Conversion Line"
   - "Base Line" - use indicator: "Ichimoku Cloud", valueType: "Base Line"
   - And other components as needed

EXAMPLES OF CORRECT MULTI-COMPONENT USAGE:
✅ CORRECT: "MACD Line crosses above MACD Signal Line"
- Left: indicator: "MACD", valueType: "MACD Value"
- Right: indicator: "MACD", valueType: "Signal Value"

✅ CORRECT: "Price crosses above Bollinger Bands Upper Band"
- Left: type: "PRICE", value: "Close"
- Right: indicator: "Bollinger Bands", valueType: "Upper Band"

✅ CORRECT: "Stochastic %K crosses below Stochastic %D"
- Left: indicator: "Stochastic", valueType: "K Value"
- Right: indicator: "Stochastic", valueType: "D Value"

❌ WRONG: "MACD crosses above MACD" (identical and non-specific)
❌ WRONG: "MACD(12,26,9) crosses above MACD(12,26,9)" (identical components)
❌ WRONG: "Stochastic crosses above Stochastic" (non-specific components)

CRITICAL: PREVENT IDENTICAL LEFT AND RIGHT SIDES IN CONDITIONS

NEVER create conditions where the left AND right sides are exactly the same indicator with the same valueType and parameters. This creates meaningless comparisons that cannot be evaluated:

❌ WRONG EXAMPLES TO AVOID:
- MACD(12,26,9) with valueType "MACD Value" crosses above MACD(12,26,9) with valueType "MACD Value"
- RSI(14) > RSI(14) - same indicator comparing to itself
- SMA(50) crosses below SMA(50) - identical moving averages
- CCI(14) < CCI(14) - same CCI comparing to itself

✅ CORRECT EXAMPLES:
- MACD with valueType "MACD Value" crosses above MACD with valueType "Signal Value"
- RSI(14) < 30 - RSI compared to fixed threshold
- Price > SMA(50) - price compared to moving average
- CCI(14) < -100 - CCI compared to fixed threshold
- EMA(20) crosses above SMA(50) - different moving averages with different periods

CRITICAL: OR GROUP REQUIRED CONDITIONS RULE

When creating OR groups, the requiredConditions MUST be LESS than the total number of inequalities in that group:
- If OR group has 2 conditions → requiredConditions can be 1 (not 2)
- If OR group has 3 conditions → requiredConditions can be 1 or 2 (not 3)
- If OR group has 4 conditions → requiredConditions can be 1, 2, or 3 (not 4)

Setting requiredConditions equal to the total number of conditions defeats the purpose of using an OR group (it becomes equivalent to an AND group).

EXAMPLES:
✅ CORRECT: OR group with 3 conditions, requiredConditions: 2 (any 2 of 3 must be true)
✅ CORRECT: OR group with 2 conditions, requiredConditions: 1 (either condition can be true)
❌ WRONG: OR group with 2 conditions, requiredConditions: 2 (both must be true = AND logic)
❌ WRONG: OR group with 3 conditions, requiredConditions: 3 (all must be true = AND logic)

TRADING LOGIC AND CONDITION PLACEMENT RULES:
CRITICAL: You must understand standard trading logic when placing conditions in Entry vs Exit Rules:

ENTRY RULES - Conditions that signal when to ENTER a position:
- OVERSOLD conditions (RSI < 30, CCI < -100, Stochastic < 20, etc.) - These indicate potential buying opportunities
- BULLISH momentum signals (MACD Line crosses above MACD Signal Line, price breaks above resistance, etc.)
- SUPPORT level breaks or bounces
- Volume confirmation for entry signals
- Trend continuation signals (price above moving averages for long positions)

EXIT RULES - Conditions that signal when to EXIT a position:
- OVERBOUGHT conditions (RSI > 70, CCI > 100, Stochastic > 80, etc.) - These indicate potential selling opportunities
- BEARISH momentum signals (MACD Line crosses below MACD Signal Line, price breaks below support, etc.)
- RESISTANCE level tests or breaks
- Stop-loss conditions (price drops below certain level)
- Take-profit conditions (price reaches target level)
- Trend reversal signals

EXAMPLES OF CORRECT PLACEMENT:
✅ CORRECT Entry: "RSI below 30" (oversold, good for entry)
✅ CORRECT Exit: "RSI above 70" (overbought, good for exit)
❌ WRONG: Putting "RSI above 70" in Entry Rules (this would mean buying when overbought)
❌ WRONG: Putting "RSI below 30" in Exit Rules (this would mean selling when oversold)

✅ CORRECT Entry: "Price breaks above 50-day SMA" (bullish signal for entry)
✅ CORRECT Exit: "Price drops below 50-day SMA" (bearish signal for exit)

✅ CORRECT Entry: "MACD Line crosses above MACD Signal Line" (bullish momentum for entry)
✅ CORRECT Exit: "MACD Line crosses below MACD Signal Line" (bearish momentum for exit)

ALWAYS ANALYZE THE USER'S INTENT:
- If user says "buy when RSI is oversold", put RSI < 30 in ENTRY RULES
- If user says "sell when RSI is overbought", put RSI > 70 in EXIT RULES
- If user mentions "entry" or "buy" signals, analyze what they describe and place in ENTRY RULES
- If user mentions "exit" or "sell" signals, analyze what they describe and place in EXIT RULES
- If user doesn't specify entry/exit clearly, use standard trading logic to determine proper placement

EXPLANATION WRITING RULES:
1. Write explanations that are specific, accurate, and implementable
2. Use exact threshold values (like 30, 70, -100, etc.) not vague terms
3. Mention specific indicator parameters when relevant
4. Each explanation must correspond to exactly one implementable condition
5. For multi-component indicators, specify which component is being used
6. ALWAYS specify the exact component when using MACD, Stochastic, Bollinger Bands, etc.
7. CRITICAL: Make sure the explanation matches the actual condition being implemented

CONDITION IMPLEMENTATION RULES:
1. Every condition must implement exactly what its explanation describes
2. Use specific numeric thresholds that match the explanation
3. Compare indicators to fixed values, not to each other (unless explicitly described)
4. Ensure indicator parameters match what's mentioned in the explanation
5. CRITICAL: Verify that left and right sides are different and create meaningful comparisons
6. MANDATORY: For multi-component indicators, always specify the exact component using proper valueType
7. CRITICAL: Ensure explanation content matches the actual condition values and logic

LOGIC GROUPING ANALYSIS:
Before generating the strategy, analyze the user's description for these key logic patterns:

1. AND LOGIC INDICATORS (use AND group):
   - Words like "and", "both", "all", "together", "simultaneously", "while", "when all"
   - Example: "RSI below 30 AND MACD crosses above signal"
   - Example: "Buy when price is above SMA and volume is high"

2. OR LOGIC INDICATORS (use OR group with proper requiredConditions):
   - Words like "or", "either", "alternatively", "any of", "one of", "at least"
   - Example: "RSI below 30 OR price under $20" → OR group with requiredConditions: 1
   - Example: "Exit when RSI above 70 OR stop loss hit OR take profit reached" → OR group with requiredConditions: 1
   - Example: "Enter when at least 2 of: RSI oversold, MACD bullish, price above SMA" → OR group with requiredConditions: 2

3. MIXED LOGIC (use both AND and OR groups):
   - Example: "Buy when RSI < 30 AND (MACD > 0 OR volume > average)" → AND group + OR group
   - Example: "Entry: RSI oversold AND volume high. Exit: RSI overbought OR stop loss" → Separate logic for entry/exit

CRITICAL OR GROUP RULE:
- OR groups MUST contain at least 2 conditions (inequalities)
- OR groups MUST have requiredConditions LESS THAN the total number of inequalities
- If you create an OR group, it must have a minimum of 2 inequalities in the inequalities array
- requiredConditions must be between 1 and (total_inequalities - 1)

IMPORTANT RULES:
1. Generate strategy based ONLY on the user's description - do not default to RSI/MACD unless specifically requested
2. Use indicators that are relevant to the user's request from this list: ${validIndicators.join(", ")}
3. Make the strategy name and description specific to the user's request
4. Carefully analyze the user's language to determine proper AND/OR grouping
5. Always create BOTH AND and OR groups for each rule type (entry/exit), even if one is empty initially
6. CRITICAL: Every explanation must accurately describe what the condition actually does
7. MANDATORY: OR groups must have at least 2 conditions - never create an OR group with only 1 condition
8. CRITICAL: OR groups must have requiredConditions LESS than total conditions to maintain OR logic
9. CRITICAL: Use proper trading logic to place conditions in correct Entry/Exit Rules based on market behavior
10. CRITICAL: Never create conditions with identical left and right sides - always verify meaningful comparisons
11. MANDATORY: For multi-component indicators, ALWAYS specify the exact component using proper valueType
12. CRITICAL: Ensure explanations match the actual condition implementation exactly

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

CONDITION SIDE TYPES:
When building conditions, strictly distinguish between:
1. INDICATOR: Use "type": "INDICATOR" with proper indicator name and valueType for multi-component indicators
2. PRICE: Use "type": "PRICE" and specify "value" as one of: "Open", "High", "Low", "Close" (default to "Close" unless user specifies otherwise)
3. VALUE: Use "type": "VALUE" and provide a numeric string like "30", "70", "2.5", etc. Never use text descriptions like "Current Price"

EXAMPLES OF CORRECT EXPLANATION-TO-CONDITION MAPPING:

Example 1: "Enter when RSI is below 30"
- Explanation: "Enter when RSI(14) is below 30, indicating oversold conditions"
- Condition: left: RSI(14), condition: LESS_THAN, right: VALUE "30"

Example 2: "Exit when RSI above 70 OR CCI above 100"
- Two separate conditions in OR group with requiredConditions: 1:
  - Explanation 1: "Exit when RSI(14) rises above 70, indicating overbought conditions"
  - Condition 1: left: RSI(14), condition: GREATER_THAN, right: VALUE "70"
  - Explanation 2: "Exit when CCI(14) rises above 100, indicating overbought conditions"
  - Condition 2: left: CCI(14), condition: GREATER_THAN, right: VALUE "100"

Example 3: "Buy when MACD crosses above signal line"
- Explanation: "Enter when MACD Line crosses above MACD Signal Line, indicating bullish momentum"
- Condition: left: MACD with valueType "MACD Value", condition: CROSSES_ABOVE, right: MACD with valueType "Signal Value"

LOGIC GROUPING EXAMPLES:
- "RSI below 30 AND MACD positive" → Single AND group with two conditions
- "RSI below 30 OR CCI below -100" → Single OR group with requiredConditions: 1 (minimum 2 conditions required)
- "RSI oversold AND volume high, OR price breaks support" → AND group + OR group with requiredConditions: 1
- "Enter when at least 2 of: RSI < 30, MACD > 0, CCI < -100" → OR group with requiredConditions: 2 (minimum 2 conditions satisfied)

Return ONLY this JSON structure:
{
  "name": "Descriptive strategy name based on user request",
  "description": "Strategy description that explains how it implements the user's request",
  "timeframe": "Selected timeframe from available options",
  "targetAsset": "${selectedAsset}",
  "entryRules": [
    {
      "id": 1,
      "logic": "AND",
      "inequalities": [
        {
          "id": 1,
          "left": {
            "type": "INDICATOR|PRICE|VALUE",
            "indicator": "Only if type is INDICATOR - base indicator name (e.g., 'MACD', 'Stochastic')",
            "parameters": {"period": "NumberAsString"},
            "value": "Only if type is PRICE (Open/High/Low/Close) or VALUE (numeric string)",
            "valueType": "Only if type is INDICATOR and indicator has multiple components (e.g., 'MACD Value', 'Signal Value', 'K Value', 'D Value', 'Upper Band')"
          },
          "condition": "Use ONLY the exact condition values listed above",
          "right": {
            "type": "INDICATOR|PRICE|VALUE", 
            "indicator": "Only if type is INDICATOR - base indicator name (e.g., 'MACD', 'Stochastic')",
            "parameters": {"period": "NumberAsString"},
            "value": "Only if type is PRICE (Open/High/Low/Close) or VALUE (numeric string)",
            "valueType": "Only if type is INDICATOR and indicator has multiple components (e.g., 'Signal Value', 'D Value', 'Lower Band')"
          },
          "explanation": "CRITICAL: Must accurately describe exactly what this condition does - be specific about thresholds and logic, include component names for multi-component indicators"
        }
      ]
    },
    {
      "id": 2,
      "logic": "OR",
      "requiredConditions": "Number between 1 and (total_conditions - 1) - MUST be less than total inequalities",
      "inequalities": [
        {
          "id": 1,
          "left": {
            "type": "INDICATOR|PRICE|VALUE",
            "indicator": "Only if type is INDICATOR - base indicator name",
            "parameters": {"period": "NumberAsString"},
            "value": "Only if type is PRICE (Open/High/Low/Close) or VALUE (numeric string)",
            "valueType": "Only if type is INDICATOR and has multiple components"
          },
          "condition": "Use ONLY the exact condition values listed above",
          "right": {
            "type": "INDICATOR|PRICE|VALUE",
            "indicator": "Only if type is INDICATOR - base indicator name",
            "parameters": {"period": "NumberAsString"}, 
            "value": "Only if type is PRICE (Open/High/Low/Close) or VALUE (numeric string)",
            "valueType": "Only if type is INDICATOR and has multiple components"
          },
          "explanation": "CRITICAL: Must accurately describe exactly what this OR condition does - be specific about thresholds and logic, include component names"
        },
        {
          "id": 2,
          "left": {
            "type": "INDICATOR|PRICE|VALUE",
            "indicator": "Only if type is INDICATOR - base indicator name",
            "parameters": {"period": "NumberAsString"},
            "value": "Only if type is PRICE (Open/High/Low/Close) or VALUE (numeric string)",
            "valueType": "Only if type is INDICATOR and has multiple components"
          },
          "condition": "Use ONLY the exact condition values listed above",
          "right": {
            "type": "INDICATOR|PRICE|VALUE",
            "indicator": "Only if type is INDICATOR - base indicator name",
            "parameters": {"period": "NumberAsString"}, 
            "value": "Only if type is PRICE (Open/High/Low/Close) or VALUE (numeric string)",
            "valueType": "Only if type is INDICATOR and has multiple components"
          },
          "explanation": "CRITICAL: Must accurately describe exactly what this second OR condition does - be specific about thresholds and logic, include component names"
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
            "type": "INDICATOR|PRICE|VALUE",
            "indicator": "Only if type is INDICATOR - base indicator name", 
            "parameters": {"period": "NumberAsString"},
            "value": "Only if type is PRICE (Open/High/Low/Close) or VALUE (numeric string)",
            "valueType": "Only if type is INDICATOR and has multiple components"
          },
          "condition": "Use ONLY the exact condition values listed above",
          "right": {
            "type": "INDICATOR|PRICE|VALUE",
            "indicator": "Only if type is INDICATOR - base indicator name",
            "parameters": {"period": "NumberAsString"}, 
            "value": "Only if type is PRICE (Open/High/Low/Close) or VALUE (numeric string)",
            "valueType": "Only if type is INDICATOR and has multiple components"
          },
          "explanation": "CRITICAL: Must accurately describe exactly what this exit condition does - be specific about thresholds and logic, include component names"
        }
      ]
    },
    {
      "id": 2,
      "logic": "OR",
      "requiredConditions": "Number between 1 and (total_conditions - 1) - MUST be less than total inequalities",
      "inequalities": [
        {
          "id": 1,
          "left": {
            "type": "INDICATOR|PRICE|VALUE",
            "indicator": "Only if type is INDICATOR - base indicator name",
            "parameters": {"period": "NumberAsString"},
            "value": "Only if type is PRICE (Open/High/Low/Close) or VALUE (numeric string)",
            "valueType": "Only if type is INDICATOR and has multiple components"
          },
          "condition": "Use ONLY the exact condition values listed above",
          "right": {
            "type": "INDICATOR|PRICE|VALUE",
            "indicator": "Only if type is INDICATOR - base indicator name",
            "parameters": {"period": "NumberAsString"},
            "value": "Only if type is PRICE (Open/High/Low/Close) or VALUE (numeric string)",
            "valueType": "Only if type is INDICATOR and has multiple components"
          },
          "explanation": "CRITICAL: Must accurately describe exactly what this OR exit condition does - be specific about thresholds and logic, include component names"
        },
        {
          "id": 2,
          "left": {
            "type": "INDICATOR|PRICE|VALUE",
            "indicator": "Only if type is INDICATOR - base indicator name",
            "parameters": {"period": "NumberAsString"},
            "value": "Only if type is PRICE (Open/High/Low/Close) or VALUE (numeric string)",
            "valueType": "Only if type is INDICATOR and has multiple components"
          },
          "condition": "Use ONLY the exact condition values listed above",
          "right": {
            "type": "INDICATOR|PRICE|VALUE",
            "indicator": "Only if type is INDICATOR - base indicator name",
            "parameters": {"period": "NumberAsString"},
            "value": "Only if type is PRICE (Open/High/Low/Close) or VALUE (numeric string)",
            "valueType": "Only if type is INDICATOR and has multiple components"
          },
          "explanation": "CRITICAL: Must accurately describe exactly what this second OR exit condition does - be specific about thresholds and logic, include component names"
        }
      ]
    }
  ]
}

FINAL VERIFICATION CHECKLIST:
Before returning the JSON, verify that:
1. Every explanation accurately describes what its corresponding condition actually implements
2. Numeric thresholds in explanations match the actual condition values
3. Indicator comparisons in explanations match the actual left/right sides of conditions
4. Logic grouping (AND/OR) matches the user's described intent
5. No condition compares indicators to each other unless explicitly described in user request
6. All explanations are specific and implementable, not vague or generic
7. MANDATORY: Every OR group contains at least 2 conditions in its inequalities array
8. CRITICAL: Every OR group has requiredConditions LESS than total conditions
9. OR groups with only 1 condition have been converted to AND groups or expanded with additional logical conditions
10. CRITICAL: No condition has identical left and right sides - all comparisons are meaningful
11. For multi-component indicators (MACD, Stochastic, etc.), different components are used when comparing within the same indicator family
12. MANDATORY: All multi-component indicators specify exact components using proper valueType
13. CRITICAL: Never use generic indicator names without proper valueType specification for multi-component indicators
14. CRITICAL: Explanations exactly match the condition values, thresholds, and logic being implemented

CRITICAL: 
- Always create both AND and OR groups (id: 1 for AND, id: 2 for OR)
- Put conditions in the appropriate group based on the user's language analysis
- If no conditions belong to a group, leave its inequalities array empty
- For OR groups, set requiredConditions appropriately but ALWAYS less than total conditions
- Ensure all condition types (INDICATOR/PRICE/VALUE) are properly specified
- MOST IMPORTANT: Every explanation must accurately describe what the condition actually does
- MANDATORY: OR groups must have at least 2 conditions and requiredConditions less than total
- CRITICAL: Use standard trading logic to place conditions correctly - oversold in Entry, overbought in Exit
- CRITICAL: Never create conditions where left and right sides are identical - always ensure meaningful comparisons
- MANDATORY: For all multi-component indicators, ALWAYS specify the exact component using proper valueType
- CRITICAL: Ensure explanations match actual condition implementation exactly

Carefully analyze the user's description to create a strategy that truly reflects their intent, using appropriate logic structures (AND/OR), proper condition types (INDICATOR/PRICE/VALUE), accurate parameters, proper trading logic for Entry/Exit placement, meaningful condition comparisons that avoid identical left/right sides, exact component specification for multi-component indicators using proper valueType, correct OR group logic with requiredConditions less than total conditions, and explanations that match the actual implementation exactly. Remember: OR groups must always contain at least 2 conditions with requiredConditions less than total, trading conditions must be placed logically based on market behavior, all condition comparisons must be meaningful and avoid identical sides, multi-component indicators must always specify the exact component using proper valueType, and explanations must exactly match the condition implementation.`;

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
          { role: 'system', content: 'You are a trading strategy generator. Analyze user requests carefully and create appropriate strategies with proper AND/OR logic grouping based on the user\'s language. Use OR groups when the user indicates alternative conditions with words like "or", "either", "any of". Always create both AND and OR groups even if one is empty. CRITICAL: OR groups must contain at least 2 conditions with requiredConditions LESS than total conditions to maintain proper OR logic. CRITICAL: Never create conditions where left and right sides are identical - ensure all comparisons are meaningful. MANDATORY: For multi-component indicators (MACD, Stochastic, Bollinger Bands), always specify the exact component using proper valueType (e.g., MACD with valueType "MACD Value" vs "Signal Value"). CRITICAL: Ensure explanations exactly match the condition implementation. Return only valid JSON that matches the specified structure exactly.' },
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

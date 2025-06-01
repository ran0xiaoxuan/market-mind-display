
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// OpenAI API configuration
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

// Enhanced CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-my-custom-header',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Enhanced logging utility
const logWithTimestamp = (level: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data, null, 2) : '';
  console.log(`[${timestamp}] [${level}] ${message}${logData ? '\n' + logData : ''}`);
};

// Health check endpoint
const handleHealthCheck = async () => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    openai_key_configured: !!openaiApiKey,
    environment: Deno.env.get('DENO_DEPLOYMENT_ID') ? 'production' : 'development'
  };
  
  // Test OpenAI API connectivity if key is available
  if (openaiApiKey) {
    try {
      const testResponse = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000)
      });
      
      health.openai_api_accessible = testResponse.ok;
      health.openai_status = testResponse.status;
    } catch (error) {
      health.openai_api_accessible = false;
      health.openai_error = error.message;
    }
  }
  
  logWithTimestamp('INFO', 'Health check completed', health);
  
  return new Response(JSON.stringify(health), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
};

serve(async (req) => {
  const startTime = Date.now();
  const url = new URL(req.url);
  
  logWithTimestamp('INFO', 'Request received', {
    method: req.method,
    url: req.url,
    pathname: url.pathname,
    origin: req.headers.get('origin'),
    userAgent: req.headers.get('user-agent')
  });
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    logWithTimestamp('INFO', 'CORS preflight request handled');
    return new Response(null, { headers: corsHeaders });
  }

  // Health check endpoint
  if (url.pathname.includes('/health') || url.searchParams.has('health')) {
    return handleHealthCheck();
  }

  // Only allow POST requests for strategy generation
  if (req.method !== 'POST') {
    logWithTimestamp('ERROR', 'Method not allowed', { method: req.method });
    return new Response(
      JSON.stringify({
        error: "Method not allowed. Use POST.",
        type: "method_error",
        timestamp: new Date().toISOString()
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  try {
    // Check if OpenAI API key is configured
    if (!openaiApiKey) {
      logWithTimestamp('ERROR', 'OpenAI API key not configured');
      return new Response(
        JSON.stringify({
          error: "OpenAI API key not configured. Please set OPENAI_API_KEY in Supabase secrets.",
          type: "api_key_error",
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Parse request body with enhanced error handling
    let requestData;
    try {
      const body = await req.text();
      logWithTimestamp('INFO', 'Request body received', { 
        bodyLength: body.length,
        bodyPreview: body.substring(0, 200)
      });
      
      if (!body.trim()) {
        throw new Error('Empty request body');
      }
      
      requestData = JSON.parse(body);
      logWithTimestamp('INFO', 'Request data parsed successfully', {
        hasAssetType: !!requestData.assetType,
        hasSelectedAsset: !!requestData.selectedAsset,
        hasStrategyDescription: !!requestData.strategyDescription,
        hasDescription: !!requestData.description,
        descriptionLength: (requestData.strategyDescription || requestData.description || '').length
      });
    } catch (parseError) {
      logWithTimestamp('ERROR', 'Request parsing failed', { error: parseError.message });
      return new Response(
        JSON.stringify({
          error: "Invalid request format: " + parseError.message,
          type: "parameter_error",
          timestamp: new Date().toISOString()
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Support both 'strategyDescription' and 'description' for backward compatibility
    const { assetType, selectedAsset } = requestData;
    const strategyDescription = requestData.strategyDescription || requestData.description;
    
    // Enhanced parameter validation
    const validationErrors = [];
    if (!assetType) validationErrors.push('assetType is required');
    if (!selectedAsset) validationErrors.push('selectedAsset is required');
    if (!strategyDescription) validationErrors.push('strategyDescription (or description) is required');
    if (strategyDescription && strategyDescription.length < 10) {
      validationErrors.push('strategyDescription must be at least 10 characters');
    }
    if (strategyDescription && strategyDescription.length > 2000) {
      validationErrors.push('strategyDescription must be less than 2000 characters');
    }
    
    if (validationErrors.length > 0) {
      logWithTimestamp('ERROR', 'Parameter validation failed', { validationErrors });
      return new Response(
        JSON.stringify({
          error: "Parameter validation failed: " + validationErrors.join(', '),
          type: "parameter_error",
          details: validationErrors,
          timestamp: new Date().toISOString()
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    logWithTimestamp('INFO', 'Starting strategy generation', { 
      assetType, 
      selectedAsset, 
      descriptionLength: strategyDescription.length 
    });
    
    // Enhanced and comprehensive system prompt with strict parameter requirements
    const systemPrompt = `You are an expert trading strategy architect. Generate a complete, actionable trading strategy with ABSOLUTELY NO BLANK FIELDS OR PLACEHOLDER VALUES. Every parameter must be filled with realistic, specific, concrete values.

CRITICAL REQUIREMENTS - ALL MUST BE FULFILLED:
1. Strategy name MUST include the ${selectedAsset} symbol and be descriptive (8-15 words)
2. Description MUST be 80-120 words explaining the strategy's logic and purpose
3. ALL risk management fields MUST have realistic numeric values (no placeholders)
4. BOTH entry and exit rules MUST have at least one complete condition with ALL parameters filled with CONCRETE VALUES
5. If OR groups exist, they MUST have at least 2 conditions and specify requiredConditions count
6. ALL indicator parameters MUST be populated with standard, specific numeric values
7. ALL price references MUST specify exactly one of: "open", "high", "low", "close" - NEVER use generic terms
8. ALL value fields MUST contain SPECIFIC NUMBERS - NEVER use placeholders like "current_price", "market_value", etc.
9. ALL explanations MUST be clear and educational

STRICT VALUE REQUIREMENTS:
- When using PRICE type: MUST specify exactly "open", "high", "low", or "close" in the "value" field
- When using VALUE type: MUST specify exact numbers like "30", "70", "2.5", "1.2" - NEVER placeholders
- When using INDICATOR type: MUST specify exact indicator name and ALL required parameters with specific values

EXACT JSON STRUCTURE REQUIRED:
{
  "name": "Complete strategy name including ${selectedAsset} symbol",
  "description": "80-120 word comprehensive description of strategy logic, market conditions, and expected performance",
  "timeframe": "Daily|Weekly|Monthly|1h|4h|15m|30m|5m|1m",
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
            "indicator": "RSI|SMA|EMA|MACD|BB_UPPER|BB_LOWER|STOCH|ADX|CCI|ROC",
            "parameters": {"period": "14", "source": "close"},
            "value": "",
            "valueType": "number"
          },
          "condition": "GREATER_THAN|LESS_THAN|CROSSES_ABOVE|CROSSES_BELOW|EQUALS",
          "right": {
            "type": "VALUE",
            "indicator": "",
            "parameters": {},
            "value": "70",
            "valueType": "number"
          },
          "explanation": "Clear explanation of what this condition detects"
        }
      ]
    },
    {
      "id": 2,
      "logic": "OR",
      "requiredConditions": 1,
      "inequalities": [
        {
          "id": 1,
          "left": {
            "type": "PRICE",
            "indicator": "",
            "parameters": {},
            "value": "close",
            "valueType": "number"
          },
          "condition": "GREATER_THAN",
          "right": {
            "type": "INDICATOR",
            "indicator": "SMA",
            "parameters": {"period": "20", "source": "close"},
            "value": "",
            "valueType": "number"
          },
          "explanation": "Clear explanation"
        },
        {
          "id": 2,
          "left": {
            "type": "INDICATOR",
            "indicator": "MACD",
            "parameters": {"fast": "12", "slow": "26", "signal": "9"},
            "value": "",
            "valueType": "number"
          },
          "condition": "CROSSES_ABOVE",
          "right": {
            "type": "VALUE",
            "indicator": "",
            "parameters": {},
            "value": "0",
            "valueType": "number"
          },
          "explanation": "Clear explanation"
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
            "type": "INDICATOR",
            "indicator": "RSI",
            "parameters": {"period": "14", "source": "close"},
            "value": "",
            "valueType": "number"
          },
          "condition": "GREATER_THAN",
          "right": {
            "type": "VALUE",
            "indicator": "",
            "parameters": {},
            "value": "80",
            "valueType": "number"
          },
          "explanation": "Clear explanation"
        }
      ]
    },
    {
      "id": 2,
      "logic": "OR",
      "requiredConditions": 1,
      "inequalities": [
        {
          "id": 1,
          "left": {
            "type": "PRICE",
            "indicator": "",
            "parameters": {},
            "value": "close",
            "valueType": "number"
          },
          "condition": "LESS_THAN",
          "right": {
            "type": "INDICATOR",
            "indicator": "SMA",
            "parameters": {"period": "50", "source": "close"},
            "value": "",
            "valueType": "number"
          },
          "explanation": "Clear explanation"
        },
        {
          "id": 2,
          "left": {
            "type": "INDICATOR",
            "indicator": "STOCH",
            "parameters": {"k": "14", "d": "3"},
            "value": "",
            "valueType": "number"
          },
          "condition": "LESS_THAN",
          "right": {
            "type": "VALUE",
            "indicator": "",
            "parameters": {},
            "value": "20",
            "valueType": "number"
          },
          "explanation": "Clear explanation"
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

MANDATORY PARAMETER VALUES (use these exact values):
- RSI: {"period": "14", "source": "close"}
- SMA: {"period": "20", "source": "close"} or {"period": "50", "source": "close"}
- EMA: {"period": "20", "source": "close"} or {"period": "12", "source": "close"}
- MACD: {"fast": "12", "slow": "26", "signal": "9"}
- BB_UPPER/BB_LOWER: {"period": "20", "multiplier": "2", "source": "close"}
- STOCH: {"k": "14", "d": "3"}
- ADX: {"period": "14"}
- CCI: {"period": "20"}
- ROC: {"period": "10", "source": "close"}

PRICE VALUE REQUIREMENTS:
- When type is "PRICE", value MUST be exactly one of: "open", "high", "low", "close"
- NEVER use "price", "current_price", "market_price" or any other variation

VALUE REQUIREMENTS:
- When type is "VALUE", use ONLY specific numbers like: "30", "70", "0", "50", "80", "20", "1.5", "2.0"
- NEVER use: "current_price", "market_value", "threshold", "level", or any placeholder text
- Common RSI values: 30, 70, 20, 80
- Common MACD values: 0, 0.5, -0.5
- Common percentage values: 2, 5, 10, 15

VALIDATION CHECKLIST BEFORE GENERATING:
✓ Strategy name includes ${selectedAsset} and is descriptive
✓ Description is 80-120 words
✓ Both AND and OR groups exist for entry and exit
✓ OR groups have requiredConditions specified
✓ All indicators have complete parameters with specific values
✓ All PRICE types use exactly "open", "high", "low", or "close"
✓ All VALUE types use specific numbers, no placeholders
✓ All conditions have clear explanations
✓ Risk management has realistic numeric values
✓ No empty strings, placeholders, or missing fields

Return ONLY valid JSON with no markdown formatting.`;

    const userPrompt = `Asset: ${selectedAsset}
Type: ${assetType}
User Requirements: ${strategyDescription}

Generate a comprehensive trading strategy following ALL requirements above. Ensure every field is populated with realistic, specific values and all conditions are properly explained. The strategy must be immediately usable without any blank fields, placeholder values, or missing parameters. Pay special attention to using specific price types (open/high/low/close) and exact numeric values instead of placeholders.`;

    // Make OpenAI API call with enhanced error handling
    logWithTimestamp('INFO', 'Making OpenAI API request', { 
      model: 'gpt-4o-mini',
      promptLength: userPrompt.length 
    });
    
    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
        stream: false
      }),
      signal: AbortSignal.timeout(45000) // 45 second timeout for comprehensive generation
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      logWithTimestamp('ERROR', 'OpenAI API error', {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        error: errorText
      });
      
      let errorType = "unknown_error";
      if (openaiResponse.status === 401) {
        errorType = "api_key_error";
      } else if (openaiResponse.status === 429) {
        errorType = "rate_limit_error";
      } else if (openaiResponse.status >= 500) {
        errorType = "connection_error";
      }
      
      return new Response(
        JSON.stringify({
          error: `OpenAI API error: ${openaiResponse.status} ${openaiResponse.statusText}`,
          type: errorType,
          details: errorText,
          timestamp: new Date().toISOString()
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const openaiData = await openaiResponse.json();
    logWithTimestamp('INFO', 'OpenAI response received', {
      hasChoices: !!openaiData.choices,
      choicesLength: openaiData.choices?.length || 0,
      usage: openaiData.usage
    });

    // Parse and validate OpenAI response
    const aiResponseText = openaiData.choices[0]?.message?.content;
    if (!aiResponseText) {
      logWithTimestamp('ERROR', 'No content in OpenAI response', openaiData);
      return new Response(
        JSON.stringify({
          error: 'Empty response from OpenAI',
          type: "parsing_error",
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    logWithTimestamp('INFO', 'Processing OpenAI response', { 
      responseLength: aiResponseText.length,
      responsePreview: aiResponseText.substring(0, 200)
    });

    // Enhanced JSON parsing with multiple fallback strategies
    let strategyJSON;
    try {
      // Try direct JSON parsing first
      strategyJSON = JSON.parse(aiResponseText);
    } catch (directParseError) {
      try {
        // Try extracting JSON from markdown code blocks
        const jsonMatch = aiResponseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          strategyJSON = JSON.parse(jsonMatch[1]);
        } else {
          // Try finding JSON object pattern
          const jsonObjectMatch = aiResponseText.match(/\{[\s\S]*\}/);
          if (jsonObjectMatch) {
            strategyJSON = JSON.parse(jsonObjectMatch[0]);
          } else {
            throw new Error('No valid JSON found in response');
          }
        }
      } catch (fallbackParseError) {
        logWithTimestamp('ERROR', 'JSON parsing failed completely', {
          directError: directParseError.message,
          fallbackError: fallbackParseError.message,
          responsePreview: aiResponseText.substring(0, 500)
        });
        return new Response(
          JSON.stringify({
            error: 'Failed to parse strategy data from AI response',
            type: "parsing_error",
            timestamp: new Date().toISOString()
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }

    // Enhanced validation of required fields and content quality
    const requiredFields = ['name', 'description', 'timeframe', 'targetAsset', 'entryRules', 'exitRules', 'riskManagement'];
    const missingFields = requiredFields.filter(field => !strategyJSON[field]);
    
    if (missingFields.length > 0) {
      logWithTimestamp('ERROR', 'Strategy validation failed - missing fields', { missingFields });
      return new Response(
        JSON.stringify({
          error: `Generated strategy missing required fields: ${missingFields.join(', ')}`,
          type: "parsing_error",
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Additional validation for content quality and placeholder detection
    const validationIssues = [];
    
    // Check strategy name includes asset
    if (!strategyJSON.name?.includes(selectedAsset)) {
      validationIssues.push('Strategy name must include asset symbol');
    }
    
    // Check description length
    if (!strategyJSON.description || strategyJSON.description.length < 80) {
      validationIssues.push('Strategy description must be at least 80 words');
    }
    
    // Check entry rules have conditions
    if (!strategyJSON.entryRules?.length || !strategyJSON.entryRules[0]?.inequalities?.length) {
      validationIssues.push('Entry rules must have at least one condition');
    }
    
    // Check exit rules have conditions
    if (!strategyJSON.exitRules?.length || !strategyJSON.exitRules[0]?.inequalities?.length) {
      validationIssues.push('Exit rules must have at least one condition');
    }
    
    // Check risk management values
    const riskMgmt = strategyJSON.riskManagement;
    if (!riskMgmt?.stopLoss || !riskMgmt?.takeProfit || !riskMgmt?.singleBuyVolume || !riskMgmt?.maxBuyVolume) {
      validationIssues.push('All risk management fields must be populated');
    }
    
    // Enhanced validation for placeholder detection
    const checkForPlaceholders = (obj, path = '') => {
      if (typeof obj === 'string') {
        const placeholderPatterns = [
          'current_price', 'market_price', 'market_value', 'threshold', 'level',
          'value-current_price', 'specific_number', 'realistic_', 'specific_',
          'appropriate_', 'suitable_'
        ];
        for (const pattern of placeholderPatterns) {
          if (obj.toLowerCase().includes(pattern.toLowerCase())) {
            validationIssues.push(`Placeholder value detected at ${path}: "${obj}"`);
          }
        }
        
        // Check for PRICE type values
        if (path.includes('value') && path.includes('PRICE')) {
          const validPriceValues = ['open', 'high', 'low', 'close'];
          if (!validPriceValues.includes(obj)) {
            validationIssues.push(`Invalid PRICE value at ${path}: "${obj}" (must be open/high/low/close)`);
          }
        }
      } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          checkForPlaceholders(value, path ? `${path}.${key}` : key);
        }
      }
    };
    
    checkForPlaceholders(strategyJSON);
    
    if (validationIssues.length > 0) {
      logWithTimestamp('ERROR', 'Strategy content validation failed', { validationIssues });
      return new Response(
        JSON.stringify({
          error: `Generated strategy quality issues: ${validationIssues.join(', ')}`,
          type: "parsing_error",
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Normalize timeframe
    if (strategyJSON.timeframe === "1d") {
      strategyJSON.timeframe = "Daily";
    }

    const processingTime = Date.now() - startTime;
    logWithTimestamp('INFO', 'Strategy generation completed successfully', {
      processingTimeMs: processingTime,
      strategyName: strategyJSON.name,
      descriptionLength: strategyJSON.description?.length || 0,
      entryRulesCount: strategyJSON.entryRules?.length || 0,
      exitRulesCount: strategyJSON.exitRules?.length || 0,
      hasRiskManagement: !!strategyJSON.riskManagement
    });

    return new Response(
      JSON.stringify({
        ...strategyJSON,
        _metadata: {
          processingTime: processingTime,
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logWithTimestamp('ERROR', 'Strategy generation failed', {
      error: error.message,
      stack: error.stack,
      processingTimeMs: processingTime
    });
    
    // Determine error type and appropriate status code
    let status = 500;
    let errorType = "unknown_error";
    
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      status = 408;
      errorType = "timeout_error";
    } else if (error.message?.includes('API key')) {
      status = 401;
      errorType = "api_key_error";
    } else if (error.message?.includes('rate limit')) {
      status = 429;
      errorType = "rate_limit_error";
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      status = 503;
      errorType = "connection_error";
    } else if (error.message?.includes('parse') || error.message?.includes('JSON')) {
      status = 500;
      errorType = "parsing_error";
    }
    
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        type: errorType,
        timestamp: new Date().toISOString(),
        processingTime: processingTime
      }),
      {
        status: status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

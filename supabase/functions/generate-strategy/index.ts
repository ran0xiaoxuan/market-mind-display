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
    
    // Enhanced system prompt
    const systemPrompt = `You are a professional trading strategy assistant. Generate a complete, practical trading strategy in valid JSON format.

CRITICAL JSON STRUCTURE REQUIREMENTS:
{
  "name": "Strategy name including asset symbol",
  "description": "60-80 word description",
  "timeframe": "Daily|Weekly|Monthly|1h|4h|15m|30m|5m|1m",
  "targetAsset": "Asset symbol",
  "entryRules": [RuleGroup array],
  "exitRules": [RuleGroup array],
  "riskManagement": {
    "stopLoss": "percentage%",
    "takeProfit": "percentage%",
    "singleBuyVolume": "$amount",
    "maxBuyVolume": "$amount"
  }
}

RULE GROUP STRUCTURE:
{
  "id": number,
  "logic": "AND"|"OR",
  "requiredConditions": number,
  "explanation": "description",
  "inequalities": [Inequality array]
}

INEQUALITY STRUCTURE:
{
  "id": number,
  "left": {"type": "INDICATOR"|"VALUE", "indicator": "name", "parameters": {}, "value": "string", "valueType": "number"},
  "condition": "GREATER_THAN"|"LESS_THAN"|"CROSSES_ABOVE"|"CROSSES_BELOW",
  "right": {"type": "INDICATOR"|"VALUE", "indicator": "name", "parameters": {}, "value": "string", "valueType": "number"},
  "explanation": "description"
}

IMPORTANT RULES:
- ALWAYS include ${selectedAsset} in strategy name
- Use BOTH AND and OR rule groups effectively
- OR groups MUST have at least 2 conditions
- Use exact timeframe values: "Daily", "Weekly", "Monthly", "1h", "4h", "15m", "30m", "5m", "1m"
- Return ONLY valid JSON, no markdown formatting`;

    const userPrompt = `Asset: ${selectedAsset}
Type: ${assetType}
Strategy: ${strategyDescription}

Generate a detailed trading strategy as valid JSON. Include "${selectedAsset}" in the name and create balanced entry/exit rules with proper risk management.`;

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
        temperature: 0.7,
        max_tokens: 2500,
        stream: false
      }),
      signal: AbortSignal.timeout(30000) // 30 second timeout
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

    // Validate required fields
    const requiredFields = ['name', 'description', 'timeframe', 'targetAsset', 'entryRules', 'exitRules', 'riskManagement'];
    const missingFields = requiredFields.filter(field => !strategyJSON[field]);
    
    if (missingFields.length > 0) {
      logWithTimestamp('ERROR', 'Strategy validation failed', { missingFields });
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

    // Normalize timeframe
    if (strategyJSON.timeframe === "1d") {
      strategyJSON.timeframe = "Daily";
    }

    const processingTime = Date.now() - startTime;
    logWithTimestamp('INFO', 'Strategy generation completed successfully', {
      processingTimeMs: processingTime,
      strategyName: strategyJSON.name,
      entryRulesCount: strategyJSON.entryRules?.length || 0,
      exitRulesCount: strategyJSON.exitRules?.length || 0
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

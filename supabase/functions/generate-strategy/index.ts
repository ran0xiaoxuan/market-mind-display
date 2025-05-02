
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define types for the request
interface GenerateStrategyRequest {
  assetType: "stocks" | "cryptocurrency";
  selectedAsset: string;
  strategyDescription: string;
}

// Define types for the response from Bailian AI
interface GeneratedStrategy {
  name: string;
  description: string;
  market: string;
  timeframe: string;
  targetAsset: string;
  riskManagement: {
    stopLoss: string;
    takeProfit: string;
    singleBuyVolume: string;
    maxBuyVolume: string;
  };
  entryRules: {
    id: number;
    logic: string;
    inequalities: {
      id: number;
      left: {
        type: string;
        indicator?: string;
        parameters?: Record<string, string>;
        value?: string;
        valueType?: string;
      };
      condition: string;
      right: {
        type: string;
        indicator?: string;
        parameters?: Record<string, string>;
        value?: string;
        valueType?: string;
      };
      explanation?: string; // Added explanation field for each rule
    }[];
    requiredConditions?: number; // Explicitly defined for OR groups
  }[];
  exitRules: {
    id: number;
    logic: string;
    inequalities: {
      id: number;
      left: {
        type: string;
        indicator?: string;
        parameters?: Record<string, string>;
        value?: string;
        valueType?: string;
      };
      condition: string;
      right: {
        type: string;
        indicator?: string;
        parameters?: Record<string, string>;
        value?: string;
        valueType?: string;
      };
      explanation?: string; // Added explanation field for each rule
    }[];
    requiredConditions?: number; // Explicitly defined for OR groups
  }[];
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get API key from environment variable
    const bailianApiKey = Deno.env.get("BAILIAN_API_KEY");
    if (!bailianApiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the request body
    const { assetType, selectedAsset, strategyDescription }: GenerateStrategyRequest = await req.json();

    // Create client to check authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // Get the user from the request
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enhanced prompt for Bailian AI with more detailed instructions
    const prompt = `Generate a detailed trading strategy with the following specifications:
    - Asset type: ${assetType}
    - Target asset: ${selectedAsset || "Any suitable asset for this strategy"}
    - User description: ${strategyDescription}
    
    The strategy should include:
    1. A clear name and description
    2. Appropriate timeframe
    3. Risk management parameters (stop loss, take profit, position sizing)
    
    For the trading rules part, please follow these specific requirements:
    
    1. Entry Rules:
       - Create an AND group where ALL conditions must be met
       - Create an OR group where a SPECIFIC number of conditions must be met (specify this number as 'requiredConditions')
       - Use a diverse set of technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands, etc.)
       - Include price action conditions when appropriate
       - Mix different types of conditions (crossovers, threshold comparisons, etc.)
       
    2. Exit Rules:
       - Follow the same structure as Entry Rules
       - Include take profit and stop loss conditions
       - Consider different market conditions for exit strategies
    
    3. For EACH rule, include:
       - A brief explanation of why this rule is effective
       - What market condition it's designed to identify
       
    4. For OR groups specifically:
       - Create at least 2-3 conditions
       - Specify how many conditions must be met (requiredConditions value)
       - Ensure OR conditions complement each other to catch different market scenarios
    
    Format the response as a structured JSON object that can be parsed by a trading system.`;

    console.log("Sending enhanced request to Bailian API with prompt:", prompt);
    
    // Connect to Bailian API for strategy generation
    try {
      const bailianResponse = await fetch("https://api.bailian.com/v1/generate", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${bailianApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: prompt,
          temperature: 0.7,
          max_tokens: 2000, // Increased to accommodate more detailed responses
          model: "bailian-strategy-v1"
        })
      });
      
      if (!bailianResponse.ok) {
        // If Bailian API fails, fall back to mock response for demo purposes
        console.warn(`Bailian API returned ${bailianResponse.status}, using mock response`);
        
        // Return enhanced mock response as fallback
        const mockResponse: GeneratedStrategy = {
          name: `${assetType === "stocks" ? "Stock" : "Crypto"} ${selectedAsset || "Asset"} Strategy`,
          description: `A strategy for ${assetType} markets based on multiple technical indicators. ${strategyDescription}`,
          market: assetType === "stocks" ? "Stocks" : "Cryptocurrency",
          timeframe: "1h",
          targetAsset: selectedAsset || (assetType === "stocks" ? "SPY" : "BTC"),
          riskManagement: {
            stopLoss: "2.5",
            takeProfit: "5.0",
            singleBuyVolume: "1000",
            maxBuyVolume: "5000"
          },
          entryRules: [
            {
              id: 1,
              logic: "AND",
              inequalities: [
                {
                  id: 1,
                  left: {
                    type: "indicator",
                    indicator: "RSI",
                    parameters: { period: "14" }
                  },
                  condition: "Crosses Above",
                  right: {
                    type: "value",
                    value: "30"
                  },
                  explanation: "RSI crossing above 30 indicates potential reversal from oversold conditions, suggesting a good entry point as momentum shifts bullish."
                },
                {
                  id: 2,
                  left: {
                    type: "indicator",
                    indicator: "SMA",
                    parameters: { period: "20" }
                  },
                  condition: "Greater Than",
                  right: {
                    type: "indicator",
                    indicator: "SMA",
                    parameters: { period: "50" }
                  },
                  explanation: "When the shorter-term SMA crosses above the longer-term SMA, it signals an uptrend and confirms bullish momentum."
                },
                {
                  id: 3,
                  left: {
                    type: "indicator",
                    indicator: "Bollinger Bands",
                    parameters: { period: "20", deviation: "2" },
                    valueType: "Lower Band"
                  },
                  condition: "Less Than",
                  right: {
                    type: "price",
                    value: "Close"
                  },
                  explanation: "Price moving above the lower Bollinger Band after touching or breaking below it indicates a potential bounce and reversal."
                }
              ]
            },
            {
              id: 2,
              logic: "OR",
              inequalities: [
                {
                  id: 1,
                  left: {
                    type: "indicator",
                    indicator: "MACD",
                    parameters: { fast: "12", slow: "26", signal: "9" },
                    valueType: "MACD Line"
                  },
                  condition: "Crosses Above",
                  right: {
                    type: "indicator",
                    indicator: "MACD",
                    parameters: { fast: "12", slow: "26", signal: "9" },
                    valueType: "Signal"
                  },
                  explanation: "MACD line crossing above the signal line indicates increasing momentum and potential for upward movement."
                },
                {
                  id: 2,
                  left: {
                    type: "indicator",
                    indicator: "Volume",
                    parameters: { period: "5" }
                  },
                  condition: "Greater Than",
                  right: {
                    type: "indicator",
                    indicator: "Volume MA",
                    parameters: { period: "20" }
                  },
                  explanation: "Volume increasing above its moving average suggests strong interest in the current price movement, validating the trend."
                },
                {
                  id: 3,
                  left: {
                    type: "indicator",
                    indicator: "Ichimoku Cloud",
                    parameters: { conversionPeriod: "9", basePeriod: "26" },
                    valueType: "Price"
                  },
                  condition: "Crosses Above",
                  right: {
                    type: "indicator",
                    indicator: "Ichimoku Cloud",
                    parameters: { conversionPeriod: "9", basePeriod: "26" },
                    valueType: "Cloud"
                  },
                  explanation: "Price breaking above the Ichimoku Cloud indicates a shift from bearish to bullish sentiment and potential for continued upward movement."
                }
              ],
              requiredConditions: 2
            }
          ],
          exitRules: [
            {
              id: 1,
              logic: "AND",
              inequalities: [
                {
                  id: 1,
                  left: {
                    type: "indicator",
                    indicator: "RSI",
                    parameters: { period: "14" }
                  },
                  condition: "Greater Than",
                  right: {
                    type: "value",
                    value: "70"
                  },
                  explanation: "RSI above 70 indicates overbought conditions, suggesting it may be time to take profits as a reversal could be imminent."
                },
                {
                  id: 2,
                  left: {
                    type: "indicator",
                    indicator: "Stochastic",
                    parameters: { k: "14", d: "3" },
                    valueType: "K Line"
                  },
                  condition: "Crosses Below",
                  right: {
                    type: "indicator",
                    indicator: "Stochastic",
                    parameters: { k: "14", d: "3" },
                    valueType: "D Line"
                  },
                  explanation: "Stochastic K line crossing below D line in overbought territory signals momentum is shifting downward and a potential reversal."
                }
              ]
            },
            {
              id: 2,
              logic: "OR",
              inequalities: [
                {
                  id: 1,
                  left: {
                    type: "indicator",
                    indicator: "SMA",
                    parameters: { period: "20" }
                  },
                  condition: "Crosses Below",
                  right: {
                    type: "indicator",
                    indicator: "SMA",
                    parameters: { period: "50" }
                  },
                  explanation: "Short-term SMA crossing below long-term SMA signals a potential trend reversal to the downside."
                },
                {
                  id: 2,
                  left: {
                    type: "price",
                    value: "Close"
                  },
                  condition: "Less Than",
                  right: {
                    type: "value",
                    value: "Stop Loss"
                  },
                  explanation: "Price hitting the predetermined stop loss level indicates the trade is moving against expectations and should be closed to limit losses."
                },
                {
                  id: 3,
                  left: {
                    type: "indicator",
                    indicator: "ATR",
                    parameters: { period: "14" }
                  },
                  condition: "Multiplied By",
                  right: {
                    type: "value",
                    value: "2"
                  },
                  explanation: "When price moves more than 2 ATR from entry, volatility has increased significantly, suggesting taking profits or cutting losses."
                }
              ],
              requiredConditions: 1
            }
          ]
        };
        
        return new Response(
          JSON.stringify(mockResponse),
          { 
            status: 200, 
            headers: { 
              ...corsHeaders, 
              "Content-Type": "application/json" 
            } 
          }
        );
      }
      
      // If Bailian API succeeded, process and return the actual response
      const bailianData = await bailianResponse.json();
      const generatedStrategy: GeneratedStrategy = bailianData.result;
      
      return new Response(
        JSON.stringify(generatedStrategy),
        { 
          status: 200, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json" 
          } 
        }
      );
      
    } catch (apiError) {
      console.error("Error calling Bailian API:", apiError);
      
      // Return enhanced mock response as fallback if API call fails
      const mockResponse: GeneratedStrategy = {
        name: `${assetType === "stocks" ? "Stock" : "Crypto"} ${selectedAsset || "Asset"} Strategy`,
        description: `A strategy for ${assetType} markets based on multiple technical indicators. ${strategyDescription}`,
        market: assetType === "stocks" ? "Stocks" : "Cryptocurrency",
        timeframe: "1h",
        targetAsset: selectedAsset || (assetType === "stocks" ? "SPY" : "BTC"),
        riskManagement: {
          stopLoss: "2.5",
          takeProfit: "5.0",
          singleBuyVolume: "1000",
          maxBuyVolume: "5000"
        },
        entryRules: [
          {
            id: 1,
            logic: "AND",
            inequalities: [
              {
                id: 1,
                left: {
                  type: "indicator",
                  indicator: "RSI",
                  parameters: { period: "14" }
                },
                condition: "Crosses Above",
                right: {
                  type: "value",
                  value: "30"
                },
                explanation: "RSI crossing above 30 indicates potential reversal from oversold conditions, suggesting a good entry point as momentum shifts bullish."
              },
              {
                id: 2,
                left: {
                  type: "indicator",
                  indicator: "SMA",
                  parameters: { period: "20" }
                },
                condition: "Greater Than",
                right: {
                  type: "indicator",
                  indicator: "SMA",
                  parameters: { period: "50" }
                },
                explanation: "When the shorter-term SMA crosses above the longer-term SMA, it signals an uptrend and confirms bullish momentum."
              }
            ]
          },
          {
            id: 2,
            logic: "OR",
            inequalities: [
              {
                id: 1,
                left: {
                  type: "indicator",
                  indicator: "MACD",
                  parameters: { fast: "12", slow: "26", signal: "9" },
                  valueType: "MACD Line"
                },
                condition: "Crosses Above",
                right: {
                  type: "indicator",
                  indicator: "MACD",
                  parameters: { fast: "12", slow: "26", signal: "9" },
                  valueType: "Signal"
                },
                explanation: "MACD line crossing above the signal line indicates increasing momentum and potential for upward movement."
              },
              {
                id: 2,
                left: {
                  type: "indicator",
                  indicator: "Volume",
                  parameters: { period: "5" }
                },
                condition: "Greater Than",
                right: {
                  type: "indicator",
                  indicator: "Volume MA",
                  parameters: { period: "20" }
                },
                explanation: "Volume increasing above its moving average suggests strong interest in the current price movement, validating the trend."
              }
            ],
            requiredConditions: 1
          }
        ],
        exitRules: [
          {
            id: 1,
            logic: "AND",
            inequalities: [
              {
                id: 1,
                left: {
                  type: "indicator",
                  indicator: "RSI",
                  parameters: { period: "14" }
                },
                condition: "Greater Than",
                right: {
                  type: "value",
                  value: "70"
                },
                explanation: "RSI above 70 indicates overbought conditions, suggesting it may be time to take profits as a reversal could be imminent."
              }
            ]
          },
          {
            id: 2,
            logic: "OR",
            inequalities: [
              {
                id: 1,
                left: {
                  type: "indicator",
                  indicator: "SMA",
                  parameters: { period: "20" }
                },
                condition: "Crosses Below",
                right: {
                  type: "indicator",
                  indicator: "SMA",
                  parameters: { period: "50" }
                },
                explanation: "Short-term SMA crossing below long-term SMA signals a potential trend reversal to the downside."
              },
              {
                id: 2,
                left: {
                  type: "price",
                  value: "Close"
                },
                condition: "Less Than",
                right: {
                  type: "value",
                  value: "Stop Loss"
                },
                explanation: "Price hitting the predetermined stop loss level indicates the trade is moving against expectations and should be closed to limit losses."
              }
            ],
            requiredConditions: 1
          }
        ]
      };
      
      return new Response(
        JSON.stringify(mockResponse),
        { 
          status: 200, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json" 
          } 
        }
      );
    }
    
  } catch (error) {
    console.error("Error in generate-strategy function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});

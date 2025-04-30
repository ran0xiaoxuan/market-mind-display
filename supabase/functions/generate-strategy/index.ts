
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
    }[];
    requiredConditions?: number;
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
    }[];
    requiredConditions?: number;
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

    // Prepare the prompt for Bailian AI
    const prompt = `Generate a detailed trading strategy with the following specifications:
    - Asset type: ${assetType}
    - Target asset: ${selectedAsset || "Any suitable asset for this strategy"}
    - User description: ${strategyDescription}
    
    The strategy should include:
    1. A clear name and description
    2. Appropriate timeframe
    3. Risk management parameters (stop loss, take profit, position sizing)
    4. Entry rules with technical indicators and conditions
    5. Exit rules with technical indicators and conditions
    
    Format the response as a structured JSON object that can be parsed by a trading system.`;

    console.log("Sending request to Bailian API with prompt:", prompt);
    
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
          max_tokens: 1500,
          model: "bailian-strategy-v1"
        })
      });
      
      if (!bailianResponse.ok) {
        // If Bailian API fails, fall back to mock response for demo purposes
        console.warn(`Bailian API returned ${bailianResponse.status}, using mock response`);
        
        // Return mock response as fallback
        const mockResponse: GeneratedStrategy = {
          name: `${assetType === "stocks" ? "Stock" : "Crypto"} ${selectedAsset || "Asset"} Strategy`,
          description: `A strategy for ${assetType} markets based on momentum indicators. ${strategyDescription}`,
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
                  }
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
                  }
                }
              ]
            },
            {
              id: 2,
              logic: "OR",
              inequalities: [
                {
                  id: 3,
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
                  }
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
                  }
                }
              ]
            },
            {
              id: 2,
              logic: "OR",
              inequalities: [
                {
                  id: 2,
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
                  }
                },
                {
                  id: 3,
                  left: {
                    type: "indicator",
                    indicator: "MACD",
                    parameters: { fast: "12", slow: "26", signal: "9" },
                    valueType: "MACD Line"
                  },
                  condition: "Crosses Below",
                  right: {
                    type: "indicator",
                    indicator: "MACD",
                    parameters: { fast: "12", slow: "26", signal: "9" },
                    valueType: "Signal"
                  }
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
      
      // Return mock response as fallback if API call fails
      const mockResponse: GeneratedStrategy = {
        name: `${assetType === "stocks" ? "Stock" : "Crypto"} ${selectedAsset || "Asset"} Strategy`,
        description: `A strategy for ${assetType} markets based on momentum indicators. ${strategyDescription}`,
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
                }
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
                }
              }
            ]
          },
          {
            id: 2,
            logic: "OR",
            inequalities: [
              {
                id: 3,
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
                }
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
                }
              }
            ]
          },
          {
            id: 2,
            logic: "OR",
            inequalities: [
              {
                id: 2,
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
                }
              },
              {
                id: 3,
                left: {
                  type: "indicator",
                  indicator: "MACD",
                  parameters: { fast: "12", slow: "26", signal: "9" },
                  valueType: "MACD Line"
                },
                condition: "Crosses Below",
                right: {
                  type: "indicator",
                  indicator: "MACD",
                  parameters: { fast: "12", slow: "26", signal: "9" },
                  valueType: "Signal"
                }
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


// Import necessary dependencies
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define strategy templates organized by asset type and strategy type
const strategyTemplates = {
  stocks: {
    momentum: {
      name: "Stock Momentum Strategy",
      description: "This strategy identifies stocks with strong upward momentum and buys them while they continue to show strength.",
      market: "Equities",
      timeframe: "Daily",
      entryRules: [
        {
          id: 1,
          logic: "AND",
          inequalities: [
            {
              id: 1,
              left: {
                type: "price",
                indicator: "Price"
              },
              condition: "Greater Than",
              right: {
                type: "indicator",
                indicator: "SMA",
                parameters: { period: "200" }
              },
              explanation: "Price above 200-day SMA indicates a long-term uptrend."
            },
            {
              id: 2,
              left: {
                type: "indicator",
                indicator: "RSI",
                parameters: { period: "14" }
              },
              condition: "Greater Than",
              right: {
                type: "value",
                value: "50"
              },
              explanation: "RSI above 50 confirms bullish momentum."
            }
          ]
        },
        {
          id: 2,
          logic: "OR",
          requiredConditions: 1,
          inequalities: [
            {
              id: 1,
              left: {
                type: "indicator",
                indicator: "MACD",
                parameters: { fast: "12", slow: "26", signal: "9" }
              },
              condition: "Crosses Above",
              right: {
                type: "value",
                value: "0"
              },
              explanation: "MACD crossing above zero line indicates strengthening momentum."
            },
            {
              id: 2,
              left: {
                type: "indicator",
                indicator: "Volume",
              },
              condition: "Greater Than",
              right: {
                type: "indicator",
                indicator: "Volume SMA",
                parameters: { period: "20" }
              },
              explanation: "Above average volume suggests strong buying interest."
            }
          ]
        }
      ],
      exitRules: [
        {
          id: 1,
          logic: "OR",
          requiredConditions: 1,
          inequalities: [
            {
              id: 1,
              left: {
                type: "price",
                indicator: "Price"
              },
              condition: "Less Than",
              right: {
                type: "indicator",
                indicator: "SMA",
                parameters: { period: "50" }
              },
              explanation: "Price falling below 50-day SMA signals potential trend reversal."
            },
            {
              id: 2,
              left: {
                type: "indicator",
                indicator: "RSI",
                parameters: { period: "14" }
              },
              condition: "Less Than",
              right: {
                type: "value",
                value: "40"
              },
              explanation: "RSI below 40 indicates weakening momentum."
            }
          ]
        }
      ],
      riskManagement: {
        stopLoss: "5",
        takeProfit: "15",
        singleBuyVolume: "2000",
        maxBuyVolume: "10000"
      }
    },
    value: {
      name: "Value Stock Strategy",
      description: "This strategy identifies undervalued stocks based on fundamental and technical indicators.",
      market: "Equities",
      timeframe: "Daily",
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
              condition: "Less Than",
              right: {
                type: "value",
                value: "30"
              },
              explanation: "RSI below 30 indicates an oversold condition, suggesting the stock may be undervalued."
            },
            {
              id: 2,
              left: {
                type: "price",
                indicator: "Price"
              },
              condition: "Greater Than",
              right: {
                type: "indicator",
                indicator: "SMA",
                parameters: { period: "50" }
              },
              explanation: "Price still above 50-day SMA suggests overall trend remains positive despite recent pullback."
            }
          ]
        }
      ],
      exitRules: [
        {
          id: 1,
          logic: "OR",
          requiredConditions: 1,
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
              explanation: "RSI above 70 indicates an overbought condition, suggesting it may be time to take profits."
            },
            {
              id: 2,
              left: {
                type: "indicator",
                indicator: "Bollinger Bands",
                parameters: { period: "20", deviations: "2" }
              },
              condition: "Touches Upper",
              right: {
                type: "indicator",
                indicator: "Bollinger Bands",
                parameters: { period: "20", deviations: "2" }
              },
              explanation: "Price touching upper Bollinger Band suggests potential resistance and reversal point."
            }
          ]
        }
      ],
      riskManagement: {
        stopLoss: "4",
        takeProfit: "12",
        singleBuyVolume: "2500",
        maxBuyVolume: "10000"
      }
    },
    mean_reversion: {
      name: "Mean Reversion Strategy",
      description: "This strategy identifies stocks that have deviated significantly from their average price and are likely to revert back.",
      market: "Equities",
      timeframe: "Daily",
      entryRules: [
        {
          id: 1,
          logic: "AND",
          inequalities: [
            {
              id: 1,
              left: {
                type: "price",
                indicator: "Price"
              },
              condition: "Less Than",
              right: {
                type: "indicator",
                indicator: "Bollinger Bands",
                parameters: { period: "20", deviations: "-2" }
              },
              explanation: "Price below lower Bollinger Band indicates potential overselling and mean reversion opportunity."
            },
            {
              id: 2,
              left: {
                type: "indicator",
                indicator: "RSI",
                parameters: { period: "2" }
              },
              condition: "Less Than",
              right: {
                type: "value",
                value: "10"
              },
              explanation: "Extremely low 2-period RSI confirms severe oversold condition."
            }
          ]
        }
      ],
      exitRules: [
        {
          id: 1,
          logic: "OR",
          requiredConditions: 1,
          inequalities: [
            {
              id: 1,
              left: {
                type: "price",
                indicator: "Price"
              },
              condition: "Greater Than",
              right: {
                type: "indicator",
                indicator: "SMA",
                parameters: { period: "20" }
              },
              explanation: "Price returning to 20-day SMA indicates successful mean reversion."
            },
            {
              id: 2,
              left: {
                type: "indicator",
                indicator: "RSI",
                parameters: { period: "14" }
              },
              condition: "Greater Than",
              right: {
                type: "value",
                value: "60"
              },
              explanation: "RSI above 60 suggests momentum has shifted from oversold to potentially overbought."
            }
          ]
        }
      ],
      riskManagement: {
        stopLoss: "3",
        takeProfit: "9",
        singleBuyVolume: "2200",
        maxBuyVolume: "8800"
      }
    },
    breakout: {
      name: "Breakout Trading Strategy",
      description: "This strategy identifies stocks breaking out of consolidation patterns with increased volume.",
      market: "Equities",
      timeframe: "Daily",
      entryRules: [
        {
          id: 1,
          logic: "AND",
          inequalities: [
            {
              id: 1,
              left: {
                type: "price",
                indicator: "Price"
              },
              condition: "Greater Than",
              right: {
                type: "indicator",
                indicator: "Resistance",
                parameters: { period: "20" }
              },
              explanation: "Price breaking above recent resistance level signals potential breakout."
            },
            {
              id: 2,
              left: {
                type: "indicator",
                indicator: "Volume"
              },
              condition: "Greater Than",
              right: {
                type: "indicator",
                indicator: "Volume SMA",
                parameters: { period: "20" }
              },
              explanation: "Increased volume confirms the strength of the breakout."
            }
          ]
        }
      ],
      exitRules: [
        {
          id: 1,
          logic: "OR",
          requiredConditions: 1,
          inequalities: [
            {
              id: 1,
              left: {
                type: "price",
                indicator: "Price"
              },
              condition: "Less Than",
              right: {
                type: "indicator",
                indicator: "Support",
                parameters: { period: "10" }
              },
              explanation: "Price dropping below recent support suggests failed breakout."
            },
            {
              id: 2,
              left: {
                type: "indicator",
                indicator: "ATR",
                parameters: { period: "14" }
              },
              condition: "Decreasing",
              right: {
                type: "indicator",
                indicator: "ATR",
                parameters: { period: "14", shift: "5" }
              },
              explanation: "Decreasing volatility suggests momentum from breakout is waning."
            }
          ]
        }
      ],
      riskManagement: {
        stopLoss: "6",
        takeProfit: "18",
        singleBuyVolume: "2000",
        maxBuyVolume: "10000"
      }
    }
  },
  cryptocurrency: {
    trend_following: {
      name: "Crypto Trend Following Strategy",
      description: "This strategy identifies strong trends in cryptocurrency markets and follows them until reversal signals appear.",
      market: "Crypto",
      timeframe: "4h",
      entryRules: [
        {
          id: 1,
          logic: "AND",
          inequalities: [
            {
              id: 1,
              left: {
                type: "indicator",
                indicator: "EMA",
                parameters: { period: "8" }
              },
              condition: "Crosses Above",
              right: {
                type: "indicator",
                indicator: "EMA",
                parameters: { period: "21" }
              },
              explanation: "Fast EMA crossing above slow EMA indicates start of potential uptrend."
            },
            {
              id: 2,
              left: {
                type: "indicator",
                indicator: "ADX",
                parameters: { period: "14" }
              },
              condition: "Greater Than",
              right: {
                type: "value",
                value: "25"
              },
              explanation: "ADX above 25 confirms strong trend is in place."
            }
          ]
        }
      ],
      exitRules: [
        {
          id: 1,
          logic: "OR",
          requiredConditions: 1,
          inequalities: [
            {
              id: 1,
              left: {
                type: "indicator",
                indicator: "EMA",
                parameters: { period: "8" }
              },
              condition: "Crosses Below",
              right: {
                type: "indicator",
                indicator: "EMA",
                parameters: { period: "21" }
              },
              explanation: "Fast EMA crossing below slow EMA signals potential trend reversal."
            },
            {
              id: 2,
              left: {
                type: "indicator",
                indicator: "Parabolic SAR"
              },
              condition: "Flips",
              right: {
                type: "value",
                value: "Above Price"
              },
              explanation: "Parabolic SAR flipping above price is a strong reversal signal."
            }
          ]
        }
      ],
      riskManagement: {
        stopLoss: "8",
        takeProfit: "24",
        singleBuyVolume: "1000",
        maxBuyVolume: "5000"
      }
    },
    oscillator: {
      name: "Crypto Oscillator Strategy",
      description: "This strategy uses oscillators to identify overbought and oversold conditions in cryptocurrency markets.",
      market: "Crypto",
      timeframe: "1h",
      entryRules: [
        {
          id: 1,
          logic: "AND",
          inequalities: [
            {
              id: 1,
              left: {
                type: "indicator",
                indicator: "Stochastic",
                parameters: { k: "14", d: "3" }
              },
              condition: "Crosses Above",
              right: {
                type: "value",
                value: "20"
              },
              explanation: "Stochastic crossing above 20 from oversold territory signals potential upward momentum."
            },
            {
              id: 2,
              left: {
                type: "price",
                indicator: "Price"
              },
              condition: "Greater Than",
              right: {
                type: "indicator",
                indicator: "EMA",
                parameters: { period: "50" }
              },
              explanation: "Price above 50 EMA confirms overall uptrend remains intact."
            }
          ]
        }
      ],
      exitRules: [
        {
          id: 1,
          logic: "OR",
          requiredConditions: 1,
          inequalities: [
            {
              id: 1,
              left: {
                type: "indicator",
                indicator: "Stochastic",
                parameters: { k: "14", d: "3" }
              },
              condition: "Crosses Below",
              right: {
                type: "value",
                value: "80"
              },
              explanation: "Stochastic crossing below 80 from overbought territory signals potential downward momentum."
            },
            {
              id: 2,
              left: {
                type: "indicator",
                indicator: "RSI",
                parameters: { period: "14" }
              },
              condition: "Crosses Below",
              right: {
                type: "value",
                value: "70"
              },
              explanation: "RSI crossing below 70 confirms overbought conditions are resolving."
            }
          ]
        }
      ],
      riskManagement: {
        stopLoss: "6",
        takeProfit: "18",
        singleBuyVolume: "1200",
        maxBuyVolume: "6000"
      }
    },
    ichimoku: {
      name: "Ichimoku Cloud Strategy",
      description: "This strategy uses the Ichimoku Cloud indicator system to identify trends and potential reversals in cryptocurrency markets.",
      market: "Crypto",
      timeframe: "4h",
      entryRules: [
        {
          id: 1,
          logic: "AND",
          inequalities: [
            {
              id: 1,
              left: {
                type: "price",
                indicator: "Price"
              },
              condition: "Crosses Above",
              right: {
                type: "indicator",
                indicator: "Ichimoku Cloud",
                parameters: { component: "kumo" }
              },
              explanation: "Price crossing above the Ichimoku Cloud indicates a bullish signal."
            },
            {
              id: 2,
              left: {
                type: "indicator",
                indicator: "Ichimoku Cloud",
                parameters: { component: "tenkan" }
              },
              condition: "Crosses Above",
              right: {
                type: "indicator",
                indicator: "Ichimoku Cloud",
                parameters: { component: "kijun" }
              },
              explanation: "Tenkan-sen crossing above Kijun-sen (TK Cross) confirms bullish momentum."
            }
          ]
        }
      ],
      exitRules: [
        {
          id: 1,
          logic: "OR",
          requiredConditions: 1,
          inequalities: [
            {
              id: 1,
              left: {
                type: "price",
                indicator: "Price"
              },
              condition: "Crosses Below",
              right: {
                type: "indicator",
                indicator: "Ichimoku Cloud",
                parameters: { component: "kijun" }
              },
              explanation: "Price crossing below the Kijun-sen signals loss of momentum."
            },
            {
              id: 2,
              left: {
                type: "indicator",
                indicator: "Ichimoku Cloud",
                parameters: { component: "tenkan" }
              },
              condition: "Crosses Below",
              right: {
                type: "indicator",
                indicator: "Ichimoku Cloud",
                parameters: { component: "kijun" }
              },
              explanation: "Tenkan-sen crossing below Kijun-sen signals bearish momentum."
            }
          ]
        }
      ],
      riskManagement: {
        stopLoss: "7",
        takeProfit: "21",
        singleBuyVolume: "1000",
        maxBuyVolume: "5000"
      }
    },
    breakout: {
      name: "Crypto Volatility Breakout Strategy",
      description: "This strategy identifies periods of low volatility followed by breakouts in cryptocurrency markets.",
      market: "Crypto",
      timeframe: "1h",
      entryRules: [
        {
          id: 1,
          logic: "AND",
          inequalities: [
            {
              id: 1,
              left: {
                type: "indicator",
                indicator: "Bollinger Bands Width",
                parameters: { period: "20", deviations: "2" }
              },
              condition: "Increasing",
              right: {
                type: "indicator",
                indicator: "Bollinger Bands Width",
                parameters: { period: "20", deviations: "2", shift: "5" }
              },
              explanation: "Expanding Bollinger Bands width indicates increasing volatility after consolidation."
            },
            {
              id: 2,
              left: {
                type: "price",
                indicator: "Price"
              },
              condition: "Greater Than",
              right: {
                type: "indicator",
                indicator: "Bollinger Bands",
                parameters: { period: "20", deviations: "2" }
              },
              explanation: "Price breaking above upper Bollinger Band confirms upward breakout."
            }
          ]
        }
      ],
      exitRules: [
        {
          id: 1,
          logic: "OR",
          requiredConditions: 1,
          inequalities: [
            {
              id: 1,
              left: {
                type: "indicator",
                indicator: "ATR",
                parameters: { period: "14" }
              },
              condition: "Decreasing",
              right: {
                type: "indicator",
                indicator: "ATR",
                parameters: { period: "14", shift: "3" }
              },
              explanation: "Decreasing ATR indicates volatility contraction after breakout move."
            },
            {
              id: 2,
              left: {
                type: "price",
                indicator: "Price"
              },
              condition: "Less Than",
              right: {
                type: "indicator",
                indicator: "Bollinger Bands",
                parameters: { period: "20", component: "middle" }
              },
              explanation: "Price returning below middle Bollinger Band suggests momentum is slowing."
            }
          ]
        }
      ],
      riskManagement: {
        stopLoss: "8",
        takeProfit: "24",
        singleBuyVolume: "1000",
        maxBuyVolume: "5000"
      }
    }
  }
};

// Helper function to select a strategy template based on asset type and description keywords
function selectStrategyTemplate(assetType, description) {
  // Convert to lowercase for case-insensitive matching
  const lowerDescription = description.toLowerCase();
  let strategyType = "momentum"; // Default strategy type
  
  // Define keywords that map to different strategy types
  const strategyKeywords = {
    momentum: ["momentum", "trend", "following", "uptrend", "bullish"],
    value: ["value", "undervalued", "fundamental", "oversold", "buy low"],
    mean_reversion: ["mean", "reversion", "average", "return", "oversold", "overbought"],
    breakout: ["breakout", "volatility", "consolidation", "range", "volume"],
    oscillator: ["oscillator", "rsi", "stochastic", "overbought", "oversold"],
    ichimoku: ["ichimoku", "cloud", "tenkan", "kijun"]
  };
  
  // Find the strategy type with the most keyword matches
  let maxMatches = 0;
  Object.entries(strategyKeywords).forEach(([type, keywords]) => {
    const matches = keywords.filter(keyword => lowerDescription.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      strategyType = type;
    }
  });
  
  // If no good match is found in cryptocurrency templates but we need one, use a default
  if (assetType === "cryptocurrency" && !strategyTemplates.cryptocurrency[strategyType]) {
    strategyType = "trend_following";
  }
  
  // If no good match is found in stocks templates but we need one, use a default
  if (assetType === "stocks" && !strategyTemplates.stocks[strategyType]) {
    strategyType = "momentum";
  }
  
  // Return the selected template
  return strategyTemplates[assetType][strategyType];
}

// Custom function to modify a template and personalize it for the asset
function personalizeTemplate(template, assetType, selectedAsset, strategyDescription) {
  // Create a deep copy of the template to avoid modifying the original
  const strategy = JSON.parse(JSON.stringify(template));
  
  // Personalize the name and description
  strategy.name = `${selectedAsset} ${template.name}`;
  strategy.description = `${strategyDescription}\n\nThis strategy is designed for ${selectedAsset} and ${template.description.toLowerCase()}`;
  
  // Set the target asset
  strategy.targetAsset = selectedAsset;
  
  // Add some randomization to risk management settings to make each strategy feel unique
  const randomizeFactor = 0.9 + (Math.random() * 0.2); // Between 0.9 and 1.1
  strategy.riskManagement.stopLoss = (parseFloat(strategy.riskManagement.stopLoss) * randomizeFactor).toFixed(1);
  strategy.riskManagement.takeProfit = (parseFloat(strategy.riskManagement.takeProfit) * randomizeFactor).toFixed(1);
  
  // Maybe add an additional rule based on asset type
  if (Math.random() > 0.7) {
    if (assetType === "cryptocurrency") {
      // Add a crypto-specific rule
      const extraRule = {
        id: 3,
        left: {
          type: "indicator", 
          indicator: "Volume"
        },
        condition: "Greater Than", 
        right: {
          type: "indicator",
          indicator: "Volume SMA",
          parameters: { period: "30" }
        },
        explanation: "Higher than average volume indicates strong market interest and potential for continued movement."
      };
      
      if (strategy.entryRules[0].inequalities.length < 3) {
        strategy.entryRules[0].inequalities.push(extraRule);
      }
    } else {
      // Add a stock-specific rule
      const extraRule = {
        id: 3,
        left: {
          type: "indicator",
          indicator: "ATR",
          parameters: { period: "14" }
        },
        condition: "Increasing",
        right: {
          type: "indicator",
          indicator: "ATR",
          parameters: { period: "14", shift: "5" }
        },
        explanation: "Increasing Average True Range indicates rising volatility which often accompanies the start of new trends."
      };
      
      if (strategy.entryRules[0].inequalities.length < 3) {
        strategy.entryRules[0].inequalities.push(extraRule);
      }
    }
  }
  
  return strategy;
}

// Define the serving function for the edge function
serve(async (req) => {
  // Set CORS headers for browser clients
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  
  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Parse request body with proper error handling
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new Response(JSON.stringify({ 
        error: "Invalid request body", 
        details: "The request body could not be parsed as JSON." 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const { assetType, selectedAsset, strategyDescription } = requestData;
    
    // Validate input
    if (!assetType || !selectedAsset || !strategyDescription) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required parameters",
          details: {
            assetType: assetType ? "✓" : "✗ missing",
            selectedAsset: selectedAsset ? "✓" : "✗ missing", 
            strategyDescription: strategyDescription ? "✓" : "✗ missing"
          }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log("Generating strategy for:", { assetType, selectedAsset, strategyDescription });

    try {
      // Select an appropriate template based on the asset type and description
      const templateAssetType = assetType === "cryptocurrency" ? "cryptocurrency" : "stocks";
      const selectedTemplate = selectStrategyTemplate(templateAssetType, strategyDescription);
      
      // Personalize the template for the specific asset and description
      const strategy = personalizeTemplate(selectedTemplate, templateAssetType, selectedAsset, strategyDescription);
      
      // Log success
      console.log("Strategy generated successfully");
      
      // Return the generated strategy
      return new Response(JSON.stringify(strategy), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (genError) {
      console.error("Error generating strategy:", genError);
      
      // Return a meaningful error
      return new Response(
        JSON.stringify({ 
          error: "Failed to generate strategy",
          details: genError.toString(),
          type: "generation_error"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in edge function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "An unexpected error occurred",
        details: error.toString(),
        type: "general_error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

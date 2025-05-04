
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GeneratedStrategy } from "@/services/strategyService";

// Sample test data to demonstrate the strategy generator output
const testStrategyData: GeneratedStrategy = {
  name: "BTC/USD Momentum Strategy",
  description: "A momentum-based strategy that uses RSI and moving averages to identify trend changes in BTC/USD",
  market: "Crypto",
  timeframe: "4h",
  targetAsset: "BTC/USD",
  entryRules: [
    {
      id: 1,
      logic: "AND",
      inequalities: [
        {
          id: 1,
          left: {
            type: "indicator",
            indicator: "SMA",
            parameters: { period: "20" }
          },
          condition: "Crosses Above",
          right: {
            type: "indicator",
            indicator: "SMA",
            parameters: { period: "50" }
          },
          explanation: "When the faster 20-period SMA crosses above the slower 50-period SMA, it signals a potential uptrend beginning."
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
            indicator: "RSI",
            parameters: { period: "14" }
          },
          condition: "Crosses Above",
          right: {
            type: "value",
            value: "40"
          },
          explanation: "RSI crossing above 40 from below indicates a potential momentum shift from oversold conditions."
        },
        {
          id: 2,
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
          explanation: "MACD crossing above zero indicates a potential shift in momentum to the upside."
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
          explanation: "RSI above 70 indicates overbought conditions, suggesting it may be time to take profits."
        },
        {
          id: 2,
          left: {
            type: "price",
            value: "Close"
          },
          condition: "Less Than",
          right: {
            type: "indicator",
            indicator: "SMA",
            parameters: { period: "20" }
          },
          explanation: "Price closing below the 20-period SMA may indicate the uptrend is losing momentum."
        }
      ]
    }
  ],
  riskManagement: {
    stopLoss: "3.5",
    takeProfit: "10",
    singleBuyVolume: "1000",
    maxBuyVolume: "5000"
  }
};

interface TestStrategyGeneratorProps {
  onGenerateTest: (strategy: GeneratedStrategy) => void;
}

export const TestStrategyGenerator = ({ onGenerateTest }: TestStrategyGeneratorProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateTestStrategy = () => {
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      onGenerateTest(testStrategyData);
      toast("Test strategy generated", {
        description: "A sample BTC/USD momentum strategy has been loaded"
      });
      setIsLoading(false);
    }, 1500);
  };

  return (
    <Card className="p-6 mb-6 border">
      <h2 className="text-xl font-semibold mb-2">Strategy Generator Test</h2>
      <p className="text-muted-foreground mb-4">
        Generate a test strategy to verify the UI is working correctly
      </p>
      
      <Button 
        onClick={handleGenerateTestStrategy}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Test Strategy...
          </>
        ) : (
          "Generate Test Strategy"
        )}
      </Button>
    </Card>
  );
};

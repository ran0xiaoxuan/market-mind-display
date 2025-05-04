
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { AssetTypeSelector } from "@/components/strategy/AssetTypeSelector";
import { StrategyDescription } from "@/components/strategy/StrategyDescription";
import { useNavigate } from "react-router-dom";
import { generateStrategy, saveGeneratedStrategy, GeneratedStrategy } from "@/services/strategyService";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Loader2, AlertTriangle } from "lucide-react";
import { TradingRules } from "@/components/strategy-detail/TradingRules";
import { RiskManagement } from "@/components/strategy-detail/RiskManagement";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AIStrategy = () => {
  const { user } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [strategyDescription, setStrategyDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedStrategy, setGeneratedStrategy] = useState<GeneratedStrategy | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAssetSelect = (symbol: string) => {
    setSelectedAsset(symbol);
  };

  const handleGenerateStrategy = async () => {
    if (!strategyDescription) {
      toast("Strategy description required", {
        description: "Please provide a description of your trading strategy"
      });
      return;
    }

    // Reset states
    setIsLoading(true);
    setGenerationError(null);
    setIsUsingFallback(false);

    try {
      console.log("Starting strategy generation for:", { asset: selectedAsset, description: strategyDescription });
      
      // We're now generating strategies for combined assets, so we'll determine the type based on the asset format
      const assetType = selectedAsset.includes('/') ? 'cryptocurrency' : 'stocks';
      console.log(`Determined asset type: ${assetType}`);
      
      const strategy = await generateStrategy(assetType, selectedAsset, strategyDescription);
      console.log("Strategy generation result:", strategy);
      
      // Check if we're using fallback data (this is set in the service)
      if (strategy.description?.includes('Fallback data')) {
        console.log("Using fallback data due to API service error");
        setIsUsingFallback(true);
      }
      
      setGeneratedStrategy(strategy);
      toast("Strategy generated", {
        description: "AI has successfully generated a trading strategy based on your description"
      });
    } catch (error) {
      console.error("Error generating strategy:", error);
      setGenerationError(error instanceof Error ? error.message : "Unknown error occurred");
      toast("Failed to generate strategy", {
        description: "Please try again with a different description"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveStrategy = async () => {
    if (!generatedStrategy) return;
    if (!user) {
      toast("Authentication required", {
        description: "Please log in to save your strategy"
      });
      return;
    }

    setIsSaving(true);
    try {
      const strategyId = await saveGeneratedStrategy(generatedStrategy);
      toast("Strategy saved", {
        description: "Your strategy has been saved successfully"
      });
      
      // Navigate to the strategy details page
      navigate(`/strategy/${strategyId}`);
    } catch (error) {
      console.error("Error saving strategy:", error);
      toast("Failed to save strategy", {
        description: "Please try again later"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setGeneratedStrategy(null);
    setStrategyDescription("");
    setGenerationError(null);
    setIsUsingFallback(false);
  };

  // Log current state for debugging
  useEffect(() => {
    if (generatedStrategy) {
      console.log("Current generated strategy state:", generatedStrategy);
    }
  }, [generatedStrategy]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        {!generatedStrategy ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">AI Strategy Generator</h1>
              <p className="text-muted-foreground">
                Select your asset and describe your ideal trading strategy
              </p>
            </div>

            <AssetTypeSelector
              selectedAsset={selectedAsset}
              onAssetSelect={handleAssetSelect}
            />

            <StrategyDescription
              description={strategyDescription}
              onDescriptionChange={setStrategyDescription}
            />

            {generationError && (
              <Alert className="mb-6 border-red-200 bg-red-50 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error generating strategy</AlertTitle>
                <AlertDescription>{generationError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button
                className="w-full"
                onClick={handleGenerateStrategy}
                disabled={isLoading || !strategyDescription}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Strategy...
                  </>
                ) : (
                  "Generate Strategy"
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            {isUsingFallback && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-800" />
                <AlertTitle className="text-amber-800">Using Fallback Data</AlertTitle>
                <AlertDescription className="text-amber-700">
                  The AI service is currently unavailable. We're displaying a sample strategy based on your inputs.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between mb-8">
              <div>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="mb-4"
                >
                  Generate Another Strategy
                </Button>
                <h1 className="text-3xl font-bold">{generatedStrategy.name}</h1>
                <p className="text-muted-foreground mt-2">
                  {generatedStrategy.description?.replace(' (Fallback data due to AI service error)', '')}
                </p>
              </div>
              <Button
                onClick={handleSaveStrategy}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Strategy"
                )}
              </Button>
            </div>

            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-6">Strategy Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6">
                <div>
                  <p className="text-sm text-muted-foreground">Market</p>
                  <p className="font-medium">{generatedStrategy.market}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Timeframe</p>
                  <p className="font-medium">{generatedStrategy.timeframe}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Target Asset</p>
                  <p className="font-medium">{generatedStrategy.targetAsset || "Not specified"}</p>
                </div>
              </div>
            </Card>

            <RiskManagement riskManagement={generatedStrategy.riskManagement} />

            <TradingRules
              entryRules={generatedStrategy.entryRules}
              exitRules={generatedStrategy.exitRules}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default AIStrategy;


import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { AssetTypeSelector } from "@/components/strategy/AssetTypeSelector";
import { StrategyDescription } from "@/components/strategy/StrategyDescription";
import { useNavigate } from "react-router-dom";
import { generateStrategy, saveGeneratedStrategy, GeneratedStrategy } from "@/services/strategyService";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { TradingRules } from "@/components/strategy-detail/TradingRules";
import { RiskManagement } from "@/components/strategy-detail/RiskManagement";
import { useAuth } from "@/contexts/AuthContext";

const AIStrategy = () => {
  const { user } = useAuth();
  const [assetType, setAssetType] = useState<"stocks" | "cryptocurrency">("stocks");
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [strategyDescription, setStrategyDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedStrategy, setGeneratedStrategy] = useState<GeneratedStrategy | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAssetTypeChange = (type: "stocks" | "cryptocurrency") => {
    setAssetType(type);
    setSelectedAsset(""); // Clear selection when changing asset type
  };

  const handleAssetSelect = (symbol: string) => {
    setSelectedAsset(symbol);
  };

  const handleGenerateStrategy = async () => {
    if (!strategyDescription) {
      toast({
        title: "Strategy description required",
        description: "Please provide a description of your trading strategy",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const strategy = await generateStrategy(assetType, selectedAsset, strategyDescription);
      setGeneratedStrategy(strategy);
      toast({
        title: "Strategy generated",
        description: "AI has successfully generated a trading strategy based on your description",
      });
    } catch (error) {
      console.error("Error generating strategy:", error);
      toast({
        title: "Failed to generate strategy",
        description: "Please try again with a different description",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveStrategy = async () => {
    if (!generatedStrategy) return;
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save your strategy",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const strategyId = await saveGeneratedStrategy(generatedStrategy);
      toast({
        title: "Strategy saved",
        description: "Your strategy has been saved successfully",
      });
      
      // Navigate to the strategy details page
      navigate(`/strategy/${strategyId}`);
    } catch (error) {
      console.error("Error saving strategy:", error);
      toast({
        title: "Failed to save strategy",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setGeneratedStrategy(null);
    setStrategyDescription("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        {!generatedStrategy ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">AI Strategy Generator</h1>
              <p className="text-muted-foreground">
                Select your asset type and describe your ideal trading strategy
              </p>
            </div>

            <AssetTypeSelector
              assetType={assetType}
              selectedAsset={selectedAsset}
              onAssetTypeChange={handleAssetTypeChange}
              onAssetSelect={handleAssetSelect}
            />

            <StrategyDescription
              description={strategyDescription}
              onDescriptionChange={setStrategyDescription}
            />

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
                  {generatedStrategy.description}
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

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { AssetTypeSelector } from "@/components/strategy/AssetTypeSelector";
import { StrategyDescription } from "@/components/strategy/StrategyDescription";
import { useNavigate } from "react-router-dom";
import { generateStrategy, saveGeneratedStrategy, GeneratedStrategy } from "@/services/strategyService";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Loader2, AlertCircle, ExternalLink, CheckCircle } from "lucide-react";
import { TradingRules } from "@/components/strategy-detail/TradingRules";
import { RiskManagement } from "@/components/strategy-detail/RiskManagement";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const AIStrategy = () => {
  const { user } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [strategyDescription, setStrategyDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedStrategy, setGeneratedStrategy] = useState<GeneratedStrategy | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [edgeFunctionError, setEdgeFunctionError] = useState<boolean>(false);
  const [useFallbackData, setUseFallbackData] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleAssetSelect = (symbol: string) => {
    setSelectedAsset(symbol);
    setError(null);
    setEdgeFunctionError(false);
    setUseFallbackData(false);
  };

  const handleStrategyDescriptionChange = (value: string) => {
    setStrategyDescription(value);
    setError(null);
    setEdgeFunctionError(false);
    setUseFallbackData(false);
  };

  const handleGenerateStrategy = async () => {
    // Validation checks
    if (!selectedAsset) {
      toast("Asset selection required", {
        description: "Please select an asset for your trading strategy"
      });
      return;
    }

    if (!strategyDescription) {
      toast("Strategy description required", {
        description: "Please provide a description of your trading strategy"
      });
      return;
    }

    // Clear previous errors and set loading state
    setIsLoading(true);
    setError(null);
    setEdgeFunctionError(false);
    setUseFallbackData(false);
    
    try {
      // We're now generating strategies for combined assets, so we'll determine the type based on the asset format
      const assetType = selectedAsset.includes('/') ? 'cryptocurrency' : 'stocks';
      console.log("Generating strategy with parameters:", { assetType, selectedAsset, strategyDescription });
      
      const strategy = await generateStrategy(assetType, selectedAsset, strategyDescription);
      console.log("Strategy generated successfully:", strategy);
      
      setGeneratedStrategy(strategy);
      toast("Strategy generated", {
        description: "Moonshot AI has successfully generated a trading strategy based on your description",
        icon: <CheckCircle className="h-4 w-4 text-green-500" />
      });
    } catch (error) {
      console.error("Error generating strategy:", error);
      const errorMessage = error.response?.data?.error || error.message || "Unknown error";
      
      // Check if this is an edge function communication error
      const isEdgeFunctionError = errorMessage.includes("Edge Function") || 
                                 errorMessage.includes("Failed to fetch") ||
                                 errorMessage.includes("Failed to send");
      
      setEdgeFunctionError(isEdgeFunctionError);
      setError(`Failed to generate strategy: ${errorMessage}`);
      
      toast("Failed to generate strategy", {
        description: isEdgeFunctionError 
          ? "There was an error connecting to our AI service. Please check your connection and try again."
          : "There was an error generating your strategy. Please try again.",
        icon: <AlertCircle className="h-4 w-4 text-destructive" />
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseFallbackData = () => {
    // We're now generating strategies for combined assets, so we'll determine the type based on the asset format
    const assetType = selectedAsset.includes('/') ? 'cryptocurrency' : 'stocks';
    
    // Use the generateFallbackStrategy function from strategyService
    import("@/services/strategyService").then(({ generateFallbackStrategy }) => {
      const fallbackStrategy = generateFallbackStrategy(
        assetType as "stocks" | "cryptocurrency", 
        selectedAsset, 
        strategyDescription
      );
      
      setGeneratedStrategy(fallbackStrategy);
      setUseFallbackData(true);
      
      toast("Using fallback strategy", {
        description: "Using a template strategy since the AI service is unavailable",
        icon: <CheckCircle className="h-4 w-4 text-green-500" />
      });
    });
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
    setError(null);
    setEdgeFunctionError(false);
    setUseFallbackData(false);
  };

  const openSupabaseDocs = () => {
    window.open("https://supabase.com/docs/guides/functions", "_blank");
  };

  const openSupabaseDashboard = () => {
    window.open("https://supabase.com/dashboard/project/lqfhhqhswdqpsliskxrr/functions", "_blank");
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
                Select your asset and describe your ideal trading strategy
              </p>
            </div>

            <AssetTypeSelector
              selectedAsset={selectedAsset}
              onAssetSelect={handleAssetSelect}
            />

            <StrategyDescription
              description={strategyDescription}
              onDescriptionChange={handleStrategyDescriptionChange}
            />

            {error && (
              <div className="my-4 p-4 border border-destructive text-destructive bg-destructive/10 rounded-md flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">
                    {edgeFunctionError ? "AI Service Connection Error" : "AI Service Error"}
                  </h4>
                  <p className="text-sm">{error}</p>
                  
                  {edgeFunctionError && (
                    <div className="mt-3">
                      <Alert variant="destructive" className="bg-destructive/5">
                        <AlertTitle className="flex items-center gap-2">
                          Supabase Edge Function Error
                        </AlertTitle>
                        <AlertDescription>
                          <p className="mb-2">The AI service is currently unavailable. This might be due to:</p>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>Supabase Edge Function not deployed correctly</li>
                            <li>Missing MOONSHOT_API_KEY in the project settings</li>
                            <li>Network connectivity issues</li>
                          </ul>
                          <div className="flex flex-col sm:flex-row gap-2 mt-3">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex items-center gap-1"
                              onClick={openSupabaseDocs}
                            >
                              <ExternalLink className="w-3 h-3" />
                              Supabase Functions Documentation
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex items-center gap-1"
                              onClick={openSupabaseDashboard}
                            >
                              <ExternalLink className="w-3 h-3" />
                              View Edge Functions
                            </Button>
                          </div>
                          
                          <div className="mt-4">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={handleUseFallbackData}
                              className="w-full"
                            >
                              Use Fallback Strategy Template
                            </Button>
                            <p className="text-xs mt-1 text-center text-muted-foreground">
                              Continue with a predefined template instead of AI generation
                            </p>
                          </div>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Button
                className="w-full"
                onClick={handleGenerateStrategy}
                disabled={isLoading || !strategyDescription || !selectedAsset}
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
                  {useFallbackData && <span className="text-amber-600 ml-2 font-medium">(Template Strategy)</span>}
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


import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { AssetTypeSelector } from "@/components/strategy/AssetTypeSelector";
import { StrategyDescription } from "@/components/strategy/StrategyDescription";
import { useNavigate } from "react-router-dom";
import { generateStrategy, saveGeneratedStrategy, GeneratedStrategy } from "@/services/strategyService";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Loader2, AlertCircle, ExternalLink, CheckCircle, RefreshCcw } from "lucide-react";
import { TradingRules } from "@/components/strategy-detail/TradingRules";
import { RiskManagement } from "@/components/strategy-detail/RiskManagement";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

const AIStrategy = () => {
  const { user } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [strategyDescription, setStrategyDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedStrategy, setGeneratedStrategy] = useState<GeneratedStrategy | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const navigate = useNavigate();

  const handleAssetSelect = (symbol: string) => {
    setSelectedAsset(symbol);
    setError(null);
    setErrorType(null);
  };

  const handleStrategyDescriptionChange = (value: string) => {
    setStrategyDescription(value);
    setError(null);
    setErrorType(null);
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
    setErrorType(null);
    
    try {
      console.log("Generating strategy with parameters:", { assetType: 'stocks', selectedAsset, strategyDescription, retryAttempt: retryCount });
      
      const strategy = await generateStrategy('stocks', selectedAsset, strategyDescription);
      console.log("Strategy generated successfully:", strategy);
      
      setGeneratedStrategy(strategy);
      setRetryCount(0); // Reset retry count on success
      
      toast("Strategy generated", {
        description: "AI has successfully generated a trading strategy based on your description",
        icon: <CheckCircle className="h-4 w-4 text-green-500" />
      });
    } catch (error: any) {
      console.error("Error generating strategy:", error);
      const errorMessage = error.message || "Unknown error";
      const errorType = error.type || "unknown_error";
      
      setError(errorMessage);
      setErrorType(errorType);
      
      // Check if this is a connection error
      const isConnectionError = errorMessage.includes("Failed to fetch") || 
                                errorMessage.includes("Network error") ||
                                errorMessage.includes("connection") ||
                                errorType === "connection_error" ||
                                !navigator.onLine;
      
      toast("Failed to generate strategy", {
        description: isConnectionError 
          ? "There was an error connecting to the AI service. Please check your connection and try again."
          : "There was an error generating your strategy. Please try again or use a simpler description.",
        icon: <AlertCircle className="h-4 w-4 text-destructive" />
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryGeneration = () => {
    setRetryCount(prev => prev + 1);
    // If we've tried 3+ times, suggest using a simpler description
    if (retryCount >= 2) {
      toast("Consider simplifying your description", {
        description: "Try using fewer requirements or simpler language for better results"
      });
    }
    handleGenerateStrategy();
  };

  const handleUseFallbackData = () => {
    // Use the generateFallbackStrategy function from strategyService
    import("@/services/strategyService").then(({ generateFallbackStrategy }) => {
      const fallbackStrategy = generateFallbackStrategy(
        "stocks", 
        selectedAsset, 
        strategyDescription
      );
      
      setGeneratedStrategy(fallbackStrategy);
      
      toast("Using template strategy", {
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
    setErrorType(null);
    setRetryCount(0);
  };

  const openSupabaseDocs = () => {
    window.open("https://supabase.com/docs/guides/functions", "_blank");
  };

  const openSupabaseDashboard = () => {
    window.open("https://supabase.com/dashboard/project/lqfhhqhswdqpsliskxrr/functions", "_blank");
  };

  const isAPIKeyError = errorType === "api_key_error";
  const isConnectionError = error?.includes("Failed to fetch") || 
                           error?.includes("Network error") ||
                           errorType === "connection_error";
  const isTimeoutError = errorType === "timeout_error" || error?.includes("timed out");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        {!generatedStrategy ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">AI Strategy Generator</h1>
              <p className="text-muted-foreground">
                Select your stock and describe your ideal trading strategy in detail
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
                    {isAPIKeyError ? "API Key Error" : 
                     isConnectionError ? "Connection Error" : 
                     isTimeoutError ? "Request Timeout" : 
                     "AI Service Error"}
                  </h4>
                  <p className="text-sm">{error}</p>
                  
                  {isAPIKeyError && (
                    <div className="mt-3">
                      <Alert variant="destructive" className="bg-destructive/5">
                        <AlertTitle className="flex items-center gap-2">
                          Supabase Edge Function Configuration Error
                        </AlertTitle>
                        <AlertDescription>
                          <p className="mb-2">The AI service could not authenticate. This is due to:</p>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>Missing OPENAI_API_KEY in the project settings</li>
                            <li>Invalid or expired API key</li>
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
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                  
                  {(isConnectionError || isTimeoutError) && (
                    <div className="mt-3">
                      <Alert variant="destructive" className="bg-destructive/5">
                        <AlertTitle className="flex items-center gap-2">
                          {isConnectionError ? "Connection Error" : "Request Timeout"}
                        </AlertTitle>
                        <AlertDescription>
                          <p className="mb-2">We couldn't reach the AI service. This might be due to:</p>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>Network connectivity issues</li>
                            <li>Supabase Edge Function not responding</li>
                            {isTimeoutError && <li>Request was too complex and timed out</li>}
                          </ul>
                          
                          <div className="mt-4 flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={handleRetryGeneration}
                              className="flex items-center gap-1"
                            >
                              <RefreshCcw className="w-3 h-3" />
                              Retry Generation
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleUseFallbackData}
                            >
                              Use Template Strategy
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                  
                  {!isAPIKeyError && !isConnectionError && !isTimeoutError && (
                    <div className="mt-4">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleRetryGeneration}
                        className="mr-2 flex items-center gap-1"
                      >
                        <RefreshCcw className="w-3 h-3" />
                        Retry
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUseFallbackData}
                      >
                        Use Template Strategy
                      </Button>
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
              <div className="max-w-3xl">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="mb-4"
                >
                  Generate Another Strategy
                </Button>
                <h1 className="text-3xl font-bold">{generatedStrategy.name}</h1>
                <div className="mt-4 text-muted-foreground">
                  <ScrollArea className="max-h-[200px] rounded-md border p-4">
                    <p className="whitespace-pre-line">
                      {generatedStrategy.description}
                    </p>
                  </ScrollArea>
                </div>
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

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AssetTypeSelector } from "@/components/strategy/AssetTypeSelector";
import { StrategyDescription } from "@/components/strategy/StrategyDescription";
import { useNavigate, useBeforeUnload } from "react-router-dom";
import { generateStrategy, saveGeneratedStrategy, GeneratedStrategy, checkAIServiceHealth, ServiceError } from "@/services/strategyService";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle, ExternalLink, CheckCircle, RefreshCcw, Wifi, WifiOff } from "lucide-react";
import { TradingRules } from "@/components/strategy-detail/TradingRules";
import { RiskManagement } from "@/components/strategy-detail/RiskManagement";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Navbar } from "@/components/Navbar";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AIStrategy = () => {
  const { user } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [strategyDescription, setStrategyDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedStrategy, setGeneratedStrategy] = useState<GeneratedStrategy | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<ServiceError | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [serviceHealth, setServiceHealth] = useState<{ healthy: boolean; details?: any; error?: string } | null>(null);
  const navigate = useNavigate();

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setError(null);
      console.log("Network connection restored");
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setError({
        message: "No internet connection. Please check your network.",
        type: "connection_error",
        retryable: true
      });
      console.log("Network connection lost");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check AI service health on component mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await checkAIServiceHealth();
        setServiceHealth(health);
        console.log("AI service health check:", health);
      } catch (error) {
        console.error("Health check failed:", error);
        setServiceHealth({ healthy: false, error: "Health check failed" });
      }
    };

    checkHealth();
  }, []);

  // Handle beforeunload event (browser refresh/close)
  useBeforeUnload(
    (event) => {
      if (generatedStrategy) {
        event.preventDefault();
        return "You have an unsaved strategy. Are you sure you want to leave?";
      }
    }
  );

  // Add effect to handle navigation attempts when there's an unsaved strategy
  useEffect(() => {
    if (pendingNavigation && !showSaveDialog) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [pendingNavigation, showSaveDialog, navigate]);

  const handleAssetSelect = (symbol: string) => {
    setSelectedAsset(symbol);
    setError(null);
  };

  const handleStrategyDescriptionChange = (value: string) => {
    setStrategyDescription(value);
    setError(null);
  };

  const handleGenerateStrategy = async () => {
    // Pre-flight checks
    if (!isOnline) {
      toast.error("No internet connection. Please check your network and try again.");
      return;
    }

    if (!selectedAsset) {
      toast.error("Please select an asset for your trading strategy");
      return;
    }
    if (!strategyDescription) {
      toast.error("Please provide a description of your trading strategy");
      return;
    }

    if (strategyDescription.trim().length < 10) {
      toast.error("Strategy description must be at least 10 characters long");
      return;
    }

    // Clear previous errors and set loading state
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Generating strategy with enhanced error handling:", {
        assetType: 'stocks',
        selectedAsset,
        strategyDescription: strategyDescription.substring(0, 100) + "...",
        retryAttempt: retryCount,
        timestamp: new Date().toISOString()
      });
      
      const strategy = await generateStrategy('stocks', selectedAsset, strategyDescription);
      console.log("Strategy generated successfully:", { 
        name: strategy.name,
        timestamp: new Date().toISOString()
      });
      
      setGeneratedStrategy(strategy);
      setRetryCount(0); // Reset retry count on success
      setError(null);

      toast.success("AI has successfully generated a trading strategy based on your description");
    } catch (serviceError: any) {
      console.error("Strategy generation failed:", serviceError);
      setError(serviceError);
      setRetryCount(prev => prev + 1);

      // Show appropriate toast message based on error type
      const errorMessages = {
        connection_error: "Unable to connect to AI service. Check your connection and try again.",
        api_key_error: "AI service configuration issue. Please try the template strategy.",
        timeout_error: "Request took too long. Try simplifying your description.",
        rate_limit_error: "Service is busy. Please wait a moment and try again.",
        validation_error: serviceError.message || "Please check your input and try again.",
        parsing_error: "AI response processing failed. Please try again.",
        unknown_error: "An unexpected error occurred. Please try again."
      };

      const message = errorMessages[serviceError.type] || errorMessages.unknown_error;
      toast.error(message);

      // Auto-retry for certain error types
      if (serviceError.retryable && retryCount < 1) {
        console.log("Auto-retrying due to retryable error...");
        setTimeout(() => {
          handleGenerateStrategy();
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryGeneration = () => {
    if (retryCount >= 2) {
      toast.warning("Try using fewer requirements or simpler language for better results");
    }
    handleGenerateStrategy();
  };

  const handleUseFallbackData = () => {
    import("@/services/strategyService").then(({
      generateFallbackStrategy
    }) => {
      const fallbackStrategy = generateFallbackStrategy("stocks", selectedAsset, strategyDescription);
      setGeneratedStrategy(fallbackStrategy);
      setError(null);
      toast.success("A template strategy has been created based on your asset selection");
    });
  };

  const handleSaveStrategy = async () => {
    if (!generatedStrategy) return;
    
    if (!user) {
      toast.error("Please log in to save your strategy");
      navigate(`/auth/login`);
      return;
    }
    
    setIsSaving(true);
    
    try {
      console.log("Saving strategy:", generatedStrategy);
      
      const strategyId = await saveGeneratedStrategy(generatedStrategy);
      console.log("Strategy saved with ID:", strategyId);
      
      toast.success("Your strategy has been saved successfully");

      navigate(`/strategy/${strategyId}`);
    } catch (error: any) {
      console.error("Error saving strategy:", error);
      
      if (error.message?.includes("authentication") || error.code === 'PGRST301') {
        toast.error("Please log in to save your strategy");
        navigate(`/auth/login`);
      } else if (error.message?.includes("row-level security") || error.code === 'PGRST204') {
        toast.error("You don't have permission to save this strategy. Please log out and log back in.");
      } else {
        toast.error(error.message || "Failed to save strategy. Please try again later");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleNavigationAttempt = (path: string) => {
    if (generatedStrategy) {
      setPendingNavigation(path);
      setShowSaveDialog(true);
    } else {
      navigate(path);
    }
  };

  const handleDialogCancel = () => {
    setShowSaveDialog(false);
    setPendingNavigation(null);
  };

  const handleDialogContinue = () => {
    setShowSaveDialog(false);
  };

  const handleDialogSave = async () => {
    await handleSaveStrategy();
    setShowSaveDialog(false);
  };

  const handleReset = () => {
    setGeneratedStrategy(null);
    setStrategyDescription("");
    setError(null);
    setRetryCount(0);
  };

  const openSupabaseDocs = () => {
    window.open("https://supabase.com/docs/guides/functions", "_blank");
  };

  // Enhanced error type checking
  const isAPIKeyError = error?.type === "api_key_error";
  const isConnectionError = error?.type === "connection_error";
  const isTimeoutError = error?.type === "timeout_error";
  const isRateLimitError = error?.type === "rate_limit_error";
  const isValidationError = error?.type === "validation_error";

  return (
    <div className="min-h-screen bg-background">
      <Navbar onNavigate={handleNavigationAttempt} />
      
      {/* Network Status Indicator */}
      {!isOnline && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <div className="flex items-center">
            <WifiOff className="h-4 w-4 mr-2" />
            <span>No internet connection. Please check your network.</span>
          </div>
        </div>
      )}

      {/* Service Health Status */}
      {serviceHealth && !serviceHealth.healthy && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>AI service may be experiencing issues. Template strategies are available as backup.</span>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto p-6">
        {!generatedStrategy ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">AI Strategy Generator</h1>
              <p className="text-muted-foreground">
                Select your stock and describe your ideal trading strategy in detail
              </p>
              {serviceHealth?.healthy && (
                <div className="flex items-center mt-2 text-green-600 text-sm">
                  <Wifi className="h-3 w-3 mr-1" />
                  AI service is online and ready
                </div>
              )}
            </div>

            <AssetTypeSelector selectedAsset={selectedAsset} onAssetSelect={handleAssetSelect} />

            <StrategyDescription description={strategyDescription} onDescriptionChange={handleStrategyDescriptionChange} />

            {error && (
              <Alert variant="destructive" className="my-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {isConnectionError ? "Connection Issue" : 
                   isAPIKeyError ? "Configuration Error" : 
                   isTimeoutError ? "Request Timeout" :
                   isRateLimitError ? "Service Busy" :
                   isValidationError ? "Input Validation Error" : "AI Service Error"}
                </AlertTitle>
                <AlertDescription>
                  <div className="mt-2">
                    <p className="mb-3">{error.message}</p>
                    
                    {error.details && Array.isArray(error.details) && (
                      <ul className="list-disc list-inside mb-3 text-sm">
                        {error.details.map((detail: string, index: number) => (
                          <li key={index}>{detail}</li>
                        ))}
                      </ul>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2">
                      {error.retryable && (
                        <Button variant="outline" size="sm" onClick={handleRetryGeneration}>
                          <RefreshCcw className="w-3 h-3 mr-1" />
                          {retryCount > 0 ? `Retry (${retryCount + 1})` : "Retry"}
                        </Button>
                      )}
                      
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={handleUseFallbackData}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Use Template Strategy
                      </Button>
                      
                      {isAPIKeyError && (
                        <Button variant="outline" size="sm" onClick={openSupabaseDocs}>
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Setup Guide
                        </Button>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end mt-6">
              <Button 
                className="w-full" 
                onClick={handleGenerateStrategy} 
                disabled={isLoading || !strategyDescription || !selectedAsset || !isOnline}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Strategy...
                  </>
                ) : "Generate Strategy"}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col mb-6">
              <Button variant="outline" onClick={handleReset} className="mb-4 self-start">
                Generate Another Strategy
              </Button>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold">{generatedStrategy.name}</h1>
                    <Button onClick={handleSaveStrategy} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : "Save Strategy"}
                    </Button>
                  </div>
                  
                  <div className="mt-2 rounded-md bg-muted/50 p-4">
                    <p className="whitespace-pre-line text-sm">
                      {generatedStrategy.description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6 mt-6">
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
            </div>

            <RiskManagement riskManagement={generatedStrategy.riskManagement} />

            <TradingRules entryRules={generatedStrategy.entryRules} exitRules={generatedStrategy.exitRules} />
          </div>
        )}
      </main>

      {/* Save Strategy Dialog */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Strategy</AlertDialogTitle>
            <AlertDialogDescription>
              You have a generated strategy that hasn't been saved. Would you like to save it before leaving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDialogCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDialogContinue} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Leave without saving
            </AlertDialogAction>
            <AlertDialogAction onClick={handleDialogSave}>
              Save Strategy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AIStrategy;

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AssetTypeSelector } from "@/components/strategy/AssetTypeSelector";
import { StrategyDescription } from "@/components/strategy/StrategyDescription";
import { useNavigate, useBeforeUnload } from "react-router-dom";
import { generateStrategy, saveGeneratedStrategy, GeneratedStrategy } from "@/services/strategyService";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle, ExternalLink, CheckCircle, RefreshCcw } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const navigate = useNavigate();

  // Handle beforeunload event (browser refresh/close)
  useBeforeUnload(
    (event) => {
      if (generatedStrategy) {
        event.preventDefault();
        // Return a string to show a browser confirmation dialog
        return "You have an unsaved strategy. Are you sure you want to leave?";
      }
    }
  );

  // Add effect to handle navigation attempts when there's an unsaved strategy
  useEffect(() => {
    // If we have a pending navigation and no strategy, or the dialog is closed without action
    if (pendingNavigation && !showSaveDialog) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [pendingNavigation, showSaveDialog, navigate]);

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
      toast({
        title: "Asset selection required",
        description: "Please select an asset for your trading strategy"
      });
      return;
    }
    if (!strategyDescription) {
      toast({
        title: "Strategy description required",
        description: "Please provide a description of your trading strategy"
      });
      return;
    }

    // Clear previous errors and set loading state
    setIsLoading(true);
    setError(null);
    setErrorType(null);
    
    try {
      console.log("Generating strategy with parameters:", {
        assetType: 'stocks',
        selectedAsset,
        strategyDescription,
        retryAttempt: retryCount
      });
      
      const strategy = await generateStrategy('stocks', selectedAsset, strategyDescription);
      console.log("Strategy generated successfully:", strategy);
      setGeneratedStrategy(strategy);
      setRetryCount(0); // Reset retry count on success

      toast({
        title: "Strategy generated",
        description: "AI has successfully generated a trading strategy based on your description",
      });
    } catch (error: any) {
      console.error("Error generating strategy:", error);
      const errorMessage = error.message || "Unknown error";
      const errorType = error.type || "connection_error";
      
      setError(errorMessage);
      setErrorType(errorType);

      // Show immediate fallback option for connection errors
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("Network error") || !navigator.onLine) {
        setErrorType("connection_error");
        toast({
          title: "Connection Error",
          description: "Unable to connect to AI service. You can use a template strategy instead.",
          variant: "destructive"
        });
      } else if (errorType === "api_key_error") {
        toast({
          title: "Configuration Error",
          description: "AI service configuration issue. Please try the template strategy.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "AI Service Error",
          description: "There was an error generating your strategy. Try simplifying your description or use a template.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryGeneration = () => {
    setRetryCount(prev => prev + 1);
    // If we've tried 3+ times, suggest using a simpler description
    if (retryCount >= 2) {
      toast({
        title: "Consider simplifying your description",
        description: "Try using fewer requirements or simpler language for better results"
      });
    }
    handleGenerateStrategy();
  };

  const handleUseFallbackData = () => {
    // Use the generateFallbackStrategy function from strategyService
    import("@/services/strategyService").then(({
      generateFallbackStrategy
    }) => {
      const fallbackStrategy = generateFallbackStrategy("stocks", selectedAsset, strategyDescription);
      setGeneratedStrategy(fallbackStrategy);
      toast({
        title: "Template strategy created",
        description: "A template strategy has been created based on your asset selection",
      });
    });
  };

  const handleSaveStrategy = async () => {
    if (!generatedStrategy) return;
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save your strategy"
      });
      navigate(`/auth/login`);
      return;
    }
    
    setIsSaving(true);
    
    try {
      console.log("Saving strategy:", generatedStrategy);
      
      // Save strategy and get the id
      const strategyId = await saveGeneratedStrategy(generatedStrategy);
      console.log("Strategy saved with ID:", strategyId);
      
      // Show success toast
      toast({
        title: "Strategy saved",
        description: "Your strategy has been saved successfully",
      });

      // Navigate to the strategy details page
      navigate(`/strategy/${strategyId}`);
    } catch (error: any) {
      console.error("Error saving strategy:", error);
      
      // Check if this is an authentication error
      if (error.message?.includes("authentication") || error.code === 'PGRST301') {
        toast({
          title: "Authentication required",
          description: "Please log in to save your strategy",
          variant: "destructive"
        });
        navigate(`/auth/login`);
      } else if (error.message?.includes("row-level security") || error.code === 'PGRST204') {
        toast({
          title: "Permission error",
          description: "You don't have permission to save this strategy. Please log out and log back in.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Failed to save strategy",
          description: error.message || "Please try again later",
          variant: "destructive"
        });
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
    // Navigation will happen in the useEffect
  };

  const handleDialogSave = async () => {
    await handleSaveStrategy();
    setShowSaveDialog(false);
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
  const isConnectionError = errorType === "connection_error" || error?.includes("Failed to fetch") || error?.includes("Network error");
  const isTimeoutError = errorType === "timeout_error" || error?.includes("timed out");

  return (
    <div className="min-h-screen bg-background">
      <Navbar onNavigate={handleNavigationAttempt} />
      <main className="max-w-4xl mx-auto p-6">
        {!generatedStrategy ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">AI Strategy Generator</h1>
              <p className="text-muted-foreground">
                Select your stock and describe your ideal trading strategy in detail
              </p>
            </div>

            <AssetTypeSelector selectedAsset={selectedAsset} onAssetSelect={handleAssetSelect} />

            <StrategyDescription description={strategyDescription} onDescriptionChange={handleStrategyDescriptionChange} />

            {error && (
              <div className="my-4 p-4 border border-destructive text-destructive bg-destructive/10 rounded-md flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium mb-2">
                    {isConnectionError ? "Connection Issue - Service Unavailable" : 
                     isAPIKeyError ? "Configuration Error" : 
                     isTimeoutError ? "Request Timeout" : "AI Service Error"}
                  </h4>
                  
                  {isConnectionError && (
                    <div>
                      <p className="text-sm mb-3">The AI service is currently unavailable. This could be due to:</p>
                      <ul className="list-disc pl-5 space-y-1 text-sm mb-4">
                        <li>Network connectivity issues</li>
                        <li>AI service temporarily down</li>
                        <li>Server maintenance</li>
                      </ul>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={handleUseFallbackData}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Use Template Strategy
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleRetryGeneration}>
                          <RefreshCcw className="w-3 h-3 mr-1" />
                          Try Again
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {isAPIKeyError && (
                    <div>
                      <p className="text-sm mb-3">AI service configuration error:</p>
                      <ul className="list-disc pl-5 space-y-1 text-sm mb-4">
                        <li>Missing or invalid OpenAI API key</li>
                        <li>Edge function configuration issue</li>
                      </ul>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={handleUseFallbackData}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Use Template Strategy
                        </Button>
                        <Button variant="outline" size="sm" onClick={openSupabaseDocs}>
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Setup Guide
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {isTimeoutError && (
                    <div>
                      <p className="text-sm mb-3">Request timed out. Try:</p>
                      <ul className="list-disc pl-5 space-y-1 text-sm mb-4">
                        <li>Simplifying your strategy description</li>
                        <li>Using fewer technical requirements</li>
                        <li>Trying again in a moment</li>
                      </ul>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" size="sm" onClick={handleRetryGeneration}>
                          <RefreshCcw className="w-3 h-3 mr-1" />
                          Retry with Current Description
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={handleUseFallbackData}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Use Template Strategy
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {!isConnectionError && !isAPIKeyError && !isTimeoutError && (
                    <div>
                      <p className="text-sm mb-3">{error}</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" size="sm" onClick={handleRetryGeneration}>
                          <RefreshCcw className="w-3 h-3 mr-1" />
                          Retry
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={handleUseFallbackData}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Use Template Strategy
                        </Button>
                      </div>
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

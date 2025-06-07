
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AssetTypeSelector } from "@/components/strategy/AssetTypeSelector";
import { StrategyDescription } from "@/components/strategy/StrategyDescription";
import { useNavigate } from "react-router-dom";
import { generateStrategy, GeneratedStrategy, checkAIServiceHealth, ServiceError } from "@/services/strategyService";
import { toast } from "sonner";
import { Loader2, AlertCircle, ExternalLink, CheckCircle, RefreshCcw, Wifi, WifiOff, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Navbar } from "@/components/Navbar";
import { useActivityLogger } from "@/hooks/useActivityLogger";

const AIStrategy = () => {
  const { user } = useAuth();
  const { logActivity } = useActivityLogger();
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [strategyDescription, setStrategyDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ServiceError | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [serviceHealth, setServiceHealth] = useState<{ healthy: boolean; details?: any; error?: string } | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);
  const [lastHealthCheck, setLastHealthCheck] = useState<Date | null>(null);
  const navigate = useNavigate();

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setError(null);
      console.log("Network connection restored");
      toast.success("Internet connection restored");
      // Trigger health check when coming back online
      checkHealth();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setError({
        message: "No internet connection. Please check your network.",
        type: "connection_error",
        retryable: true
      });
      console.log("Network connection lost");
      toast.error("Internet connection lost");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Enhanced health check function
  const checkHealth = async () => {
    if (!isOnline) return;
    
    setIsCheckingHealth(true);
    try {
      console.log("Performing comprehensive AI service health check...");
      const health = await checkAIServiceHealth();
      setServiceHealth(health);
      setLastHealthCheck(new Date());
      console.log("AI service health check result:", health);
      
      if (!health.healthy) {
        setError({
          message: "AI service is currently unavailable",
          type: "service_unavailable",
          retryable: true,
          details: [health.error || "Service health check failed", "Try again in a few moments"]
        });
      } else {
        // Clear error if service is healthy
        setError(null);
      }
    } catch (error) {
      console.error("Health check failed:", error);
      setServiceHealth({ healthy: false, error: "Health check failed" });
      setLastHealthCheck(new Date());
    } finally {
      setIsCheckingHealth(false);
    }
  };

  // Check AI service health on component mount and periodically
  useEffect(() => {
    checkHealth();
    
    // Check health every 30 seconds, but more frequently if service is down
    const healthCheckInterval = setInterval(() => {
      checkHealth();
    }, serviceHealth?.healthy ? 30000 : 10000); // 30s if healthy, 10s if not
    
    return () => clearInterval(healthCheckInterval);
  }, [isOnline, serviceHealth?.healthy]);

  const handleAssetSelect = (symbol: string) => {
    setSelectedAsset(symbol);
    setError(null);
    console.log("Asset selected:", symbol);
  };

  const handleStrategyDescriptionChange = (value: string) => {
    setStrategyDescription(value);
    setError(null);
  };

  const handleGenerateStrategy = async () => {
    console.log("=== Strategy generation initiated ===");
    console.log("Generation attempt:", retryCount + 1);
    
    // Pre-flight checks
    if (!isOnline) {
      toast.error("No internet connection. Please check your network and try again.");
      return;
    }

    if (!selectedAsset) {
      toast.error("Please select an asset for your trading strategy");
      return;
    }
    
    if (!strategyDescription.trim()) {
      toast.error("Please provide a description of your trading strategy");
      return;
    }

    if (strategyDescription.trim().length < 10) {
      toast.error("Strategy description must be at least 10 characters long");
      return;
    }

    // Check service health before attempting generation
    if (serviceHealth && !serviceHealth.healthy) {
      toast.error("AI service is currently unavailable. Please try again later.");
      return;
    }

    // Clear previous errors and set loading state
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Generating strategy with parameters:", {
        assetType: 'stocks',
        selectedAsset,
        strategyDescriptionLength: strategyDescription.length,
        retryAttempt: retryCount,
        timestamp: new Date().toISOString()
      });
      
      // Log activity
      await logActivity(
        'generate',
        'AI Strategy Generation Started',
        `Generating strategy for ${selectedAsset}: ${strategyDescription.substring(0, 50)}...`
      );
      
      const strategy = await generateStrategy('stocks', selectedAsset, strategyDescription);
      
      console.log("Strategy generated successfully:", { 
        name: strategy.name,
        timestamp: new Date().toISOString()
      });
      
      setRetryCount(0); // Reset retry count on success
      setError(null);

      // Log successful generation
      await logActivity(
        'generate',
        'AI Strategy Generated Successfully',
        `Generated "${strategy.name}" for ${selectedAsset}`,
        strategy.name
      );

      toast.success("AI has successfully generated a trading strategy based on your description");
      
      // Navigate to the new preview page with the generated strategy
      navigate('/strategy-preview', { 
        state: { generatedStrategy: strategy }
      });
      
    } catch (serviceError: any) {
      console.error("Strategy generation failed:", serviceError);
      setError(serviceError);
      setRetryCount(prev => prev + 1);

      // Log failed generation
      await logActivity(
        'generate',
        'AI Strategy Generation Failed',
        `Failed to generate strategy for ${selectedAsset}: ${serviceError.message}`
      );

      // Show appropriate toast message based on error type
      const errorMessages = {
        connection_error: "Unable to connect to AI service. Check your connection and try again.",
        api_key_error: "AI service configuration issue. Please try the template strategy.",
        timeout_error: "Request took too long. Try simplifying your description.",
        rate_limit_error: "Service is busy. Please wait a moment and try again.",
        validation_error: serviceError.message || "Please check your input and try again.",
        parsing_error: "AI response processing failed. Please try again.",
        service_unavailable: "AI service is temporarily unavailable. Please try again later.",
        unknown_error: "An unexpected error occurred. Please try again."
      };

      const message = errorMessages[serviceError.type] || errorMessages.unknown_error;
      toast.error(message);

      // Auto-retry for certain error types (but limit retries)
      if (serviceError.retryable && retryCount < 1) {
        console.log("Auto-retrying due to retryable error...");
        setTimeout(() => {
          handleGenerateStrategy();
        }, 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryGeneration = async () => {
    if (retryCount >= 2) {
      toast.warning("Try using fewer requirements or simpler language for better results");
    }
    
    // Force a health check before retry
    await checkHealth();
    
    if (serviceHealth && !serviceHealth.healthy) {
      toast.error("AI service is still unavailable. Please wait a moment.");
      return;
    }
    
    handleGenerateStrategy();
  };

  const handleUseFallbackData = async () => {
    const { generateFallbackStrategy } = await import("@/services/strategyService");
    const fallbackStrategy = generateFallbackStrategy("stocks", selectedAsset, strategyDescription);
    
    // Log fallback usage
    await logActivity(
      'generate',
      'Template Strategy Created',
      `Created template strategy for ${selectedAsset}`,
      fallbackStrategy.name
    );
    
    // Navigate to preview page with fallback strategy
    navigate('/strategy-preview', { 
      state: { generatedStrategy: fallbackStrategy }
    });
    
    toast.success("A template strategy has been created based on your asset selection");
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
  const isServiceUnavailable = error?.type === "service_unavailable";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Network Status Indicator */}
      {!isOnline && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <div className="flex items-center">
            <WifiOff className="h-4 w-4 mr-2" />
            <span>No internet connection. Please check your network.</span>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Strategy Generator</h1>
          <p className="text-muted-foreground">
            Select your stock and describe your ideal trading strategy in detail
          </p>
          
          {/* Enhanced Service Status */}
          <div className="flex items-center mt-2 gap-4 flex-wrap">
            {isCheckingHealth ? (
              <div className="flex items-center text-blue-600 text-sm">
                <Activity className="h-3 w-3 mr-1 animate-spin" />
                Checking service status...
              </div>
            ) : serviceHealth?.healthy ? (
              <div className="flex items-center text-green-600 text-sm">
                <Wifi className="h-3 w-3 mr-1" />
                AI service is online and ready
                {serviceHealth.details?.openaiHealthy && (
                  <span className="ml-2 text-xs bg-green-100 px-2 py-1 rounded">OpenAI Connected</span>
                )}
              </div>
            ) : (
              <div className="flex items-center text-red-600 text-sm">
                <WifiOff className="h-3 w-3 mr-1" />
                AI service is offline
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={checkHealth}
                  className="ml-2 h-6 px-2 text-xs"
                >
                  <RefreshCcw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </div>
            )}
            
            {isOnline && (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="h-3 w-3 mr-1" />
                Internet connected
              </div>
            )}

            {lastHealthCheck && (
              <div className="text-xs text-muted-foreground">
                Last checked: {lastHealthCheck.toLocaleTimeString()}
              </div>
            )}
          </div>
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
               isValidationError ? "Input Validation Error" :
               isServiceUnavailable ? "Service Unavailable" : "AI Service Error"}
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRetryGeneration}
                      disabled={isCheckingHealth}
                    >
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
            disabled={isLoading || !strategyDescription || !selectedAsset || !isOnline || isCheckingHealth || (serviceHealth && !serviceHealth.healthy)}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Strategy...
              </>
            ) : "Generate Strategy"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default AIStrategy;

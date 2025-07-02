
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
      toast.success("Internet connection restored");
      checkHealth();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setError(new ServiceError(
        "No internet connection. Please check your network.",
        "connection_error",
        true
      ));
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
      console.log('Checking AI service health...');
      const health = await checkAIServiceHealth();
      setServiceHealth(health);
      setLastHealthCheck(new Date());
      
      if (!health.healthy) {
        setError(new ServiceError(
          "AI service is currently unavailable",
          "service_unavailable",
          true,
          [health.error || "Service health check failed"]
        ));
      } else {
        setError(null);
        toast.success("AI service is online and ready");
      }
    } catch (error) {
      console.error('Health check failed:', error);
      setServiceHealth({ healthy: false, error: "Health check failed" });
      setLastHealthCheck(new Date());
    } finally {
      setIsCheckingHealth(false);
    }
  };

  // Check health on mount and periodically
  useEffect(() => {
    checkHealth();
    
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [isOnline]);

  const handleAssetSelect = (symbol: string) => {
    setSelectedAsset(symbol);
    setError(null);
  };

  const handleStrategyDescriptionChange = (value: string) => {
    setStrategyDescription(value);
    setError(null);
  };

  const handleGenerateStrategy = async () => {
    console.log('=== Strategy generation initiated ===');
    
    if (!isOnline) {
      toast.error("No internet connection. Please check your network and try again.");
      return;
    }

    if (!selectedAsset || !strategyDescription.trim()) {
      toast.error("Please select an asset and provide a strategy description");
      return;
    }

    if (strategyDescription.trim().length < 10) {
      toast.error("Strategy description must be at least 10 characters long");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Generating strategy...', { selectedAsset, retryAttempt: retryCount });
      
      await logActivity(
        'generate',
        'AI Strategy Generation Started',
        `Generating strategy for ${selectedAsset}`
      );
      
      const strategy = await generateStrategy('stocks', selectedAsset, strategyDescription);
      
      console.log('Strategy generated successfully:', strategy.name);
      setRetryCount(0);
      setError(null);

      await logActivity(
        'generate',
        'AI Strategy Generated Successfully',
        `Generated "${strategy.name}" for ${selectedAsset}`,
        strategy.name
      );

      toast.success("AI strategy generated successfully!");
      navigate('/strategy-preview', { state: { generatedStrategy: strategy } });
      
    } catch (serviceError: any) {
      console.error('Strategy generation failed:', serviceError);
      setError(serviceError);
      setRetryCount(prev => prev + 1);

      await logActivity(
        'generate',
        'AI Strategy Generation Failed',
        `Failed to generate strategy for ${selectedAsset}: ${serviceError.message}`
      );

      const errorMessages = {
        connection_error: "Connection failed. Retrying automatically...",
        api_key_error: "AI service configuration issue. Please try the template strategy.",
        timeout_error: "Request timed out. Try simplifying your description.",
        rate_limit_error: "Service is busy. Please wait and try again.",
        validation_error: serviceError.message || "Please check your input.",
        parsing_error: "AI response processing failed. Please try again.",
        service_unavailable: "AI service is temporarily unavailable.",
        unknown_error: "An unexpected error occurred. Please try again."
      };

      const message = errorMessages[serviceError.type] || errorMessages.unknown_error;
      toast.error(message);

      // Auto-retry for connection errors
      if (serviceError.retryable && retryCount < 2 && serviceError.type === 'connection_error') {
        console.log('Auto-retrying due to connection error...');
        setTimeout(() => {
          handleGenerateStrategy();
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryGeneration = async () => {
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
    
    await logActivity(
      'generate',
      'Template Strategy Created',
      `Created template strategy for ${selectedAsset}`,
      fallbackStrategy.name
    );
    
    navigate('/strategy-preview', { state: { generatedStrategy: fallbackStrategy } });
    toast.success("Template strategy created successfully");
  };

  const isAPIKeyError = error?.type === "api_key_error";
  const isConnectionError = error?.type === "connection_error";
  const isServiceUnavailable = error?.type === "service_unavailable";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
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
            Select your stock and describe your ideal trading strategy
          </p>
        </div>

        <AssetTypeSelector selectedAsset={selectedAsset} onAssetSelect={handleAssetSelect} />
        <StrategyDescription description={strategyDescription} onDescriptionChange={handleStrategyDescriptionChange} />

        {error && (
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {isConnectionError ? "Connection Issue" : 
               isAPIKeyError ? "Configuration Error" : 
               isServiceUnavailable ? "Service Unavailable" : "AI Service Error"}
            </AlertTitle>
            <AlertDescription>
              <div className="mt-2">
                <p className="mb-3">{error.message}</p>
                
                {error.details && (
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
                      Retry Generation
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open("https://supabase.com/docs/guides/functions", "_blank")}
                    >
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
      </main>
    </div>
  );
};

export default AIStrategy;

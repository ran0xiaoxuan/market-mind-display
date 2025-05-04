
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { AssetTypeSelector } from "@/components/strategy/AssetTypeSelector";
import { StrategyDescription } from "@/components/strategy/StrategyDescription";
import { useNavigate } from "react-router-dom";
import { generateStrategy, saveGeneratedStrategy, GeneratedStrategy } from "@/services/strategyService";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Loader2, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
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
  const [usingFallback, setUsingFallback] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [connectionChecked, setConnectionChecked] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'success' | 'error' | 'checking' | null>(null);
  const navigate = useNavigate();

  // Check connection to Supabase and verify API key on component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setConnectionStatus('checking');
        // We'll just check if we can make a simple request to Supabase
        const { data, error } = await fetch('/api/health-check', { method: 'HEAD' })
          .then(res => ({ data: res.ok, error: null }))
          .catch(err => ({ data: null, error: err }));
        
        setConnectionChecked(true);
        
        if (error) {
          setConnectionStatus('error');
          console.warn("Network connectivity issue detected:", error);
        } else {
          setConnectionStatus('success');
        }
      } catch (error) {
        console.error("Error checking connection:", error);
        setConnectionChecked(true);
        setConnectionStatus('error');
      }
    };
    
    checkConnection();
  }, []);

  const handleAssetSelect = (symbol: string) => {
    setSelectedAsset(symbol);
    // Clear any previous errors when user makes changes
    setError(null);
  };

  const handleDescriptionChange = (description: string) => {
    setStrategyDescription(description);
    // Clear any previous errors when user makes changes
    setError(null);
  };

  const handleGenerateStrategy = async () => {
    if (!strategyDescription) {
      toast("Strategy description required", {
        description: "Please provide a description of your trading strategy"
      });
      return;
    }

    // Reset state
    setIsLoading(true);
    setError(null);
    setUsingFallback(false);
    
    try {
      // We're now generating strategies for combined assets, so we'll determine the type based on the asset format
      const assetType = selectedAsset.includes('/') ? 'cryptocurrency' : 'stocks';
      console.log(`Generating strategy for ${assetType}: ${selectedAsset}`);
      
      const strategy = await generateStrategy(assetType, selectedAsset, strategyDescription);
      
      setGeneratedStrategy(strategy);
      // Check if this is a fallback strategy based on the description or name
      const isFallback = 
        strategy.description.includes("Fallback") || 
        strategy.description.includes("fallback") ||
        strategy.name.includes("[AI Unavailable]") ||
        strategy.description.includes("AI service currently unavailable");
        
      setUsingFallback(isFallback);
      
      if (isFallback) {
        toast("Strategy generated with fallback", {
          description: "We used our built-in template as the AI service was unavailable"
        });
      } else {
        toast("Strategy generated", {
          description: "AI has successfully generated a trading strategy based on your description"
        });
      }
    } catch (error) {
      console.error("Error generating strategy:", error);
      
      // Set human-readable error message
      let errorMessage = "Please try again with a different description";
      
      if (error.message?.includes("API key") || error.message?.includes("authentication")) {
        errorMessage = "AI service authentication issue. Please contact support.";
      } else if (error.message?.includes("rate limit")) {
        errorMessage = "AI service is currently busy. Please try again in a few minutes.";
      } else if (error.message?.includes("timed out")) {
        errorMessage = "Request timed out. Please try again or use a shorter description.";
      } else if (error.message?.includes("Failed to connect")) {
        errorMessage = "Connection issue. Please check your internet connection and try again.";
      }
      
      setError(errorMessage);
      
      toast("Failed to generate strategy", {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    setRetryCount(prev => prev + 1);
    handleGenerateStrategy();
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
    setUsingFallback(false);
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

            {connectionStatus === 'error' && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Connection issue detected</AlertTitle>
                <AlertDescription>
                  There may be network connectivity issues that could affect AI strategy generation.
                  The system will automatically use a fallback if needed.
                </AlertDescription>
              </Alert>
            )}

            <AssetTypeSelector
              selectedAsset={selectedAsset}
              onAssetSelect={handleAssetSelect}
            />

            <StrategyDescription
              description={strategyDescription}
              onDescriptionChange={handleDescriptionChange}
            />

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Generation failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
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
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                  >
                    Generate Another Strategy
                  </Button>
                  
                  {usingFallback && (
                    <Button
                      variant="secondary"
                      onClick={handleRegenerate}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Retry with AI
                    </Button>
                  )}
                </div>
                
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

            {usingFallback && (
              <Alert className="mb-6 bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertTitle>Using fallback template</AlertTitle>
                <AlertDescription>
                  We're using a template strategy because our AI service is currently unavailable.
                  You can customize this strategy after saving or try again later.
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-amber-700 bg-amber-100 border-amber-300 hover:bg-amber-200"
                      onClick={handleRegenerate}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry AI Generation
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

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

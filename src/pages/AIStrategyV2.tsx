
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, AlertCircle, CheckCircle, Sparkles, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";

// Popular stock symbols for quick selection
const POPULAR_STOCKS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "NFLX", 
  "AMD", "BABA", "V", "MA", "JPM", "JNJ", "WMT", "PG", "UNH", "HD"
];

interface GeneratedStrategy {
  name: string;
  description: string;
  timeframe: string;
  targetAsset: string;
  entryRules: any[];
  exitRules: any[];
  riskManagement: {
    stopLoss: string;
    takeProfit: string;
    singleBuyVolume: string;
    maxBuyVolume: string;
  };
}

const AIStrategyV2 = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Form state
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [customAsset, setCustomAsset] = useState<string>("");
  const [strategyDescription, setStrategyDescription] = useState<string>("");
  
  // UI state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedStrategy, setGeneratedStrategy] = useState<GeneratedStrategy | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<number>(1);

  // Get the actual asset symbol (either selected or custom)
  const getAssetSymbol = () => {
    return selectedAsset === "custom" ? customAsset.toUpperCase() : selectedAsset;
  };

  // Validate form inputs
  const isFormValid = () => {
    const asset = getAssetSymbol();
    return asset.length > 0 && strategyDescription.trim().length >= 20;
  };

  // Generate strategy using edge function
  const handleGenerateStrategy = async () => {
    if (!isFormValid()) {
      toast.error("Please select an asset and provide a detailed strategy description (at least 20 characters)");
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      console.log("Starting strategy generation...");
      
      const asset = getAssetSymbol();
      const requestBody = {
        assetType: "stocks",
        selectedAsset: asset,
        strategyDescription: strategyDescription.trim()
      };

      console.log("Sending request:", requestBody);

      // Call the edge function with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout - please try again')), 45000);
      });

      const requestPromise = supabase.functions.invoke('generate-strategy', {
        body: requestBody,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const { data, error } = await Promise.race([requestPromise, timeoutPromise]) as any;

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to generate strategy");
      }

      if (!data) {
        throw new Error("No strategy data received");
      }

      console.log("Strategy generated successfully:", data);
      setGeneratedStrategy(data);
      setStep(2);
      toast.success("AI strategy generated successfully!");

    } catch (error: any) {
      console.error("Strategy generation failed:", error);
      const errorMessage = error.message || "Failed to generate strategy";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save generated strategy to database
  const handleSaveStrategy = async () => {
    if (!generatedStrategy || !user) {
      toast.error("Please log in to save your strategy");
      return;
    }

    setIsSaving(true);
    
    try {
      // Create the base strategy
      const { data: strategyData, error: strategyError } = await supabase
        .from('strategies')
        .insert({
          name: generatedStrategy.name,
          description: generatedStrategy.description,
          timeframe: generatedStrategy.timeframe,
          target_asset: generatedStrategy.targetAsset,
          stop_loss: generatedStrategy.riskManagement.stopLoss,
          take_profit: generatedStrategy.riskManagement.takeProfit,
          single_buy_volume: generatedStrategy.riskManagement.singleBuyVolume,
          max_buy_volume: generatedStrategy.riskManagement.maxBuyVolume,
          user_id: user.id,
          is_active: false
        })
        .select('*')
        .single();

      if (strategyError) {
        console.error("Error saving strategy:", strategyError);
        throw new Error("Failed to save strategy");
      }

      const strategyId = strategyData.id;
      console.log("Strategy saved with ID:", strategyId);

      toast.success("Strategy saved successfully!");
      navigate(`/strategy/${strategyId}`);

    } catch (error: any) {
      console.error("Error saving strategy:", error);
      toast.error(error.message || "Failed to save strategy");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form and start over
  const handleStartOver = () => {
    setGeneratedStrategy(null);
    setError(null);
    setStep(1);
    setStrategyDescription("");
    setSelectedAsset("");
    setCustomAsset("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-4xl mx-auto p-6">
        {step === 1 && (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Sparkles className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold">AI Strategy Generator</h1>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Describe your trading vision and let AI create a comprehensive strategy with entry/exit rules and risk management
              </p>
            </div>

            {/* Asset Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Select Your Asset</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a stock symbol or select custom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Enter Custom Symbol</SelectItem>
                    {POPULAR_STOCKS.map((stock) => (
                      <SelectItem key={stock} value={stock}>
                        {stock}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedAsset === "custom" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Custom Stock Symbol</label>
                    <input
                      type="text"
                      value={customAsset}
                      onChange={(e) => setCustomAsset(e.target.value)}
                      placeholder="e.g., AAPL, MSFT, TSLA"
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      maxLength={10}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Strategy Description */}
            <Card>
              <CardHeader>
                <CardTitle>Describe Your Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={strategyDescription}
                  onChange={(e) => setStrategyDescription(e.target.value)}
                  placeholder="Describe your ideal trading strategy in detail. For example: 'I want a momentum-based strategy using RSI and MACD indicators, with medium risk tolerance. Focus on short-term trades with a 2:1 profit-loss ratio. Use volume confirmation and trend-following approach.'"
                  className="min-h-[120px]"
                  maxLength={1500}
                />
                <div className="mt-2 text-sm text-muted-foreground">
                  {strategyDescription.length}/1500 characters
                  {strategyDescription.length < 20 && " (minimum 20 characters)"}
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Generate Button */}
            <div className="flex justify-center">
              <Button 
                onClick={handleGenerateStrategy}
                disabled={!isFormValid() || isGenerating}
                size="lg"
                className="px-8 py-3"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Strategy...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate AI Strategy
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && generatedStrategy && (
          <div className="space-y-6">
            {/* Header with actions */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{generatedStrategy.name}</h1>
                <p className="text-muted-foreground">Generated Strategy</p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={handleStartOver}>
                  Generate Another
                </Button>
                <Button onClick={handleSaveStrategy} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Save Strategy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Strategy Details */}
            <div className="grid gap-6">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Strategy Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {generatedStrategy.description}
                  </p>
                </CardContent>
              </Card>

              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Strategy Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Timeframe</span>
                      <p className="font-medium">{generatedStrategy.timeframe}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Target Asset</span>
                      <p className="font-medium">{generatedStrategy.targetAsset}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Stop Loss</span>
                      <p className="font-medium">{generatedStrategy.riskManagement.stopLoss}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Take Profit</span>
                      <p className="font-medium">{generatedStrategy.riskManagement.takeProfit}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Single Buy Volume</span>
                      <p className="font-medium">{generatedStrategy.riskManagement.singleBuyVolume}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Max Buy Volume</span>
                      <p className="font-medium">{generatedStrategy.riskManagement.maxBuyVolume}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trading Rules Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Trading Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Entry Rules</h4>
                      <p className="text-sm text-muted-foreground">
                        {generatedStrategy.entryRules?.length || 0} rule groups defined
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Exit Rules</h4>
                      <p className="text-sm text-muted-foreground">
                        {generatedStrategy.exitRules?.length || 0} rule groups defined
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AIStrategyV2;

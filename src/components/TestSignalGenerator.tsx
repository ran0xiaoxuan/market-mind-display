
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Crown } from "lucide-react";
import { generateTestSignal, getTestStrategies, TestSignalData } from "@/services/testSignalService";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { useQuery } from "@tanstack/react-query";

export function TestSignalGenerator() {
  const { tier: subscriptionTier, isLoading: subscriptionLoading } = useUserSubscription();
  const isPro = subscriptionTier === 'pro' || subscriptionTier === 'premium';
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("");
  const [signalType, setSignalType] = useState<'entry' | 'exit'>('entry');
  const [price, setPrice] = useState<string>("100");

  const {
    data: strategies = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['test-strategies'],
    queryFn: getTestStrategies,
    retry: 1,
    enabled: isPro // Only fetch strategies if user is Pro
  });

  const handleGenerateSignal = async () => {
    if (!isPro) {
      toast.error("This feature is only available for Pro users");
      return;
    }

    if (!selectedStrategy) {
      toast.error("Please select a strategy");
      return;
    }

    const strategy = strategies.find(s => s.id === selectedStrategy);
    if (!strategy) {
      toast.error("Strategy not found");
      return;
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setIsGenerating(true);
    try {
      console.log('Starting test signal generation...');
      const testData: TestSignalData = {
        strategyId: strategy.id,
        strategyName: strategy.name,
        targetAsset: strategy.target_asset || 'AAPL',
        price: priceValue,
        signalType: signalType,
        ...(signalType === 'exit' && {
          profitPercentage: Math.random() * 10 - 5
        }) // Random P&L for exit signals
      };

      console.log('Test data prepared:', testData);
      const result = await generateTestSignal(testData);
      console.log('Test signal generated successfully:', result);

      toast.success(
        `Test ${signalType} signal generated successfully! ` +
        `Check your Discord/Telegram/Email for the notification.`,
        {
          duration: 5000
        }
      );
    } catch (error) {
      console.error('Error generating test signal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to generate test signal: ${errorMessage}`, {
        duration: 5000
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Loading state
  if (subscriptionLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Test Signal Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  // Free user experience
  if (!isPro) {
    return (
      <Card className="w-full border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Test Signal Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-amber-900 mb-2">Pro Feature</h3>
              <p className="text-amber-700 text-sm">
                Upgrade to Pro to test your notification setup and ensure your Discord, Telegram, and Email integrations are working correctly.
              </p>
            </div>

            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
              <Crown className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error handling for Pro users
  if (error) {
    console.error('Error loading strategies:', error);
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Test Signal Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">
            Error loading strategies. Please refresh the page and try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Loading strategies for Pro users
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Test Signal Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading strategies...</p>
        </CardContent>
      </Card>
    );
  }

  // No strategies available for Pro users
  if (strategies.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Test Signal Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No active strategies found. Please create a strategy first to test notifications.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Pro user experience with strategies
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          Test Signal Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="strategy">Strategy</Label>
          <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
            <SelectTrigger>
              <SelectValue placeholder="Select a strategy" />
            </SelectTrigger>
            <SelectContent>
              {strategies.map(strategy => (
                <SelectItem key={strategy.id} value={strategy.id}>
                  {strategy.name} ({strategy.target_asset_name || strategy.target_asset})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="signalType">Signal Type</Label>
          <Select value={signalType} onValueChange={(value: 'entry' | 'exit') => setSignalType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entry">Entry Signal</SelectItem>
              <SelectItem value="exit">Exit Signal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="price">Price ($)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0.01"
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="100.00"
          />
        </div>

        <Button
          onClick={handleGenerateSignal}
          disabled={isGenerating || !selectedStrategy}
          className="w-full"
        >
          {isGenerating ? "Generating..." : "Generate Test Signal"}
        </Button>

        <p className="text-sm text-muted-foreground">
          This will create a test trading signal and send notifications to your verified Discord/Telegram channels and email.
        </p>
      </CardContent>
    </Card>
  );
}

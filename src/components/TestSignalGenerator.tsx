
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { generateTestSignal, getTestStrategies, TestSignalData } from "@/services/testSignalService";
import { useDailyTestSignalUsage } from "@/hooks/useDailyTestSignalUsage";
import { TestSignalQuota } from "@/components/TestSignalQuota";
import { useQuery } from "@tanstack/react-query";

export function TestSignalGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("");
  const [signalType, setSignalType] = useState<'entry' | 'exit'>('entry');
  const [price, setPrice] = useState<string>("100");

  const { usage, refreshUsage } = useDailyTestSignalUsage();

  const {
    data: strategies = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['test-strategies'],
    queryFn: getTestStrategies,
    retry: 1
  });

  const handleGenerateSignal = async () => {
    if (!selectedStrategy) {
      toast.error("Please select a strategy");
      return;
    }

    if (usage.isLimitReached) {
      toast.error(`Daily test signal limit reached. You have used ${usage.count}/${usage.limit} test signals today. Please try again tomorrow.`);
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

      // Refresh usage after successful generation
      refreshUsage();

      toast.success(
        `Test ${signalType} signal generated successfully! ` +
        `Notifications sent to your configured channels. ${usage.remaining - 1} test signals remaining today.`,
        {
          duration: 6000
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

  if (error) {
    console.error('Error loading strategies:', error);
    return (
      <div className="space-y-4">
        <TestSignalQuota />
        <Card className="w-full">
          <CardHeader>
            <CardTitle>🧪 Test Signal Generator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">
              Error loading strategies. Please refresh the page and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <TestSignalQuota />
        <Card className="w-full">
          <CardHeader>
            <CardTitle>🧪 Test Signal Generator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Loading strategies...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (strategies.length === 0) {
    return (
      <div className="space-y-4">
        <TestSignalQuota />
        <Card className="w-full">
          <CardHeader>
            <CardTitle>🧪 Test Signal Generator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No active strategies found. Please create a strategy first to test notifications.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TestSignalQuota />
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Test Signal Generator</CardTitle>
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
            disabled={isGenerating || !selectedStrategy || usage.isLimitReached}
            className="w-full"
          >
            {isGenerating ? "Generating..." : usage.isLimitReached ? "Daily Limit Reached" : "Generate Test Signal"}
          </Button>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Test signals are used only for testing notifications and are stored separately from your real trading history. 
              You can generate up to 20 test signals per day. They will not appear in your strategy's trade history or affect your performance metrics.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

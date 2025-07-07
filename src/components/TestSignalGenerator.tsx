
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { generateTestSignal, getTestStrategies, TestSignalData } from "@/services/testSignalService";
import { useQuery } from "@tanstack/react-query";

export function TestSignalGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("");
  const [signalType, setSignalType] = useState<'entry' | 'exit'>('entry');
  const [price, setPrice] = useState<string>("100");

  const { data: strategies = [], isLoading } = useQuery({
    queryKey: ['test-strategies'],
    queryFn: getTestStrategies
  });

  const handleGenerateSignal = async () => {
    if (!selectedStrategy) {
      toast.error("Please select a strategy");
      return;
    }

    const strategy = strategies.find(s => s.id === selectedStrategy);
    if (!strategy) {
      toast.error("Strategy not found");
      return;
    }

    setIsGenerating(true);
    try {
      const testData: TestSignalData = {
        strategyId: strategy.id,
        strategyName: strategy.name,
        targetAsset: strategy.target_asset || 'AAPL',
        price: parseFloat(price) || 100,
        signalType: signalType,
        ...(signalType === 'exit' && { profitPercentage: Math.random() * 10 - 5 }) // Random P&L for exit signals
      };

      const signal = await generateTestSignal(testData);
      toast.success(`Test ${signalType} signal generated successfully! Check your Discord/Telegram for the notification.`);
      console.log('Generated signal:', signal);
    } catch (error) {
      console.error('Error generating test signal:', error);
      toast.error("Failed to generate test signal: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return <div>Loading strategies...</div>;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>🧪 Test Signal Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="strategy">Strategy</Label>
          <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
            <SelectTrigger>
              <SelectValue placeholder="Select a strategy" />
            </SelectTrigger>
            <SelectContent>
              {strategies.map((strategy) => (
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
            value={price}
            onChange={(e) => setPrice(e.target.value)}
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
          This will create a test trading signal and send notifications to your verified Discord/Telegram channels.
        </p>
      </CardContent>
    </Card>
  );
}


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { generateTradingSignal } from "@/services/signalGenerationService";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Send, TestTube } from "lucide-react";

export function TestNotifications() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [signalType, setSignalType] = useState<'entry' | 'exit' | 'stop_loss' | 'take_profit'>('entry');
  const [asset, setAsset] = useState('AAPL');
  const [price, setPrice] = useState('150.00');

  const handleTestSignal = async () => {
    if (!user) {
      toast.error("Please log in to test notifications");
      return;
    }

    setIsLoading(true);
    try {
      // For testing, we'll use a dummy strategy ID
      // In a real app, this would come from the user's actual strategies
      const dummyStrategyId = 'test-strategy-' + Date.now();
      
      await generateTradingSignal(dummyStrategyId, signalType, {
        strategyId: dummyStrategyId,
        strategyName: 'Test Strategy',
        asset: asset,
        price: parseFloat(price),
        userId: user.id,
        timestamp: new Date().toISOString(),
        conditions: ['Test condition triggered'],
        confidence: 0.85
      });

      toast.success(`${signalType.replace('_', ' ')} signal sent successfully!`);
    } catch (error) {
      console.error('Error sending test signal:', error);
      toast.error("Failed to send test signal");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Bell className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Please log in to test notifications</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Test Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Signal Type</label>
            <Select value={signalType} onValueChange={(value: any) => setSignalType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entry">Entry Signal</SelectItem>
                <SelectItem value="exit">Exit Signal</SelectItem>
                <SelectItem value="stop_loss">Stop Loss</SelectItem>
                <SelectItem value="take_profit">Take Profit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Asset</label>
            <Input
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              placeholder="e.g., AAPL, TSLA"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Price</label>
            <Input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="150.00"
              type="number"
              step="0.01"
            />
          </div>
        </div>
        
        <Button 
          onClick={handleTestSignal} 
          disabled={isLoading}
          className="w-full"
        >
          <Send className="mr-2 h-4 w-4" />
          {isLoading ? "Sending Test Signal..." : "Send Test Signal"}
        </Button>
        
        <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
          <p>This will send a test notification to all your enabled notification channels based on your current settings.</p>
        </div>
      </CardContent>
    </Card>
  );
}

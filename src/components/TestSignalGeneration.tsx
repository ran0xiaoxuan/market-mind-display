
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { testSignalGeneration, triggerSignalMonitoring } from '@/services/signalGenerationService';
import { toast } from 'sonner';

export const TestSignalGeneration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleTestSignalGeneration = async (strategyId: string) => {
    setIsLoading(true);
    try {
      const result = await testSignalGeneration(strategyId);
      setResults(result);
      
      if (result.signalGenerated) {
        toast.success('Signal generated successfully!');
      } else {
        toast.warning(`No signal generated: ${result.reason}`);
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerMonitoring = async () => {
    setIsLoading(true);
    try {
      const result = await triggerSignalMonitoring();
      setResults(result);
      
      if (result.success) {
        toast.success('Signal monitoring triggered successfully!');
      } else {
        toast.error(`Monitoring failed: ${result.error}`);
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Test Signal Generation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button 
            onClick={() => handleTestSignalGeneration('YOUR_STRATEGY_ID')}
            disabled={isLoading}
            className="w-full"
          >
            Test AMD Strategy Signal Generation
          </Button>
          
          <Button 
            onClick={() => handleTestSignalGeneration('YOUR_OTHER_STRATEGY_ID')}
            disabled={isLoading}
            className="w-full"
          >
            Test TQQQ Strategy Signal Generation
          </Button>
          
          <Button 
            onClick={handleTriggerMonitoring}
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            Trigger All Strategy Monitoring
          </Button>
        </div>

        {results && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

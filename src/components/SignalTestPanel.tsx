
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TestResult {
  message: string;
  processedStrategies: number;
  signalsGenerated: number;
  results: Array<{
    strategyId: string;
    strategyName: string;
    status: string;
    reason: string;
    signalType?: string;
    evaluationDetails?: string[];
  }>;
}

export const SignalTestPanel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const handleTestSignalGeneration = async () => {
    setIsLoading(true);
    try {
      console.log('Testing signal generation...');
      
      const { data, error } = await supabase.functions.invoke('monitor-trading-signals', {
        body: { manual: true }
      });
      
      if (error) {
        console.error('Error testing signal generation:', error);
        toast.error(`Error: ${error.message}`);
        return;
      }
      
      console.log('Signal generation test result:', data);
      setTestResult(data);
      
      if (data.signalsGenerated > 0) {
        toast.success(`Successfully generated ${data.signalsGenerated} signals!`);
      } else {
        toast.info('No signals generated - conditions not met');
      }
    } catch (error) {
      console.error('Error testing signal generation:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Signal Generation Test Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleTestSignalGeneration}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Testing Signal Generation...' : 'Test Signal Generation'}
        </Button>

        {testResult && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            <p className="text-sm mb-2">
              <strong>Message:</strong> {testResult.message}
            </p>
            <p className="text-sm mb-2">
              <strong>Processed Strategies:</strong> {testResult.processedStrategies}
            </p>
            <p className="text-sm mb-4">
              <strong>Signals Generated:</strong> {testResult.signalsGenerated}
            </p>
            
            <div className="space-y-2">
              <h4 className="font-medium">Strategy Results:</h4>
              {testResult.results.map((result, index) => (
                <div key={index} className="p-3 bg-white rounded border">
                  <p className="text-sm"><strong>Strategy:</strong> {result.strategyName}</p>
                  <p className="text-sm"><strong>Status:</strong> {result.status}</p>
                  <p className="text-sm"><strong>Reason:</strong> {result.reason}</p>
                  {result.signalType && (
                    <p className="text-sm"><strong>Signal Type:</strong> {result.signalType}</p>
                  )}
                  {result.evaluationDetails && result.evaluationDetails.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Evaluation Details:</p>
                      <ul className="text-xs ml-4 list-disc">
                        {result.evaluationDetails.map((detail, idx) => (
                          <li key={idx}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

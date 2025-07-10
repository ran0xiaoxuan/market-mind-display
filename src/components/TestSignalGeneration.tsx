
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { testSignalGeneration, triggerSignalMonitoring, refreshDashboardData } from '@/services/signalGenerationService';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';

export const TestSignalGeneration = () => {
  const { id: strategyId } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleTestSignalGeneration = async () => {
    if (!strategyId) {
      toast.error('No strategy ID found');
      return;
    }

    setIsLoading(true);
    try {
      console.log(`[TestComponent] Testing signal generation for strategy: ${strategyId}`);
      const result = await testSignalGeneration(strategyId);
      setResults(result);
      
      if (result.signalGenerated) {
        toast.success('Signal generated and stored successfully!', {
          description: `Signal ID: ${result.signalId}`
        });
        
        // Refresh dashboard data to show new signal
        setTimeout(() => {
          refreshDashboardData();
        }, 1000);
      } else {
        toast.warning(`No signal generated: ${result.reason}`);
      }
    } catch (error) {
      console.error('[TestComponent] Error:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerMonitoring = async () => {
    setIsLoading(true);
    try {
      console.log('[TestComponent] Triggering signal monitoring for all strategies');
      const result = await triggerSignalMonitoring();
      setResults(result);
      
      if (result.success) {
        const signalsGenerated = result.data?.signalsGenerated || 0;
        toast.success(`Signal monitoring completed successfully!`, {
          description: `Generated ${signalsGenerated} new signals`
        });
        
        // Refresh dashboard data to show new signals
        if (signalsGenerated > 0) {
          setTimeout(() => {
            refreshDashboardData();
          }, 1000);
        }
      } else {
        toast.error(`Monitoring failed: ${result.error}`);
      }
    } catch (error) {
      console.error('[TestComponent] Error:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshDashboard = async () => {
    setIsLoading(true);
    try {
      console.log('[TestComponent] Refreshing dashboard data');
      await refreshDashboardData();
      toast.success('Dashboard data refreshed');
    } catch (error) {
      console.error('[TestComponent] Error:', error);
      toast.error(`Error refreshing: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Test Signal Generation & Database Storage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button 
            onClick={handleTestSignalGeneration}
            disabled={isLoading || !strategyId}
            className="w-full"
          >
            {isLoading ? 'Testing...' : 'Test This Strategy Signal Generation'}
          </Button>
          
          <Button 
            onClick={handleTriggerMonitoring}
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            {isLoading ? 'Processing...' : 'Trigger All Strategy Monitoring'}
          </Button>

          <Button 
            onClick={handleRefreshDashboard}
            disabled={isLoading}
            className="w-full"
            variant="secondary"
          >
            {isLoading ? 'Refreshing...' : 'Refresh Dashboard Data'}
          </Button>
        </div>

        {results && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            <div className="space-y-2">
              <div>
                <strong>Signal Generated:</strong> {results.signalGenerated ? '✅ Yes' : '❌ No'}
              </div>
              {results.signalId && (
                <div>
                  <strong>Signal ID:</strong> {results.signalId}
                </div>
              )}
              <div>
                <strong>Reason:</strong> {results.reason}
              </div>
              {results.matchedConditions && results.matchedConditions.length > 0 && (
                <div>
                  <strong>Matched Conditions:</strong> {results.matchedConditions.length}
                </div>
              )}
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer font-medium">Full Details</summary>
              <pre className="text-sm overflow-auto whitespace-pre-wrap mt-2 bg-white p-2 rounded border">
                {JSON.stringify(results, null, 2)}
              </pre>
            </details>
          </div>
        )}

        <div className="text-sm text-gray-600 mt-4 p-3 bg-blue-50 rounded">
          <strong>Usage:</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Use "Test This Strategy" to generate a signal for this specific strategy</li>
            <li>Use "Trigger All Strategy Monitoring" to check all active strategies</li>
            <li>Use "Refresh Dashboard Data" to update the dashboard display</li>
            <li>Generated signals should appear in both Strategy Details and Dashboard Trade History</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

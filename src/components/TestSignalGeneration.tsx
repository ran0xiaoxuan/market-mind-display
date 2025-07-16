
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateSignalForStrategy } from "@/services/optimizedSignalGenerationService";
import { fetchMarketDataWithCache } from "@/services/optimizedMarketDataService";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, PlayCircle, CheckCircle, XCircle } from "lucide-react";

interface TestResult {
  signalGenerated: boolean;
  signalId?: string;
  reason?: string;
  matchedConditions?: string[];
  evaluationDetails?: string[];
  processingTime: number;
  cacheHits?: number;
  testProcessingTime?: number;
}

export function TestSignalGeneration() {
  const [isTestingSignal, setIsTestingSignal] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const { data: strategies = [] } = useQuery({
    queryKey: ['test-strategies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('strategies')
        .select(`
          id,
          name,
          target_asset,
          timeframe,
          user_id,
          is_active,
          signal_notifications_enabled,
          rule_groups (
            id,
            rule_type,
            logic,
            required_conditions,
            trading_rules (
              id,
              left_type,
              left_indicator,
              left_parameters,
              left_value,
              condition,
              right_type,
              right_indicator,
              right_parameters,
              right_value
            )
          )
        `)
        .eq('is_active', true)
        .limit(1);

      if (error) throw error;
      return data || [];
    }
  });

  const testSignalGeneration = async () => {
    if (strategies.length === 0) return;

    setIsTestingSignal(true);
    setTestResult(null);

    try {
      const strategy = strategies[0];
      
      // Fetch market data
      const marketData = await fetchMarketDataWithCache(
        strategy.target_asset,
        strategy.timeframe,
        60 // 1 minute cache for testing
      );

      if (!marketData) {
        setTestResult({
          signalGenerated: false,
          reason: "Failed to fetch market data",
          processingTime: 0
        });
        return;
      }

      // Generate test signal
      const result = await generateSignalForStrategy(strategy, marketData, true);
      setTestResult(result);

    } catch (error) {
      console.error('Test signal generation error:', error);
      setTestResult({
        signalGenerated: false,
        reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        processingTime: 0
      });
    } finally {
      setIsTestingSignal(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5" />
          Test Signal Generation
        </CardTitle>
        <CardDescription>
          Test the optimized signal generation system with real market data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Available strategies: {strategies.length}
            </p>
            {strategies.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Testing with: {strategies[0].name} ({strategies[0].target_asset})
              </p>
            )}
          </div>
          <Button
            onClick={testSignalGeneration}
            disabled={isTestingSignal || strategies.length === 0}
            variant="outline"
          >
            {isTestingSignal ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Test Signal
              </>
            )}
          </Button>
        </div>

        {testResult && (
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              {testResult.signalGenerated ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <Badge variant={testResult.signalGenerated ? "default" : "destructive"}>
                {testResult.signalGenerated ? "Signal Generated" : "No Signal"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Processing Time:</span>
                <p className="text-muted-foreground">{testResult.processingTime}ms</p>
              </div>
              {testResult.signalId && (
                <div>
                  <span className="font-medium">Signal ID:</span>
                  <p className="text-muted-foreground font-mono text-xs">{testResult.signalId}</p>
                </div>
              )}
            </div>

            {testResult.reason && (
              <div>
                <span className="font-medium text-sm">Reason:</span>
                <p className="text-muted-foreground text-sm">{testResult.reason}</p>
              </div>
            )}

            {testResult.matchedConditions && testResult.matchedConditions.length > 0 && (
              <div>
                <span className="font-medium text-sm">Matched Conditions:</span>
                <ul className="text-muted-foreground text-sm list-disc list-inside">
                  {testResult.matchedConditions.map((condition, index) => (
                    <li key={index}>{condition}</li>
                  ))}
                </ul>
              </div>
            )}

            {testResult.cacheHits !== undefined && (
              <div>
                <span className="font-medium text-sm">Cache Hits:</span>
                <p className="text-muted-foreground text-sm">{testResult.cacheHits}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

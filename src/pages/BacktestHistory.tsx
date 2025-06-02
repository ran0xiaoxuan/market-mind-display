
import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play } from "lucide-react";
import { BacktestCard } from "@/components/backtest/BacktestCard";
import { BacktestData } from "@/types/backtest";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

const BacktestHistory = () => {
  const { strategyId } = useParams<{ strategyId: string }>();
  const [searchParams] = useSearchParams();
  const strategyIdFromQuery = searchParams.get('strategyId');
  const finalStrategyId = strategyId || strategyIdFromQuery;
  
  const [backtests, setBacktests] = useState<BacktestData[]>([]);
  const [strategyName, setStrategyName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openBacktests, setOpenBacktests] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchBacktestHistory = async () => {
      if (!finalStrategyId) {
        setError("Strategy ID is missing");
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching backtest history for strategy:", finalStrategyId);
        
        // First, get the strategy name
        const { data: strategy, error: strategyError } = await supabase
          .from('strategies')
          .select('name')
          .eq('id', finalStrategyId)
          .single();

        if (strategyError) {
          console.error("Error fetching strategy:", strategyError);
          setError("Strategy not found");
          setLoading(false);
          return;
        }

        setStrategyName(strategy.name || "Unknown Strategy");

        // Fetch backtests for this strategy
        const { data: backtestData, error: backtestError } = await supabase
          .from('backtests')
          .select('*')
          .eq('strategy_id', finalStrategyId)
          .order('created_at', { ascending: false });

        if (backtestError) {
          console.error("Error fetching backtests:", backtestError);
          setError("Failed to load backtest history");
          setLoading(false);
          return;
        }

        if (!backtestData || backtestData.length === 0) {
          console.log("No backtests found for strategy:", finalStrategyId);
          setBacktests([]);
          setLoading(false);
          return;
        }

        // Transform the data to match BacktestData interface
        const transformedBacktests: BacktestData[] = backtestData.map((backtest, index) => ({
          id: index + 1,
          version: `v${index + 1}`,
          date: new Date(backtest.created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          time: new Date(backtest.created_at).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          }),
          isLatest: index === 0,
          metrics: {
            totalReturn: `${backtest.total_return_percentage >= 0 ? '+' : ''}${backtest.total_return_percentage?.toFixed(2) || '0.00'}%`,
            totalReturnValue: backtest.total_return_percentage || 0,
            sharpeRatio: backtest.sharpe_ratio || 0,
            winRate: `${backtest.win_rate?.toFixed(0) || '0'}%`,
            maxDrawdown: `${backtest.max_drawdown >= 0 ? '+' : '-'}${Math.abs(backtest.max_drawdown || 0).toFixed(2)}%`,
            maxDrawdownValue: backtest.max_drawdown || 0,
            trades: backtest.total_trades || 0
          },
          parameters: {
            "Initial Capital": backtest.initial_capital || 10000,
            "Start Date": new Date(backtest.start_date).toLocaleDateString(),
            "End Date": new Date(backtest.end_date).toLocaleDateString(),
            "Single Buy Volume": "1000", // These would come from strategy settings
            "Max Buy Volume": "5000"
          },
          entryRules: [], // These would be fetched separately if needed
          exitRules: []   // These would be fetched separately if needed
        }));

        setBacktests(transformedBacktests);
        console.log("Backtest history loaded:", transformedBacktests.length, "backtests");

      } catch (err: any) {
        console.error("Error in fetchBacktestHistory:", err);
        setError(err.message || "Failed to load backtest history");
        toast.error("Failed to load backtest history");
      } finally {
        setLoading(false);
      }
    };

    fetchBacktestHistory();
  }, [finalStrategyId]);

  const toggleBacktestDetails = (backtestId: number) => {
    setOpenBacktests(prev => ({
      ...prev,
      [backtestId]: !prev[backtestId]
    }));
  };

  if (!finalStrategyId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <Alert variant="destructive" className="my-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Missing Strategy ID</AlertTitle>
              <AlertDescription>
                Please select a strategy to view its backtest history.
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <Skeleton className="h-4 w-16 mb-4" />
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <Skeleton className="h-8 w-64 mb-2" />
                  <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-10 w-40" />
              </div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <Alert variant="destructive" className="my-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link to={`/strategy/${finalStrategyId}`} className="text-sm flex items-center mb-4 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">Backtest History</h1>
                <p className="text-muted-foreground">View and compare backtest results for {strategyName}</p>
              </div>
              
              <Link to={`/backtest?strategyId=${finalStrategyId}`}>
                <Button>
                  <Play className="h-4 w-4 mr-2" />
                  Run New Backtest
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="space-y-4">
            {backtests.length > 0 ? (
              backtests.map(backtest => (
                <BacktestCard
                  key={backtest.id}
                  backtest={backtest}
                  isOpen={!!openBacktests[backtest.id]}
                  onToggle={toggleBacktestDetails}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No Backtest History</h3>
                <p className="text-muted-foreground mb-4">
                  This strategy hasn't been backtested yet.
                </p>
                <Link to={`/backtest?strategyId=${finalStrategyId}`}>
                  <Button>
                    <Play className="h-4 w-4 mr-2" />
                    Run Your First Backtest
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BacktestHistory;

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { StrategyHeader } from '@/components/strategy-detail/StrategyHeader';
import { TradingRules } from '@/components/strategy-detail/TradingRules';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getTradingRulesForStrategy } from '@/services/strategyService';
import { copyRecommendationToMyStrategies } from '@/services/recommendationService';
import { StrategyInfo } from '@/components/strategy-detail/StrategyInfo';
import { getRecommendationDetail } from '@/services/recommendationService';
import { useQueryClient } from '@tanstack/react-query';
import { useUserSubscription, isPro } from '@/hooks/useUserSubscription';
import { Button } from '@/components/ui/button';
import { useOptimizedStrategies } from '@/hooks/useOptimizedStrategies';

export default function RecommendationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rec, setRec] = useState<any>(null);
  const [entryRules, setEntryRules] = useState<any[]>([]);
  const [exitRules, setExitRules] = useState<any[]>([]);
  const [isCopying, setIsCopying] = useState(false);
  const [strategyInfo, setStrategyInfo] = useState<any>(null);
  const queryClient = useQueryClient();
  const { tier, isLoading: subscriptionLoading } = useUserSubscription();
  const userIsPro = isPro(tier);
  const { data: strategies = [], isLoading: strategiesLoading } = useOptimizedStrategies();
  const currentStrategyCount = strategies.length;
  const shouldShowUpgradePrompt = !userIsPro && !subscriptionLoading && !strategiesLoading && currentStrategyCount >= 1;

  const handleUpgrade = async (plan: 'monthly' | 'yearly') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Please log in again");
        return;
      }
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'x-site-url': window.location.origin,
        },
        body: { plan }
      });
      if (error) {
        const contextBody = (error as any)?.context?.body;
        try {
          const parsed = typeof contextBody === 'string' ? JSON.parse(contextBody) : contextBody;
          if (parsed?.error) {
            throw new Error(parsed.error);
          }
        } catch (_) {}
        throw error as any;
      }
      if (data?.url) {
        window.location.href = data.url as string;
      } else {
        toast.error("Failed to start checkout");
      }
    } catch (err: any) {
      console.error('Upgrade error:', err);
      toast.error(err?.message || "Failed to start checkout");
    }
  };

  const fetchDetail = async () => {
    if (!id || id === 'undefined') {
      setError('Invalid recommendation id');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getRecommendationDetail(id);
      setRec(data.recommendation);
      setStrategyInfo(data.strategy);
      setEntryRules(data.entryRules);
      setExitRules(data.exitRules);
    } catch (fnErr: any) {
      console.error('[RecommendationDetail] Edge function failed, falling back:', fnErr);
      try {
        // Fallback: load recommendation row directly
                  const { data: recRow, error: recErr } = await supabase
          .from('recommendations')
          .select('*')
          .eq('id', id as any)
          .single();
        if (recErr) throw recErr;
        setRec(recRow);

        // Build minimal StrategyInfo from recommendation snapshot
        const row: any = recRow as any;
        setStrategyInfo({
          id: row.original_strategy_id,
          description: row.description,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          timeframe: row.timeframe,
          targetAsset: row.target_asset,
          dailySignalLimit: undefined,
          signalNotificationsEnabled: undefined,
        });

        // Attempt to load rules; may be blocked by RLS
        try {
          const rules = await getTradingRulesForStrategy(row.original_strategy_id);
          setEntryRules(rules.entryRules);
          setExitRules(rules.exitRules);
        } catch (rulesErr) {
          console.warn('[RecommendationDetail] Failed to load rules via fallback:', rulesErr);
          setEntryRules([]);
          setExitRules([]);
        }
        toast.warning('Showing limited details due to server unavailability.');
      } catch (fallbackErr: any) {
        console.error('[RecommendationDetail] Fallback also failed:', fallbackErr);
        setError(fallbackErr.message || 'Failed to load recommendation');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [id]);

  const handleCopy = async () => {
    if (!id) return;
    try {
      // Free-tier gating: max 1 strategy
      if (shouldShowUpgradePrompt) {
        toast.error('Free plan allows up to 1 strategy. Upgrade to copy more.');
        return;
      }

      setIsCopying(true);
      await copyRecommendationToMyStrategies(id);
      toast.success('Copied to My Strategies');
      // Invalidate strategies cache before navigating
      queryClient.invalidateQueries({ queryKey: ['strategies', 'optimized'] });
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      navigate('/strategies');
    } catch (e: any) {
      toast.error('Copy failed', { description: e.message });
    } finally {
      setIsCopying(false);
    }
  };

  if (!id || id === 'undefined') {
    return (
      <>
        <Navbar />
        <Container>
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Invalid ID</AlertTitle>
            <AlertDescription>Please check the URL and try again.</AlertDescription>
          </Alert>
        </Container>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <Container>
          <div className="my-4 space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </Container>
      </>
    );
  }

  if (error || !rec) {
    return (
      <>
        <Navbar />
        <Container>
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || 'Failed to load recommendation'}</AlertDescription>
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container>
        {shouldShowUpgradePrompt && (
          <Alert className="my-4 border-amber-200 bg-amber-50">
            <AlertTitle className="text-amber-800 dark:text-amber-800">Strategy Limit Reached</AlertTitle>
            <AlertDescription>
              <p className="text-amber-800">Free plan allows up to 1 strategy. Upgrade to copy more strategies.</p>
              <div className="mt-3 flex flex-col sm:flex-row gap-3">
                <Button onClick={() => handleUpgrade('yearly')} size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-6 py-3" aria-label="Upgrade to Pro Yearly">
                  Upgrade to Pro — Yearly
                </Button>
                <Button onClick={() => handleUpgrade('monthly')} size="lg" variant="outline" className="bg-white border-amber-500 text-amber-700 hover:bg-amber-50 hover:text-amber-500 px-6 py-3" aria-label="Upgrade to Pro Monthly">
                  Upgrade to Pro — Monthly
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="my-6 space-y-8">
          <StrategyHeader
            strategyId={rec?.original_strategy_id}
            strategyName={rec?.name}
            hideEditButton
            hideDeleteButton
            customActionLabel={isCopying ? 'Copying...' : 'Copy to My Strategies'}
            customActionDisabled={isCopying}
            onCustomAction={handleCopy}
          />

          {strategyInfo && (
            <StrategyInfo
              strategy={strategyInfo}
              hideProBanner
            />
          )}

          <TradingRules entryRules={entryRules} exitRules={exitRules} />
        </div>
      </Container>
    </>
  );
} 
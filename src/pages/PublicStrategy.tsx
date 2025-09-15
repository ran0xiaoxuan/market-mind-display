import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Palette } from 'lucide-react';
import { StrategyHeader } from '@/components/strategy-detail/StrategyHeader';
import { TradingRules } from '@/components/strategy-detail/TradingRules';
import { StrategyInfo } from '@/components/strategy-detail/StrategyInfo';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast } from 'sonner';

const PublicHeader = () => (
  <header className="p-4 border-b">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-between items-center">
      <Logo />
      <div className="flex items-center gap-3">
        <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 dark:!bg-white dark:!text-black dark:hover:!bg-white dark:hover:!text-black">
          <Link to="/login">Log In</Link>
        </Button>
        <Link to="/signup" className="inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
          Sign Up
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Palette className="h-5 w-5" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <ThemeToggle />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </header>
);

export default function PublicStrategy() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rec, setRec] = useState<any>(null);
  const [entryRules, setEntryRules] = useState<any[]>([]);
  const [exitRules, setExitRules] = useState<any[]>([]);
  const [strategyInfo, setStrategyInfo] = useState<any>(null);

  const copyLink = async () => {
    const text = window.location.href;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard');
    } catch (_) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        toast.success('Link copied to clipboard');
      } catch (err) {
        toast.error('Failed to copy link');
      }
    }
  };

  useEffect(() => {
    const fetchPublic = async () => {
      if (!id || id === 'undefined') {
        setError('Invalid strategy id');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke('public-strategy-detail', {
          body: { strategyId: id }
        });
        if (error) throw error as any;
        setRec(data.recommendation);
        setStrategyInfo(data.strategy);
        setEntryRules(data.entryRules);
        setExitRules(data.exitRules);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    fetchPublic();
  }, [id]);

  if (!id || id === 'undefined') {
    return (
      <>
        <PublicHeader />
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
        <PublicHeader />
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

  if (error || !strategyInfo) {
    return (
      <>
        <PublicHeader />
        <Container>
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || 'Failed to load strategy'}</AlertDescription>
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <PublicHeader />
      <Container>
        <div className="my-6 space-y-8">
          <StrategyHeader
            strategyId={strategyInfo?.id}
            strategyName={rec?.name || 'Strategy'}
            hideEditButton
            hideDeleteButton
          />

          <StrategyInfo strategy={strategyInfo} hideProBanner />

          <TradingRules entryRules={entryRules} exitRules={exitRules} />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyLink}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              Copy Link
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
} 
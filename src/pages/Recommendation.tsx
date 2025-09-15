import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getRecommendations, copyRecommendationToMyStrategies, RecommendationItem } from '@/services/recommendationService';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

export default function Recommendation() {
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fetchList = async () => {
    try {
      setLoading(true);
      const data = await getRecommendations();
      setItems(data);
    } catch (e: any) {
      toast.error('Failed to load recommendations', { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const handleCopy = async (id: string) => {
    try {
      setCopyingId(id);
      const res = await copyRecommendationToMyStrategies(id);
      toast.success('Copied to My Strategies');
      // Invalidate strategies cache so next page shows fresh data
      queryClient.invalidateQueries({ queryKey: ['strategies', 'optimized'] });
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      navigate('/strategies');
    } catch (e: any) {
      toast.error('Copy failed', { description: e.message });
    } finally {
      setCopyingId(null);
    }
  };

  return (
    <>
      <Navbar />
      <Container>
        <div className="my-6 space-y-6">
          <h1 className="text-2xl md:text-3xl font-bold">Recommendation</h1>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="h-64 rounded-lg border bg-card animate-pulse" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="text-muted-foreground">No recommended strategies yet</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {items.map(item => (
                <Card key={item.id} className="p-5 flex flex-col gap-3" onClick={() => navigate(`/recommendations/${item.id}`)}>
                  <div className="text-lg font-semibold truncate">{item.name}</div>
                  <div className="text-sm text-muted-foreground line-clamp-3">{item.description || 'No description'}</div>
                  <div className="text-xs text-muted-foreground">Timeframe: {item.timeframe} {item.targetAsset ? `• ${item.targetAsset}` : ''}</div>
                  <div className="mt-auto flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <Button onClick={() => handleCopy(item.id)} disabled={copyingId === item.id}>
                      {copyingId === item.id ? 'Copying...' : 'Copy to My Strategies'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Container>
    </>
  );
} 
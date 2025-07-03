
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserSubscription {
  tier: 'free' | 'pro' | 'premium' | null;
  isLoading: boolean;
}

export const useUserSubscription = (): UserSubscription => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription>({
    tier: null,
    isLoading: true
  });

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setSubscription({
          tier: null,
          isLoading: false
        });
        return;
      }

      try {
        // First check the profiles table for subscription_tier
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          setSubscription({
            tier: 'free', // Default to free on error
            isLoading: false
          });
          return;
        }

        const tier = profile?.subscription_tier as 'free' | 'pro' | 'premium' | null;
        setSubscription({
          tier: tier || 'free', // Default to free if null
          isLoading: false
        });
      } catch (error) {
        console.error('Error in fetchSubscription:', error);
        setSubscription({
          tier: 'free', // Default to free on error
          isLoading: false
        });
      }
    };

    fetchSubscription();
  }, [user]);

  return subscription;
};

export const isPro = (tier: string | null): boolean => {
  return tier === 'pro' || tier === 'premium';
};

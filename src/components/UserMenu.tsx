
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { LogOut, Settings, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/Badge";
import { supabase } from "@/integrations/supabase/client";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Load and sync subscription status from database
  useEffect(() => {
    const loadSubscriptionStatus = async () => {
      if (!user) {
        setIsPro(false);
        setIsLoadingSubscription(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // Profile doesn't exist, create one
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              subscription_tier: 'free'
            });

          if (insertError) {
            console.error('Error creating profile:', insertError);
          }
          setIsPro(false);
        } else if (error) {
          console.error('Error fetching profile:', error);
          setIsPro(false);
        } else {
          setIsPro(profile?.subscription_tier === 'pro');
        }
      } catch (error) {
        console.error('Error loading subscription status:', error);
        setIsPro(false);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    loadSubscriptionStatus();

    // Set up real-time subscription to profile changes
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Profile updated:', payload);
          if (payload.new && payload.new.subscription_tier) {
            setIsPro(payload.new.subscription_tier === 'pro');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleClose = () => setOpen(false);
  
  const handleLogout = async () => {
    try {
      await signOut();
      handleClose();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Extract display name from user metadata
  const email = user?.email || "user@example.com";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 ml-2 flex items-center justify-center">
          <UserRound size={18} className="text-primary" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-64 p-0" align="end">
        <div className="p-4 border-b">
          <p className="text-sm text-slate-900">{email}</p>
          <div className="mt-2">
            {isLoadingSubscription ? (
              <div className="h-5 w-12 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <Badge variant={isPro ? 'pro' : 'free'}>
                {isPro ? 'Pro' : 'Free'}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="py-2">
          <Link to="/settings" onClick={handleClose}>
            <Button variant="ghost" className="w-full justify-start px-4 py-2 h-auto">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
          
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start px-4 py-2 h-auto text-red-500 hover:text-red-500 hover:bg-red-50">
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

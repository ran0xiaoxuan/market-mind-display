
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
}

declare global {
  interface Window {
    turnstile: {
      render: (element: HTMLElement | string, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export function Turnstile({ onVerify, onError, onExpire, className }: TurnstileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [isLoadingKey, setIsLoadingKey] = useState(true);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    // Get the site key from Supabase edge function
    const getSiteKey = async () => {
      try {
        console.log('Fetching Turnstile site key...');
        const { data, error } = await supabase.functions.invoke('get-turnstile-key');
        
        if (error) {
          console.error('Error fetching Turnstile site key:', error);
          throw error;
        }
        
        console.log('Turnstile response:', data);
        
        if (data?.siteKey) {
          setSiteKey(data.siteKey);
          console.log('Turnstile site key loaded successfully');
        } else {
          throw new Error('No site key in response');
        }
      } catch (error) {
        console.error('Failed to get Turnstile site key:', error);
        // Use a test site key for development
        setSiteKey('0x4AAAAAABeotV9KL7X5-YJB');
      } finally {
        setIsLoadingKey(false);
      }
    };

    getSiteKey();
  }, []);

  useEffect(() => {
    if (!siteKey || isLoadingKey || isRendering || !ref.current) return;

    const loadTurnstile = () => {
      if (window.turnstile && ref.current && !widgetId) {
        console.log('Rendering Turnstile widget with site key:', siteKey);
        setIsRendering(true);
        
        try {
          // Clear any existing content first
          ref.current.innerHTML = '';
          
          const id = window.turnstile.render(ref.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              console.log('Turnstile verified successfully');
              onVerify(token);
            },
            'error-callback': () => {
              console.error('Turnstile verification failed');
              if (onError) onError();
            },
            'expired-callback': () => {
              console.log('Turnstile token expired');
              if (onExpire) onExpire();
            },
            theme: 'light',
            size: 'normal',
          });
          
          setWidgetId(id);
          setIsLoaded(true);
          console.log('Turnstile widget rendered successfully with ID:', id);
        } catch (error) {
          console.error('Error rendering Turnstile widget:', error);
          if (onError) onError();
        } finally {
          setIsRendering(false);
        }
      }
    };

    if (window.turnstile) {
      loadTurnstile();
    } else {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.onload = loadTurnstile;
      script.onerror = () => {
        console.error('Failed to load Turnstile script');
        setIsRendering(false);
        if (onError) onError();
      };
      document.head.appendChild(script);

      return () => {
        try {
          document.head.removeChild(script);
        } catch (e) {
          // Script may have already been removed
        }
      };
    }

    return () => {
      if (widgetId && window.turnstile) {
        try {
          console.log('Cleaning up Turnstile widget:', widgetId);
          window.turnstile.remove(widgetId);
          setWidgetId(null);
          setIsLoaded(false);
        } catch (e) {
          console.warn('Failed to remove Turnstile widget:', e);
        }
      }
    };
  }, [siteKey, isLoadingKey, onVerify, onError, onExpire, widgetId, isRendering]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (widgetId && window.turnstile) {
        try {
          console.log('Unmounting - cleaning up Turnstile widget:', widgetId);
          window.turnstile.remove(widgetId);
        } catch (e) {
          console.warn('Failed to cleanup Turnstile widget on unmount:', e);
        }
      }
    };
  }, [widgetId]);

  if (isLoadingKey) {
    return (
      <div className={className}>
        <div className="h-16 bg-gray-100 rounded animate-pulse flex items-center justify-center">
          <span className="text-sm text-gray-500">Loading security check...</span>
        </div>
      </div>
    );
  }

  if (!siteKey) {
    return (
      <div className={className}>
        <div className="h-16 bg-red-100 rounded flex items-center justify-center">
          <span className="text-sm text-red-600">Security check unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={ref} />
      {!isLoaded && !isRendering && (
        <div className="h-16 bg-gray-100 rounded animate-pulse flex items-center justify-center">
          <span className="text-sm text-gray-500">Loading captcha...</span>
        </div>
      )}
    </div>
  );
}

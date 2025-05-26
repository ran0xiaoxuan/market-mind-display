
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
        setSiteKey('1x00000000000000000000AA');
      } finally {
        setIsLoadingKey(false);
      }
    };

    getSiteKey();
  }, []);

  useEffect(() => {
    if (!siteKey || isLoadingKey) return;

    const loadTurnstile = () => {
      if (window.turnstile && ref.current) {
        console.log('Rendering Turnstile widget with site key:', siteKey);
        try {
          const id = window.turnstile.render(ref.current, {
            sitekey: siteKey,
            callback: onVerify,
            'error-callback': onError,
            'expired-callback': onExpire,
            theme: 'light',
            size: 'normal',
          });
          setWidgetId(id);
          setIsLoaded(true);
          console.log('Turnstile widget rendered successfully');
        } catch (error) {
          console.error('Error rendering Turnstile widget:', error);
          if (onError) onError();
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
          window.turnstile.remove(widgetId);
        } catch (e) {
          // Widget may have already been removed
        }
      }
    };
  }, [siteKey, isLoadingKey, onVerify, onError, onExpire]);

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
      {!isLoaded && (
        <div className="h-16 bg-gray-100 rounded animate-pulse flex items-center justify-center">
          <span className="text-sm text-gray-500">Loading captcha...</span>
        </div>
      )}
    </div>
  );
}

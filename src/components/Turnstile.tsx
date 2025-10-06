
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
  const [isLoading, setIsLoading] = useState(true);
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Check if we're in development mode
  const isDevelopment = () => {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('lovableproject.com');
  };

  // Simplified site key fetching
  useEffect(() => {
    let isMounted = true;

    const fetchSiteKey = async () => {
      if (isDevelopment()) {
        console.log('Development mode detected, using bypass');
        setIsLoading(false);
        setTimeout(() => {
          if (isMounted) {
            onVerify('dev-bypass-token');
          }
        }, 500);
        return;
      }

      try {
        console.log('[Turnstile] Fetching site key...');
        
        const { data, error } = await supabase.functions.invoke('get-turnstile-key', {
          body: JSON.stringify({ 
            timestamp: Date.now(),
            origin: window.location.origin
          }),
        });

        if (error) {
          throw new Error(`Failed to get site key: ${error.message}`);
        }

        if (data?.siteKey && isMounted) {
          console.log('[Turnstile] Site key received successfully');
          setSiteKey(data.siteKey);
          setHasError(false);
        } else {
          throw new Error('No site key received');
        }
      } catch (error: any) {
        console.error('[Turnstile] Site key fetch error:', error);
        if (isMounted) {
          setHasError(true);
          if (onError) onError();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSiteKey();
    return () => { isMounted = false; };
  }, [onVerify, onError, retryCount]);

  // Render Turnstile widget
  useEffect(() => {
    if (!siteKey || isLoading || widgetId || !ref.current || hasError) return;

    const renderWidget = () => {
      if (!window.turnstile || !ref.current) return;

      try {
        console.log('Rendering Turnstile widget...');
        ref.current.innerHTML = '';
        
        const id = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            console.log('Turnstile verified successfully');
            onVerify(token);
          },
          'error-callback': (error: any) => {
            console.error('Turnstile error:', error);
            setHasError(true);
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
        console.log('Turnstile widget rendered successfully');
      } catch (error) {
        console.error('Widget render error:', error);
        setHasError(true);
        if (onError) onError();
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      // Load Turnstile script
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      script.onerror = () => {
        console.error('Failed to load Turnstile script');
        setHasError(true);
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
  }, [siteKey, isLoading, widgetId, onVerify, onError, onExpire]);

  // Cleanup widget on unmount
  useEffect(() => {
    return () => {
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch (e) {
          console.warn('Failed to cleanup Turnstile widget:', e);
        }
      }
    };
  }, [widgetId]);

  const handleRetry = () => {
    setHasError(false);
    setWidgetId(null);
    setIsLoading(true);
    setSiteKey(null);
    setRetryCount(prev => prev + 1);
    if (ref.current) {
      ref.current.innerHTML = '';
    }
  };

  if (isDevelopment()) {
    return (
      <div className={className}>
        <div className="h-16 bg-green-100 rounded flex items-center justify-center">
          <span className="text-sm text-green-600">✓ Security check passed (dev mode)</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={className}>
        <div className="h-16 bg-gray-100 rounded animate-pulse flex items-center justify-center">
          <span className="text-sm text-gray-500">Loading security verification...</span>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={className}>
        <div className="h-16 bg-red-100 rounded flex items-center justify-center flex-col space-y-2">
          <span className="text-sm text-red-600">Security verification failed</span>
          <button 
            onClick={handleRetry}
            className="text-xs text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={ref} />
    </div>
  );
}

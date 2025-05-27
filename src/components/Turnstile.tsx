
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
  const [hasError, setHasError] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    const getSiteKey = async () => {
      try {
        console.log('Fetching Turnstile site key from edge function...');
        
        const startTime = Date.now();
        
        // Try multiple approaches for better compatibility
        let data, error;
        
        try {
          // First try with supabase.functions.invoke
          const response = await supabase.functions.invoke('get-turnstile-key', {
            body: JSON.stringify({ timestamp: Date.now() }),
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          data = response.data;
          error = response.error;
          
          console.log('Supabase invoke response:', { data, error });
          
        } catch (invokeError) {
          console.log('Supabase invoke failed, trying direct fetch...', invokeError);
          
          // Fallback to direct fetch
          try {
            const directResponse = await fetch(
              `https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/get-turnstile-key`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0`,
                },
                body: JSON.stringify({ timestamp: Date.now() }),
              }
            );
            
            if (directResponse.ok) {
              data = await directResponse.json();
              error = null;
              console.log('Direct fetch successful:', data);
            } else {
              throw new Error(`HTTP ${directResponse.status}: ${directResponse.statusText}`);
            }
          } catch (fetchError) {
            console.error('Direct fetch also failed:', fetchError);
            throw fetchError;
          }
        }
        
        const endTime = Date.now();
        console.log(`Request completed in ${endTime - startTime}ms`);
        
        if (error) {
          console.error('Error from edge function:', error);
          throw new Error(`Edge function error: ${error.message || 'Unknown error'}`);
        }
        
        if (data?.siteKey) {
          console.log('Site key received successfully');
          setSiteKey(data.siteKey);
          setNetworkError(false);
        } else {
          console.error('No site key in response:', data);
          throw new Error('No site key in response');
        }
        
      } catch (error: any) {
        console.error('Failed to get Turnstile site key:', error);
        setNetworkError(true);
        
        // Use test site key as fallback
        console.log('Using test site key as fallback');
        setSiteKey('0x4AAAAAABeotV9KL7X5-YJB');
      } finally {
        setIsLoadingKey(false);
      }
    };

    getSiteKey();
  }, []);

  useEffect(() => {
    if (!siteKey || isLoadingKey || widgetId || !ref.current) return;

    const loadTurnstile = () => {
      if (window.turnstile && ref.current && !widgetId) {
        console.log('Rendering Turnstile widget with site key:', siteKey);
        
        try {
          // Clear any existing content first
          ref.current.innerHTML = '';
          
          const id = window.turnstile.render(ref.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              console.log('Turnstile verified successfully');
              setIsLoaded(true);
              setHasError(false);
              onVerify(token);
            },
            'error-callback': () => {
              console.error('Turnstile verification failed');
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
          console.log('Turnstile widget rendered successfully with ID:', id);
        } catch (error) {
          console.error('Error rendering Turnstile widget:', error);
          setHasError(true);
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
  }, [siteKey, isLoadingKey, widgetId, onVerify, onError, onExpire]);

  // Cleanup on unmount only
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

  const handleRetry = () => {
    setHasError(false);
    setWidgetId(null);
    setIsLoaded(false);
    setIsLoadingKey(true);
    setSiteKey(null);
    setNetworkError(false);
    if (ref.current) {
      ref.current.innerHTML = '';
    }
    
    // Trigger refetch
    window.location.reload();
  };

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
        <div className="h-16 bg-red-100 rounded flex items-center justify-center flex-col space-y-2">
          <span className="text-sm text-red-600">Security check unavailable</span>
          <span className="text-xs text-red-500 text-center px-2">Unable to connect to verification service</span>
          <button 
            onClick={handleRetry}
            className="text-xs text-blue-600 hover:underline"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={className}>
        <div className="h-16 bg-red-100 rounded flex items-center justify-center flex-col space-y-2">
          <span className="text-sm text-red-600">Security check failed</span>
          <button 
            onClick={handleRetry}
            className="text-xs text-blue-600 hover:underline"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {networkError && (
        <div className="mb-2 text-xs text-amber-600 text-center bg-amber-50 p-2 rounded">
          ⚠️ Using fallback verification due to network issue
        </div>
      )}
      <div ref={ref} />
    </div>
  );
}

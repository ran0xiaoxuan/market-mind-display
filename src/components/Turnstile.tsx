
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
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Get the site key from Supabase edge function
    const getSiteKey = async () => {
      try {
        console.log('Fetching Turnstile site key...');
        
        const { data, error } = await supabase.functions.invoke('get-turnstile-key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (error) {
          console.error('Error fetching Turnstile site key:', error);
          throw new Error(`Edge function error: ${error.message}`);
        }
        
        console.log('Turnstile response:', data);
        
        if (data?.siteKey) {
          setSiteKey(data.siteKey);
          setErrorMessage('');
          console.log('Turnstile site key loaded successfully');
        } else {
          throw new Error('No site key in response');
        }
      } catch (error: any) {
        console.error('Failed to get Turnstile site key:', error);
        setErrorMessage(`Network error: ${error.message}`);
        
        // Use a test site key as fallback
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
    setErrorMessage('');
    if (ref.current) {
      ref.current.innerHTML = '';
    }
    
    // Retry fetching the site key
    const getSiteKey = async () => {
      try {
        console.log('Retrying Turnstile site key fetch...');
        const { data, error } = await supabase.functions.invoke('get-turnstile-key', {
          method: 'POST',
        });
        
        if (error) throw new Error(`Edge function error: ${error.message}`);
        if (data?.siteKey) {
          setSiteKey(data.siteKey);
          setErrorMessage('');
        } else {
          throw new Error('No site key in response');
        }
      } catch (error: any) {
        console.error('Retry failed:', error);
        setErrorMessage(`Retry failed: ${error.message}`);
        setSiteKey('0x4AAAAAABeotV9KL7X5-YJB');
      } finally {
        setIsLoadingKey(false);
      }
    };
    
    getSiteKey();
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
          {errorMessage && (
            <span className="text-xs text-red-500 text-center px-2">{errorMessage}</span>
          )}
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

  if (hasError) {
    return (
      <div className={className}>
        <div className="h-16 bg-red-100 rounded flex items-center justify-center flex-col space-y-2">
          <span className="text-sm text-red-600">Security check failed</span>
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

  const isUsingTestKey = siteKey === '0x4AAAAAABeotV9KL7X5-YJB';

  return (
    <div className={className}>
      {isUsingTestKey && errorMessage && (
        <div className="mb-2 text-xs text-amber-600 text-center">
          Using test verification (network issue detected)
        </div>
      )}
      <div ref={ref} />
      {!isLoaded && !hasError && (
        <div className="h-16 bg-gray-100 rounded animate-pulse flex items-center justify-center">
          <span className="text-sm text-gray-500">Loading verification...</span>
        </div>
      )}
    </div>
  );
}

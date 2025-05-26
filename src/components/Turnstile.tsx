
import { useEffect, useRef, useState } from "react";

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

  useEffect(() => {
    // Get the site key from Supabase
    const getSiteKey = async () => {
      try {
        const { data } = await fetch('https://lqfhhqhswdqpsliskxrr.supabase.co/functions/v1/get-turnstile-key', {
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0`
          }
        }).then(res => res.json());
        
        if (data?.siteKey) {
          setSiteKey(data.siteKey);
        }
      } catch (error) {
        console.error('Failed to get Turnstile site key:', error);
        // Fallback to a placeholder - you'll need to replace this with your actual site key
        setSiteKey('1x00000000000000000000AA');
      }
    };

    getSiteKey();
  }, []);

  useEffect(() => {
    if (!siteKey) return;

    const loadTurnstile = () => {
      if (window.turnstile && ref.current) {
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
  }, [siteKey, onVerify, onError, onExpire]);

  if (!siteKey) {
    return (
      <div className={className}>
        <div className="h-16 bg-gray-100 rounded animate-pulse flex items-center justify-center">
          <span className="text-sm text-gray-500">Loading security check...</span>
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

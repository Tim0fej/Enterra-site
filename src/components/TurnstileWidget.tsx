import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const SCRIPT_ID = 'cf-turnstile-script';

interface TurnstileWidgetProps {
  siteKey: string;
  widgetKey?: number;
  onToken: (token: string) => void;
  onExpire?: () => void;
}

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();

  const existing = document.getElementById(SCRIPT_ID);
  if (existing) {
    return new Promise((resolve) => {
      window.onTurnstileLoad = () => resolve();
      if (window.turnstile) resolve();
    });
  }

  return new Promise((resolve, reject) => {
    window.onTurnstileLoad = () => resolve();
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Turnstile load failed'));
    document.head.appendChild(script);
  });
}

export function TurnstileWidget({ siteKey, widgetKey = 0, onToken, onExpire }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !siteKey) return;

    let cancelled = false;

    void loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;

        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'auto',
          callback: (token) => onToken(token),
          'expired-callback': () => onExpire?.(),
          'error-callback': () => onExpire?.(),
        });
      })
      .catch(() => onExpire?.());

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, widgetKey, onToken, onExpire]);

  return <div className="turnstile-widget" ref={containerRef} />;
}

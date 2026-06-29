import { useEffect, useRef } from 'react';

/** Периодический опрос, только когда вкладка активна. */
export function usePolling(callback: () => void, intervalMs: number, enabled = true): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (document.visibilityState === 'visible') {
        callbackRef.current();
      }
    };

    const restart = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(tick, intervalMs);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        tick();
        restart();
      }
    };

    tick();
    restart();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intervalMs, enabled]);
}

import { useEffect, useRef, useState } from 'react';

function formatCountdown(ms: number): string {
  if (ms <= 0) {
    return '0 сек';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days} д ${hours} ч ${minutes} мин`;
  }
  if (hours > 0) {
    return `${hours} ч ${minutes} мин ${seconds} сек`;
  }
  return `${minutes} мин ${seconds} сек`;
}

interface AccessCodeTimerProps {
  expiresAt: string;
  onExpired?: () => void;
  compact?: boolean;
}

export function AccessCodeTimer({ expiresAt, onExpired, compact = false }: AccessCodeTimerProps) {
  const [remainingMs, setRemainingMs] = useState(() => Date.parse(expiresAt) - Date.now());
  const expiredRef = useRef(false);
  const expired = remainingMs <= 0;

  useEffect(() => {
    expiredRef.current = false;
    setRemainingMs(Date.parse(expiresAt) - Date.now());
  }, [expiresAt]);

  useEffect(() => {
    if (expired) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        onExpired?.();
      }
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingMs(Date.parse(expiresAt) - Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [expiresAt, expired, onExpired]);

  return (
    <div
      className={`access-code-timer${expired ? ' access-code-timer--expired' : ''}${
        compact ? ' access-code-timer--compact' : ''
      }`}
    >
      <span className="access-code-timer__label">
        {expired ? 'Код обновляется…' : 'До смены кода'}
      </span>
      <strong className="access-code-timer__value">
        {expired ? '—' : formatCountdown(remainingMs)}
      </strong>
    </div>
  );
}

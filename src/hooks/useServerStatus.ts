import { useCallback, useEffect, useState } from 'react';
import type { ServerStatus } from '../types/server';
import type { McStatusResponse } from '../types/server';

const POLL_INTERVAL = 30_000;

async function fetchStatus(): Promise<ServerStatus> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch('/api/minecraft/status', { signal: controller.signal });

    if (!res.ok) throw new Error('API error');

    const data = (await res.json()) as McStatusResponse;

    return {
      state: data.displayState,
      playersOnline: data.playersOnline ?? 0,
      playersMax: data.playersMax,
      label: data.label,
      message: data.message,
      displayMode: data.displayMode,
    };
  } catch {
    return {
      state: 'error',
      playersOnline: null,
      playersMax: null,
      label: 'Статус недоступен',
      message: null,
      displayMode: null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function useServerStatus(): ServerStatus {
  const [status, setStatus] = useState<ServerStatus>({
    state: 'loading',
    playersOnline: null,
    playersMax: null,
    label: 'Проверка статуса...',
    message: null,
    displayMode: null,
  });

  const refresh = useCallback(async () => {
    setStatus(await fetchStatus());
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), POLL_INTERVAL);
    return () => clearInterval(id);
  }, [refresh]);

  return status;
}

export type { ServerStatus };

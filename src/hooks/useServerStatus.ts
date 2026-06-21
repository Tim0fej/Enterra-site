import { useCallback, useEffect, useState } from 'react';
import { SERVER_CONFIG } from '../config';
import type { McStatusResponse, ServerStatus } from '../types/server';

const POLL_INTERVAL = 60_000;

async function fetchStatus(): Promise<ServerStatus> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      `https://api.mcstatus.io/v2/status/java/${SERVER_CONFIG.ip}:${SERVER_CONFIG.port}`,
      { signal: controller.signal },
    );

    if (!res.ok) throw new Error('API error');

    const data = (await res.json()) as McStatusResponse;

    if (data.online) {
      const playersOnline = data.players?.online ?? 0;
      const playersMax = data.players?.max ?? null;
      return {
        state: 'online',
        playersOnline,
        playersMax,
        label: `Онлайн · ${playersOnline}/${playersMax ?? '?'} игроков`,
      };
    }

    return {
      state: 'offline',
      playersOnline: 0,
      playersMax: null,
      label: 'Сервер оффлайн',
    };
  } catch {
    return {
      state: 'error',
      playersOnline: null,
      playersMax: null,
      label: 'Статус недоступен',
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

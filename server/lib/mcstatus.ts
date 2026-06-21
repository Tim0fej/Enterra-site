const MC_HOST = process.env.MC_HOST ?? 'play.enterra.ru';
const MC_PORT = Number(process.env.MC_PORT) || 25565;

export interface McOnlineData {
  online: boolean;
  playersOnline: number;
  playersMax: number | null;
  playerNames: string[];
}

export async function fetchMcOnline(): Promise<McOnlineData> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      `https://api.mcstatus.io/v2/status/java/${MC_HOST}:${MC_PORT}`,
      { signal: controller.signal },
    );

    if (!res.ok) throw new Error('mcstatus error');

    const data = (await res.json()) as {
      online?: boolean;
      players?: { online?: number; max?: number; list?: string[] };
    };

    return {
      online: Boolean(data.online),
      playersOnline: data.players?.online ?? 0,
      playersMax: data.players?.max ?? null,
      playerNames: (data.players?.list ?? []).map((n) => n.toLowerCase()),
    };
  } catch {
    return {
      online: false,
      playersOnline: 0,
      playersMax: null,
      playerNames: [],
    };
  } finally {
    clearTimeout(timeout);
  }
}

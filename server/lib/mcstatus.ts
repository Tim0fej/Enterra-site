const MC_HOST = process.env.MC_HOST ?? 'Enterra.minerent.io';
const MC_PORT = Number(process.env.MC_PORT) || 25565;

export interface McOnlineData {
  online: boolean;
  playersOnline: number;
  playersMax: number | null;
  /** Lowercase nicknames for matching. */
  playerNames: string[];
  /** Original casing from the server query API. */
  playerNamesDisplay: string[];
}

export async function fetchMcOnline(options?: { bypassCache?: boolean }): Promise<McOnlineData> {
  const ttlMs = Number.parseInt(process.env.MCSTATUS_CACHE_MS ?? '15000', 10) || 15_000;
  const now = Date.now();

  if (!options?.bypassCache && cached && now - cachedAt < ttlMs) {
    return cached;
  }

  const fresh = await fetchMcOnlineRaw();
  cached = fresh;
  cachedAt = now;
  return fresh;
}

let cached: McOnlineData | null = null;
let cachedAt = 0;

async function fetchMcOnlineRaw(): Promise<McOnlineData> {
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

    const list = data.players?.list ?? [];

    return {
      online: Boolean(data.online),
      playersOnline: data.players?.online ?? 0,
      playersMax: data.players?.max ?? null,
      playerNames: list.map((n) => n.toLowerCase()),
      playerNamesDisplay: list,
    };
  } catch {
    return {
      online: false,
      playersOnline: 0,
      playersMax: null,
      playerNames: [],
      playerNamesDisplay: [],
    };
  } finally {
    clearTimeout(timeout);
  }
}

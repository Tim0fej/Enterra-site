function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

type BanEntry = { until: number; reason: string };
type AbuseEntry = { score: number; resetAt: number };

const tempBans = new Map<string, BanEntry>();
const abuseScores = new Map<string, AbuseEntry>();

const ABUSE_THRESHOLD = envInt('ABUSE_BAN_THRESHOLD', 20);
const ABUSE_WINDOW_MS = envInt('ABUSE_WINDOW_MS', 5 * 60_000);
const BAN_DURATION_MS = envInt('ABUSE_BAN_MS', 30 * 60_000);

setInterval(() => {
  const now = Date.now();
  for (const [ip, ban] of tempBans) {
    if (ban.until <= now) tempBans.delete(ip);
  }
  for (const [ip, abuse] of abuseScores) {
    if (abuse.resetAt <= now) abuseScores.delete(ip);
  }
}, 60_000);

export function recordAbuse(ip: string, weight = 1): void {
  if (!ip || ip === 'unknown') return;

  const now = Date.now();
  let entry = abuseScores.get(ip);
  if (!entry || entry.resetAt <= now) {
    entry = { score: 0, resetAt: now + ABUSE_WINDOW_MS };
  }

  entry.score += weight;
  abuseScores.set(ip, entry);

  if (entry.score >= ABUSE_THRESHOLD) {
    tempBanIp(ip, 'auto: flood');
  }
}

export function tempBanIp(ip: string, reason: string, durationMs = BAN_DURATION_MS): void {
  tempBans.set(ip, { until: Date.now() + durationMs, reason });
  abuseScores.delete(ip);
}

export function isTempBanned(ip: string): boolean {
  const entry = tempBans.get(ip);
  if (!entry) return false;
  if (entry.until <= Date.now()) {
    tempBans.delete(ip);
    return false;
  }
  return true;
}

export function getActiveBanCount(): number {
  return tempBans.size;
}

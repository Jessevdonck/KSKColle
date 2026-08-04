/**
 * Eenvoudige in-memory TTL-cache voor veelgebruikte GET-responses.
 * Vermindert DB-load en CPU op Railway.
 */

const store = new Map<string, { value: unknown; expires: number }>();

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Zonder periodieke opruiming blijven verlopen entries in het geheugen hangen
 * tot iemand exact dezelfde sleutel opnieuw opvraagt. Een toernooidetail is
 * al snel enkele honderden KB, dus dat loopt op.
 */
const SWEEP_INTERVAL_MS = 60_000;

export let cacheSweepInterval: ReturnType<typeof setInterval> | undefined;

function sweepExpired(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.expires) store.delete(key);
  }
}

if (typeof setInterval !== 'undefined') {
  cacheSweepInterval = setInterval(sweepExpired, SWEEP_INTERVAL_MS);
  cacheSweepInterval.unref?.();
}

export function stopShortLivedCacheSweep(): void {
  if (cacheSweepInterval) clearInterval(cacheSweepInterval);
  store.clear();
}

export const SHORT_CACHE_TTL_MS = {
  tournamentList: 30_000,
  tournamentDetail: 30_000,
  calendarList: 30_000,
  tournamentRounds: 20_000,
  megaschaakRead: 45_000,
  megaschaakPlayers: 60_000,
  /** Spelerslijst (clubrating): zelden gewijzigd; ververs na import/sluiting via invalidatePublicUsersCache. */
  publicUsers: 3 * DAY_MS,
} as const;

export function shortLivedCacheGet<T>(key: string): T | undefined {
  const e = store.get(key);
  if (!e) return undefined;
  if (Date.now() > e.expires) {
    store.delete(key);
    return undefined;
  }
  return e.value as T;
}

export function shortLivedCacheSet(
  key: string,
  value: unknown,
  ttlMs: number,
): void {
  store.set(key, { value, expires: Date.now() + ttlMs });
}

export function shortLivedCacheInvalidatePrefix(prefix: string): void {
  for (const k of [...store.keys()]) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}

export function shortLivedCacheDelete(key: string): void {
  store.delete(key);
}

/** Vaste prefixes voor invalidatie buiten de REST-module (bv. close-route). */
export const SHORT_CACHE_KEY_PREFIX = {
  tournamentList: "tournament:list:",
  tournamentDetail: "tournament:detail:",
  calendarList: "calendar:list:",
  tournamentRounds: "tournamentRounds:",
  megaschaak: "megaschaak:",
  publicUsers: "users:publicUsers",
  publicYouth: "users:publicYouth",
} as const;

export function invalidateTournamentDetailCache(tournamentId?: number) {
  if (tournamentId != null) {
    shortLivedCacheDelete(`${SHORT_CACHE_KEY_PREFIX.tournamentDetail}${tournamentId}`);
    return;
  }
  shortLivedCacheInvalidatePrefix(SHORT_CACHE_KEY_PREFIX.tournamentDetail);
}

export function invalidateTournamentRoundsCache(tournamentId: number) {
  shortLivedCacheDelete(`${SHORT_CACHE_KEY_PREFIX.tournamentRounds}${tournamentId}`);
  invalidateTournamentDetailCache(tournamentId);
}

export function invalidateMegaschaakCache() {
  shortLivedCacheInvalidatePrefix(SHORT_CACHE_KEY_PREFIX.megaschaak);
}

export function invalidatePublicUsersCache() {
  shortLivedCacheDelete(SHORT_CACHE_KEY_PREFIX.publicUsers);
  shortLivedCacheDelete(SHORT_CACHE_KEY_PREFIX.publicYouth);
}

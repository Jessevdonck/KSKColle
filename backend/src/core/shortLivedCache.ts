/**
 * Eenvoudige in-memory TTL-cache voor veelgebruikte GET-responses.
 * Vermindert DB-load en CPU op Railway; max. enkele seconden “vertraagde” data.
 */

const store = new Map<string, { value: unknown; expires: number }>();

export const SHORT_CACHE_TTL_MS = {
  tournamentList: 30_000,
  tournamentDetail: 30_000,
  calendarList: 30_000,
  tournamentRounds: 20_000,
  megaschaakRead: 45_000,
  megaschaakPlayers: 60_000,
  publicUsers: 120_000,
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

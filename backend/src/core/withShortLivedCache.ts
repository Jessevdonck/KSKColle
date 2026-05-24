import { shortLivedCacheGet, shortLivedCacheSet } from './shortLivedCache';

/** Haal data op met in-memory TTL-cache (per server instance). */
export async function withShortLivedCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const cached = shortLivedCacheGet<T>(key);
  if (cached !== undefined) return cached;
  const value = await loader();
  shortLivedCacheSet(key, value, ttlMs);
  return value;
}

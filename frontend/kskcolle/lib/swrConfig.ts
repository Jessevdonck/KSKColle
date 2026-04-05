/**
 * Standaard SWR-gedrag voor de hele site: minder API-verkeer naar Railway
 * (geen refetch bij tab-focus of reconnect, geen automatische “stale”-refresh).
 *
 * Niet combineren met `revalidateOnMount: false` op data die nog niet in de cache zit:
 * SWR slaat dan de initiële fetch over → oneindige loading.
 * Met `revalidateIfStale: false` blijft data na de eerste fetch in cache bij heropenen.
 */
export const DEFAULT_SWR_OPTIONS = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
  dedupingInterval: 120_000,
} as const;

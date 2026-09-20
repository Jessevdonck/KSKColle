/**
 * Eenvoudige in-memory rate limiter (fixed window) voor gevoelige endpoints
 * zoals het contactformulier, dat externe mails verstuurt via Resend.
 * Geen Redis nodig: de app draait als één Railway-instance.
 */
import type { Next } from 'koa';
import type { KoaContext } from '../types/koa';
import { getLogger } from './logging';

const logger = getLogger();

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  /** Tijdsvenster in ms waarin `max` requests toegelaten zijn. */
  windowMs: number;
  /** Maximaal aantal requests per sleutel binnen het venster. */
  max: number;
  /** Bepaalt de sleutel waarop geteld wordt (bv. user id en/of IP). */
  keyGenerator: (ctx: KoaContext) => string;
  /** Foutmelding die de gebruiker te zien krijgt bij overschrijding. */
  message?: string;
}

const SWEEP_INTERVAL_MS = 60_000;

export function createRateLimiter(options: RateLimitOptions) {
  const store = new Map<string, RateLimitEntry>();

  const sweepInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, SWEEP_INTERVAL_MS);
  sweepInterval.unref?.();

  return async (ctx: KoaContext, next: Next) => {
    const key = options.keyGenerator(ctx);
    const now = Date.now();

    let entry = store.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + options.windowMs };
      store.set(key, entry);
    }

    entry.count += 1;

    if (entry.count > options.max) {
      logger.warn('Rate limit exceeded', { key, count: entry.count, path: ctx.path });
      ctx.throw(429, options.message || 'Te veel verzoeken, probeer het later opnieuw.', {
        code: 'RATE_LIMITED',
      });
      return;
    }

    return next();
  };
}

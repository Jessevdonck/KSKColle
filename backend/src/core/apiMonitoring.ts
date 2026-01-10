import { KoaContext } from '../types/koa';
import { getLogger } from './logging';

interface ApiCallStats {
  endpoint: string;
  method: string;
  count: number;
  totalTime: number;
  errors: number;
  lastCalled: Date;
}

class ApiMonitor {
  private stats: Map<string, ApiCallStats> = new Map();
  private readonly logger = getLogger();

  recordCall(ctx: KoaContext, duration: number, isError: boolean) {
    const endpoint = ctx.url?.split('?')[0] || ctx.url || '/';
    const key = `${ctx.method} ${endpoint}`; // Remove query params
    const existing = this.stats.get(key) || {
      endpoint: endpoint,
      method: ctx.method,
      count: 0,
      totalTime: 0,
      errors: 0,
      lastCalled: new Date(),
    };

    existing.count++;
    existing.totalTime += duration;
    if (isError) existing.errors++;
    existing.lastCalled = new Date();

    this.stats.set(key, existing);
  }

  getStats(): ApiCallStats[] {
    return Array.from(this.stats.values())
      .sort((a, b) => b.count - a.count) // Sort by count descending
      .map(stat => ({
        ...stat,
        avgTime: stat.totalTime / stat.count,
      } as ApiCallStats & { avgTime: number }));
  }

  getTopEndpoints(limit: number = 10): ApiCallStats[] {
    return this.getStats().slice(0, limit);
  }

  logSummary() {
    const topEndpoints = this.getTopEndpoints(20);
    if (topEndpoints.length === 0) return;

    this.logger.info('📊 API Call Statistics (Top 20):');
    topEndpoints.forEach((stat, index) => {
      const avgTime = (stat.totalTime / stat.count).toFixed(2);
      this.logger.info(
        `  ${index + 1}. ${stat.method} ${stat.endpoint} - ` +
        `Count: ${stat.count}, ` +
        `Avg Time: ${avgTime}ms, ` +
        `Errors: ${stat.errors}, ` +
        `Last: ${stat.lastCalled.toISOString()}`
      );
    });
  }

  reset() {
    this.stats.clear();
  }
}

export const apiMonitor = new ApiMonitor();

// Middleware to track API calls
export function apiMonitoringMiddleware() {
  return async (ctx: KoaContext, next: () => Promise<any>) => {
    const startTime = Date.now();
    let isError = false;

    try {
      await next();
      if (ctx.status >= 400) {
        isError = true;
      }
    } catch (error) {
      isError = true;
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      apiMonitor.recordCall(ctx, duration, isError);
    }
  };
}

// Log summary every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    apiMonitor.logSummary();
  }, 5 * 60 * 1000); // 5 minutes
}

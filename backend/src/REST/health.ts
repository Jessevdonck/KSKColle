import Router from '@koa/router';
import * as healthService from '../service/health';
import type { Context } from 'koa';
import validate from '../core/validation';
import { ChessAppContext, ChessAppState } from '../types/koa';
import { apiMonitor } from '../core/apiMonitoring';
import { requireAuthentication, makeRequireRole } from '../core/auth';

/**
 * @api {get} /api/health/ping Ping the server
 * @apiName PingServer
 * @apiGroup Health
 * @apiSuccess {Object} pong Response object
 * @apiSuccess {Boolean} pong.pong `true` when server responds
 * @apiError {Object} 400 BadRequest
 * @apiError {String} message Error message
 */

const ping = async (ctx: Context) => {
  ctx.status = 200;
  ctx.body = healthService.ping();
};
ping.validationScheme = null;

/**
 * @api {get} /api/health/version Get the server's version information
 * @apiName GetServerVersion
 * @apiGroup Health
 * @apiSuccess {Object} versionInfo The server's running version information
 * @apiSuccess {String} versionInfo.env The environment in which the server is running
 * @apiSuccess {String} versionInfo.version The version of the server
 * @apiSuccess {String} versionInfo.name The name of the server
 * @apiError {Object} 400 BadRequest
 * @apiError {String} message Error message
 */
const getVersion = async (ctx: Context) => {
  ctx.status = 200;
  ctx.body = healthService.getVersion();
};
getVersion.validationScheme = null;

/**
 * @api {get} /api/health/stats Get API call statistics
 * @apiName GetApiStats
 * @apiGroup Health
 * @apiPermission admin
 * @apiSuccess {Object[]} stats Array of API call statistics
 * @apiSuccess {String} stats.endpoint The API endpoint
 * @apiSuccess {String} stats.method HTTP method
 * @apiSuccess {Number} stats.count Number of calls
 * @apiSuccess {Number} stats.avgTime Average response time in ms
 * @apiSuccess {Number} stats.errors Number of errors
 * @apiSuccess {String} stats.lastCalled ISO timestamp of last call
 */
const getStats = async (ctx: Context) => {
  const stats = apiMonitor.getStats();
  ctx.status = 200;
  ctx.body = {
    stats: stats.map(stat => ({
      endpoint: stat.endpoint,
      method: stat.method,
      count: stat.count,
      avgTime: Math.round((stat.totalTime / stat.count) * 100) / 100,
      errors: stat.errors,
      lastCalled: stat.lastCalled.toISOString(),
    })),
  };
};
getStats.validationScheme = null;

export default (parent: Router<ChessAppState, ChessAppContext>) => {
  const router = new Router({ prefix: '/health' });

  router.get('/ping', validate(ping.validationScheme), ping);
  router.get('/version',validate(getVersion.validationScheme), getVersion);
  router.get('/stats', requireAuthentication, makeRequireRole('admin'), validate(getStats.validationScheme), getStats);

  parent.use(router.routes()).use(router.allowedMethods());
};
import Router from '@koa/router';
import * as healthService from '../service/health';
import type { Context } from 'koa';
import validate from '../core/validation';

const ping = async (ctx: Context) => {
  ctx.status = 200;
  ctx.body = healthService.ping();
};
ping.validationScheme = null;

const getVersion = async (ctx: Context) => {
  ctx.status = 200;
  ctx.body = healthService.getVersion();
};
getVersion.validationScheme = null;

export default (parent: Router) => {
  const router = new Router({ prefix: '/health' });

  router.get('/ping', validate(ping.validationScheme), ping);
  router.get('/version',validate(getVersion.validationScheme), getVersion);

  parent.use(router.routes()).use(router.allowedMethods());
};
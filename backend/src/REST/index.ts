import type Application from 'koa';

import Router from '@koa/router';
import installSpelerRouter from './spelers';
import installHealthRouter from './health';

export default (app: Application) => {
  const router = new Router({
    prefix: '/api',
  });

  installSpelerRouter(router);
  installHealthRouter(router);

  app.use(router.routes()).use(router.allowedMethods());
};
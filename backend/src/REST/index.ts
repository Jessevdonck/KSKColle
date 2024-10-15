import type Application from 'koa';

import Router from '@koa/router';
import installSpelerRouter from './spelers';
import installHealthRouter from './health';
import installTournamentRouter from './toernooien';
import installRondeRouter from './rondes';
import installSpelRouter from './spellen';

export default (app: Application) => {
  const router = new Router({
    prefix: '/api',
  });

  installHealthRouter(router);
  installSpelerRouter(router);
  installTournamentRouter(router);
  installRondeRouter(router);
  installSpelRouter(router);

  app.use(router.routes()).use(router.allowedMethods());
};
import Router from '@koa/router';
import installSpelerRouter from './users';
import installHealthRouter from './health';
import installTournamentRouter from './tournament';
import installRondeRouter from './rondes';
import installSpelRouter from './spellen';
import type { /*ChessAppContext, ChessAppState,*/ KoaApplication } from '../types/koa';

export default (app: KoaApplication) => {
  const router = new Router/*<ChessAppState, ChessAppContext>*/({
    prefix: '/api',
  });

  installHealthRouter(router);
  installSpelerRouter(router);
  installTournamentRouter(router);
  installRondeRouter(router);
  installSpelRouter(router);

  app.use(router.routes()).use(router.allowedMethods());
};
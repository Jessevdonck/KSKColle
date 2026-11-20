import Router from '@koa/router';
import Joi from 'joi';
import validate from '../core/validation';
import * as eloHistoryService from '../service/eloHistoryService';
import * as blitzRatingService from '../service/blitzRatingService';
import type { ChessAppContext, ChessAppState } from '../types/koa';

/**
 * @api {get} /elo-history/user/:user_id Get historical Elo ratings for a user
 * @apiName GetUserEloHistory
 * @apiGroup EloHistory
 *
 * @apiParam {Number} user_id De ID van de speler.
 *
 * @apiSuccess {Object[]} items Historische ratingpunten (chronologisch), {period, rating}.
 */
const getUserEloHistory = async (ctx: any) => {
  const userId = Number(ctx.params.user_id);
  const history = await eloHistoryService.getEloHistoryForUser(userId);
  ctx.body = { items: history };
};
getUserEloHistory.validationScheme = {
  params: {
    user_id: Joi.number().integer().positive(),
  },
};

/**
 * @api {get} /elo-history/user/:user_id/blitz Get blitz rating history for a user
 * @apiName GetUserBlitzHistory
 * @apiGroup EloHistory
 *
 * @apiParam {Number} user_id De ID van de speler.
 *
 * @apiSuccess {Object[]} items Blitzrating na elk blitztoernooi (chronologisch),
 *   {period, rating, rating_change, games, tournament}. Los van de ELIO.
 */
const getUserBlitzHistory = async (ctx: any) => {
  const userId = Number(ctx.params.user_id);
  const history = await blitzRatingService.getBlitzHistoryForUser(userId);
  ctx.body = { items: history };
};
getUserBlitzHistory.validationScheme = getUserEloHistory.validationScheme;

export default (parent: Router<ChessAppState, ChessAppContext>) => {
  const router = new Router({
    prefix: '/elo-history',
  });

  // Publiek leesbaar: profielen zijn ook publiek
  router.get('/user/:user_id', validate(getUserEloHistory.validationScheme), getUserEloHistory);
  router.get('/user/:user_id/blitz', validate(getUserBlitzHistory.validationScheme), getUserBlitzHistory);

  parent.use(router.routes()).use(router.allowedMethods());
};

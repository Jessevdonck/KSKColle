import Router from '@koa/router';
import Joi from 'joi';
import validate from '../core/validation';
import * as honorService from '../service/honorService';
import type { ChessAppContext, ChessAppState } from '../types/koa';

/**
 * @api {get} /honors Get all tournament honors
 * @apiName GetAllHonors
 * @apiGroup Honor
 *
 * @apiSuccess {Object[]} items Podia per afgesloten toernooi (erelijsten).
 */
const getAllHonors = async (ctx: any) => {
  const honors = await honorService.getAllHonors();
  ctx.body = { items: honors };
};
getAllHonors.validationScheme = null;

/**
 * @api {get} /honors/user/:user_id Get honors for a user
 * @apiName GetUserHonors
 * @apiGroup Honor
 *
 * @apiParam {Number} user_id De ID van de speler.
 *
 * @apiSuccess {Object[]} items Palmares van de speler.
 */
const getUserHonors = async (ctx: any) => {
  const userId = Number(ctx.params.user_id);
  const honors = await honorService.getHonorsForUser(userId);
  ctx.body = { items: honors };
};
getUserHonors.validationScheme = {
  params: {
    user_id: Joi.number().integer().positive(),
  },
};

export default (parent: Router<ChessAppState, ChessAppContext>) => {
  const router = new Router({
    prefix: '/honors',
  });

  // Publiek leesbaar: erelijsten en profielen zijn ook publiek
  router.get('/', validate(getAllHonors.validationScheme), getAllHonors);
  router.get('/user/:user_id', validate(getUserHonors.validationScheme), getUserHonors);

  parent.use(router.routes()).use(router.allowedMethods());
};

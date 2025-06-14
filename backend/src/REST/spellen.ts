import Router from '@koa/router';
import * as spellenService from '../service/spellenService';
import type { ChessAppContext, ChessAppState, KoaContext } from '../types/koa';
import type { CreateSpelRequest, CreateSpelResponse, GetAllSpellenResponse, GetSpelByIdResponse, UpdateSpelRequest, UpdateSpelResponse } from '../types/spel';
import type { IdParams } from '../types/common';
import Joi from 'joi';
import validate from '../core/validation';
import { requireAuthentication, makeRequireRole } from '../core/auth';
import Role from '../core/roles';

/**
 * @api {get} /spel Get all spellen
 * @apiName GetAllSpellen
 * @apiGroup Spel
 * 
 * @apiSuccess {Object[]} items List of all spellen.
 * @apiError (400) BadRequest Invalid data provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You don't have access to this resource.
 * @apiError (404) NotFound The requested resource could not be found.
 */
const getAllSpellen = async (ctx: KoaContext<GetAllSpellenResponse>) => {
  const spellen =  await spellenService.getAllSpellen();
  ctx.body = {
    items: spellen,
  };
};

getAllSpellen.validationScheme = null;

/**
 * @api {post} /spel Create a new spel
 * @apiName CreateSpel
 * @apiGroup Spel
 * 
 * @apiBody {Number} speler1_id The ID of player 1.
 * @apiBody {Number} speler2_id The ID of player 2.
 * @apiBody {Number} winnaar_id The ID of the winner.
 * @apiBody {Date} datum The date of the game.
 * 
 * @apiSuccess {Object} spel The created spel object.
 * @apiError (400) BadRequest Invalid data provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You don't have access to this resource.
 * @apiError (404) NotFound The requested resource could not be found.
 */
const createSpel = async (ctx: KoaContext<CreateSpelResponse, void, CreateSpelRequest>) => {
  const newSpel: any = await spellenService.createSpel(ctx.request.body);
  ctx.status = 201; 
  ctx.body = newSpel;
};

createSpel.validationScheme = {
  body: {
    speler1_id: Joi.number().integer().positive(),
    speler2_id: Joi.number().integer().positive(),
    winnaar_id: Joi.number().integer().positive(),
    datum: Joi.date(),
  },
};

/**
 * @api {get} /spel/:id Get spel by ID
 * @apiName GetSpelById
 * @apiGroup Spel
 * @apiParam {Number} id The ID of the spel.
 * 
 * @apiSuccess {Object} spel The spel object.
 * @apiError (400) BadRequest Invalid data provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You don't have access to this resource.
 * @apiError (404) NotFound The requested resource could not be found.
 */
const getSpelById = async (ctx: KoaContext<GetSpelByIdResponse, IdParams>) => {
  ctx.body = await spellenService.getSpelById(Number(ctx.params.id));
};

getSpelById.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
};

/**
 * @api {put} /spel/:id Update spel by ID
 * @apiName UpdateSpel
 * @apiGroup Spel
 * @apiParam {Number} id The ID of the spel to update.
 * @apiBody {String} result The updated result of the spel.
 * 
 * @apiSuccess {Object} spel The updated spel object.
 * @apiError (400) BadRequest Invalid data provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You don't have access to this resource.
 * @apiError (404) NotFound The requested resource could not be found.
 */
const updateSpel = async (ctx: KoaContext<UpdateSpelResponse, IdParams, UpdateSpelRequest>) => {
  const spelId = Number(ctx.params.id); 
  const updatedSpeler = await spellenService.updateSpel(spelId, ctx.request.body); 
  
  ctx.body = updatedSpeler; 
};

updateSpel.validationScheme = {
  params: {
    id: Joi.number().integer().positive().required(),
  },
  body: {
    result: Joi.string().optional(), 
    uitgestelde_datum: Joi.date().iso().optional()
  },
};

/**
 * @api {delete} /spel/:id Delete spel by ID
 * @apiName DeleteSpel
 * @apiGroup Spel
 * @apiParam {Number} id The ID of the spel to delete.
 * 
 * @apiSuccess (204) NoContent The spel was successfully deleted.
 * @apiError (400) BadRequest Invalid data provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You don't have access to this resource.
 * @apiError (404) NotFound The requested resource could not be found.
 */
const removeSpel = async (ctx: KoaContext<void, IdParams>) => {
  const spelId = Number(ctx.params.id);
  spellenService.removeSpel(spelId);
  ctx.status = 204; 
};

removeSpel.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
};

/**
 * @api {get} /spel/speler/:id Get all spellen by player ID
 * @apiName GetSpellenByPlayerId
 * @apiGroup Spel
 * @apiParam {Number} id The ID of the player.
 * 
 * @apiSuccess {Object[]} items List of spellen for the given player.
 * @apiError (400) BadRequest Invalid data provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You don't have access to this resource.
 * @apiError (404) NotFound No spellen found for the given player.
 */
const getSpellenByPlayerId = async (ctx: KoaContext<GetAllSpellenResponse, IdParams>) => {
  const playerId = Number(ctx.params.id);
  const spellen = await spellenService.getSpellenByPlayerId(playerId);

  if (!spellen || spellen.length === 0) {
    ctx.status = 404;
    return;
  }

  ctx.body = {
    items: spellen,
  };
};

getSpellenByPlayerId.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
};

export default (parent: Router<ChessAppState, ChessAppContext>) => {
  const router = new Router({
    prefix: '/spel',
  });

  const requireAdmin = makeRequireRole(Role.ADMIN);

  router.get('/', requireAuthentication, validate(getAllSpellen.validationScheme), getAllSpellen);
  router.get('/:id', requireAuthentication, validate(getSpelById.validationScheme), getSpelById);
  router.get('/speler/:id', requireAuthentication, validate(getSpellenByPlayerId.validationScheme),getSpellenByPlayerId);
  router.post('/', requireAuthentication, requireAdmin, validate(createSpel.validationScheme), createSpel);
  router.put('/:id', requireAuthentication, requireAdmin, validate(updateSpel.validationScheme), updateSpel);
  router.delete('/:id', requireAuthentication, requireAdmin, validate(removeSpel.validationScheme), removeSpel);

  parent.use(router.routes()).use(router.allowedMethods());
};
import Router from '@koa/router';
import * as spellenService from '../service/spellenService';
import type { ChessAppContext, ChessAppState, KoaContext } from '../types/koa';
import type { CreateSpelRequest, CreateSpelResponse, GetAllSpellenResponse, GetSpelByIdResponse, UpdateSpelRequest, UpdateSpelResponse } from '../types/spel';
import type { IdParams } from '../types/common';
import Joi from 'joi';
import validate from '../core/validation';
import { requireAuthentication, makeRequireRole } from '../core/auth';
import Role from '../core/roles';

const getAllSpellen = async (ctx: KoaContext<GetAllSpellenResponse>) => {
  const spellen =  await spellenService.getAllSpellen();
  ctx.body = {
    items: spellen,
  };
};

getAllSpellen.validationScheme = null;

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

const getSpelById = async (ctx: KoaContext<GetSpelByIdResponse, IdParams>) => {
  ctx.body = await spellenService.getSpelById(Number(ctx.params.id));
};

getSpelById.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
};

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
    result: Joi.string().required(), 
  },
};

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
  router.post('/', requireAdmin, requireAuthentication,validate(createSpel.validationScheme), createSpel);
  router.get('/:id', requireAuthentication, validate(getSpelById.validationScheme), getSpelById);
  router.get('/speler/:id', requireAuthentication, validate(getSpellenByPlayerId.validationScheme),getSpellenByPlayerId);
  router.put('/:id', requireAdmin, requireAuthentication, validate(updateSpel.validationScheme), updateSpel);
  router.delete('/:id', requireAdmin, requireAuthentication, validate(removeSpel.validationScheme), removeSpel);

  parent.use(router.routes()).use(router.allowedMethods());
};
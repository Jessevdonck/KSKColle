import Router from '@koa/router';
import {
  shortLivedCacheGet,
  shortLivedCacheSet,
  shortLivedCacheInvalidatePrefix,
  SHORT_CACHE_TTL_MS,
  SHORT_CACHE_KEY_PREFIX,
  invalidateTournamentDetailCache,
} from '../core/shortLivedCache';
import * as tournamentService from '../service/tournamentService';
import type { GetAllTournamentenResponse, GetTournamentByIdResponse, UpdateTournamentRequest, UpdateTournamentResponse } from '../types/tournament';
import type { ChessAppContext, ChessAppState, KoaContext } from '../types/koa';
import type { IdParams } from '../types/common';
import Joi from 'joi';
import validate from '../core/validation';
import { requireAuthentication, makeRequireRole } from '../core/auth';
import Role from '../core/roles';

const toBool = (v?: string) =>
  v === undefined ? undefined : v === 'true' ? true : v === 'false' ? false : undefined;

const TOURNAMENT_LIST_CACHE_PREFIX = SHORT_CACHE_KEY_PREFIX.tournamentList;

function invalidateTournamentListCache() {
  shortLivedCacheInvalidatePrefix(TOURNAMENT_LIST_CACHE_PREFIX);
}

/**
 * @api {get} /tournament Get all tournaments
 * @apiName GetAllTournaments
 * @apiGroup Tournament
 * 
 * @apiSuccess {Object[]} items List of all tournaments.
 * @apiError (400) BadRequest Invalid data provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You don't have access to this resource.
 * @apiError (404) NotFound The requested resource could not be found.
 */
const getAllTournament = async (ctx: KoaContext<GetAllTournamentenResponse>) => {
  const active = toBool(ctx.query.active as string | undefined);
  const youth  = toBool((ctx.query as any).is_youth as string | undefined);

  const cacheKey = `${TOURNAMENT_LIST_CACHE_PREFIX}${String(active)}:${String(youth)}`;
  const cached = shortLivedCacheGet<GetAllTournamentenResponse>(cacheKey);
  if (cached) {
    ctx.body = cached;
    return;
  }

  const toernooien = await tournamentService.getAllTournaments(active, youth);
  const body: GetAllTournamentenResponse = { items: toernooien };
  shortLivedCacheSet(cacheKey, body, SHORT_CACHE_TTL_MS.tournamentList);
  ctx.body = body;
};

getAllTournament.validationScheme = {
  query: {
    active: Joi.string().valid('true', 'false').optional(),
    is_youth: Joi.string().valid('true', 'false').optional(),
  },
};


/**
 * @api {get} /tournament/:id Get tournament by ID
 * @apiName GetTournamentById
 * @apiGroup Tournament
 * @apiParam {Number} id The ID of the tournament.
 * 
 * @apiSuccess {Object} tournament The tournament object.
 * @apiError (400) BadRequest Invalid data provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You don't have access to this resource.
 * @apiError (404) NotFound The requested resource could not be found.
 */
const getTournamentById = async (ctx: KoaContext<GetTournamentByIdResponse, IdParams>) => {
  const id = Number(ctx.params.id);
  const cacheKey = `${SHORT_CACHE_KEY_PREFIX.tournamentDetail}${id}`;
  const cached = shortLivedCacheGet<GetTournamentByIdResponse>(cacheKey);
  if (cached) {
    ctx.body = cached;
    return;
  }
  const body = await tournamentService.getTournamentById(id);
  shortLivedCacheSet(cacheKey, body, SHORT_CACHE_TTL_MS.tournamentDetail);
  ctx.body = body;
};
getTournamentById.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
};

/**
 * @api {put} /tournament/:id Update tournament by ID
 * @apiName UpdateTournament
 * @apiGroup Tournament
 * @apiParam {Number} id The ID of the tournament to update.
 * @apiBody {String} naam The name of the tournament.
 * @apiBody {Date} startdatum The start date of the tournament.
 * 
 * @apiSuccess {Object} tournament The updated tournament object.
 * @apiError (400) BadRequest Invalid data provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You don't have access to this resource.
 * @apiError (404) NotFound The requested resource could not be found.
 */

const updateTournament = async (ctx: KoaContext<UpdateTournamentResponse, IdParams, UpdateTournamentRequest>) => {
  const tournamentId = Number(ctx.params.id); 
  const updatedSpeler = await tournamentService.updateTournament(tournamentId, ctx.request.body); 
  invalidateTournamentListCache();
  invalidateTournamentDetailCache(tournamentId);
  ctx.body = updatedSpeler; 
};
updateTournament.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
  body: {
    naam: Joi.string(),
    rondes: Joi.number().integer().positive(),
    type: Joi.string().valid("SWISS","ROUND_ROBIN"),  
    participations: Joi.array().items(Joi.number().integer().positive()),
  },
};

/**
 * @api {delete} /tournament/:id Delete tournament by ID
 * @apiName DeleteTournament
 * @apiGroup Tournament
 * @apiParam {Number} id The ID of the tournament to delete.
 * 
 * @apiSuccess (204) NoContent The tournament was successfully deleted.
 * @apiError (400) BadRequest Invalid data provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You don't have access to this resource.
 * @apiError (404) NotFound The requested resource could not be found.
 */
const removeTournament = async (ctx: KoaContext<void, IdParams>) => {
  const tournament_id = Number(ctx.params.id);
  tournamentService.removeTournament(tournament_id);
  invalidateTournamentListCache();
  invalidateTournamentDetailCache(tournament_id);
  ctx.status = 204; 
};
removeTournament.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
};

const finalizeRatings = async (ctx: any) => {
  const id = Number(ctx.params.id);
  await tournamentService.finalizeTournamentRatings(id);
  invalidateTournamentListCache();
  invalidateTournamentDetailCache(id);
  ctx.status = 204;
};
finalizeRatings.validationScheme = {
  params: {
    id: Joi.number().integer().positive().required(),
  }
};

const endTournamentHandler = async (ctx: any) => {
  const id = Number(ctx.params.id);
  await tournamentService.endTournament(id);
  invalidateTournamentListCache();
  invalidateTournamentDetailCache(id);
  ctx.status = 204;
};
endTournamentHandler.validationScheme = {
  params: { id: Joi.number().integer().positive().required() },
};


export default (parent: Router<ChessAppState, ChessAppContext>) => {
  const router = new Router({
    prefix: '/tournament',
  });

  const requireAdmin = makeRequireRole(Role.ADMIN);

  router.get('/', validate(getAllTournament.validationScheme), getAllTournament);
  router.get('/:id', validate(getTournamentById.validationScheme), getTournamentById);
  router.post("/:id/finalize", requireAuthentication, requireAdmin, validate(finalizeRatings.validationScheme), finalizeRatings);
  router.post("/:id/end",requireAuthentication,requireAdmin,validate(endTournamentHandler.validationScheme),endTournamentHandler);
  router.put('/:id', requireAuthentication, requireAdmin, validate(updateTournament.validationScheme),updateTournament);
  router.delete('/:id', requireAuthentication, requireAdmin, validate(removeTournament.validationScheme), removeTournament);


  parent.use(router.routes()).use(router.allowedMethods());
};
import Router from '@koa/router';
import * as tournamentService from '../service/tournamentService';
import type { CreateTournamentRequest, CreateTournamentResponse, GetAllTournamentenResponse, GetTournamentByIdResponse, UpdateTournamentRequest, UpdateTournamentResponse } from '../types/tournament';
import type { ChessAppContext, ChessAppState, KoaContext } from '../types/koa';
import type { IdParams } from '../types/common';
import Joi from 'joi';
import validate from '../core/validation';
import { requireAuthentication, makeRequireRole } from '../core/auth';
import Role from '../core/roles';
import { createAndSavePairings } from '../service/pairingService';

const toBool = (v?: string) =>
  v === undefined ? undefined : v === 'true' ? true : v === 'false' ? false : undefined;

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

  const toernooien = await tournamentService.getAllTournaments(active, youth);
  ctx.body = { items: toernooien };
};

getAllTournament.validationScheme = {
  query: {
    active: Joi.string().valid('true', 'false').optional(),
    is_youth: Joi.string().valid('true', 'false').optional(),
  },
};


/**
 * @api {post} /tournament Create a new tournament
 * @apiName CreateTournament
 * @apiGroup Tournament
 * 
 * @apiBody {String} naam The name of the tournament.
 * @apiBody {Number} rondes The number of rounds in the tournament.
 * @apiBody {Number[]} participations Array of participant IDs.
 * 
 * @apiSuccess {Object} tournament The created tournament object.
 * @apiError (400) BadRequest Invalid data provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You don't have access to this resource.
 * @apiError (404) NotFound The requested resource could not be found.
 */
const createTournament = async (ctx: KoaContext<CreateTournamentResponse, void, CreateTournamentRequest>) => {
  
  const newSpeler: any = await tournamentService.addTournament(ctx.request.body);
  console.log('BODY:', ctx.request.body)
  ctx.status = 201; 
  ctx.body = newSpeler;
};
createTournament.validationScheme = {
  body: {
    naam: Joi.string(),
    rondes: Joi.number().integer().positive(),
    type: Joi.string().valid('SWISS', 'ROUND_ROBIN'),
    participations: Joi.array().items(Joi.number().integer().positive()),
    is_youth: Joi.boolean().optional(), 
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
  ctx.body = await tournamentService.getTournamentById(Number(ctx.params.id));
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
  ctx.status = 204; 
};
removeTournament.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
};

/**
 * @api {post} /tournament/:id/pairings/:rondeNummer Generate pairings for a round
 */
const generatePairings = async (ctx: KoaContext<void, IdParams & { rondeNummer: number }>) => {
  const tournamentId  = Number(ctx.params.id);
  const rondeNummer   = Number(ctx.params.rondeNummer);

  try {
    await createAndSavePairings(tournamentId, rondeNummer);
    ctx.status = 201;      
  } catch (error) {
    ctx.throw(400, error instanceof Error ? error.message : 'Pairing mislukt');
  }
};
generatePairings.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
    rondeNummer: Joi.number().integer().positive(),
  },
};

const finalizeRatings = async (ctx: any) => {
  const id = Number(ctx.params.id);
  await tournamentService.finalizeTournamentRatings(id);
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
  router.post('/', requireAuthentication, requireAdmin, validate(createTournament.validationScheme), createTournament);
  router.post('/:id/pairings/:rondeNummer', requireAuthentication, requireAdmin, validate(generatePairings.validationScheme), generatePairings);
  router.post("/:id/finalize", requireAuthentication, requireAdmin, validate(finalizeRatings.validationScheme), finalizeRatings);
  router.post("/:id/end",requireAuthentication,requireAdmin,validate(endTournamentHandler.validationScheme),endTournamentHandler);
  router.put('/:id', requireAuthentication, requireAdmin, validate(updateTournament.validationScheme),updateTournament);
  router.delete('/:id', requireAuthentication, requireAdmin, validate(removeTournament.validationScheme), removeTournament);


  parent.use(router.routes()).use(router.allowedMethods());
};
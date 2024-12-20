import Router from '@koa/router';
import * as tournamentService from '../service/tournamentService';
import type { CreateTournamentRequest, CreateTournamentResponse, GetAllTournamentenResponse, GetTournamentByIdResponse, UpdateTournamentRequest, UpdateTournamentResponse } from '../types/tournament';
import type { ChessAppContext, ChessAppState, KoaContext } from '../types/koa';
import type { IdParams } from '../types/common';
import { createAndSaveSwissPairings } from '../service/swiss-pairings';
import Joi from 'joi';
import validate from '../core/validation';
import { requireAuthentication, makeRequireRole } from '../core/auth';
import Role from '../core/roles';

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
  const spelers =  await tournamentService.getAllTournaments();
  ctx.body = {
    items: spelers,
  };
};
getAllTournament.validationScheme = null;

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
  ctx.status = 201; 
  ctx.body = newSpeler;
};
createTournament.validationScheme = {
  body: {
    naam: Joi.string(),
    rondes: Joi.number().integer().positive(),
    participations: Joi.array().items(Joi.number().integer().positive()), 
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
    startdatum: Joi.date(),
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
 * @apiName GeneratePairings
 * @apiGroup Tournament
 * @apiParam {Number} id The ID of the tournament.
 * @apiParam {Number} rondeNummer The round number for which to generate pairings.
 * 
 * @apiSuccess (201) Created The pairings were successfully generated.
 * @apiError (400) BadRequest Invalid data provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You don't have access to this resource.
 * @apiError (404) NotFound The requested resource could not be found.
 */
const generatePairings = async (ctx: KoaContext<void, IdParams & { rondeNummer: number }>) => {
  const tournamentId = Number(ctx.params.id);
  const rondeNummer = Number(ctx.params.rondeNummer);
  
  try {
    await createAndSaveSwissPairings(tournamentId, rondeNummer);
    ctx.status = 201;
  } catch (error) {
    ctx.status = 400;
  }
};
generatePairings.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
    rondeNummer: Joi.number().integer().positive(),
  },
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
  router.put('/:id', requireAuthentication, requireAdmin, validate(updateTournament.validationScheme),updateTournament);
  router.delete('/:id', requireAuthentication, requireAdmin, validate(removeTournament.validationScheme), removeTournament);

  parent.use(router.routes()).use(router.allowedMethods());
};
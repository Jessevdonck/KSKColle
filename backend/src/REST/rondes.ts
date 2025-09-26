import Router from '@koa/router';
import * as rondeService from '../service/rondeService';
import type { ChessAppContext, ChessAppState, KoaContext } from '../types/koa';
import type { CreateRoundRequest, CreateRoundResponse, GetAllRoundsResponse, GetRoundByIdResponse, IdRondeParams, UpdateRoundRequest, UpdateRoundResponse } from '../types/ronde';
import Koa from 'koa';
import { getRondeByTournamentId } from '../service/rondeService';
import Joi from 'joi';
import validate from '../core/validation';
import { requireAuthentication, makeRequireRole } from '../core/auth';
import Role from '../core/roles';

/**
 * @api {get} /rondes Get all rondes
 * @apiName GetAllRondes
 * @apiGroup Ronde
 *
 * @apiSuccess {Object[]} items List of all rondes.
 */
const getAllRondes = async (ctx: KoaContext<GetAllRoundsResponse>) => {
  const spelers =  await rondeService.getAllRondes();
  ctx.body = {
    items: spelers,
  };
};
getAllRondes.validationScheme = null;

/**
 * @api {get} /rondes/next/:tournament_id Get next available round number
 * @apiName GetNextRoundNumber
 * @apiGroup Ronde
 *
 * @apiParam {Number} tournament_id The ID of the tournament.
 *
 * @apiSuccess {Number} nextRoundNumber The next available round number.
 */
const getNextRoundNumber = async (ctx: KoaContext<{ nextRoundNumber: number }, { tournament_id: string }>) => {
  const tournament_id = Number(ctx.params.tournament_id);
  const nextRoundNumber = await rondeService.getNextRegularRoundNumber(tournament_id);
  ctx.body = { nextRoundNumber };
};
getNextRoundNumber.validationScheme = {
  params: {
    tournament_id: Joi.number().integer().positive().required(),
  },
};

/**
 * @api {post} /rondes Create a new ronde
 * @apiName CreateRonde
 * @apiGroup Ronde
 *
 * @apiBody {Number} tournament_id ID of the tournament
 * @apiBody {Number} ronde_nummer The number of the ronde
 * @apiBody {Date} ronde_datum The date of the ronde
 *
 * @apiSuccess {Object} newRound The created ronde object.
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 201 Created
 *   {
 *     "ronde_id": 1,
 *     "tournament_id": 2,
 *     "ronde_nummer": 1,
 *     "ronde_datum": "2024-12-20T00:00:00.000Z"
 *   }
 */
const createRonde = async (ctx: KoaContext<CreateRoundResponse, void, CreateRoundRequest>) => {
  const newRound: any = await rondeService.createRonde(ctx.request.body);
  ctx.status = 201; 
  ctx.body = newRound;
};
createRonde.validationScheme = {
  body: {
    tournament_id: Joi.number().integer().positive().required(),
    ronde_nummer: Joi.number().integer().positive().required(),
    ronde_datum: Joi.date().required(),
    startuur: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default("20:00"),
  },
};

/**
 * @api {get} /rondes/:ronde_id Get ronde by ID
 * @apiName GetRondeById
 * @apiGroup Ronde
 *
 * @apiParam {Number} ronde_id The ID of the ronde.
 *
 * @apiSuccess {Object} ronde The ronde data.
 * @apiError (404) RondeNotFound Ronde with the given ID does not exist.
 */
const getRondeById = async (ctx: KoaContext<GetRoundByIdResponse, IdRondeParams>) => {
  ctx.body = await rondeService.getById(
    ctx.params.ronde_id, 
  );
};
getRondeById.validationScheme = {
  params: {
    ronde_id: Joi.number().integer().positive(),
  },
};

/**
 * @api {get} /rondes/:tournament_id/rondes/:round_id Get ronde by tournament ID and round ID
 * @apiName GetRondeByTournament
 * @apiGroup Ronde
 *
 * @apiParam {Number} tournament_id The tournament ID.
 * @apiParam {Number} round_id The round ID.
 *
 * @apiSuccess {Object} ronde The ronde data.
 */
const getRondeByTournament = async (ctx: Koa.Context) => {
  const tournamentId = Number(ctx.params.tournament_id);
  const roundId = Number(ctx.params.round_id);

  const ronde = await getRondeByTournamentId(tournamentId, roundId);
  ctx.body = ronde;
};
getRondeByTournament.validationScheme = {
  params: {
    tournament_id: Joi.number().integer().positive(),
    round_id: Joi.number().integer().positive(),
  },
};

/**
 * @api {put} /rondes/:tournament_id/rondes/:ronde_id Update ronde
 * @apiName UpdateRonde
 * @apiGroup Ronde
 *
 * @apiParam {Number} tournament_id The ID of the tournament.
 * @apiParam {Number} ronde_id The ID of the ronde.
 * @apiBody {Number} ronde_nummer The number of the ronde.
 * @apiBody {Date} ronde_datum The new date of the ronde.
 *
 * @apiSuccess {Object} updatedSpeler The updated ronde data.
 */
const updateRonde = async (ctx: KoaContext<UpdateRoundResponse, IdRondeParams, UpdateRoundRequest>) => {
  const tournamentId = Number(ctx.params.tournament_id); 
  const roundId = Number(ctx.params.ronde_id);
  const updatedSpeler = await rondeService.updateRonde(tournamentId, roundId, ctx.request.body); 
  
  ctx.body = updatedSpeler; 
};
updateRonde.validationScheme = {
  params: {
    tournament_id: Joi.number().integer().positive(),
    ronde_id: Joi.number().integer().positive(),
  },
  body: {
    ronde_nummer: Joi.number().integer().positive(),
    ronde_datum: Joi.date(),
    startuur: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  },
};

/**
 * @api {delete} /rondes/:tournament_id/rondes/:ronde_id Remove ronde
 * @apiName RemoveRonde
 * @apiGroup Ronde
 *
 * @apiParam {Number} tournament_id The ID of the tournament.
 * @apiParam {Number} ronde_id The ID of the ronde.
 *
 * @apiSuccess (204) NoContent The ronde was successfully deleted.
 */
const removeRonde = async (ctx: KoaContext<void, IdRondeParams>) => {
  const tournament_id = Number(ctx.params.tournament_id);
  const ronde_id = Number(ctx.params.ronde_id);
  rondeService.removeRound(tournament_id, ronde_id);
  ctx.status = 204; 
};
removeRonde.validationScheme = {
  params: {
    tournament_id: Joi.number().integer().positive(),
    ronde_id: Joi.number().integer().positive(),
  },
};

/**
 * @api {get} /rondes/:tournament_id/rondes Get all rondes by tournament ID
 * @apiName GetAllRondesByTournamentId
 * @apiGroup Ronde
 *
 * @apiParam {Number} tournament_id The ID of the tournament.
 *
 * @apiSuccess {Object[]} items List of all rondes in the tournament.
 * @apiError (404) TournamentNotFound No tournament with the given ID exists.
 */
const getAllRondesByTournamentId = async (ctx: any) => {
  const tournamentId = Number(ctx.params.tournament_id);
  const rondes = await rondeService.getAllRondesByTournamentId(tournamentId);

  if (rondes.length === 0) {
    ctx.status = 404; 
    ctx.body = {
      code: 'NOT_FOUND',
      message: `No tournament with this id exists`,
    };
    return; 
  }
  ctx.body = {
    items: rondes,
  };
};
getAllRondesByTournamentId.validationScheme = {
  params: {
    tournament_id: Joi.number().integer().positive(),
  },
};

/**
 * @api {get} /rondes/:tournament_id/rondes/:round_id/export Get round data for PDF export
 * @apiName GetRoundForExport
 * @apiGroup Ronde
 *
 * @apiParam {Number} tournament_id The ID of the tournament.
 * @apiParam {Number} round_id The ID of the round.
 *
 * @apiSuccess {Object} roundData The round data with games and players for PDF export.
 */
const getRoundForExport = async (ctx: any) => {
  const tournamentId = Number(ctx.params.tournament_id);
  const roundId = Number(ctx.params.round_id);
  
  const roundData = await rondeService.getRoundForExport(tournamentId, roundId);
  ctx.body = roundData;
};
getRoundForExport.validationScheme = {
  params: {
    tournament_id: Joi.number().integer().positive(),
    round_id: Joi.number().integer().positive(),
  },
};

export default (parent: Router<ChessAppState, ChessAppContext>) => {
  const router = new Router({
    prefix: '/rondes',
  });

  const requireAdmin = makeRequireRole(Role.ADMIN);

  router.get('/', requireAuthentication, validate(getAllRondes.validationScheme), getAllRondes);
  router.get('/next/:tournament_id', requireAuthentication, validate(getNextRoundNumber.validationScheme), getNextRoundNumber);
  router.get('/:tournament_id/rondes',validate(getAllRondesByTournamentId.validationScheme), getAllRondesByTournamentId);
  router.get('/:ronde_id', validate(getRondeById.validationScheme), getRondeById);
  router.get('/:tournament_id/rondes/:round_id', requireAuthentication, validate(getRondeByTournament.validationScheme), getRondeByTournament); 
  router.get('/:tournament_id/rondes/:round_id/export', requireAuthentication, requireAdmin, validate(getRoundForExport.validationScheme), getRoundForExport);
  router.post('/', requireAuthentication, requireAdmin, validate(createRonde.validationScheme), createRonde);
  router.put('/:tournament_id/rondes/:ronde_id', requireAuthentication, requireAdmin, validate(updateRonde.validationScheme), updateRonde); 
  router.delete('/:tournament_id/rondes/:ronde_id', requireAuthentication, requireAdmin, validate(removeRonde.validationScheme), removeRonde); 

  parent.use(router.routes()).use(router.allowedMethods());
};

export {
  getAllRondes,
  getNextRoundNumber,
  createRonde,
  getRondeById,
  getAllRondesByTournamentId,
  getRondeByTournament,
  getRoundForExport,
  updateRonde,
  removeRonde,
};
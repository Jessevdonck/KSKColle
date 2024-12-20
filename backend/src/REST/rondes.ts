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

const getAllRondes = async (ctx: KoaContext<GetAllRoundsResponse>) => {
  const spelers =  await rondeService.getAllRondes();
  ctx.body = {
    items: spelers,
  };
};
getAllRondes.validationScheme = null;

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
  },
};

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
  },
};

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

export default (parent: Router<ChessAppState, ChessAppContext>) => {
  const router = new Router({
    prefix: '/rondes',
  });

  const requireAdmin = makeRequireRole(Role.ADMIN);

  router.get('/', requireAuthentication, validate(getAllRondes.validationScheme), getAllRondes);
  router.get('/:tournament_id/rondes',validate(getAllRondesByTournamentId.validationScheme), getAllRondesByTournamentId);
  router.get('/:ronde_id', validate(getRondeById.validationScheme), getRondeById);
  router.post('/', requireAuthentication, requireAdmin, validate(createRonde.validationScheme), createRonde);
  router.get('/:tournament_id/rondes/:round_id', requireAuthentication, validate(getRondeByTournament.validationScheme), getRondeByTournament); 
  router.put('/:tournament_id/rondes/:ronde_id', requireAuthentication, requireAdmin, validate(updateRonde.validationScheme), updateRonde); 
  router.delete('/:tournament_id/rondes/:ronde_id', requireAuthentication, requireAdmin, validate(removeRonde.validationScheme), removeRonde); 

  parent.use(router.routes()).use(router.allowedMethods());
};
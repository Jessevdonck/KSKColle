import Router from '@koa/router';
import * as rondeService from '../service/rondeService';
import type { KoaContext } from '../types/koa';
import type { CreateRoundRequest, CreateRoundResponse, GetAllRoundsResponse, IdRondeParams, UpdateRoundRequest, UpdateRoundResponse } from '../types/ronde';
import Koa from 'koa';
import { getRondeByTournamentId } from '../service/rondeService';
import ServiceError from '../core/serviceError';
import Joi from 'joi';
import validate from '../core/validation';

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

const getRondeById = async (ctx: Koa.Context) => {
  const tournamentId = Number(ctx.params.tournament_id);
  const roundId = Number(ctx.params.round_id);

  if (isNaN(tournamentId) || isNaN(roundId)) {
    ctx.status = 400;
    ctx.body = {
      code: 'VALIDATION_FAILED',
      message: 'Invalid tournament_id or round_id',
      details: {
        params: {
          tournament_id: ctx.params.tournament_id,
          round_id: ctx.params.round_id,
        },
      },
    };
    return;
  }

  try {
    const ronde = await getRondeByTournamentId(tournamentId, roundId);
    ctx.status = 200;
    ctx.body = ronde;
  } catch (error) {
    if (error instanceof ServiceError) {
      switch (error.code) {
        case 'NOT_FOUND':
          ctx.status = 404;
          break;
        case 'VALIDATION_FAILED':
          ctx.status = 400;
          break;
        default:
          ctx.status = 500;
      }
      ctx.body = {
        code: error.code,
        message: error.message,
        stack: (error as Error).stack,
      };
    } else {
      ctx.status = 500;
      ctx.body = {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        stack: (error as Error).stack,
      };
    }
  }
};
getRondeById.validationScheme = {
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
    round_id: Joi.number().integer().positive(),
  },
  body: {
    ronde_nummer: Joi.number().integer().positive(),
    ronde_datum: Joi.date(),
  },
};

const removeRonde = async (ctx: KoaContext<void, IdRondeParams>) => {
  const tournament_id = Number(ctx.params.tournament_id);
  const roundId = Number(ctx.params.ronde_id);
  rondeService.removeRound(tournament_id, roundId);
  ctx.status = 204; 
};
removeRonde.validationScheme = {
  params: {
    tournament_id: Joi.number().integer().positive(),
    round_id: Joi.number().integer().positive(),
  },
};

const getAllRondesByTournamentId = async (ctx: any) => {
  const tournamentId = Number(ctx.params.tournament_id);
  const rondes = await rondeService.getAllRondesByTournamentId(tournamentId);
  ctx.body = {
    items: rondes,
  };
};
getAllRondesByTournamentId.validationScheme = {
  params: {
    tournament_id: Joi.number().integer().positive(),
  },
};

export default (parent: Router) => {
  const router = new Router({
    prefix: '/rondes',
  });

  router.get('/', validate(getAllRondes.validationScheme), getAllRondes);
  router.get('/:tournament_id/rondes',validate(getAllRondesByTournamentId.validationScheme), getAllRondesByTournamentId);
  router.post('/',validate(createRonde.validationScheme), createRonde);
  router.get('/:tournament_id/rondes/:round_id',validate(getRondeById.validationScheme), getRondeById); 
  router.put('/:tournament_id/rondes/:round_id',validate(updateRonde.validationScheme), updateRonde); 
  router.delete('/:tournament_id/rondes/:round_id',validate(removeRonde.validationScheme), removeRonde); 

  parent.use(router.routes()).use(router.allowedMethods());
};removeRonde
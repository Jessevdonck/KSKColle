import Router from '@koa/router';
import * as toernooienService from '../service/toernooienService';
import type { CreateToernooiRequest, CreateToernooiResponse, GetAllToernooienResponse, GetToernooiByIdResponse, UpdateToernooiRequest, UpdateToernooiResponse } from '../types/toernooi';
import type { KoaContext } from '../types/koa';
import type { IdParams } from '../types/common';
import { createAndSaveSwissPairings } from '../service/swiss-pairings';
import Joi from 'joi';
import validate from '../core/validation';

const getAllTournament = async (ctx: KoaContext<GetAllToernooienResponse>) => {
  const spelers =  await toernooienService.getAllTournaments();
  ctx.body = {
    items: spelers,
  };
};
getAllTournament.validationScheme = null;

const createTournament = async (ctx: KoaContext<CreateToernooiResponse, void, CreateToernooiRequest>) => {
  const newSpeler: any = await toernooienService.addTournament(ctx.request.body);
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

const getTournamentById = async (ctx: KoaContext<GetToernooiByIdResponse, IdParams>) => {
  ctx.body = await toernooienService.getTournamentById(Number(ctx.params.id));
};
getTournamentById.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
};

const updateTournament = async (ctx: KoaContext<UpdateToernooiResponse, IdParams, UpdateToernooiRequest>) => {
  const tournamentId = Number(ctx.params.id); 
  const updatedSpeler = await toernooienService.updateTournament(tournamentId, ctx.request.body); 
  
  ctx.body = updatedSpeler; 
};
updateTournament.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
  body: {
    toernooi_naam: Joi.string(),
    toernooi_datum: Joi.date(),
  },
};

const removeTournament = async (ctx: KoaContext<void, IdParams>) => {
  const tournament_id = Number(ctx.params.id);
  toernooienService.removeTournament(tournament_id);
  ctx.status = 204; 
};
removeTournament.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
};

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

export default (parent: Router) => {
  const router = new Router({
    prefix: '/toernooien',
  });

  router.get('/', validate(getAllTournament.validationScheme), getAllTournament);
  router.post('/', validate(createTournament.validationScheme), createTournament);
  router.get('/:id', validate(getTournamentById.validationScheme), getTournamentById);
  router.put('/:id',validate(updateTournament.validationScheme),updateTournament);
  router.delete('/:id', validate(removeTournament.validationScheme), removeTournament);
  router.post('/:id/pairings/:rondeNummer', validate(generatePairings.validationScheme), generatePairings);

  parent.use(router.routes()).use(router.allowedMethods());
};
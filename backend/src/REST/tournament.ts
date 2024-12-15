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

const getAllTournament = async (ctx: KoaContext<GetAllTournamentenResponse>) => {
  const spelers =  await tournamentService.getAllTournaments();
  ctx.body = {
    items: spelers,
  };
};
getAllTournament.validationScheme = null;

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

const getTournamentById = async (ctx: KoaContext<GetTournamentByIdResponse, IdParams>) => {
  ctx.body = await tournamentService.getTournamentById(Number(ctx.params.id));
};
getTournamentById.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
};

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

  router.get('/', requireAuthentication, validate(getAllTournament.validationScheme), getAllTournament);
  router.post('/', requireAuthentication, requireAdmin, validate(createTournament.validationScheme), createTournament);
  router.get('/:id', requireAuthentication, validate(getTournamentById.validationScheme), getTournamentById);
  router.put('/:id', requireAuthentication, requireAdmin, validate(updateTournament.validationScheme),updateTournament);
  router.delete('/:id', requireAuthentication, requireAdmin, validate(removeTournament.validationScheme), removeTournament);
  router.post('/:id/pairings/:rondeNummer', requireAuthentication, requireAdmin, validate(generatePairings.validationScheme), generatePairings);

  parent.use(router.routes()).use(router.allowedMethods());
};
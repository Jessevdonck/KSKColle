import Router from '@koa/router';
import * as toernooienService from '../service/toernooienService';
import type { CreateToernooiRequest, CreateToernooiResponse, GetAllToernooienResponse, GetToernooiByIdResponse, UpdateToernooiRequest, UpdateToernooiResponse } from '../types/toernooi';
import type { KoaContext } from '../types/koa';
import type { IdParams } from '../types/common';
import { createAndSaveSwissPairings } from '../service/swiss-pairings';

const getAllTournament = async (ctx: KoaContext<GetAllToernooienResponse>) => {
  const spelers =  await toernooienService.getAllTournaments();
  ctx.body = {
    items: spelers,
  };
};

const createTournament = async (ctx: KoaContext<CreateToernooiResponse, void, CreateToernooiRequest>) => {
  const newSpeler: any = await toernooienService.addTournament(ctx.request.body);
  ctx.status = 201; 
  ctx.body = newSpeler;
};

const getTournamentById = async (ctx: KoaContext<GetToernooiByIdResponse, IdParams>) => {
  ctx.body = await toernooienService.getTournamentById(Number(ctx.params.id));
};

const updateTournament = async (ctx: KoaContext<UpdateToernooiResponse, IdParams, UpdateToernooiRequest>) => {
  const tournamentId = Number(ctx.params.id); 
  const updatedSpeler = await toernooienService.updateTournament(tournamentId, ctx.request.body); 
  
  ctx.body = updatedSpeler; 
};

const removeTournament = async (ctx: KoaContext<void, IdParams>) => {
  const tournament_id = Number(ctx.params.id);
  toernooienService.removeTournament(tournament_id);
  ctx.status = 204; 
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

export default (parent: Router) => {
  const router = new Router({
    prefix: '/toernooien',
  });

  router.get('/', getAllTournament);
  router.post('/', createTournament);
  router.get('/:id', getTournamentById);
  router.put('/:id', updateTournament);
  router.delete('/:id', removeTournament);
  router.post('/:id/pairings/:rondeNummer', generatePairings);

  parent.use(router.routes()).use(router.allowedMethods());
};
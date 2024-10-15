import Router from '@koa/router';
import * as toernooienService from '../service/toernooienService';
import type { Context } from 'koa';

const getAllTournament = async (ctx: Context) => {
  const spelers =  await toernooienService.getAllTournament();
  ctx.body = {
    items: spelers,
  };
};

const createTournament = async (ctx: Context) => {
  const newSpeler: any = await toernooienService.addTournament(ctx.request.body);
  ctx.status = 201; 
  ctx.body = {
    message: 'Speler succesvol toegevoegd',
    speler: newSpeler,
  };
};

const getTournamentById = async (ctx: Context) => {
  ctx.body = await toernooienService.getTournamentById(String(ctx.params.id));
};

const updateTournament = async (ctx: any) => {
  const tournamentId = String(ctx.params.id); 
  const updatedSpeler = await toernooienService.updateTournament(tournamentId, ctx.request.body); 
  
  ctx.body = updatedSpeler; 
};

const removeTournament = async (ctx: Context) => {
  const tournament_id = String(ctx.params.id);
  toernooienService.removeTournament(tournament_id);
  ctx.status = 204; 
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

  parent.use(router.routes()).use(router.allowedMethods());
};
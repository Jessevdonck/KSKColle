import Router from '@koa/router';
import * as rondeService from '../service/rondeService';
import type { Context } from 'koa';

const getAllRondes = async (ctx: Context) => {
  const spelers =  await rondeService.getAllRondes();
  ctx.body = {
    items: spelers,
  };
};

const createRonde = async (ctx: Context) => {
  const newSpeler: any = await rondeService.createRonde(ctx.request.body);
  ctx.status = 201; 
  ctx.body = {
    message: 'Speler succesvol toegevoegd',
    speler: newSpeler,
  };
};

const getRondeById = async (ctx: Context) => {
  const tournamentId = String(ctx.params.id); 
  const roundId = Number(ctx.params.roundId);
  ctx.body = await rondeService.getRondeByTournamentId(tournamentId, roundId);
};

const updateRonde = async (ctx: any) => {
  const tournamentId = String(ctx.params.id); 
  const roundId = Number(ctx.params.roundId);
  const updatedSpeler = await rondeService.updateRonde(tournamentId, roundId, ctx.request.body); 
  
  ctx.body = updatedSpeler; 
};

const removeRonde = async (ctx: Context) => {
  const tournament_id = String(ctx.params.id);
  const roundId = Number(ctx.params.roundId);
  rondeService.removeRound(tournament_id, roundId);
  ctx.status = 204; 
};

export default (parent: Router) => {
  const router = new Router({
    prefix: '/rondes',
  });

  router.get('/', getAllRondes);
  router.post('/', createRonde);
  router.get('/:id/rondes/:roundId', getRondeById);
  router.put('/:id/rondes/:roundId', updateRonde);
  router.delete('/:id/rondes/:roundId', removeRonde);

  parent.use(router.routes()).use(router.allowedMethods());
};
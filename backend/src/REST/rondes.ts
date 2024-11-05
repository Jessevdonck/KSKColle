import Router from '@koa/router';
import * as rondeService from '../service/rondeService';
import type { KoaContext } from '../types/koa';
import type { CreateRoundRequest, CreateRoundResponse, GetAllRoundsResponse, GetRoundByIdResponse, IdRondeParams, UpdateRoundRequest, UpdateRoundResponse } from '../types/ronde';

const getAllRondes = async (ctx: KoaContext<GetAllRoundsResponse>) => {
  const spelers =  await rondeService.getAllRondes();
  ctx.body = {
    items: spelers,
  };
};

const createRonde = async (ctx: KoaContext<CreateRoundResponse, void, CreateRoundRequest>) => {
  const newRound: any = await rondeService.createRonde(ctx.request.body);
  ctx.status = 201; 
  ctx.body = newRound;
};

const getRondeById = async (ctx: KoaContext<GetRoundByIdResponse, IdRondeParams>) => {
  const tournamentId = Number(ctx.params.tournament_id); 
  const roundId = Number(ctx.params.ronde_id);
  ctx.body = await rondeService.getRondeByTournamentId(tournamentId, roundId);
};

const updateRonde = async (ctx: KoaContext<UpdateRoundResponse, IdRondeParams, UpdateRoundRequest>) => {
  const tournamentId = Number(ctx.params.tournament_id); 
  const roundId = Number(ctx.params.ronde_id);
  const updatedSpeler = await rondeService.updateRonde(tournamentId, roundId, ctx.request.body); 
  
  ctx.body = updatedSpeler; 
};

const removeRonde = async (ctx: KoaContext<void, IdRondeParams>) => {
  const tournament_id = Number(ctx.params.tournament_id);
  const roundId = Number(ctx.params.ronde_id);
  rondeService.removeRound(tournament_id, roundId);
  ctx.status = 204; 
};

export default (parent: Router) => {
  const router = new Router({
    prefix: '/rondes',
  });

  router.get('/', getAllRondes);
  router.post('/', createRonde);
  router.get('/:tournament_id/rondes/:ronde_id', getRondeById); 
  router.put('/:tournament_id/rondes/:ronde_id', updateRonde); 
  router.delete('/:tournament_id/rondes/:ronde_id', removeRonde); 

  parent.use(router.routes()).use(router.allowedMethods());
};
import Router from '@koa/router';
import * as spelerService from '../service/spelersService';
import type { Speler, CreateSpelerResponse, CreateSpelerRequest, GetSpelerByIdResponse, UpdateSpelerResponse, UpdateSpelerRequest, GetAllSpelersResponse } from '../types/speler';
import type { KoaContext } from '../types/koa';
import type { IdParams } from '../types/common';

const getAllSpelers = async (ctx: KoaContext<GetAllSpelersResponse>): Promise<Speler[]> => {
  const spelers =  await spelerService.getAllSpelers();
  ctx.body = {
    items: spelers,
  };

  return spelers;
};

const createSpeler = async (ctx: KoaContext<CreateSpelerResponse, void, CreateSpelerRequest>) => {
  const newSpeler: any = await spelerService.createSpeler(ctx.request.body);
  ctx.status = 201; 
  ctx.body = newSpeler;
};

const getSpelerByID = async (ctx: KoaContext<GetSpelerByIdResponse, IdParams>) => {
  ctx.body = await spelerService.getSpelerById(Number(ctx.params.id));
};

const updateSpeler = async (ctx: KoaContext<UpdateSpelerResponse, IdParams, UpdateSpelerRequest>) => {
  const spelerId = Number(ctx.params.id); 
  const updatedSpeler = await spelerService.updateUser(spelerId, ctx.request.body); 
  
  ctx.body = updatedSpeler; 
};

const removeSpeler = async (ctx: KoaContext<void, IdParams>) => {
  const spelerId = Number(ctx.params.id);
  spelerService.removeSpeler(spelerId);
  ctx.status = 204; 
};

export default (parent: Router) => {
  const router = new Router({
    prefix: '/spelers',
  });

  router.get('/', getAllSpelers);
  router.post('/', createSpeler);
  router.get('/:id', getSpelerByID);
  router.put('/:id', updateSpeler);
  router.delete('/:id', removeSpeler);

  parent.use(router.routes()).use(router.allowedMethods());
};
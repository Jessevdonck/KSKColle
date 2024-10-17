import Router from '@koa/router';
import * as spellenService from '../service/spellenService';
import type { KoaContext } from '../types/koa';
import type { CreateSpelRequest, CreateSpelResponse, GetAllSpellenResponse, GetSpelByIdResponse, UpdateSpelRequest, UpdateSpelResponse } from '../types/spel';
import type { IdParams } from '../types/common';

const getAllSpellen = async (ctx: KoaContext<GetAllSpellenResponse>) => {
  const spellen =  await spellenService.getAllSpellen();
  ctx.body = {
    items: spellen,
  };
};

const createSpel = async (ctx: KoaContext<CreateSpelResponse, void, CreateSpelRequest>) => {
  const newSpel: any = await spellenService.createSpel(ctx.request.body);
  ctx.status = 201; 
  ctx.body = newSpel;
};

const getSpelById = async (ctx: KoaContext<GetSpelByIdResponse, IdParams>) => {
  ctx.body = await spellenService.getSpelById(String(ctx.params.id));
};

const updateSpel = async (ctx: KoaContext<UpdateSpelResponse, IdParams, UpdateSpelRequest>) => {
  const spelId = String(ctx.params.id); 
  const updatedSpeler = await spellenService.updateSpel(spelId, ctx.request.body); 
  
  ctx.body = updatedSpeler; 
};

const removeSpel = async (ctx: KoaContext<void, IdParams>) => {
  const spelId = String(ctx.params.id);
  spellenService.removeSpel(spelId);
  ctx.status = 204; 
};

export default (parent: Router) => {
  const router = new Router({
    prefix: '/spel',
  });

  router.get('/', getAllSpellen);
  router.post('/', createSpel);
  router.get('/:id', getSpelById);
  router.put('/:id', updateSpel);
  router.delete('/:id', removeSpel);

  parent.use(router.routes()).use(router.allowedMethods());
};
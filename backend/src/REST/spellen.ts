import Router from '@koa/router';
import * as spellenService from '../service/spellenService';
import type { Context } from 'koa';

const getAllSpellen = async (ctx: Context) => {
  const spellen =  await spellenService.getAllSpellen();
  ctx.body = {
    items: spellen,
  };
};

const createSpel = async (ctx: Context) => {
  const newSpel: any = await spellenService.addSpel(ctx.request.body);
  ctx.status = 201; 
  ctx.body = {
    message: 'Spel succesvol toegevoegd',
    speler: newSpel,
  };
};

const getSpelById = async (ctx: Context) => {
  ctx.body = await spellenService.getSpelById(String(ctx.params.id));
};

const updateSpel = async (ctx: any) => {
  const spelId = String(ctx.params.id); 
  const updatedSpeler = await spellenService.updateSpel(spelId, ctx.request.body); 
  
  ctx.body = updatedSpeler; 
};

const removeSpel = async (ctx: Context) => {
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
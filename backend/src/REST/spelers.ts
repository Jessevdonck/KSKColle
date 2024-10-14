import Router from '@koa/router';
import * as spelerService from '../service/spelersService';
import type { Context } from 'koa';

const getAllSpelers = async (ctx: Context) => {
  const spelers =  await spelerService.getAllSpelers();
  ctx.body = {
    items: spelers,
  };
};

const createSpeler = async (ctx: Context) => {
  const newSpeler: any = spelerService.addSpeler(ctx.request.body as any);
  ctx.status = 201; 
  ctx.body = {
    message: 'Speler succesvol toegevoegd',
    speler: newSpeler,
  };
};

const getSpelerByID = async (ctx: Context) => {
  ctx.body = spelerService.getSpelerById(Number(ctx.params.id));
};

const updateSpeler = async (ctx: any) => {
  const spelerId = Number(ctx.params.id); 
  const updatedSpeler = spelerService.updateUser(spelerId, ctx.request.body); 
  
  ctx.body = updatedSpeler; 
};

const deleteSpeler = async (ctx: Context) => {
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
  router.delete('/:id', deleteSpeler);

  parent.use(router.routes()).use(router.allowedMethods());
};
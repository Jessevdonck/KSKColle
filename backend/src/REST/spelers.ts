import Router from '@koa/router';
import * as spelerService from '../service/spelersService';
import type { Speler, CreateSpelerResponse, CreateSpelerRequest, GetSpelerByIdResponse, UpdateSpelerResponse, UpdateSpelerRequest, GetAllSpelersResponse, GetSpelerByNaamResponse } from '../types/speler';
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
  const newSpeler: CreateSpelerRequest = ctx.request.body;

  try {
    const createdSpeler = await spelerService.createSpeler(newSpeler);
    ctx.status = 201; 
    ctx.body = createdSpeler;
  } catch (error) {
    console.error("Error creating speler:", error);
    ctx.status = 500;
  }
};

const getSpelerByID = async (ctx: KoaContext<GetSpelerByIdResponse, IdParams>) => {
  ctx.body = await spelerService.getSpelerById(Number(ctx.params.id));
};

const updateSpeler = async (ctx: KoaContext<UpdateSpelerResponse, IdParams, UpdateSpelerRequest>) => {
  const spelerId = Number(ctx.params.id); 
  const updatedSpeler = await spelerService.updateUser(spelerId, ctx.request.body); 
  
  ctx.body = updatedSpeler; 
};

const getSpelerByNaam = async (ctx: KoaContext<GetSpelerByNaamResponse>) => {
  const voornaam = decodeURIComponent(ctx.query.voornaam as string);
  const achternaam = decodeURIComponent(ctx.query.achternaam as string);

  if (!voornaam || !achternaam) {
    ctx.status = 400;
    return;
  }

  try {
    const speler = await spelerService.getSpelerByNaam(voornaam, achternaam);
    if (speler) {
      ctx.body = speler;
    } else {
      ctx.status = 404;
    }
  } catch (error) {
    console.error('Error in getSpelerByNaam:', error);
    ctx.status = 500;
  }
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
  router.get('/by-name', getSpelerByNaam);
  router.get('/:id', getSpelerByID);
  router.put('/:id', updateSpeler);
  router.delete('/:id', removeSpeler);

  parent.use(router.routes()).use(router.allowedMethods());
};
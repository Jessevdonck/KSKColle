import Router from '@koa/router';
import * as spelerService from '../service/spelersService';
import type { User, CreateUserResponse, CreateUserRequest, GetUserByIdResponse, UpdateUserResponse, UpdateUserRequest, GetAllUserResponse, GetUserByNaamResponse } from '../types/user';
import type { KoaContext } from '../types/koa';
import type { IdParams } from '../types/common';
import Joi from 'joi';
import validate from '../core/validation';

const getAllUsers = async (ctx: KoaContext<GetAllUserResponse>): Promise<User[]> => {
  const users =  await spelerService.getAllUsers();
  ctx.body = {
    items: users,
  };

  return users;
};
getAllUsers.validationScheme = null;

const createUser = async (ctx: KoaContext<CreateUserResponse, void, CreateUserRequest>) => {
  const newUser: CreateUserRequest = ctx.request.body;

  try {
    const createdUser = await spelerService.createUser(newUser);
    ctx.status = 201; 
    ctx.body = createdUser;
  } catch (error) {
    console.error("Error creating speler:", error);
    ctx.status = 500;
  }
};
createUser.validationScheme = {
  body: {
    voornaam: Joi.string(),
    achternaam: Joi.string(),
    geboortedatum: Joi.date(),
    email: Joi.string().email(),
    tel_nummer: Joi.string(),
    lid_sinds: Joi.date(),
    schaakrating_elo: Joi.number().integer().positive(),
    fide_id: Joi.number().integer().positive().allow(null).optional(),
    schaakrating_max: Joi.number().integer().positive().allow(null).optional(),
  },
};

const getUserById = async (ctx: KoaContext<GetUserByIdResponse, IdParams>) => {
  ctx.body = await spelerService.getUserById(Number(ctx.params.id));
};
getUserById.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
};

const updateUser = async (ctx: KoaContext<UpdateUserResponse, IdParams, UpdateUserRequest>) => {
  const userId = Number(ctx.params.id); 
  const updatedUser = await spelerService.updateUser(userId, ctx.request.body); 
  
  ctx.body = updatedUser; 
};
updateUser.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
  body: {
    voornaam: Joi.string(),
    achternaam: Joi.string(),
    geboortedatum: Joi.date(),
    email: Joi.string().email(),
    tel_nummer: Joi.string(),
    lid_sinds: Joi.date(),
    schaakrating_elo: Joi.number().integer().positive(),
    fide_id: Joi.number().integer().positive().allow(null).optional(),
    schaakrating_max: Joi.number().integer().positive().allow(null).optional(),
  },
};

const getUserByNaam = async (ctx: KoaContext<GetUserByNaamResponse>) => {
  const voornaam = decodeURIComponent(ctx.query.voornaam as string);
  const achternaam = decodeURIComponent(ctx.query.achternaam as string);

  if (!voornaam || !achternaam) {
    ctx.status = 400;
    return;
  }

  try {
    const user = await spelerService.getUserByNaam(voornaam, achternaam);
    if (user) {
      ctx.body = user;
    } else {
      ctx.status = 404;
    }
  } catch (error) {
    console.error('Error in getUserByNaam:', error);
    ctx.status = 500;
  }
};
getUserByNaam.validationScheme = {
  query: {
    voornaam: Joi.string(),
    achternaam: Joi.string(),
  },
};

const removeUser = async (ctx: KoaContext<void, IdParams>) => {
  const userId = Number(ctx.params.id);
  spelerService.removeUser(userId);
  ctx.status = 204; 
};
removeUser.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
};

export default (parent: Router) => {
  const router = new Router({
    prefix: '/users',
  });

  router.get('/', validate(getAllUsers.validationScheme), getAllUsers);
  router.post('/', validate(createUser.validationScheme), createUser);
  router.get('/by-name',validate(getUserByNaam.validationScheme), getUserByNaam);
  router.get('/:id', validate(getUserById.validationScheme), getUserById);
  router.put('/:id', validate(updateUser.validationScheme),updateUser);
  router.delete('/:id', validate(removeUser.validationScheme), removeUser);

  parent.use(router.routes()).use(router.allowedMethods());
};
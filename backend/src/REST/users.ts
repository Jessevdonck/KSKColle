import Router from '@koa/router';
import * as userService from '../service/userService';
import type { User, GetUserByIdResponse, UpdateUserResponse, UpdateUserRequest, GetUserRequest, GetAllUserResponse, GetUserByNaamResponse, LoginResponse, RegisterUserRequest } from '../types/user';
import type { ChessAppContext, ChessAppState, KoaContext } from '../types/koa';
import type { IdParams } from '../types/common';
import Joi from 'joi';
import validate from '../core/validation';
import { requireAuthentication, makeRequireRole, authDelay } from '../core/auth';
import Role from '../core/roles';
import type { Next } from 'koa';


const getAllUsers = async (ctx: KoaContext<GetAllUserResponse>): Promise<User[]> => {
  const users =  await userService.getAllUsers();
  ctx.body = {
    items: users,
  };

  return users;
};
getAllUsers.validationScheme = null;

const registerUser = async (
  ctx: KoaContext<LoginResponse, void, RegisterUserRequest>,
) => {
  const token = await userService.register(ctx.request.body); 

  ctx.status = 200;
  ctx.body = { token };
};
registerUser.validationScheme = {
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
    password: Joi.string()
  },
};

const getUserById = async (
  ctx: KoaContext<GetUserByIdResponse, GetUserRequest>, 
) => {
  const user = await userService.getUserById(
    ctx.params.id === 'me' ? ctx.state.session.userId : ctx.params.id,
  );
  ctx.status = 200;
  ctx.body = user;
};
getUserById.validationScheme = {
  params: {
    id: Joi.alternatives().try(
      Joi.number().integer().positive(),
      Joi.string().valid('me'),
    )
  },
};

const updateUser = async (ctx: KoaContext<UpdateUserResponse, IdParams, UpdateUserRequest>) => {
  const userId = Number(ctx.params.id); 
  const updatedUser = await userService.updateUser(userId, ctx.request.body); 
  
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
    const user = await userService.getUserByNaam(voornaam, achternaam);
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
  userService.removeUser(userId);
  ctx.status = 204; 
};
removeUser.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
};

const checkUserId = (ctx: KoaContext<unknown, GetUserRequest>, next: Next) => {
  const { userId, roles } = ctx.state.session;
  const { id } = ctx.params;

  if (id !== 'me' && id !== userId && !roles.includes(Role.ADMIN)) {
    return ctx.throw(
      403,
      "You are not allowed to view this user's information",
      { code: 'FORBIDDEN' },
    );
  }
  return next();
};

export default (parent: Router<ChessAppState, ChessAppContext>) => {
  const router = new Router({
    prefix: '/users',
  });

  const requireAdmin = makeRequireRole(Role.ADMIN);

  router.get('/', validate(getAllUsers.validationScheme), getAllUsers);
  router.post('/', requireAdmin, authDelay, validate(registerUser.validationScheme), registerUser);
  router.get('/by-name', requireAuthentication, validate(getUserByNaam.validationScheme), checkUserId, getUserByNaam);
  router.get('/:id', requireAuthentication, validate(getUserById.validationScheme), checkUserId, getUserById);
  router.put('/:id', requireAdmin, requireAuthentication, validate(updateUser.validationScheme), checkUserId, updateUser);
  router.delete('/:id', requireAdmin , requireAuthentication, validate(removeUser.validationScheme), checkUserId, removeUser);

  parent.use(router.routes()).use(router.allowedMethods());
};
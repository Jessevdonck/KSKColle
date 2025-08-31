import Router from '@koa/router';
import * as userService from '../service/userService';
import * as passwordGenerationService from '../service/passwordGenerationService';
import type { User, GetUserByIdResponse, UpdateUserResponse, UpdateUserRequest, GetUserRequest, GetAllUserResponse, PublicUser,GetAllPublicUserResponse, GetUserByNaamResponse, LoginResponse, RegisterUserRequest, UpdatePasswordRequest, UpdatePasswordResponse } from '../types/user';
import type { ChessAppContext, ChessAppState, KoaContext } from '../types/koa';
import type { IdParams } from '../types/common';
import Joi from 'joi';
import validate from '../core/validation';
import { requireAuthentication, makeRequireRole, authDelay } from '../core/auth';
import Role from '../core/roles';
import { generateJWT } from '../core/jwt';
import { prisma } from '../service/data';
import type { Next } from 'koa';

/**
 * @api {get} /users Get all users
 * @apiName GetAllUsers
 * @apiGroup User
 * @apiPermission admin
 * 
 * @apiSuccess {Object[]} items List of all users.
 * @apiError (400) BadRequest Invalid data provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You don't have access to this resource.
 * @apiError (404) NotFound The requested resource could not be found.
 */
const getAllUsers = async (ctx: KoaContext<GetAllUserResponse>): Promise<User[]> => {
  const users =  await userService.getAllUsers();
  ctx.body = {
    items: users,
  };

  return users;
};
getAllUsers.validationScheme = null;

/**
 * @api {get} /users/publicUsers Get all public users
 * @apiName GetAllPublicUsers
 * @apiGroup User
 * 
 * @apiSuccess {Object[]} items List of all public users.
 * @apiError (400) BadRequest Invalid data provided.
 * @apiError (404) NotFound The requested resource could not be found.
 */
const getAllPublicUsers = async (ctx: KoaContext<GetAllPublicUserResponse>): Promise<PublicUser[]> => {
  const users =  await userService.getAllPublicUsers();
  ctx.body = {
    items: users,
  };

  return users;
}
getAllPublicUsers.validationScheme = null;

/**
 * @api {post} /users Register a new user
 * @apiName RegisterUser
 * @apiGroup User
 * 
 * @apiBody {String} voornaam First name of the user.
 * @apiBody {String} achternaam Last name of the user.
 * @apiBody {Date} geboortedatum Birthdate of the user.
 * @apiBody {String} email Email address of the user.
 * @apiBody {String} tel_nummer Phone number of the user.
 * @apiBody {Date} lid_sinds Date when the user became a member.
 * @apiBody {Number} schaakrating_elo Elo rating of the user.
 * @apiBody {Number} fide_id FIDE ID of the user (optional).
 * @apiBody {Number} schaakrating_max Maximum Elo rating of the user (optional).
 * @apiBody {String} password Password of the user.
 * @apiBody {String[]} roles Roles assigned to the user (either 'USER' or 'ADMIN').
 * 
 * @apiSuccess {String} token The token generated after successful registration.
 * @apiError (400) BadRequest Invalid data provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You don't have access to this resource.
 * @apiError (404) NotFound The requested resource could not be found.
 */
const registerUser = async (
  ctx: KoaContext<LoginResponse, void, RegisterUserRequest>,
) => {
  console.log("body: ", ctx.request.body);
  
  // Gebruik de password generation service voor nieuwe gebruikers
  const userId = await passwordGenerationService.createUserWithGeneratedPassword({
    userData: ctx.request.body,
    adminUserId: ctx.state.session?.userId || 0, // Voor nieuwe registraties is er geen admin
  });
  
  // We need the full user object for JWT generation, not just the public user
  const fullUser = await prisma.user.findUnique({ where: { user_id: userId } });
  if (!fullUser) {
    throw new Error('User not found after creation');
  }
  
  const token = await generateJWT(fullUser);

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
    vast_nummer: Joi.string().allow("").optional(),
    lid_sinds: Joi.date(),
    schaakrating_elo: Joi.number().integer().positive(),
    fide_id: Joi.number().integer().positive().optional(),
    schaakrating_max: Joi.number().integer().positive().optional(),
    is_youth: Joi.boolean().optional(),
    password: Joi.string(),
    roles: Joi.array().items(Joi.string().valid(Role.USER, Role.ADMIN)).required(),

    adres_straat: Joi.string().required(),
    adres_nummer: Joi.string().required(),
    adres_bus: Joi.string().allow("").optional(),
    adres_postcode: Joi.string().required(),
    adres_gemeente: Joi.string().required(),
    adres_land: Joi.string().required(),
  },
};

/**
 * @api {get} /users/:id Get user by ID
 * @apiName GetUserById
 * @apiGroup User
 * 
 * @apiParam {Number=me} id The ID of the user or 'me' to get the authenticated user's information.
 * 
 * @apiSuccess {Object} user The user object.
 * @apiError (400) BadRequest Invalid ID provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You are not allowed to view this user's information.
 * @apiError (404) NotFound The requested resource could not be found.
 */
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

/**
 * @api {put} /users/:id Update user information
 * @apiName UpdateUser
 * @apiGroup User
 * 
 * @apiParam {Number} id The ID of the user to update.
 * @apiBody {String} [voornaam] First name of the user.
 * @apiBody {String} [achternaam] Last name of the user.
 * @apiBody {Date} [geboortedatum] Birthdate of the user.
 * @apiBody {String} [email] Email address of the user.
 * @apiBody {String} [tel_nummer] Phone number of the user.
 * @apiBody {Date} [lid_sinds] Date when the user became a member.
 * @apiBody {Number} [schaakrating_elo] Elo rating of the user.
 * @apiBody {Number} [fide_id] FIDE ID of the user (optional).
 * @apiBody {Number} [schaakrating_max] Maximum Elo rating of the user (optional).
 * @apiBody {String} [password] Password of the user.
 * @apiBody {String[]} [roles] Roles assigned to the user (either 'USER' or 'ADMIN').
 * 
 * @apiSuccess {Object} user The updated user object.
 * @apiError (400) BadRequest Invalid data provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You don't have access to this resource.
 * @apiError (404) NotFound The requested resource could not be found.
 */
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
    voornaam: Joi.string().optional(),
    achternaam: Joi.string().optional(),
    geboortedatum: Joi.date().optional(),
    email: Joi.string().email().optional(),
    tel_nummer: Joi.string().optional(),
    vast_nummer: Joi.string().allow("").optional(),
    lid_sinds: Joi.date().optional(),
    schaakrating_elo: Joi.number().integer().positive().optional(),
    fide_id: Joi.number().integer().positive().optional(),
    schaakrating_max: Joi.number().integer().positive().optional(),
    is_youth: Joi.boolean().optional(),
    password: Joi.string().optional(),
    roles: Joi.array().items(Joi.string().valid(Role.USER, Role.ADMIN)).optional(),

    adres_straat: Joi.string().required(),
    adres_nummer: Joi.string().required(),
    adres_bus: Joi.string().allow("").optional(),
    adres_postcode: Joi.string().required(),
    adres_gemeente: Joi.string().required(),
    adres_land: Joi.string().required(),
  },
};

/**
 * @api {put} /users/:id/password Update user password
 * @apiName UpdatePassword
 * @apiGroup User
 * 
 * @apiParam {Number} id The ID of the user to update the password.
 * @apiBody {String} currentPassword Current password of the user.
 * @apiBody {String} newPassword New password for the user.
 * 
 * @apiSuccess {String} message A success message indicating the password was updated.
 * @apiError (400) BadRequest Invalid data provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You are not allowed to change this user's password.
 * @apiError (404) NotFound The requested resource could not be found.
 */
const updatePassword = async (ctx: KoaContext<UpdatePasswordResponse, IdParams, UpdatePasswordRequest>) => {
  const userId = Number(ctx.params.id);

  const { currentPassword, newPassword } = ctx.request.body;

  await userService.updatePassword(userId, currentPassword, newPassword);
  
  ctx.body = { message: 'Password updated successfully' };
};
updatePassword.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
  body: {
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
  },
};

/**
 * @api {get} /users/by-name Get user by first name and last name
 * @apiName GetUserByNaam
 * @apiGroup User
 * 
 * @apiQuery {String} voornaam First name of the user.
 * @apiQuery {String} achternaam Last name of the user.
 * 
 * @apiSuccess {Object} user User object with matching name.
 * @apiError (400) BadRequest Invalid query parameters provided.
 * @apiError (404) NotFound No user found with the given name.
 * @apiError (500) InternalServerError Server error.
 */
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

/**
 * @api {delete} /users/:id Delete user by ID
 * @apiName DeleteUser
 * @apiGroup User
 * 
 * @apiParam {Number} id The ID of the user to delete.
 * 
 * @apiSuccess (204) NoContent The user was successfully deleted.
 * @apiError (400) BadRequest Invalid ID provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You don't have access to this resource.
 * @apiError (404) NotFound The requested resource could not be found.
 */
const removeUser = async (ctx: KoaContext<void, IdParams>) => {
  const userId = Number(ctx.params.id);
  await userService.removeUser(userId);
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

const checkUserIdAdmin = (ctx: KoaContext<unknown, GetUserRequest>, next: Next) => {
  const { roles } = ctx.state.session;

  if (!roles.includes(Role.ADMIN)) {
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

  router.get('/', requireAuthentication, requireAdmin, validate(getAllUsers.validationScheme), getAllUsers);
  router.get('/publicUsers', validate(getAllPublicUsers.validationScheme), getAllPublicUsers);
  router.post('/',requireAuthentication, requireAdmin, authDelay, validate(registerUser.validationScheme), registerUser);
  router.get('/by-name', requireAuthentication, validate(getUserByNaam.validationScheme), getUserByNaam);
  router.get('/:id', requireAuthentication, validate(getUserById.validationScheme), checkUserId, getUserById);
  router.put('/:id', requireAuthentication, requireAdmin, validate(updateUser.validationScheme), checkUserIdAdmin, updateUser);
  router.put('/:id/password', requireAuthentication, validate(updatePassword.validationScheme), checkUserId, updatePassword);
  router.delete('/:id', requireAuthentication, requireAdmin, validate(removeUser.validationScheme), checkUserIdAdmin, removeUser);

  parent.use(router.routes()).use(router.allowedMethods());
};
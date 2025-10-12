import Router from '@koa/router';
import Joi from 'joi';
import validate from '../core/validation';
import * as passwordGenerationService from '../service/passwordGenerationService';

import type {
  KoaContext,
  KoaRouter,
  ChessAppState,
  ChessAppContext,
} from '../types/koa';
import { requireAuthentication, makeRequireRole } from '../core/auth';

interface GeneratePasswordRequest {
  userId: number;
}

interface CreateUserRequest {
  voornaam: string;
  achternaam: string;
  email: string;
  guardian_email?: string;
  guardian_phone?: string;
  geboortedatum?: string;
  tel_nummer: string;
  vast_nummer?: string;
  schaakrating_elo?: number;
  is_admin?: boolean;
  is_youth?: boolean;
  fide_id?: number;
  lid_sinds?: string;
  adres_straat?: string;
  adres_nummer?: string;
  adres_bus?: string;
  adres_postcode?: string;
  adres_gemeente?: string;
  adres_land?: string;
  roles?: string[];
}

/**
 * @api {post} /api/user-management/generate-password Generate new password for user
 * @apiName GeneratePassword
 * @apiGroup UserManagement
 * @apiPermission admin
 * 
 * @apiBody {Number} userId The ID of the user to generate password for
 * 
 * @apiSuccess {String} message Success message
 * 
 * @apiError (400) BadRequest Invalid data provided
 * @apiError (401) Unauthorized Authentication required
 * @apiError (403) Forbidden Admin access required
 * @apiError (404) NotFound User not found
 */
const generatePassword = async (ctx: KoaContext<{ message: string }, void, GeneratePasswordRequest>) => {
  const { userId } = ctx.request.body;
  const adminUserId = ctx.state.session.userId;
  
  await passwordGenerationService.generateNewPassword({ userId, adminUserId });
  
  ctx.status = 200;
  ctx.body = { 
    message: 'Nieuw wachtwoord is gegenereerd en naar de gebruiker gestuurd via email.' 
  };
};

generatePassword.validationScheme = {
  body: {
    userId: Joi.number().integer().positive().required(),
  },
};

/**
 * @api {post} /api/user-management/create-user Create new user with generated password
 * @apiName CreateUser
 * @apiGroup UserManagement
 * @apiPermission admin
 * 
 * @apiBody {String} voornaam First name
 * @apiBody {String} achternaam Last name
 * @apiBody {String} email Email address
 * @apiBody {String} [geboortedatum] Birth date (ISO string, optional)
 * @apiBody {String} tel_nummer Phone number
 * @apiBody {String} [vast_nummer] Landline number
 * @apiBody {Number} [schaakrating_elo] Chess rating
 * @apiBody {Boolean} [is_admin] Is admin user
 * @apiBody {Boolean} [is_youth] Is youth user
 * @apiBody {Number} [fide_id] FIDE ID
 * @apiBody {String} [lid_sinds] Member since (ISO string)
 * @apiBody {String} [adres_straat] Street address
 * @apiBody {String} [adres_nummer] House number
 * @apiBody {String} [adres_bus] Bus number
 * @apiBody {String} [adres_postcode] Postal code
 * @apiBody {String} [adres_gemeente] City
 * @apiBody {String} [adres_land] Country
 * 
 * @apiSuccess {Number} userId The ID of the created user
 * @apiSuccess {String} message Success message
 * 
 * @apiError (400) BadRequest Invalid data provided
 * @apiError (401) Unauthorized Authentication required
 * @apiError (403) Forbidden Admin access required
 */
const createUser = async (ctx: KoaContext<{ userId: number; message: string }, void, CreateUserRequest>) => {
  const userData = ctx.request.body;
  const adminUserId = ctx.state.session.userId;
  
  // Parse dates
  const parsedUserData = {
    ...userData,
    geboortedatum: userData.geboortedatum && userData.geboortedatum.trim() !== '' ? new Date(userData.geboortedatum) : null,
    lid_sinds: userData.lid_sinds ? new Date(userData.lid_sinds) : new Date(),
  };
  
  const userId = await passwordGenerationService.createUserWithGeneratedPassword({
    userData: parsedUserData,
    adminUserId,
  });
  
  ctx.status = 201;
  ctx.body = { 
    userId,
    message: 'Gebruiker succesvol aangemaakt. Wachtwoord is naar het emailadres gestuurd.' 
  };
};

createUser.validationScheme = {
  body: {
    voornaam: Joi.string().required(),
    achternaam: Joi.string().required(),
    email: Joi.string().email().allow('').optional(),
    guardian_email: Joi.string().email().allow('', null).optional(),
    guardian_phone: Joi.string().allow('', null).optional(),
    geboortedatum: Joi.string().isoDate().allow('', null).optional(),
    tel_nummer: Joi.string().allow('').optional(),
    vast_nummer: Joi.string().allow('').optional(),
    schaakrating_elo: Joi.number().integer().min(0).optional(),
    is_admin: Joi.boolean().optional(),
    is_youth: Joi.boolean().optional(),
    fide_id: Joi.number().integer().positive().optional(),
    lid_sinds: Joi.string().isoDate().optional(),
    adres_straat: Joi.string().allow('').optional(),
    adres_nummer: Joi.string().allow('').optional(),
    adres_bus: Joi.string().allow('').optional(),
    adres_postcode: Joi.string().allow('').optional(),
    adres_gemeente: Joi.string().allow('').optional(),
    adres_land: Joi.string().allow('').optional(),
    roles: Joi.array().items(Joi.string().valid('admin', 'bestuurslid', 'author', 'exlid', 'user')).optional(),
  },
};

export default function installUserManagementRouter(parent: KoaRouter) {
  const router = new Router<ChessAppState, ChessAppContext>({
    prefix: '/user-management',
  });

  // Alle endpoints vereisen admin rechten
  const requireAdmin = makeRequireRole('admin');

  router.post('/generate-password', requireAuthentication, requireAdmin, validate(generatePassword.validationScheme), generatePassword);
  router.post('/create-user', requireAuthentication, requireAdmin, validate(createUser.validationScheme), createUser);

  parent.use(router.routes()).use(router.allowedMethods());
}

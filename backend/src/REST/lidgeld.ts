import Router from '@koa/router';
import * as lidgeldService from '../service/lidgeldService';
import type { ChessAppContext, ChessAppState, KoaContext } from '../types/koa';
import type { IdParams } from '../types/common';
import Joi from 'joi';
import validate from '../core/validation';
import { requireAuthentication, makeRequireRole } from '../core/auth';
import { getLogger } from '../core/logging';

const logger = getLogger();

/**
 * @api {get} /lidgeld Get all users with lidgeld status
 * @apiName GetLidgeldStatus
 * @apiGroup Lidgeld
 * @apiPermission admin, bestuurslid
 * 
 * @apiSuccess {Object[]} users List of users with their lidgeld status.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You don't have access to this resource.
 */
const getLidgeldStatus = async (ctx: KoaContext<{ users: any[] }>) => {
  try {
    const users = await lidgeldService.getUsersWithLidgeldStatus();
    ctx.body = { users };
  } catch (error) {
    logger.error('Failed to get lidgeld status', { error });
    ctx.throw(500, 'Failed to get lidgeld status');
  }
};
getLidgeldStatus.validationScheme = null;

/**
 * @api {put} /lidgeld/:id Update lidgeld status for a user
 * @apiName UpdateLidgeldStatus
 * @apiGroup Lidgeld
 * @apiPermission admin, bestuurslid
 * 
 * @apiParam {Number} id The ID of the user.
 * @apiBody {Boolean} [lidgeld_betaald] Whether lidgeld is paid.
 * @apiBody {Date} [lidgeld_periode_start] Start date of lidgeld period.
 * @apiBody {Date} [lidgeld_periode_eind] End date of lidgeld period.
 * @apiBody {Boolean} [bondslidgeld_betaald] Whether bondslidgeld is paid.
 * @apiBody {Date} [bondslidgeld_periode_start] Start date of bondslidgeld period.
 * @apiBody {Date} [bondslidgeld_periode_eind] End date of bondslidgeld period.
 * @apiBody {Boolean} [jeugdlidgeld_betaald] Whether jeugdlidgeld is paid.
 * @apiBody {Date} [jeugdlidgeld_periode_start] Start date of jeugdlidgeld period.
 * @apiBody {Date} [jeugdlidgeld_periode_eind] End date of jeugdlidgeld period.
 * 
 * @apiSuccess (200) Success Lidgeld status updated successfully.
 * @apiError (400) BadRequest Invalid data provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You don't have access to this resource.
 * @apiError (404) NotFound User not found.
 */
const updateLidgeldStatus = async (ctx: KoaContext<{ message: string }, IdParams, any>) => {
  try {
    const userId = Number(ctx.params.id);
    const data = ctx.request.body;

    await lidgeldService.updateLidgeldStatus(userId, data);
    
    ctx.status = 200;
    ctx.body = { message: 'Lidgeld status updated successfully' };
  } catch (error) {
    logger.error('Failed to update lidgeld status', { error, userId: ctx.params.id });
    ctx.throw(500, 'Failed to update lidgeld status');
  }
};
updateLidgeldStatus.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
  body: {
    lidgeld_betaald: Joi.boolean().optional(),
    lidgeld_periode_start: Joi.date().allow(null).optional(),
    lidgeld_periode_eind: Joi.date().allow(null).optional(),
    bondslidgeld_betaald: Joi.boolean().optional(),
    bondslidgeld_periode_start: Joi.date().allow(null).optional(),
    bondslidgeld_periode_eind: Joi.date().allow(null).optional(),
    jeugdlidgeld_betaald: Joi.boolean().optional(),
    jeugdlidgeld_periode_start: Joi.date().allow(null).optional(),
    jeugdlidgeld_periode_eind: Joi.date().allow(null).optional(),
  },
};

/**
 * @api {post} /lidgeld/batch-update-roles Update roles for all users based on membership status
 * @apiName BatchUpdateUserRoles
 * @apiGroup Lidgeld
 * @apiPermission admin
 * 
 * @apiSuccess (200) Success Roles updated successfully.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You don't have access to this resource.
 */
const batchUpdateUserRoles = async (ctx: KoaContext) => {
  try {
    const result = await lidgeldService.updateAllUserRolesBasedOnMembership();
    
    ctx.status = 200;
    ctx.body = { 
      message: 'User roles updated successfully',
      result
    };
  } catch (error) {
    logger.error('Failed to batch update user roles', { error });
    ctx.throw(500, 'Failed to update user roles');
  }
};
batchUpdateUserRoles.validationScheme = null;

export default (parent: Router<ChessAppState, ChessAppContext>) => {
  const router = new Router({
    prefix: '/lidgeld',
  });

  // Require admin or bestuurslid role
  const requireAdminOrBestuurslid = makeRequireRole(['admin', 'bestuurslid']);
  const requireAdmin = makeRequireRole('admin');

  router.get('/', requireAuthentication, requireAdminOrBestuurslid, validate(getLidgeldStatus.validationScheme), getLidgeldStatus);
  router.put('/:id', requireAuthentication, requireAdminOrBestuurslid, validate(updateLidgeldStatus.validationScheme), updateLidgeldStatus);
  router.post('/batch-update-roles', requireAuthentication, requireAdmin, validate(batchUpdateUserRoles.validationScheme), batchUpdateUserRoles);

  parent.use(router.routes()).use(router.allowedMethods());
};

import Router from '@koa/router';
import installSpelerRouter from './users';
import installHealthRouter from './health';
import installTournamentRouter from './tournament';
import installRondeRouter from './rondes';
import installSpelRouter from './spellen';
import installCalendarRouter from './calendar';
import installMakeupDayRouter from './makeupDay';
import installPhotoRouter from './photos';
import type { ChessAppContext, ChessAppState, KoaApplication } from '../types/koa';
import installSessionRouter from './session';

/**
 * @apiDefine idParam
 * @apiParam {Number} id The unique ID of the item.
 */

/**
 * @api {get} /items/:id Get Item by ID
 * @apiName GetItemById
 * @apiGroup Item
 * @apiUse idParam
 * 
 * @apiSuccess {Number} id The unique ID of the item.
 * @apiError (400) BadRequest Invalid data provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You don't have access to this resource.
 * @apiError (404) NotFound The requested resource could not be found.
 */

/**
 * @api {put} /items/:id Update Item by ID
 * @apiName UpdateItemById
 * @apiGroup Item
 * @apiUse idParam
 * 
 * @apiParam {Number} id The unique ID of the item.
 * @apiBody {Object} item The item data to update.
 * @apiBody {String} name The updated name of the item.
 * @apiBody {String} description The updated description of the item.
 * 
 * @apiSuccess {Number} id The updated ID of the item.
 * @apiError (400) BadRequest Invalid data provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You don't have access to this resource.
 * @apiError (404) NotFound The requested resource could not be found.
 */

/**
 * @api {delete} /items/:id Delete Item by ID
 * @apiName DeleteItemById
 * @apiGroup Item
 * @apiUse idParam
 * 
 * @apiSuccess (204) NoContent The item was successfully deleted.
 * @apiError (400) BadRequest Invalid data provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You don't have access to this resource.
 * @apiError (404) NotFound The requested resource could not be found.
 */

/**
 * @api {get} /items Get All Items
 * @apiName GetAllItems
 * @apiGroup Item
 * 
 * @apiSuccess {Object[]} items List of all items.
 * @apiError (400) BadRequest Invalid data provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You don't have access to this resource.
 * @apiError (404) NotFound The requested resource could not be found.
 */

/**
 * @api {post} /items Create a New Item
 * @apiName CreateItem
 * @apiGroup Item
 * 
 * @apiBody {String} name The name of the item.
 * @apiBody {String} description A description of the item.
 * 
 * @apiSuccess {Number} id The unique ID of the created item.
 * @apiError (400) BadRequest Invalid data provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (403) Forbidden You don't have access to this resource.
 * @apiError (404) NotFound The requested resource could not be found.
 */


export default (app: KoaApplication) => {
  const router = new Router<ChessAppState, ChessAppContext>({
    prefix: '/api',
  });

  installHealthRouter(router);
  installSessionRouter(router);
  installSpelerRouter(router);
  installTournamentRouter(router);
  installRondeRouter(router);
  installSpelRouter(router);
  installCalendarRouter(router);
  installMakeupDayRouter(router);
  installPhotoRouter(router);

  app.use(router.routes()).use(router.allowedMethods());
};
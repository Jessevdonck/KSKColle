import Router from '@koa/router';
import Joi from 'joi';
import validate from '../core/validation';
import * as photoService from '../service/photoService'; 
import { ChessAppContext, ChessAppState } from '../types/koa';

const router = new Router({ prefix: '/photos' });

/**
 * GET /api/photos/albums
 *  – lijst folders onder DRIVE_ROOT_FOLDER_ID
 */
const getAlbums = async (ctx: any) => {
  const albums = await photoService.listAlbums(process.env.DRIVE_ROOT_FOLDER_ID!);
  ctx.body = { items: albums };
};
getAlbums.validationScheme = null;

/**
 * GET /api/photos/albums/:albumId
 *  – lijst alle plaatjes in één folder
 */
const getPhotosInAlbum = async (ctx: any) => {
  const { albumId } = ctx.params;
  const photos = await photoService.listPhotos(albumId);
  ctx.body = { items: photos };
};
getPhotosInAlbum.validationScheme = {
  params: {
    albumId: Joi.string().required()
  }
};

export default (parent: Router<ChessAppState ,ChessAppContext>) => {
  router
    .get('/albums', getAlbums)
    .get('/albums/:albumId', validate(getPhotosInAlbum.validationScheme), getPhotosInAlbum);

  parent.use(router.routes()).use(router.allowedMethods());
};

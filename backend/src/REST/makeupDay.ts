import Router from '@koa/router';
import Joi from 'joi';
import validate from '../core/validation';
import { requireAuthentication, makeRequireRole } from '../core/auth';
import Role from '../core/roles';
import * as makeupDayService from '../service/makeupDayService';
import type { MakeupDay } from '../types/Types';
import type { ChessAppContext, ChessAppState, KoaContext } from '../types/koa';

const router = new Router<ChessAppState, ChessAppContext>({
  prefix: '/makeupDay',
});
const requireAdmin = makeRequireRole(Role.ADMIN);

/**
 * GET /makeupDay?tournament_id=123
 */
const getMakeupDaysForTournament = async (
  ctx: KoaContext<{ items: MakeupDay[] }>
) => {
  const tournamentId = Number(ctx.query.tournament_id);
  const items = await makeupDayService.getMakeupDaysForTournament(tournamentId);
  ctx.body = { items };
};
getMakeupDaysForTournament.validationScheme = {
  query: {
    tournament_id: Joi.number().integer().positive().required(),
  },
};

const createMakeupDay = async (
  ctx: KoaContext
) => {
  // de frontend stuurt body als { arg: { ... } }, dus we halen die eruit
  const body = (ctx.request.body as any)?.arg ?? ctx.request.body;

  const { tournament_id, round_after, date, label } = body;

  console.log("BODY binnen:", body);

  if (
    typeof tournament_id !== 'number' ||
    typeof round_after !== 'number' ||
    typeof date !== 'string'
  ) {
    ctx.throw(400, 'Ongeldige body in makeupDay POST');
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    ctx.throw(400, `Ongeldige datum: ${date}`);
  }

  const day = await makeupDayService.addMakeupDay(
    tournament_id,
    round_after,
    parsedDate,
    label ?? undefined
  );

  ctx.status = 201;
  ctx.body = day;
};

/**
 * DELETE /makeupDay/:id
 */
const deleteMakeupDay = async (
  ctx: KoaContext<void, { id: string }>
) => {
  const id = Number(ctx.params.id);
  await makeupDayService.removeMakeupDay(id);
  ctx.status = 204;
};
deleteMakeupDay.validationScheme = {
  params: {
    id: Joi.number().integer().positive().required(),
  },
};

export default (parent: Router<ChessAppState, ChessAppContext>) => {
  router
    .get(    '/',    validate(getMakeupDaysForTournament.validationScheme), getMakeupDaysForTournament)
    .post(   '/',    requireAuthentication, requireAdmin,   createMakeupDay)
    .delete('/:id',  requireAuthentication, requireAdmin, validate(deleteMakeupDay.validationScheme), deleteMakeupDay);

  parent.use(router.routes()).use(router.allowedMethods());
};

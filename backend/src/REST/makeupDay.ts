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

  const { tournament_id, round_after, date, startuur, label } = body;

  console.log("BODY binnen:", body);

  if (
    typeof tournament_id !== 'number' ||
    typeof round_after !== 'number' ||
    typeof date !== 'string' ||
    typeof startuur !== 'string'
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
    startuur
  );

  ctx.status = 201;
  ctx.body = day;
};

/**
 * PUT /makeupDay/:id
 */
const updateMakeupDay = async (
  ctx: KoaContext<MakeupDay, { id: string }>
) => {
  const id = Number(ctx.params.id);
  const body = (ctx.request.body as any)?.arg ?? ctx.request.body;
  
  const { date, startuur, label, calendar_event_id } = body;

  // Validate input
  if (date && typeof date !== 'string') {
    ctx.throw(400, 'Ongeldige datum in makeupDay PUT');
  }

  if (startuur && typeof startuur !== 'string') {
    ctx.throw(400, 'Ongeldige startuur in makeupDay PUT');
  }

  // Prepare update data
  const updateData: any = {};
  if (date) {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      ctx.throw(400, `Ongeldige datum: ${date}`);
    }
    updateData.date = parsedDate;
  }
  if (startuur) updateData.startuur = startuur;
  if (label !== undefined) updateData.label = label;
  if (calendar_event_id !== undefined) updateData.calendar_event_id = calendar_event_id;

  const updatedDay = await makeupDayService.updateMakeupDay(id, updateData);
  ctx.body = updatedDay;
};

updateMakeupDay.validationScheme = {
  params: {
    id: Joi.number().integer().positive().required(),
  },
  body: {
    date: Joi.string().optional(),
    startuur: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    label: Joi.string().optional(),
    calendar_event_id: Joi.number().integer().positive().optional(),
  },
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
    .put(    '/:id', requireAuthentication, requireAdmin, validate(updateMakeupDay.validationScheme), updateMakeupDay)
    .delete('/:id',  requireAuthentication, requireAdmin, validate(deleteMakeupDay.validationScheme), deleteMakeupDay);

  parent.use(router.routes()).use(router.allowedMethods());
};

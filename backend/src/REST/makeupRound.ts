import Router from '@koa/router';
import Joi from 'joi';
import validate from '../core/validation';
import { requireAuthentication, makeRequireRole } from '../core/auth';
import Role from '../core/roles';
import * as makeupRoundService from '../service/makeupRoundService';
import type { ChessAppContext, ChessAppState, KoaContext } from '../types/koa';

const router = new Router<ChessAppState, ChessAppContext>({
  prefix: '/makeupRound',
});
const requireAdmin = makeRequireRole(Role.ADMIN);

/**
 * GET /makeupRound?tournament_id=123
 */
const getMakeupRoundsForTournament = async (
  ctx: KoaContext<{ items: any[] }>
) => {
  const tournamentId = Number(ctx.query.tournament_id);
  const items = await makeupRoundService.getMakeupRoundsForTournament(tournamentId);
  ctx.body = { items };
};
getMakeupRoundsForTournament.validationScheme = {
  query: {
    tournament_id: Joi.number().integer().positive().required(),
  },
};

/**
 * GET /makeupRound/all?tournament_id=123
 */
const getAllRoundsForTournament = async (
  ctx: KoaContext<{ items: any[] }>
) => {
  const tournamentId = Number(ctx.query.tournament_id);
  const items = await makeupRoundService.getAllRoundsForTournament(tournamentId);
  ctx.body = { items };
};
getAllRoundsForTournament.validationScheme = {
  query: {
    tournament_id: Joi.number().integer().positive().required(),
  },
};

const createMakeupRound = async (
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
    ctx.throw(400, 'Ongeldige body in makeupRound POST');
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    ctx.throw(400, `Ongeldige datum: ${date}`);
  }

  const day = await makeupRoundService.createMakeupRound(
    tournament_id,
    round_after,
    parsedDate,
    startuur,
    label ?? undefined
  );

  ctx.status = 201;
  ctx.body = day;
};

/**
 * PUT /makeupRound/:id
 */
const updateMakeupRound = async (
  ctx: KoaContext<any, { id: string }>
) => {
  const id = Number(ctx.params.id);
  const body = (ctx.request.body as any)?.arg ?? ctx.request.body;
  
  const { ronde_datum, startuur, label } = body;

  // Validate input
  if (ronde_datum && typeof ronde_datum !== 'string') {
    ctx.throw(400, 'Ongeldige datum in makeupRound PUT');
  }

  if (startuur && typeof startuur !== 'string') {
    ctx.throw(400, 'Ongeldige startuur in makeupRound PUT');
  }

  // Prepare update data
  const updateData: any = {};
  if (ronde_datum) {
    const parsedDate = new Date(ronde_datum);
    if (isNaN(parsedDate.getTime())) {
      ctx.throw(400, `Ongeldige datum: ${ronde_datum}`);
    }
    updateData.ronde_datum = parsedDate;
  }
  if (startuur) updateData.startuur = startuur;
  if (label !== undefined) updateData.label = label;

  const updatedRound = await makeupRoundService.updateMakeupRound(id, updateData);
  ctx.body = updatedRound;
};

updateMakeupRound.validationScheme = {
  params: {
    id: Joi.number().integer().positive().required(),
  },
  body: {
    ronde_datum: Joi.string().optional(),
    startuur: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    label: Joi.string().optional(),
  },
};

/**
 * DELETE /makeupRound/:id
 */
const deleteMakeupRound = async (
  ctx: KoaContext<void, { id: string }>
) => {
  const id = Number(ctx.params.id);
  await makeupRoundService.deleteMakeupRound(id);
  ctx.status = 204;
};
deleteMakeupRound.validationScheme = {
  params: {
    id: Joi.number().integer().positive().required(),
  },
};

export default (parent: Router<ChessAppState, ChessAppContext>) => {
  router
    .get(    '/',    validate(getMakeupRoundsForTournament.validationScheme), getMakeupRoundsForTournament)
    .get(    '/all', validate(getAllRoundsForTournament.validationScheme), getAllRoundsForTournament)
    .post(   '/',    requireAuthentication, requireAdmin,   createMakeupRound)
    .put(    '/:id', requireAuthentication, requireAdmin, validate(updateMakeupRound.validationScheme), updateMakeupRound)
    .delete('/:id',  requireAuthentication, requireAdmin, validate(deleteMakeupRound.validationScheme), deleteMakeupRound);

  parent.use(router.routes()).use(router.allowedMethods());
};

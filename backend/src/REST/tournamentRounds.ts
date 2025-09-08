import Router from '@koa/router';
import Joi from 'joi';
import validate from '../core/validation';
import { requireAuthentication, makeRequireRole } from '../core/auth';
import Role from '../core/roles';
import * as tournamentRoundService from '../service/tournamentRoundService';
import type { ChessAppContext, ChessAppState, KoaContext } from '../types/koa';

const router = new Router<ChessAppState, ChessAppContext>({
  prefix: '/tournamentRounds',
});
const requireAdmin = makeRequireRole(Role.ADMIN);

/**
 * GET /tournamentRounds?tournament_id=123
 * Haal alle rondes op voor een toernooi (Sevilla + inhaaldagen)
 */
const getAllTournamentRounds = async (
  ctx: KoaContext<{ items: any[] }>
) => {
  const tournamentId = Number(ctx.query.tournament_id);
  const items = await tournamentRoundService.getAllTournamentRounds(tournamentId);
  ctx.body = { items };
};
getAllTournamentRounds.validationScheme = {
  query: {
    tournament_id: Joi.number().integer().positive().required(),
  },
};

/**
 * POST /tournamentRounds/makeup
 * Maak een inhaaldag ronde aan tussen bestaande rondes
 */
const createMakeupRound = async (
  ctx: KoaContext
) => {
  const body = (ctx.request.body as any)?.arg ?? ctx.request.body;

  const { tournament_id, after_round_number, date, startuur } = body;

  if (
    typeof tournament_id !== 'number' ||
    typeof after_round_number !== 'number' ||
    typeof date !== 'string' ||
    typeof startuur !== 'string'
  ) {
    ctx.throw(400, 'Ongeldige body in createMakeupRound POST');
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    ctx.throw(400, `Ongeldige datum: ${date}`);
  }

  const makeupRound = await tournamentRoundService.createMakeupRoundBetween(
    tournament_id,
    after_round_number,
    parsedDate,
    startuur
  );

  ctx.status = 201;
  ctx.body = makeupRound;
};

/**
 * POST /tournamentRounds/:round_id/games
 * Voeg een game toe aan een inhaaldag ronde
 */
const addGameToMakeupRound = async (
  ctx: KoaContext<any, { round_id: string }>
) => {
  const roundId = Number(ctx.params.round_id);
  const body = (ctx.request.body as any)?.arg ?? ctx.request.body;

  const { speler1_id, speler2_id, result } = body;

  if (
    typeof speler1_id !== 'number' ||
    (speler2_id !== null && typeof speler2_id !== 'number')
  ) {
    ctx.throw(400, 'Ongeldige speler IDs in addGameToMakeupRound POST');
  }

  const game = await tournamentRoundService.addGameToMakeupRound(
    roundId,
    speler1_id,
    speler2_id,
    result ?? undefined
  );

  ctx.status = 201;
  ctx.body = game;
};

/**
 * PUT /tournamentRounds/:round_id/date
 * Update de datum van een inhaaldag ronde
 */
const updateMakeupRoundDate = async (
  ctx: KoaContext<any, { round_id: string }>
) => {
  const roundId = Number(ctx.params.round_id);
  const body = (ctx.request.body as any)?.arg ?? ctx.request.body;

  const { date, startuur } = body;

  if (typeof date !== 'string') {
    ctx.throw(400, 'Ongeldige datum in updateMakeupRoundDate PUT');
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    ctx.throw(400, `Ongeldige datum: ${date}`);
  }

  const updatedRound = await tournamentRoundService.updateMakeupRoundDate(
    roundId,
    parsedDate,
    startuur ?? undefined
  );

  ctx.body = updatedRound;
};

/**
 * POST /tournamentRounds/postpone-game
 * Stel een game uit naar een inhaaldag
 */
const postponeGameToMakeupRound = async (
  ctx: KoaContext
) => {
  const body = (ctx.request.body as any)?.arg ?? ctx.request.body;

  const { game_id, makeup_round_id } = body;

  if (typeof game_id !== 'number' || typeof makeup_round_id !== 'number') {
    ctx.throw(400, 'Ongeldige game_id of makeup_round_id in postponeGameToMakeupRound POST');
  }

  const updatedGame = await tournamentRoundService.postponeGameToMakeupRound(
    game_id,
    makeup_round_id
  );

  ctx.status = 200;
  ctx.body = updatedGame;
};

/**
 * DELETE /tournamentRounds/:round_id
 * Verwijder een inhaaldag ronde
 */
const deleteMakeupRound = async (
  ctx: KoaContext<void, { round_id: string }>
) => {
  const roundId = Number(ctx.params.round_id);
  await tournamentRoundService.deleteMakeupRound(roundId);
  ctx.status = 204;
};

export default (parent: Router<ChessAppState, ChessAppContext>) => {
  router
    .get(    '/',                    validate(getAllTournamentRounds.validationScheme), getAllTournamentRounds)
    .post(   '/makeup',              requireAuthentication, requireAdmin, createMakeupRound)
    .post(   '/:round_id/games',     requireAuthentication, requireAdmin, addGameToMakeupRound)
    .put(    '/:round_id/date',      requireAuthentication, requireAdmin, updateMakeupRoundDate)
    .post(   '/postpone-game',       requireAuthentication, requireAdmin, postponeGameToMakeupRound)
    .delete('/:round_id',            requireAuthentication, requireAdmin, deleteMakeupRound);

  parent.use(router.routes()).use(router.allowedMethods());
};

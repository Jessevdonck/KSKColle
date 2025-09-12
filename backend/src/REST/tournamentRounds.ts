import Router from '@koa/router';
import Joi from 'joi';
import validate from '../core/validation';
import { requireAuthentication, makeRequireRole } from '../core/auth';
import Role from '../core/roles';
import * as tournamentRoundService from '../service/tournamentRoundService';
import * as gamePostponeService from '../service/gamePostponeService';
import { getLogger } from '../core/logging';
const logger = getLogger();
import { prisma } from '../service/data';
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

  const { tournament_id, after_round_number, date, startuur, label } = body;

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
    startuur,
    label
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

/**
 * POST /tournamentRounds/postpone
 * Stel een game uit (voor spelers)
 */
const postponeGame = async (
  ctx: KoaContext
) => {
  try {
    const body = (ctx.request.body as any)?.arg ?? ctx.request.body;
    const { game_id, makeup_round_id } = body;

    if (typeof game_id !== 'number') {
      ctx.throw(400, 'Ongeldige game_id in postponeGame POST');
    }

    const user_id = ctx.state.session?.userId;
    if (!user_id) {
      ctx.throw(401, 'Gebruiker niet geauthenticeerd');
    }

    logger.info('Starting postpone game request', { game_id, user_id, makeup_round_id });

    const result = await gamePostponeService.postponeGame({
      game_id,
      user_id,
      makeup_round_id
    });

    logger.info('Postpone game completed successfully', { game_id, user_id, makeup_round_id });

    ctx.status = 200;
    ctx.body = result;
  } catch (error) {
    // Veilige error logging
    if (!error) {
      logger.error('Error is undefined in postponeGame endpoint');
      throw new Error('An undefined error occurred');
    }
    
    try {
      logger.error('Error in postponeGame endpoint', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
      console.error('Original error:', error);
    }
    
    throw error;
  }
};

/**
 * GET /tournamentRounds/postponable-games?tournament_id=123
 * Haal games op die een gebruiker kan uitstellen
 */
const getPostponableGames = async (
  ctx: KoaContext
) => {
  const tournament_id = Number(ctx.query.tournament_id);
  const user_id = ctx.state.session?.userId;

  if (!user_id) {
    ctx.throw(401, 'Gebruiker niet geauthenticeerd');
  }

  if (!tournament_id) {
    ctx.throw(400, 'tournament_id is verplicht');
  }

  const games = await gamePostponeService.getPostponableGames(user_id, tournament_id);
  ctx.body = { games };
};

/**
 * GET /tournamentRounds/available-makeup-rounds?tournament_id=123&is_herfst=true
 * Haal beschikbare inhaaldagen op
 */
const getAvailableMakeupRounds = async (
  ctx: KoaContext
) => {
  const tournament_id = Number(ctx.query.tournament_id);
  const is_herfst = ctx.query.is_herfst === 'true';

  if (!tournament_id) {
    ctx.throw(400, 'tournament_id is verplicht');
  }

  const rounds = await gamePostponeService.getAvailableMakeupRounds(tournament_id, is_herfst);
  ctx.body = { rounds };
};

/**
 * GET /tournamentRounds/test-postpone?game_id=123
 * Test endpoint voor postpone functionaliteit
 */
const testPostpone = async (
  ctx: KoaContext
) => {
  const game_id = Number(ctx.query.game_id);
  const user_id = ctx.state.session?.userId;

  if (!user_id) {
    ctx.throw(401, 'Gebruiker niet geauthenticeerd');
  }

  if (!game_id) {
    ctx.throw(400, 'game_id is verplicht');
  }

  try {
    logger.info('Testing postpone functionality', { game_id, user_id });
    
    // Test basic game lookup
    const game = await prisma.game.findUnique({
      where: { game_id },
      include: {
        speler1: true,
        speler2: true,
        round: {
          include: {
            tournament: true
          }
        }
      }
    });

    if (!game) {
      ctx.body = { error: 'Game not found', game_id };
      return;
    }

    logger.info('Game found in test', { 
      game_id: game.game_id,
      speler1_id: game.speler1_id,
      speler2_id: game.speler2_id
    });

    ctx.body = { 
      success: true, 
      game: {
        game_id: game.game_id,
        speler1_id: game.speler1_id,
        speler2_id: game.speler2_id,
        result: game.result,
        uitgestelde_datum: game.uitgestelde_datum,
        tournament_naam: game.round.tournament.naam
      }
    };
  } catch (error) {
    logger.error('Error in test endpoint', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    ctx.body = { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    };
  }
};

/**
 * POST /tournamentRounds/undo-postpone
 * Maak een uitgestelde game ongedaan (voor spelers)
 */
const undoPostponeGame = async (
  ctx: KoaContext
) => {
  const { game_id } = ctx.request.body as { game_id: number };
  const user_id = ctx.state.session?.userId;

  if (!user_id) {
    ctx.throw(401, 'Gebruiker niet geauthenticeerd');
  }

  if (!game_id) {
    ctx.throw(400, 'game_id is verplicht');
  }

  try {
    logger.info('Starting undo postpone game request', { game_id, user_id });

    const result = await gamePostponeService.undoPostponeGame({
      game_id,
      user_id
    });

    logger.info('Undo postpone game completed successfully', { game_id, user_id });

    ctx.status = 200;
    ctx.body = result;
  } catch (error) {
    // Veilige error logging
    if (!error) {
      logger.error('Error is undefined in undo postpone game endpoint');
      throw new Error('An undefined error occurred');
    }
    
    try {
      logger.error('Error in undo postpone game endpoint', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
      console.error('Original error:', error);
    }
    
    throw error;
  }
};

/**
 * POST /tournamentRounds/undo-admin-postpone
 * Maak een admin uitstel ongedaan
 */
const undoAdminPostponeGame = async (
  ctx: KoaContext
) => {
  const { original_game_id, new_game_id } = ctx.request.body as { original_game_id: number; new_game_id: number };

  if (!original_game_id || !new_game_id) {
    ctx.throw(400, 'original_game_id en new_game_id zijn verplicht');
  }

  try {
    logger.info('Starting undo admin postpone game request', { original_game_id, new_game_id });

    const result = await tournamentRoundService.undoAdminPostponeGame(
      original_game_id,
      new_game_id
    );

    logger.info('Undo admin postpone game completed successfully', { original_game_id, new_game_id });

    ctx.status = 200;
    ctx.body = result;
  } catch (error) {
    // Veilige error logging
    if (!error) {
      logger.error('Error is undefined in undo admin postpone game endpoint');
      throw new Error('An undefined error occurred');
    }
    
    try {
      logger.error('Error in undo admin postpone game endpoint', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
      console.error('Original error:', error);
    }
    
    throw error;
  }
};

/**
 * GET /tournamentRounds/debug-rounds?tournament_id=123
 * Debug endpoint om alle rounds te bekijken
 */
const debugRounds = async (
  ctx: KoaContext
) => {
  const tournament_id = Number(ctx.query.tournament_id);

  if (!tournament_id) {
    ctx.throw(400, 'tournament_id is verplicht');
  }

  try {
    logger.info('Debugging rounds for tournament', { tournament_id });
    
    // Haal alle rounds op voor dit toernooi
    const rounds = await prisma.round.findMany({
      where: { tournament_id },
      orderBy: { ronde_nummer: 'asc' }
    });

    logger.info('Found rounds', { 
      tournament_id,
      rounds_count: rounds.length,
      rounds: rounds.map(r => ({
        round_id: r.round_id,
        ronde_nummer: r.ronde_nummer,
        type: r.type,
        label: r.label,
        ronde_datum: r.ronde_datum,
        is_future: r.ronde_datum > new Date()
      }))
    });

    ctx.body = { 
      success: true, 
      tournament_id,
      rounds_count: rounds.length,
      rounds: rounds.map(r => ({
        round_id: r.round_id,
        ronde_nummer: r.ronde_nummer,
        type: r.type,
        label: r.label,
        ronde_datum: r.ronde_datum,
        is_future: r.ronde_datum > new Date()
      }))
    };
  } catch (error) {
    logger.error('Error in debug rounds endpoint', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    ctx.body = { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    };
  }
};

export default (parent: Router<ChessAppState, ChessAppContext>) => {
  router
    .get(    '/',                    validate(getAllTournamentRounds.validationScheme), getAllTournamentRounds)
    .post(   '/makeup',              requireAuthentication, requireAdmin, createMakeupRound)
    .post(   '/:round_id/games',     requireAuthentication, requireAdmin, addGameToMakeupRound)
    .put(    '/:round_id/date',      requireAuthentication, requireAdmin, updateMakeupRoundDate)
    .post(   '/postpone-game',       requireAuthentication, requireAdmin, postponeGameToMakeupRound)
    .post(   '/postpone',            requireAuthentication, postponeGame)
    .post(   '/undo-postpone',       requireAuthentication, undoPostponeGame)
    .post(   '/undo-admin-postpone', requireAuthentication, requireAdmin, undoAdminPostponeGame)
    .get(    '/postponable-games',   requireAuthentication, getPostponableGames)
    .get(    '/available-makeup-rounds', requireAuthentication, getAvailableMakeupRounds)
    .get(    '/test-postpone',       requireAuthentication, testPostpone)
    .get(    '/debug-rounds',        requireAuthentication, debugRounds)
    .delete('/:round_id',            requireAuthentication, requireAdmin, deleteMakeupRound);

  parent.use(router.routes()).use(router.allowedMethods());
};

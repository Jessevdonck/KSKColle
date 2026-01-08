import Router from '@koa/router';
import * as puzzleService from '../service/puzzleService';
import type { ChessAppContext, ChessAppState } from '../types/koa';
import Joi from 'joi';
import validate from '../core/validation';
import { requireAuthentication, makeRequireRole } from '../core/auth';
import Role from '../core/roles';

/**
 * @api {post} /puzzles Create a new puzzle
 * @apiName CreatePuzzle
 * @apiGroup Puzzle
 *
 * @apiBody {String} name Puzzle name
 * @apiBody {String} start_position FEN notation of starting position
 * @apiBody {String} active_color "white" or "black"
 * @apiBody {Array} solution Array of moves [{from: string, to: string}]
 *
 * @apiSuccess {Object} puzzle The created puzzle.
 */
const createPuzzle = async (ctx: any) => {
  const userId = ctx.state.session.userId;
  const puzzle = await puzzleService.createPuzzle(userId, ctx.request.body);
  ctx.status = 201;
  ctx.body = puzzle;
};
createPuzzle.validationScheme = {
  body: {
    name: Joi.string().required(),
    start_position: Joi.string().required(),
    active_color: Joi.string().valid('white', 'black').required(),
    solution: Joi.array().items(
      Joi.object({
        from: Joi.string().required(),
        to: Joi.string().required(),
      })
    ).required(),
  },
};

/**
 * @api {get} /puzzles Get all puzzles
 * @apiName GetAllPuzzles
 * @apiGroup Puzzle
 *
 * @apiSuccess {Object[]} items List of all puzzles.
 */
const getAllPuzzles = async (ctx: any) => {
  const puzzles = await puzzleService.getAllPuzzles();
  ctx.body = { items: puzzles };
};
getAllPuzzles.validationScheme = null;

/**
 * @api {get} /puzzles/:puzzle_id Get puzzle by ID
 * @apiName GetPuzzleById
 * @apiGroup Puzzle
 *
 * @apiParam {Number} puzzle_id The ID of the puzzle.
 *
 * @apiSuccess {Object} puzzle The puzzle data.
 */
const getPuzzleById = async (ctx: any) => {
  const puzzleId = Number(ctx.params.puzzle_id);
  const puzzle = await puzzleService.getPuzzleById(puzzleId);
  ctx.body = puzzle;
};
getPuzzleById.validationScheme = {
  params: {
    puzzle_id: Joi.number().integer().positive(),
  },
};

/**
 * @api {put} /puzzles/:puzzle_id Update puzzle
 * @apiName UpdatePuzzle
 * @apiGroup Puzzle
 *
 * @apiParam {Number} puzzle_id The ID of the puzzle.
 * @apiBody {String} name Puzzle name (optional)
 * @apiBody {String} start_position FEN notation (optional)
 * @apiBody {String} active_color "white" or "black" (optional)
 * @apiBody {Array} solution Array of moves (optional)
 *
 * @apiSuccess {Object} puzzle The updated puzzle.
 */
const updatePuzzle = async (ctx: any) => {
  const userId = ctx.state.session.userId;
  const puzzleId = Number(ctx.params.puzzle_id);
  const puzzle = await puzzleService.updatePuzzle(puzzleId, userId, ctx.request.body);
  ctx.body = puzzle;
};
updatePuzzle.validationScheme = {
  params: {
    puzzle_id: Joi.number().integer().positive(),
  },
  body: {
    name: Joi.string().optional(),
    start_position: Joi.string().optional(),
    active_color: Joi.string().valid('white', 'black').optional(),
    solution: Joi.array().items(
      Joi.object({
        from: Joi.string().required(),
        to: Joi.string().required(),
      })
    ).optional(),
  },
};

/**
 * @api {delete} /puzzles/:puzzle_id Delete puzzle
 * @apiName DeletePuzzle
 * @apiGroup Puzzle
 *
 * @apiParam {Number} puzzle_id The ID of the puzzle.
 *
 * @apiSuccess (204) NoContent The puzzle was successfully deleted.
 */
const deletePuzzle = async (ctx: any) => {
  const userId = ctx.state.session.userId;
  const puzzleId = Number(ctx.params.puzzle_id);
  await puzzleService.deletePuzzle(puzzleId, userId);
  ctx.status = 204;
};
deletePuzzle.validationScheme = {
  params: {
    puzzle_id: Joi.number().integer().positive(),
  },
};

/**
 * @api {post} /puzzles/:puzzle_id/attempt Save a puzzle attempt
 * @apiName SavePuzzleAttempt
 * @apiGroup Puzzle
 *
 * @apiParam {Number} puzzle_id The ID of the puzzle.
 * @apiBody {Number} solve_time_ms Time in milliseconds to solve the puzzle
 *
 * @apiSuccess {Object} attempt The saved attempt.
 */
const savePuzzleAttempt = async (ctx: any) => {
  const userId = ctx.state.session.userId;
  const puzzleId = Number(ctx.params.puzzle_id);
  const { solve_time_ms } = ctx.request.body;
  const attempt = await puzzleService.savePuzzleAttempt(userId, puzzleId, solve_time_ms);
  ctx.body = attempt;
};
savePuzzleAttempt.validationScheme = {
  params: {
    puzzle_id: Joi.number().integer().positive(),
  },
  body: {
    solve_time_ms: Joi.number().integer().positive().required(),
  },
};

/**
 * @api {get} /puzzles/:puzzle_id/leaderboard Get puzzle leaderboard
 * @apiName GetPuzzleLeaderboard
 * @apiGroup Puzzle
 *
 * @apiParam {Number} puzzle_id The ID of the puzzle.
 *
 * @apiSuccess {Object[]} leaderboard List of leaderboard entries sorted by time.
 */
const getPuzzleLeaderboard = async (ctx: any) => {
  const puzzleId = Number(ctx.params.puzzle_id);
  const limit = ctx.query.limit ? Number(ctx.query.limit) : 50;
  const leaderboard = await puzzleService.getPuzzleLeaderboard(puzzleId, limit);
  ctx.body = { items: leaderboard };
};
getPuzzleLeaderboard.validationScheme = {
  params: {
    puzzle_id: Joi.number().integer().positive(),
  },
};

/**
 * @api {get} /puzzles/:puzzle_id/attempt Get user's attempt for a puzzle
 * @apiName GetUserPuzzleAttempt
 * @apiGroup Puzzle
 *
 * @apiParam {Number} puzzle_id The ID of the puzzle.
 *
 * @apiSuccess {Object|null} attempt The user's attempt or null if not found.
 */
const getUserPuzzleAttempt = async (ctx: any) => {
  const userId = ctx.state.session.userId;
  const puzzleId = Number(ctx.params.puzzle_id);
  const attempt = await puzzleService.getUserPuzzleAttempt(userId, puzzleId);
  ctx.body = attempt;
};
getUserPuzzleAttempt.validationScheme = {
  params: {
    puzzle_id: Joi.number().integer().positive(),
  },
};

export default (parent: Router<ChessAppState, ChessAppContext>) => {
  const router = new Router({
    prefix: '/puzzles',
  });

  const requirePuzzleMaster = makeRequireRole([Role.PUZZLEMASTER, Role.ADMIN]);

  router.get('/', requireAuthentication, validate(getAllPuzzles.validationScheme), getAllPuzzles);
  router.get('/:puzzle_id', requireAuthentication, validate(getPuzzleById.validationScheme), getPuzzleById);
  router.get('/:puzzle_id/leaderboard', requireAuthentication, validate(getPuzzleLeaderboard.validationScheme), getPuzzleLeaderboard);
  router.get('/:puzzle_id/attempt', requireAuthentication, validate(getUserPuzzleAttempt.validationScheme), getUserPuzzleAttempt);
  router.post('/', requireAuthentication, requirePuzzleMaster, validate(createPuzzle.validationScheme), createPuzzle);
  router.post('/:puzzle_id/attempt', requireAuthentication, validate(savePuzzleAttempt.validationScheme), savePuzzleAttempt);
  router.put('/:puzzle_id', requireAuthentication, requirePuzzleMaster, validate(updatePuzzle.validationScheme), updatePuzzle);
  router.delete('/:puzzle_id', requireAuthentication, requirePuzzleMaster, validate(deletePuzzle.validationScheme), deletePuzzle);

  parent.use(router.routes()).use(router.allowedMethods());
};

export {
  createPuzzle,
  getAllPuzzles,
  getPuzzleById,
  updatePuzzle,
  deletePuzzle,
};


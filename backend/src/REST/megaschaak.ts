import Router from '@koa/router';
import * as megaschaakService from '../service/megaschaakService';
import type { ChessAppContext, ChessAppState, KoaContext } from '../types/koa';
import Joi from 'joi';
import validate from '../core/validation';
import { requireAuthentication, makeRequireRole } from '../core/auth';
import Role from '../core/roles';
import {
  SHORT_CACHE_KEY_PREFIX,
  SHORT_CACHE_TTL_MS,
  invalidateMegaschaakCache,
} from '../core/shortLivedCache';
import { withShortLivedCache } from '../core/withShortLivedCache';

const megaschaakKey = (suffix: string) => `${SHORT_CACHE_KEY_PREFIX.megaschaak}${suffix}`;

/**
 * @api {get} /megaschaak/active-tournament Get the active megaschaak tournament
 * @apiName GetActiveTournament
 * @apiGroup Megaschaak
 */
const getActiveTournament = async (ctx: KoaContext) => {
  ctx.body = await withShortLivedCache(
    megaschaakKey('active-tournament'),
    SHORT_CACHE_TTL_MS.megaschaakRead,
    async () => {
      const tournament = await megaschaakService.getActiveMegaschaakTournament();
      return tournament || null;
    },
  );
};

/**
 * @api {get} /megaschaak/archive List all megaschaak competitions (for archive picker)
 * @apiName GetMegaschaakArchive
 * @apiGroup Megaschaak
 */
const getArchive = async (ctx: KoaContext) => {
  ctx.body = await withShortLivedCache(
    megaschaakKey('archive'),
    SHORT_CACHE_TTL_MS.megaschaakRead,
    async () => {
      const items = await megaschaakService.getMegaschaakArchive();
      return { items };
    },
  );
};

/**
 * @api {get} /megaschaak/players Get all available players with costs
 * @apiName GetAvailablePlayers
 * @apiGroup Megaschaak
 */
const getAvailablePlayers = async (ctx: KoaContext) => {
  ctx.body = await withShortLivedCache(
    megaschaakKey('players'),
    SHORT_CACHE_TTL_MS.megaschaakPlayers,
    async () => {
      const players = await megaschaakService.getAvailablePlayers();
      return { items: players };
    },
  );
};

/**
 * @api {get} /megaschaak/tournament/:tournamentId/my-teams Get user's teams for tournament
 * @apiName GetMyTeams
 * @apiGroup Megaschaak
 */
const getMyTeams = async (ctx: KoaContext) => {
  const userId = ctx.state.session.userId;
  const tournamentId = Number((ctx.params as { tournamentId: string }).tournamentId);
  
  ctx.body = await withShortLivedCache(
    megaschaakKey(`my-teams:${tournamentId}:${userId}`),
    SHORT_CACHE_TTL_MS.megaschaakRead,
    async () => {
      const teams = await megaschaakService.getUserTeams(userId, tournamentId);
      return { items: teams };
    },
  );
};

getMyTeams.validationScheme = {
  params: {
    tournamentId: Joi.number().integer().positive().required(),
  },
};

/**
 * @api {get} /megaschaak/team/:teamId Get specific team
 * @apiName GetTeam
 * @apiGroup Megaschaak
 */
const getTeam = async (ctx: KoaContext) => {
  const userId = ctx.state.session.userId;
  const teamId = Number((ctx.params as { teamId: string }).teamId);
  
  const team = await megaschaakService.getTeamById(teamId, userId);
  ctx.body = team;
};

getTeam.validationScheme = {
  params: {
    teamId: Joi.number().integer().positive().required(),
  },
};

/**
 * @api {post} /megaschaak/tournament/:tournamentId/team Create new team
 * @apiName CreateTeam
 * @apiGroup Megaschaak
 */
const createTeam = async (ctx: KoaContext) => {
  const userId = ctx.state.session.userId;
  const tournamentId = Number((ctx.params as { tournamentId: string }).tournamentId);
  const { playerIds, teamName, reservePlayerId } = ctx.request.body as { playerIds: number[], teamName: string, reservePlayerId?: number };
  
  const team = await megaschaakService.createTeam(userId, tournamentId, playerIds, teamName, reservePlayerId);
  invalidateMegaschaakCache();
  ctx.status = 201;
  ctx.body = team;
};

createTeam.validationScheme = {
  params: {
    tournamentId: Joi.number().integer().positive().required(),
  },
  body: {
    playerIds: Joi.array().items(Joi.number().integer().positive()).max(10).required(),
    teamName: Joi.string().max(100).required(),
    reservePlayerId: Joi.number().integer().positive().optional(),
  },
};

/**
 * @api {put} /megaschaak/team/:teamId Update existing team
 * @apiName UpdateTeam
 * @apiGroup Megaschaak
 */
const updateTeam = async (ctx: KoaContext) => {
  const userId = ctx.state.session.userId;
  const teamId = Number((ctx.params as { teamId: string }).teamId);
  const { playerIds, teamName, reservePlayerId } = ctx.request.body as { playerIds: number[], teamName?: string, reservePlayerId?: number | null };
  
  const team = await megaschaakService.updateTeam(teamId, userId, playerIds, teamName, reservePlayerId);
  invalidateMegaschaakCache();
  ctx.body = team;
};

updateTeam.validationScheme = {
  params: {
    teamId: Joi.number().integer().positive().required(),
  },
  body: {
    playerIds: Joi.array().items(Joi.number().integer().positive()).max(10).required(),
    teamName: Joi.string().max(100).optional(),
    reservePlayerId: Joi.number().integer().positive().optional().allow(null),
  },
};

/**
 * @api {delete} /megaschaak/team/:teamId Delete team
 * @apiName DeleteTeam
 * @apiGroup Megaschaak
 */
const deleteTeamHandler = async (ctx: KoaContext) => {
  const userId = ctx.state.session.userId;
  const teamId = Number((ctx.params as { teamId: string }).teamId);
  
  await megaschaakService.deleteTeam(teamId, userId);
  invalidateMegaschaakCache();
  ctx.status = 204;
};

deleteTeamHandler.validationScheme = {
  params: {
    teamId: Joi.number().integer().positive().required(),
  },
};

/**
 * @api {patch} /megaschaak/tournament/:tournamentId/toggle Enable/disable megaschaak for tournament (admin only)
 * @apiName ToggleMegaschaak
 * @apiGroup Megaschaak
 */
const toggleMegaschaak = async (ctx: KoaContext) => {
  const tournamentId = Number((ctx.params as { tournamentId: string }).tournamentId);
  const { enabled } = ctx.request.body as { enabled: boolean };
  
  const tournament = await megaschaakService.toggleMegaschaak(tournamentId, enabled);
  invalidateMegaschaakCache();
  ctx.body = tournament;
};

toggleMegaschaak.validationScheme = {
  params: {
    tournamentId: Joi.number().integer().positive().required(),
  },
  body: {
    enabled: Joi.boolean().required(),
  },
};

/**
 * @api {patch} /megaschaak/tournament/:tournamentId/deadline Set registration deadline (admin only)
 * @apiName SetMegaschaakDeadline
 * @apiGroup Megaschaak
 */
const setMegaschaakDeadline = async (ctx: KoaContext) => {
  const tournamentId = Number((ctx.params as { tournamentId: string }).tournamentId);
  const { deadline } = ctx.request.body as { deadline: string | null };
  
  const deadlineDate = deadline ? new Date(deadline) : null;
  const tournament = await megaschaakService.setMegaschaakDeadline(tournamentId, deadlineDate);
  invalidateMegaschaakCache();
  ctx.body = tournament;
};

setMegaschaakDeadline.validationScheme = {
  params: {
    tournamentId: Joi.number().integer().positive().required(),
  },
  body: {
    deadline: Joi.date().iso().allow(null).required(),
  },
};

/**
 * @api {get} /megaschaak/tournament/:tournamentId/standings Get team standings
 * @apiName GetTeamStandings
 * @apiGroup Megaschaak
 */
const getTeamStandings = async (ctx: KoaContext) => {
  const tournamentId = Number((ctx.params as { tournamentId: string }).tournamentId);
  ctx.body = await withShortLivedCache(
    megaschaakKey(`standings:${tournamentId}`),
    SHORT_CACHE_TTL_MS.megaschaakRead,
    async () => {
      const standings = await megaschaakService.getTeamStandings(tournamentId);
      return { items: standings };
    },
  );
};

getTeamStandings.validationScheme = {
  params: {
    tournamentId: Joi.number().integer().positive().required(),
  },
};

/**
 * @api {get} /megaschaak/tournament/:tournamentId/crosstable Get cross-table data
 * @apiName GetCrossTable
 * @apiGroup Megaschaak
 */
const getCrossTable = async (ctx: KoaContext) => {
  const tournamentId = Number((ctx.params as { tournamentId: string }).tournamentId);
  ctx.body = await withShortLivedCache(
    megaschaakKey(`crosstable:${tournamentId}`),
    SHORT_CACHE_TTL_MS.megaschaakRead,
    () => megaschaakService.getCrossTableData(tournamentId),
  );
};

getCrossTable.validationScheme = {
  params: {
    tournamentId: Joi.number().integer().positive().required(),
  },
};

/**
 * @api {get} /megaschaak/team/:teamId/details Get detailed team scores
 * @apiName GetTeamDetails
 * @apiGroup Megaschaak
 */
const getTeamDetails = async (ctx: KoaContext) => {
  const teamId = Number((ctx.params as { teamId: string }).teamId);
  ctx.body = await withShortLivedCache(
    megaschaakKey(`team-details:${teamId}`),
    SHORT_CACHE_TTL_MS.megaschaakRead,
    () => megaschaakService.getTeamDetailedScores(teamId),
  );
};

getTeamDetails.validationScheme = {
  params: {
    teamId: Joi.number().integer().positive().required(),
  },
};

/**
 * @api {get} /megaschaak/tournament/:tournamentId/popular-players Get most popular players
 * @apiName GetPopularPlayers
 * @apiGroup Megaschaak
 */
const getPopularPlayers = async (ctx: KoaContext) => {
  const tournamentId = Number((ctx.params as { tournamentId: string }).tournamentId);
  ctx.body = await withShortLivedCache(
    megaschaakKey(`popular:${tournamentId}`),
    SHORT_CACHE_TTL_MS.megaschaakRead,
    async () => {
      const players = await megaschaakService.getMostPopularPlayers(tournamentId);
      return { items: players };
    },
  );
};

getPopularPlayers.validationScheme = {
  params: {
    tournamentId: Joi.number().integer().positive().required(),
  },
};

/**
 * @api {get} /megaschaak/tournament/:tournamentId/value-players Get best value players
 * @apiName GetValuePlayers
 * @apiGroup Megaschaak
 */
const getValuePlayers = async (ctx: KoaContext) => {
  const tournamentId = Number((ctx.params as { tournamentId: string }).tournamentId);
  ctx.body = await withShortLivedCache(
    megaschaakKey(`value:${tournamentId}`),
    SHORT_CACHE_TTL_MS.megaschaakRead,
    async () => {
      const players = await megaschaakService.getBestValuePlayers(tournamentId);
      return { items: players };
    },
  );
};

getValuePlayers.validationScheme = {
  params: {
    tournamentId: Joi.number().integer().positive().required(),
  },
};

/**
 * @api {get} /megaschaak/tournament/:tournamentId/all-teams Get all teams for tournament (admin only)
 * @apiName GetAllTeams
 * @apiGroup Megaschaak
 */
const getAllTeams = async (ctx: KoaContext) => {
  const tournamentId = Number((ctx.params as { tournamentId: string }).tournamentId);
  const teams = await megaschaakService.getAllTeamsForTournament(tournamentId);
  ctx.body = { items: teams };
};

getAllTeams.validationScheme = {
  params: {
    tournamentId: Joi.number().integer().positive().required(),
  },
};

/**
 * @api {post} /megaschaak/admin/tournament/:tournamentId/team Create team for a user (admin only)
 * @apiName AdminCreateTeam
 * @apiGroup Megaschaak
 */
const adminCreateTeam = async (ctx: KoaContext) => {
  const tournamentId = Number((ctx.params as { tournamentId: string }).tournamentId);
  const { playerIds, teamName, reservePlayerId, userId } = ctx.request.body as { 
    playerIds: number[], 
    teamName: string, 
    reservePlayerId?: number,
    userId: number 
  };
  
  if (!userId) {
    ctx.status = 400;
    ctx.body = { message: 'userId is verplicht' };
    return;
  }
  
  const team = await megaschaakService.adminCreateTeam(userId, tournamentId, playerIds, teamName, reservePlayerId);
  invalidateMegaschaakCache();
  ctx.status = 201;
  ctx.body = team;
};

adminCreateTeam.validationScheme = {
  params: {
    tournamentId: Joi.number().integer().positive().required(),
  },
  body: {
    playerIds: Joi.array().items(Joi.number().integer().positive()).max(10).required(),
    teamName: Joi.string().max(100).required(),
    reservePlayerId: Joi.number().integer().positive().optional(),
    userId: Joi.number().integer().positive().required(),
  },
};

/**
 * @api {delete} /megaschaak/admin/team/:teamId Delete team as admin
 * @apiName AdminDeleteTeam
 * @apiGroup Megaschaak
 */
const adminDeleteTeam = async (ctx: KoaContext) => {
  const teamId = Number((ctx.params as { teamId: string }).teamId);
  await megaschaakService.adminDeleteTeam(teamId);
  invalidateMegaschaakCache();
  ctx.status = 204;
};

adminDeleteTeam.validationScheme = {
  params: {
    teamId: Joi.number().integer().positive().required(),
  },
};

/**
 * @api {get} /megaschaak/tournament/:tournamentId/config Get megaschaak formula configuration (admin only)
 * @apiName GetMegaschaakConfig
 * @apiGroup Megaschaak
 */
const getMegaschaakConfig = async (ctx: KoaContext) => {
  const tournamentId = Number((ctx.params as { tournamentId: string }).tournamentId);
  const config = await megaschaakService.getMegaschaakConfiguration(tournamentId);
  ctx.body = config;
};

getMegaschaakConfig.validationScheme = {
  params: {
    tournamentId: Joi.number().integer().positive().required(),
  },
};

/**
 * @api {patch} /megaschaak/tournament/:tournamentId/config Update megaschaak formula configuration (admin only)
 * @apiName UpdateMegaschaakConfig
 * @apiGroup Megaschaak
 */
const updateMegaschaakConfig = async (ctx: KoaContext) => {
  const tournamentId = Number((ctx.params as { tournamentId: string }).tournamentId);
  const config = ctx.request.body as any;
  const updatedConfig = await megaschaakService.updateMegaschaakConfiguration(tournamentId, config);
  invalidateMegaschaakCache();
  ctx.body = updatedConfig;
};

updateMegaschaakConfig.validationScheme = {
  params: {
    tournamentId: Joi.number().integer().positive().required(),
  },
  body: {
    classBonusPoints: Joi.object().optional(),
    roundsPerClass: Joi.object().optional(),
    correctieMultiplier: Joi.number().optional(),
    correctieSubtract: Joi.number().optional(),
    minCost: Joi.number().optional(),
    maxCost: Joi.number().optional(),
  },
};

export default (parent: Router<ChessAppState, ChessAppContext>) => {
  const router = new Router({
    prefix: '/megaschaak',
  });

  const requireAdmin = makeRequireRole(Role.ADMIN);

  // Public routes (read-only, no authentication required)
  router.get('/active-tournament', getActiveTournament);
  router.get('/archive', getArchive);
  router.get('/players', getAvailablePlayers);
  router.get('/tournament/:tournamentId/standings', validate(getTeamStandings.validationScheme), getTeamStandings);
  router.get('/tournament/:tournamentId/crosstable', validate(getCrossTable.validationScheme), getCrossTable);
  router.get('/team/:teamId/details', validate(getTeamDetails.validationScheme), getTeamDetails);
  router.get('/tournament/:tournamentId/popular-players', validate(getPopularPlayers.validationScheme), getPopularPlayers);
  router.get('/tournament/:tournamentId/value-players', validate(getValuePlayers.validationScheme), getValuePlayers);
  
  // Member routes (authentication required)
  router.get('/tournament/:tournamentId/my-teams', requireAuthentication, validate(getMyTeams.validationScheme), getMyTeams);
  router.get('/team/:teamId', requireAuthentication, validate(getTeam.validationScheme), getTeam);
  router.post('/tournament/:tournamentId/team', requireAuthentication, validate(createTeam.validationScheme), createTeam);
  router.put('/team/:teamId', requireAuthentication, validate(updateTeam.validationScheme), updateTeam);
  router.delete('/team/:teamId', requireAuthentication, validate(deleteTeamHandler.validationScheme), deleteTeamHandler);
  
  // Admin only routes
  router.patch('/tournament/:tournamentId/toggle', requireAuthentication, requireAdmin, validate(toggleMegaschaak.validationScheme), toggleMegaschaak);
  router.patch('/tournament/:tournamentId/deadline', requireAuthentication, requireAdmin, validate(setMegaschaakDeadline.validationScheme), setMegaschaakDeadline);
  router.get('/tournament/:tournamentId/all-teams', requireAuthentication, requireAdmin, validate(getAllTeams.validationScheme), getAllTeams);
  router.post('/admin/tournament/:tournamentId/team', requireAuthentication, requireAdmin, validate(adminCreateTeam.validationScheme), adminCreateTeam);
  router.delete('/admin/team/:teamId', requireAuthentication, requireAdmin, validate(adminDeleteTeam.validationScheme), adminDeleteTeam);
  router.get('/tournament/:tournamentId/config', requireAuthentication, requireAdmin, validate(getMegaschaakConfig.validationScheme), getMegaschaakConfig);
  router.patch('/tournament/:tournamentId/config', requireAuthentication, requireAdmin, validate(updateMegaschaakConfig.validationScheme), updateMegaschaakConfig);

  parent.use(router.routes()).use(router.allowedMethods());
};


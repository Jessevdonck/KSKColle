import Router from '@koa/router';
import { requireAuthentication, makeRequireRole } from '../core/auth';
import { ratingService } from '../service/ratingService';
import { prisma } from '../data';
import {
  shortLivedCacheInvalidatePrefix,
  SHORT_CACHE_KEY_PREFIX,
  invalidateTournamentDetailCache,
  invalidateTournamentRoundsCache,
  invalidatePublicUsersCache,
} from '../core/shortLivedCache';

const requireAdmin = makeRequireRole('admin');

export function installTournamentCloseRouter(router: Router) {
  // Close tournament and optionally update ratings
  router.post('/tournament/:id/close', requireAuthentication, requireAdmin, async (ctx) => {
    try {
      const tournamentId = parseInt(ctx.params.id || '0');
      const { updateRatings = true } = ctx.request.body as { updateRatings?: boolean };
      
      if (isNaN(tournamentId)) {
        ctx.status = 400;
        ctx.body = { error: 'Invalid tournament ID' };
        return;
      }

      // Check if tournament exists
      const tournament = await prisma.tournament.findUnique({
        where: { tournament_id: tournamentId },
      });

      if (!tournament) {
        ctx.status = 404;
        ctx.body = { error: 'Tournament not found' };
        return;
      }

      if (tournament.finished) {
        ctx.status = 400;
        ctx.body = { error: 'Tournament is already finished' };
        return;
      }

      // Update ratings for all players if requested
      if (updateRatings) {
        await ratingService.updateRatingsForTournament(tournamentId);
      }

      // Mark tournament as finished
      await prisma.tournament.update({
        where: { tournament_id: tournamentId },
        data: { finished: true },
      });

      shortLivedCacheInvalidatePrefix(SHORT_CACHE_KEY_PREFIX.tournamentList);
      invalidateTournamentDetailCache(tournamentId);
      invalidateTournamentRoundsCache(tournamentId);
      if (updateRatings) invalidatePublicUsersCache();

      ctx.status = 200;
      ctx.body = {
        message: updateRatings 
          ? `Tournament "${tournament.naam}" has been closed and ratings have been updated`
          : `Tournament "${tournament.naam}" has been closed without updating ratings`,
        tournamentId: tournamentId,
        ratingsUpdated: updateRatings,
      };

    } catch (error) {
      console.error('Error closing tournament:', error);
      ctx.status = 500;
      ctx.body = { error: 'Failed to close tournament' };
    }
  });
}

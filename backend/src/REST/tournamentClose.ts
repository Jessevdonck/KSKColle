import Router from '@koa/router';
import { requireAuthentication, makeRequireRole } from '../core/auth';
import { ratingService } from '../service/ratingService';
import { saveTournamentPodium, type PodiumEntry } from '../service/honorService';
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
      const { updateRatings = true, podium } = ctx.request.body as {
        updateRatings?: boolean;
        podium?: PodiumEntry[];
      };
      
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

      // Leg het podium vast in de erelijst/palmares. Het podium komt van de
      // frontend (zelfde berekening als de getoonde eindstand); zonder podium
      // valt de service terug op score/tie-break uit de deelnames.
      try {
        await saveTournamentPodium(tournamentId, podium);
      } catch (honorError) {
        // Afsluiten mag niet falen op de erelijst; log en ga verder
        console.error('Error saving tournament podium:', honorError);
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

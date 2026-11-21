import Router from '@koa/router';
import { requireAuthentication, makeRequireRole } from '../core/auth';
import { ratingService } from '../service/ratingService';
import { saveTournamentPodium, type PodiumEntry } from '../service/honorService';
import { prisma } from '../data';
import { countsForBlitz } from '../core/ratedCompetitions';
import { recalculateBlitzRatings } from '../service/blitzRatingService';
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
      const { updateRatings = true, podium, ranking } = ctx.request.body as {
        updateRatings?: boolean;
        podium?: PodiumEntry[];
        /** Volledige eindstand (user_id's in volgorde), zelfde berekening als de getoonde stand */
        ranking?: number[];
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

      // Update ratings for all players if requested (enkel herfst/lente telt voor ELIO)
      const ratingsUpdated = updateRatings
        ? await ratingService.updateRatingsForTournament(tournamentId)
        : false;

      // Leg het podium vast in de erelijst/palmares. Het podium komt van de
      // frontend (zelfde berekening als de getoonde eindstand); zonder podium
      // valt de service terug op score/tie-break uit de deelnames.
      try {
        await saveTournamentPodium(tournamentId, podium);
      } catch (honorError) {
        // Afsluiten mag niet falen op de erelijst; log en ga verder
        console.error('Error saving tournament podium:', honorError);
      }

      // Eindrang per speler bewaren (palmares op het profiel)
      if (Array.isArray(ranking) && ranking.length > 0) {
        try {
          await prisma.$transaction(
            ranking
              .filter((id) => Number.isInteger(id))
              .map((userId, index) =>
                prisma.participation.updateMany({
                  where: { tournament_id: tournamentId, user_id: userId },
                  data: { final_rank: index + 1 },
                }),
              ),
          );
        } catch (rankError) {
          console.error('Error saving final ranking:', rankError);
        }
      }

      // Mark tournament as finished
      await prisma.tournament.update({
        where: { tournament_id: tournamentId },
        data: { finished: true },
      });

      // Blitz: aparte blitzrating herberekenen (telt niet voor de ELIO)
      if (countsForBlitz(tournament.naam)) {
        try {
          await recalculateBlitzRatings();
          invalidatePublicUsersCache();
        } catch (blitzError) {
          console.error('Error recalculating blitz ratings:', blitzError);
        }
      }

      shortLivedCacheInvalidatePrefix(SHORT_CACHE_KEY_PREFIX.tournamentList);
      invalidateTournamentDetailCache(tournamentId);
      invalidateTournamentRoundsCache(tournamentId);
      if (ratingsUpdated) invalidatePublicUsersCache();

      ctx.status = 200;
      ctx.body = {
        message: ratingsUpdated
          ? `Tournament "${tournament.naam}" has been closed and ratings have been updated`
          : `Tournament "${tournament.naam}" has been closed without updating ratings`,
        tournamentId: tournamentId,
        ratingsUpdated,
      };

    } catch (error) {
      console.error('Error closing tournament:', error);
      ctx.status = 500;
      ctx.body = { error: 'Failed to close tournament' };
    }
  });
}

import Router from '@koa/router';
import { requireAuthentication, makeRequireRole } from '../core/auth';
import { ratingService } from '../service/ratingService';
import { prisma } from '../data';

const requireAdmin = makeRequireRole('admin');

export function installTournamentCloseRouter(router: Router) {
  // Close tournament and update ratings
  router.post('/tournament/:id/close', requireAuthentication, requireAdmin, async (ctx) => {
    try {
      const tournamentId = parseInt(ctx.params.id);
      
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

      console.log(`Closing tournament ${tournamentId}: ${tournament.naam}`);

      // Update ratings for all players
      await ratingService.updateRatingsForTournament(tournamentId);

      // Mark tournament as finished
      await prisma.tournament.update({
        where: { tournament_id: tournamentId },
        data: { finished: true },
      });

      ctx.status = 200;
      ctx.body = {
        message: `Tournament "${tournament.naam}" has been closed and ratings have been updated`,
        tournamentId: tournamentId,
      };

    } catch (error) {
      console.error('Error closing tournament:', error);
      ctx.status = 500;
      ctx.body = { error: 'Failed to close tournament' };
    }
  });
}

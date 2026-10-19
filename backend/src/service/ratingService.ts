import { prisma } from '../data';
import { invalidatePublicUsersCache } from '../core/shortLivedCache';
import { currentPeriod } from '../core/period';
import { countsForElio } from '../core/ratedCompetitions';

export class RatingService {
  private readonly K_FACTOR = 32; // Standard K-factor for tournaments

  /**
   * Calculate expected score using Elo formula
   */
  calculateExpectedScore(playerRating: number, opponentRating: number): number {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  }

  /**
   * Calculate rating change for a single game
   */
  calculateRatingChange(playerRating: number, opponentRating: number, actualScore: number): number {
    const expectedScore = this.calculateExpectedScore(playerRating, opponentRating);
    return this.K_FACTOR * (actualScore - expectedScore);
  }

  /**
   * Update ratings for all players in a tournament using Sevilla data.
   * Enkel voor de herfst- en lentecompetitie; geeft terug of er iets bijgewerkt is.
   */
  async updateRatingsForTournament(tournamentId: number): Promise<boolean> {

    // Get tournament to find the Sevilla data
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId },
    });

    if (!tournament) {
      throw new Error(`Tournament ${tournamentId} not found`);
    }

    // Zomertoernooi, blitz, rapid, … mogen de ELIO niet wijzigen
    if (!countsForElio(tournament.naam, tournament.class_name)) {
      return false;
    }

    // Get all participations with minimal user data (only what's needed for rating updates)
    const participations = await prisma.participation.findMany({
      where: { tournament_id: tournamentId },
      select: {
        user_id: true,
        tournament_id: true,
        score: true,
        sevilla_initial_rating: true,
        sevilla_final_rating: true,
        sevilla_rating_change: true,
        user: {
          select: {
            user_id: true,
            schaakrating_elo: true,
            schaakrating_difference: true,
            schaakrating_max: true,
          }
        }
      },
    });

    // Update ratings using Sevilla rating data
    const period = currentPeriod();
    for (const participation of participations) {
      // Check if we have Sevilla rating data
      if (participation.sevilla_final_rating !== null && participation.sevilla_rating_change !== null) {
        const newRating = participation.sevilla_final_rating;
        const ratingChange = participation.sevilla_rating_change;
        const currentRating = participation.user.schaakrating_elo;

        await prisma.user.update({
          where: { user_id: participation.user_id },
          data: {
            schaakrating_elo: newRating,
            schaakrating_difference: ratingChange,
            schaakrating_max: Math.max(participation.user.schaakrating_max || currentRating, newRating),
          },
        });

        // Voegt een punt toe aan de ELIO-historiekgrafiek op het profiel, zodat die
        // meegroeit met elk toernooi dat de rating bijwerkt (niet enkel de eenmalige
        // Excel-import). Zelfde maand => overschrijft (bv. bij meerdere afsluitingen
        // in dezelfde maand blijft enkel de laatste rating staan).
        await prisma.eloHistory.upsert({
          where: { user_id_period: { user_id: participation.user_id, period } },
          create: { user_id: participation.user_id, period, rating: newRating },
          update: { rating: newRating },
        });
      }
    }

    invalidatePublicUsersCache();
    return true;
  }
}

export const ratingService = new RatingService();

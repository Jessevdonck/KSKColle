import { prisma } from '../data';

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
   * Update ratings for all players in a tournament using Sevilla data
   */
  async updateRatingsForTournament(tournamentId: number): Promise<void> {
    console.log(`Starting rating update for tournament ${tournamentId}`);

    // Get tournament to find the Sevilla data
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId },
    });

    if (!tournament) {
      throw new Error(`Tournament ${tournamentId} not found`);
    }

    // Get all participations with Sevilla rating data
    const participations = await prisma.participation.findMany({
      where: { tournament_id: tournamentId },
      include: {
        user: true,
      },
    });

    console.log(`Found ${participations.length} participations`);

    // Update ratings using Sevilla rating data
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

        console.log(`✅ Updated rating for ${participation.user.voornaam} ${participation.user.achternaam}: ${currentRating} -> ${newRating} (change: ${ratingChange > 0 ? '+' : ''}${ratingChange})`);
      } else {
        console.log(`⏭️  No Sevilla rating data for ${participation.user.voornaam} ${participation.user.achternaam}, skipping`);
      }
    }

    console.log(`✅ Rating update completed for tournament ${tournamentId}`);
  }
}

export const ratingService = new RatingService();

/**
 * Utility functions for sorting tournament games
 */

export interface GameWithScore {
  game_id: number;
  speler1: {
    user_id: number;
    schaakrating_elo?: number;
  };
  speler2?: {
    user_id: number;
    schaakrating_elo?: number;
  } | null;
  round?: {
    ronde_nummer: number;
  };
  uitgestelde_datum?: Date | null;
}

export interface Participation {
  user_id: number;
  score: number;
  tie_break: number;
}

/**
 * Sort games by current tournament score (highest first)
 * Falls back to rating for first round or when scores are equal
 */
export function sortGamesByScore(
  games: GameWithScore[],
  participations: Participation[],
  roundNumber: number
): GameWithScore[] {
  // Create a map of user_id to participation data
  const participationMap = new Map<number, Participation>();
  participations.forEach(p => {
    participationMap.set(p.user_id, p);
  });

  return [...games].sort((a, b) => {
    const participationA = participationMap.get(a.speler1.user_id);
    const participationB = participationMap.get(b.speler1.user_id);

    // For first round, sort by rating
    if (roundNumber === 1) {
      const ratingA = a.speler1.schaakrating_elo || 0;
      const ratingB = b.speler1.schaakrating_elo || 0;
      return ratingB - ratingA;
    }

    // For subsequent rounds, sort by score
    if (!participationA || !participationB) {
      // Fallback to rating if participation data is missing
      const ratingA = a.speler1.schaakrating_elo || 0;
      const ratingB = b.speler1.schaakrating_elo || 0;
      return ratingB - ratingA;
    }

    // Primary sort: by score (highest first)
    if (participationA.score !== participationB.score) {
      return participationB.score - participationA.score;
    }

    // Secondary sort: by tie_break (highest first)
    if (participationA.tie_break !== participationB.tie_break) {
      return participationB.tie_break - participationA.tie_break;
    }

    // Tertiary sort: by rating (highest first)
    const ratingA = a.speler1.schaakrating_elo || 0;
    const ratingB = b.speler1.schaakrating_elo || 0;
    return ratingB - ratingA;
  });
}

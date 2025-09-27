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
  board_position?: number | null;
}

export interface Participation {
  user_id: number;
  score: number;
  tie_break: number;
}

/**
 * Sort games to maintain consistent pairing order
 * This function tries to preserve the original pairing order by using
 * a combination of rating and user_id for consistent sorting
 */
export function sortGamesByPairingOrder<T extends GameWithScore>(
  games: T[],
  isSevillaImported?: boolean
): T[] {
  // sortGamesByPairingOrder called
  
  return [...games].sort((a, b) => {
    // For Sevilla tournaments, maintain original board order by using game_id
    // This preserves the order in which games were imported from Sevilla
    if (isSevillaImported) {
      return a.game_id - b.game_id;
    }
    
    // For non-Sevilla tournaments, use rating-based sorting
    const ratingA = a.speler1.schaakrating_elo || 0;
    const ratingB = b.speler1.schaakrating_elo || 0;
    
    if (ratingA !== ratingB) {
      return ratingB - ratingA;
    }
    
    // Fallback to user_id for consistent ordering
    return a.speler1.user_id - b.speler1.user_id;
  });
}

/**
 * Sort games for Sevilla tournaments while preserving original board positions
 * This function maintains the original board order for postponed games
 */
export function sortSevillaGamesWithPostponed<T extends GameWithScore>(
  games: T[]
): T[] {
  // For Sevilla tournaments, we need to maintain the original pairing order
  // Use board_position if available, otherwise fall back to rating-based sorting
  
  // Sorting Sevilla games
  
  const sortedGames = [...games].sort((a, b) => {
    // For Sevilla tournaments, always sort by board_position if available
    // This preserves the original board order from Sevilla import
    
    const aBoardPos = a.board_position ?? 999; // Default to high number if no board_position
    const bBoardPos = b.board_position ?? 999; // Default to high number if no board_position
    
    // Comparing games
    
    // Sort by board_position (lower numbers first)
    if (aBoardPos !== bBoardPos) {
      const result = aBoardPos - bBoardPos;
      // Board position sort
      return result;
    }
    
    // If board_position is the same, sort by game_id as tiebreaker
    const result = a.game_id - b.game_id;
    // Game ID tiebreaker
    return result;
  });
  
  // Sorted Sevilla games
  
  return sortedGames;
}

/**
 * Sort games by current tournament score (highest first)
 * Falls back to rating for first round or when scores are equal
 */
export function sortGamesByScore<T extends GameWithScore>(
  games: T[],
  participations: Participation[],
  roundNumber: number
): T[] {
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

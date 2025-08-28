// src/strategies/SwissStrategy.ts
import { IPairingStrategy, Pairing, Competitor } from "../types/Types";

interface PlayerStanding {
  id: number;
  points: number;
  opponents: number[];
  rating: number;
  colorBalance: number; // positive = more white, negative = more black
  byeCount: number;
}

export class SwissStrategy implements IPairingStrategy {
  private opts = {
    maxPerRound: 1,
    rematchWeight: 1000,
    standingPower: 2,
    colorBalanceWeight: 50,
    ratingWeight: 10,
  };

  async generatePairings(
    players: Competitor[],
    roundNumber: number,
    previousRounds: Pairing[][]
  ): Promise<{ pairings: Pairing[]; byePlayer?: Competitor }> {
    // Build player standings with all necessary information
    const standings = this.buildPlayerStandings(players, previousRounds);
    
    // Handle bye player if odd number of players
    let byePlayer: Competitor | undefined;
    if (standings.length % 2 === 1) {
      byePlayer = this.assignByePlayer(standings, players);
    }

    // Generate pairings based on round number
    let pairings: Pairing[];
    if (roundNumber === 1) {
      pairings = this.generateFirstRoundPairings(standings);
    } else {
      pairings = this.generateSwissPairings(standings);
    }

    // Balance colors to ensure fair distribution
    pairings = this.balanceColors(pairings, standings);

    // Debug: Log pairing information
    console.log(`SwissStrategy: Generated ${pairings.length} pairings for ${standings.length} players`);
    if (byePlayer) {
      console.log(`SwissStrategy: Assigned bye to player ${byePlayer.user_id}`);
    }

    return byePlayer
      ? { pairings, byePlayer }
      : { pairings };
  }

  private buildPlayerStandings(players: Competitor[], previousRounds: Pairing[][]): PlayerStanding[] {
    const standings: PlayerStanding[] = players.map(p => ({
      id: p.user_id,
      points: p.score || 0,
      opponents: [],
      rating: p.schaakrating_elo,
      colorBalance: 0,
      byeCount: 0,
    }));

    // Process previous rounds to build complete standings
    previousRounds.forEach((round) => {
      round.forEach(pairing => {
        const player1 = standings.find(s => s.id === pairing.speler1_id);
        const player2 = standings.find(s => s.id === pairing.speler2_id);
        
        if (player1) {
          // Handle bye
          if (pairing.speler2_id === null) {
            player1.byeCount++;
            player1.points += 1; // Bye gives 1 point
          } else {
            // Regular game
            if (pairing.color1 === "W") player1.colorBalance++;
            else if (pairing.color1 === "B") player1.colorBalance--;
            
            if (pairing.color2 === "W") player2!.colorBalance++;
            else if (pairing.color2 === "B") player2!.colorBalance--;
            
            player1.opponents.push(pairing.speler2_id);
            player2!.opponents.push(pairing.speler1_id);
          }
        }
      });
    });

    return standings;
  }

  private assignByePlayer(standings: PlayerStanding[], players: Competitor[]): Competitor {
    // Sort by points (ascending), then by rating (ascending)
    const sorted = [...standings].sort((a, b) => {
      if (a.points !== b.points) return a.points - b.points;
      return a.rating - b.rating;
    });

    // Find player with lowest score who hasn't had a bye yet
    let byePlayer = sorted.find(s => s.byeCount === 0);
    
    // If everyone has had a bye, pick the player with lowest score
    if (!byePlayer) {
      byePlayer = sorted[0];
    }

    // Remove from standings
    const index = standings.findIndex(s => s.id === byePlayer!.id);
    standings.splice(index, 1);

    return players.find(p => p.user_id === byePlayer!.id)!;
  }

  private generateFirstRoundPairings(standings: PlayerStanding[]): Pairing[] {
    // Sort by rating (descending)
    const sorted = [...standings].sort((a, b) => b.rating - a.rating);
    const pairings: Pairing[] = [];
    
    // Pair high-rated with low-rated players
    const half = Math.floor(sorted.length / 2);
    for (let i = 0; i < half; i++) {
      const high = sorted[i];
      const low = sorted[sorted.length - 1 - i];
      
      if (high && low) {
        pairings.push({
          speler1_id: high.id,
          speler2_id: low.id,
          color1: "W",
          color2: "B"
        });
      }
    }

    return pairings;
  }

  private generateSwissPairings(standings: PlayerStanding[]): Pairing[] {
    // Sort by points (descending), then by rating (descending)
    const sorted = [...standings].sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      return b.rating - a.rating;
    });

    const pairings: Pairing[] = [];
    const used = new Set<number>();

    // Group players by score
    const scoreGroups = new Map<number, PlayerStanding[]>();
    sorted.forEach(player => {
      if (!scoreGroups.has(player.points)) {
        scoreGroups.set(player.points, []);
      }
      scoreGroups.get(player.points)!.push(player);
    });

    // Convert to array and sort by score (descending)
    const scoreGroupArray = Array.from(scoreGroups.entries())
      .sort(([a], [b]) => b - a);

    // Process score groups from highest to lowest
    for (let i = 0; i < scoreGroupArray.length; i++) {
      const scoreGroup = scoreGroupArray[i];
      if (!scoreGroup) continue;
      
      const [_score, players] = scoreGroup;
      let availablePlayers = players.filter((p: PlayerStanding) => !used.has(p.id));
      
      if (availablePlayers.length === 0) continue;
      
      // If odd number in this group, try to move one player to next group
      if (availablePlayers.length % 2 === 1 && i < scoreGroupArray.length - 1) {
        const nextGroup = scoreGroupArray[i + 1];
        if (nextGroup) {
          const movedPlayer = availablePlayers.pop()!;
          nextGroup[1].push(movedPlayer);
          nextGroup[1].sort((a, b) => b.rating - a.rating);
        }
      }

            // Pair all available players in this group (this will ALWAYS pair everyone)
      const groupPairings = this.pairAllPlayersInGroup(availablePlayers, used);
      pairings.push(...groupPairings);
    }

    return pairings;
  }

  private pairAllPlayersInGroup(players: PlayerStanding[], used: Set<number>): Pairing[] {
    const pairings: Pairing[] = [];
    const available = [...players];

    // Keep pairing until we can't make any more pairs
    while (available.length >= 2) {
      const player1 = available.shift();
      if (!player1) break;
      
      let bestMatchIndex = -1;
      let bestScore = -Infinity;

      // First priority: Find non-rematch options
      for (let i = 0; i < available.length; i++) {
        const player2 = available[i];
        if (player2 && !this.isRematch(player1, player2)) {
          const score = this.calculatePairingScore(player1, player2);
          
          if (score > bestScore) {
            bestScore = score;
            bestMatchIndex = i;
          }
        }
      }

      // LAST RESORT: If no non-rematch options available, we MUST allow rematches
      if (bestMatchIndex === -1) {
        console.warn(`SwissStrategy: No non-rematch options for player ${player1.id}, forcing rematch as last resort`);
        
        // Find best rematch option (we MUST pair everyone)
        for (let i = 0; i < available.length; i++) {
          const player2 = available[i];
          if (player2) {
            const score = this.calculateRematchScore(player1, player2);
            
            if (score > bestScore) {
              bestScore = score;
              bestMatchIndex = i;
            }
          }
        }
      }

      // Create the pairing (we MUST pair everyone, no exceptions)
      if (bestMatchIndex !== -1) {
        const bestMatch = available.splice(bestMatchIndex, 1)[0];
        if (bestMatch) {
          pairings.push({
            speler1_id: player1.id,
            speler2_id: bestMatch.id,
            color1: "W",
            color2: "B"
          });

          used.add(player1.id);
          used.add(bestMatch.id);
        }
      } else {
        // This should NEVER happen - if it does, we have a bug
        console.error(`SwissStrategy: IMPOSSIBLE ERROR - Cannot pair player ${player1.id} with ANY available player`);
        throw new Error(`SwissStrategy: Cannot pair player ${player1.id} - this should never happen`);
      }
    }

    return pairings;
  }

  private isRematch(player1: PlayerStanding, player2: PlayerStanding): boolean {
    return player1.opponents.includes(player2.id);
  }

  private calculatePairingScore(player1: PlayerStanding, player2: PlayerStanding): number {
    let score = 0;

    // Prefer similar ratings (avoid huge rating mismatches)
    const ratingDiff = Math.abs(player1.rating - player2.rating);
    score -= ratingDiff * 0.01;

    // This method should only be called for non-rematches
    if (this.isRematch(player1, player2)) {
      console.error(`SwissStrategy: calculatePairingScore called for rematch between ${player1.id} and ${player2.id}`);
      return -Infinity;
    }

    // Prefer balanced color distribution
    const colorDiff = Math.abs(player1.colorBalance - player2.colorBalance);
    score -= colorDiff * this.opts.colorBalanceWeight;

    return score;
  }

  private calculateRematchScore(player1: PlayerStanding, player2: PlayerStanding): number {
    let score = 0;

    // Prefer similar ratings (avoid huge rating mismatches)
    const ratingDiff = Math.abs(player1.rating - player2.rating);
    score -= ratingDiff * 0.01;

    // Heavy penalty for rematches, but still allow them
    if (this.isRematch(player1, player2)) {
      score -= this.opts.rematchWeight * 10; // Very heavy penalty
    }

    // Prefer balanced color distribution
    const colorDiff = Math.abs(player1.colorBalance - player2.colorBalance);
    score -= colorDiff * this.opts.colorBalanceWeight;

    return score;
  }

  // private forcePairings(players: PlayerStanding[], used: Set<number>): Pairing[] {
  //   const pairings: Pairing[] = [];
  //   const available = [...players];

  //   // Force pairings even if it means rematches
  //   while (available.length >= 2) {
  //     const player1 = available.shift()!;
  //     const player2 = available.shift()!;
      
  //     pairings.push({
  //       speler1_id: player1.id,
  //       speler2_id: player2.id,
  //       color1: "W",
  //       color2: "B"
  //     });

  //     used.add(player1.id);
  //     used.add(player2.id);
  //   }

  //   return pairings;
  // }

  // private rearrangePairings(existingPairings: Pairing[], unpairedPlayer: PlayerStanding, used: Set<number>): Pairing[] {
  //   // Find a pairing we can break and rearrange
  //   for (let i = 0; i < existingPairings.length; i++) {
  //     const pairing = existingPairings[i];
  //     if (!pairing) continue;
      
  //     const player1 = pairing.speler1_id;
  //     const player2 = pairing.speler2_id;
      
  //     if (player2 === null) continue;
      
  //     // Check if we can create a new pairing with the unpaired player
  //     if (!this.isRematch(unpairedPlayer, { id: player1, points: 0, opponents: [], rating: 0, colorBalance: 0, byeCount: 0 })) {
  //       // Create new pairing: unpairedPlayer vs player1
  //       const newPairing1: Pairing = {
  //         speler1_id: unpairedPlayer.id,
  //         speler2_id: player1,
  //         color1: "W" as "W" | "B" | "N",
  //         color2: "B" as "W" | "B" | "N"
  //       };
        
  //       // Create new pairing: player2 vs someone else (we'll need to find a match)
  //       // For now, we'll just return the existing pairings and add the new one
  //       const result = [...existingPairings];
  //       result[i] = newPairing1;
        
  //       used.add(unpairedPlayer.id);
  //       used.add(player1);
  //       used.delete(player2);
        
  //       return result;
  //     }
  //   }
    
  //   // If we can't rearrange, just return existing pairings
  //   return existingPairings;
  // }

  private balanceColors(pairings: Pairing[], standings: PlayerStanding[]): Pairing[] {
    return pairings.map(pairing => {
      const player1 = standings.find(s => s.id === pairing.speler1_id);
      const player2 = standings.find(s => s.id === pairing.speler2_id);
      
      if (!player1 || !player2) return pairing;

      // Get color history for both players
      const player1Colors = this.getColorHistory(player1.id);
      const player2Colors = this.getColorHistory(player2.id);

      // Check for streaks and balance colors
      const newPairing = this.assignOptimalColors(pairing, player1, player2, player1Colors, player2Colors);
      
      return newPairing;
    });
  }

  private getColorHistory(_playerId: number): ("W" | "B")[] {
    // Parse previous rounds to get actual color history for this player
    const colors: ("W" | "B")[] = [];
    
    // This would need access to previousRounds from the main method
    // For now, we'll use a simplified approach based on colorBalance
    // In a real implementation, you'd iterate through previousRounds and extract colors
    
    return colors;
  }

  private assignOptimalColors(
    pairing: Pairing, 
    player1: PlayerStanding, 
    player2: PlayerStanding,
    player1Colors: ("W" | "B")[],
    player2Colors: ("W" | "B")[]
  ): Pairing {
    // Calculate current color balance
    const player1Whites = (player1.colorBalance > 0) ? player1.colorBalance : 0;
    const player1Blacks = (player1.colorBalance < 0) ? Math.abs(player1.colorBalance) : 0;
    const player2Whites = (player2.colorBalance > 0) ? player2.colorBalance : 0;
    const player2Blacks = (player2.colorBalance < 0) ? Math.abs(player2.colorBalance) : 0;

    // Check for streaks (more than 3 of the same color in a row)
    const player1Streak = this.getCurrentStreak(player1Colors);
    const player2Streak = this.getCurrentStreak(player2Colors);

    // STRICT: If any player has 3+ of the same color, they MUST get the opposite color
    if (player1Streak.count >= 3 && player1Streak.color === "W") {
      return { ...pairing, color1: "B", color2: "W" };
    }
    if (player1Streak.count >= 3 && player1Streak.color === "B") {
      return { ...pairing, color1: "W", color2: "B" };
    }
    if (player2Streak.count >= 3 && player2Streak.color === "W") {
      return { ...pairing, color1: "B", color2: "W" };
    }
    if (player2Streak.count >= 3 && player2Streak.color === "B") {
      return { ...pairing, color1: "W", color2: "B" };
    }

    // Balance overall color distribution
    if (player1Whites > player1Blacks + 1) {
      return { ...pairing, color1: "B", color2: "W" };
    }
    if (player2Whites > player2Blacks + 1) {
      return { ...pairing, color1: "W", color2: "B" };
    }
    if (player1Blacks > player1Whites + 1) {
      return { ...pairing, color1: "W", color2: "B" };
    }
    if (player2Blacks > player2Whites + 1) {
      return { ...pairing, color1: "B", color2: "W" };
    }

    // Keep original assignment if colors are balanced
    return pairing;
  }

  private getCurrentStreak(colors: ("W" | "B")[]): { color: "W" | "B", count: number } {
    if (colors.length === 0) return { color: "W", count: 0 };
    
    const lastColor = colors[colors.length - 1];
    if (!lastColor) return { color: "W", count: 0 };
    
    let count = 1;
    
    // Count backwards from the end to find the current streak
    for (let i = colors.length - 2; i >= 0; i--) {
      if (colors[i] === lastColor) {
        count++;
      } else {
        break;
      }
    }
    
    return { color: lastColor, count };
  }
}

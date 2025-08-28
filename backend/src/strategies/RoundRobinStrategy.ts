import { IPairingStrategy, Pairing, Competitor } from "../types/Types";

export class RoundRobinStrategy implements IPairingStrategy {
  async generatePairings(
    players: Competitor[],
    roundNumber: number
  ): Promise<{ pairings: Pairing[]; byePlayer?: Competitor }> {
    // Generate all rounds at once
    const allRounds = this.generateAllRounds(players);
    
    // Get the specific round requested
    const round = allRounds[roundNumber - 1] ?? [];
    
    // Find bye player if any
    const byePairing = round.find(p => p.speler2_id === null);
    const byePlayer = byePairing ? players.find(p => p.user_id === byePairing.speler1_id) : undefined;
    
    return byePlayer
      ? { pairings: round, byePlayer }
      : { pairings: round };
  }

  generateAllRounds(players: Competitor[]): Pairing[][] {
    if (!players?.length) return [];
    
    // Sort players by ID for consistent ordering
    const sortedPlayers = [...players].sort((a, b) => a.user_id - b.user_id);
    
    // Handle odd number of players by adding a dummy player
    const hasOddPlayers = sortedPlayers.length % 2 === 1;
    const workingPlayers = hasOddPlayers 
      ? [...sortedPlayers, { user_id: -1, score: 0, schaakrating_elo: 0 } as Competitor]
      : [...sortedPlayers];
    
    const n = workingPlayers.length;
    const baseRounds = n - 1; // Number of rounds for one complete cycle
    const schedule: Pairing[][] = [];
    
    // Generate base rounds using circle method
    const baseSchedule: Pairing[][] = [];
    
    // Initialize color history for all players
    const colorHistory = new Map<number, ("W" | "B")[]>();
    workingPlayers.forEach(p => colorHistory.set(p.user_id, []));
    
    // Generate base rounds using circle method
    for (let round = 0; round < baseRounds; round++) {
      const roundPairings: Pairing[] = [];
      
      // Create pairs for this round
      for (let i = 0; i < n / 2; i++) {
        const playerA = workingPlayers[i];
        const playerB = workingPlayers[n - 1 - i];
        
        if (!playerA || !playerB) continue;
        
        // Handle bye player (dummy player)
        if (playerA.user_id === -1 || playerB.user_id === -1) {
          const realPlayer = playerA.user_id === -1 ? playerB : playerA;
          roundPairings.push({
            speler1_id: realPlayer.user_id,
            speler2_id: null,
            color1: "N",
            color2: "N"
          });
          continue;
        }
        
        // Create pairing with optimal color assignment
        const pairing = this.createPairingWithOptimalColors(playerA, playerB, colorHistory);
        roundPairings.push(pairing);
        
        // Update color history
        colorHistory.get(playerA.user_id)!.push(pairing.color1 as "W" | "B");
        colorHistory.get(playerB.user_id)!.push(pairing.color2 as "W" | "B");
      }
      
      baseSchedule.push(roundPairings);
      
      // Rotate players for next round (keep first player fixed)
      this.rotatePlayers(workingPlayers);
    }
    
    // Add base rounds to schedule
    schedule.push(...baseSchedule);
    
    // Now add reversed color rounds for perfect balance
    // This creates iterations where the same pairs play again but with reversed colors
    const reversedSchedule = this.createReversedColorRounds(baseSchedule);
    schedule.push(...reversedSchedule);
    
    // Add another iteration with original colors for even more balance
    const secondIteration = this.createOriginalColorRounds(baseSchedule);
    schedule.push(...secondIteration);
    
    // Add another iteration with reversed colors
    const thirdIteration = this.createReversedColorRounds(baseSchedule);
    schedule.push(...thirdIteration);
    
    return schedule;
  }

  private createReversedColorRounds(baseSchedule: Pairing[][]): Pairing[][] {
    return baseSchedule.map(round => 
      round.map(pairing => {
        // Skip bye players
        if (pairing.speler2_id === null) {
          return pairing;
        }
        
        // Reverse colors for regular pairings
        return {
          ...pairing,
          color1: pairing.color1 === "W" ? "B" : "W",
          color2: pairing.color2 === "W" ? "B" : "W"
        };
      })
    );
  }

  private createOriginalColorRounds(baseSchedule: Pairing[][]): Pairing[][] {
    // Return a deep copy of the base schedule
    return baseSchedule.map(round => 
      round.map(pairing => ({ ...pairing }))
    );
  }

  private createPairingWithOptimalColors(
    playerA: Competitor, 
    playerB: Competitor, 
    colorHistory: Map<number, ("W" | "B")[]>
  ): Pairing {
    const histA = colorHistory.get(playerA.user_id) || [];
    const histB = colorHistory.get(playerB.user_id) || [];
    
    // Count current colors for both players
    const whitesA = histA.filter(c => c === "W").length;
    const blacksA = histA.filter(c => c === "B").length;
    const whitesB = histB.filter(c => c === "W").length;
    const blacksB = histB.filter(c => c === "B").length;
    
    // Check for streaks (prevent 3+ of same color)
    const streakA = this.getCurrentStreak(histA);
    const streakB = this.getCurrentStreak(histB);
    
    // STRICT: If any player has 3+ of the same color, they MUST get the opposite color
    if (streakA.count >= 3 && streakA.color === "W") {
      return { speler1_id: playerA.user_id, speler2_id: playerB.user_id, color1: "B", color2: "W" };
    }
    if (streakA.count >= 3 && streakA.color === "B") {
      return { speler1_id: playerA.user_id, speler2_id: playerB.user_id, color1: "W", color2: "B" };
    }
    if (streakB.count >= 3 && streakB.color === "W") {
      return { speler1_id: playerA.user_id, speler2_id: playerB.user_id, color1: "B", color2: "W" };
    }
    if (streakB.count >= 3 && streakB.color === "B") {
      return { speler1_id: playerA.user_id, speler2_id: playerB.user_id, color1: "W", color2: "B" };
    }
    
    // Balance overall color distribution
    if (whitesA > whitesB + 1) {
      return { speler1_id: playerA.user_id, speler2_id: playerB.user_id, color1: "B", color2: "W" };
    }
    if (whitesB > whitesA + 1) {
      return { speler1_id: playerA.user_id, speler2_id: playerB.user_id, color1: "W", color2: "B" };
    }
    if (blacksA > blacksB + 1) {
      return { speler1_id: playerA.user_id, speler2_id: playerB.user_id, color1: "W", color2: "B" };
    }
    if (blacksB > blacksA + 1) {
      return { speler1_id: playerA.user_id, speler2_id: playerB.user_id, color1: "B", color2: "W" };
    }
    
    // Check last colors to avoid immediate repetition
    const lastA = histA[histA.length - 1];
    const lastB = histB[histB.length - 1];
    
    if (lastA === lastB && lastA) {
      // Both had same color last time, give them opposite colors
      const newColor = lastA === "W" ? "B" : "W";
      return { 
        speler1_id: playerA.user_id, 
        speler2_id: playerB.user_id, 
        color1: newColor, 
        color2: newColor === "W" ? "B" : "W" 
      };
    }
    
    // Default: give A white, B black (or vice versa based on balance)
    if (whitesA <= blacksA) {
      return { speler1_id: playerA.user_id, speler2_id: playerB.user_id, color1: "W", color2: "B" };
    } else {
      return { speler1_id: playerA.user_id, speler2_id: playerB.user_id, color1: "B", color2: "W" };
    }
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

  private rotatePlayers(players: Competitor[]): void {
    const n = players.length;
    if (n <= 2) return;
    
    // Keep first player fixed, rotate the rest
    const last = players[n - 1];
    if (!last) return;
    
    // Move all players one position to the right
    for (let i = n - 1; i > 1; i--) {
      const player = players[i - 1];
      if (player) {
        players[i] = player;
      }
    }
    
    // Put last player in second position
    players[1] = last;
  }
}
 
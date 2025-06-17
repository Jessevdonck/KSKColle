// src/strategies/SwissStrategy.ts
import { IPairingStrategy, Pairing, Competitor } from "../types/Types";
import { Swiss } from 'tournament-pairings';

export class SwissStrategy implements IPairingStrategy {
  generatePairings(
    players: Competitor[],
    roundNumber: number,
    previousRounds: Pairing[][]
  ): { pairings: Pairing[]; byePlayer?: Competitor } {
    // 1) Build history maps: avoid, seating, receivedBye
    const avoidMap = new Map<number, number[]>();
    const seatingMap = new Map<number, (1 | -1)[]>();
    const byeMap = new Map<number, boolean>();

    players.forEach(p => {
      avoidMap.set(p.user_id, []);
      seatingMap.set(p.user_id, []);
      byeMap.set(p.user_id, false);
    });

    for (const round of previousRounds) {
      for (const game of round) {
        const a = game.speler1_id;
        const b = game.speler2_id;
        // Bye detection
        if (b === null) {
          byeMap.set(a, true);
          continue;
        }
        // Avoid repeat pairings
        avoidMap.get(a)!.push(b);
        avoidMap.get(b)!.push(a);
        // Seating history: 1 = first seat (white), -1 = second seat (black)
        seatingMap.get(a)!.push(game.color1 === 'W' ? 1 : -1);
        seatingMap.get(b)!.push(game.color2 === 'W' ? 1 : -1);
      }
    }

    // 2) Map to library Player format, ensuring defaults for empty arrays
    const swissPlayers = players.map(p => ({
      id: p.user_id,
      score: p.score ?? 0,
      rating: p.schaakrating_elo,
      avoid: avoidMap.get(p.user_id) ?? [],        // default to empty
      seating: seatingMap.get(p.user_id) ?? [],    // default to empty
      receivedBye: byeMap.get(p.user_id) ?? false,
    }));

        // 3) Generate pairings: using default settings (avoid repeat, ignore seating if unsupported)
    let swissMatches;
    try {
      swissMatches = Swiss(swissPlayers, roundNumber);
    } catch (err) {
      // Fallback: try without any history fields
      swissMatches = Swiss(
        players.map(p => ({ id: p.user_id, score: p.score ?? 0, rating: p.schaakrating_elo })),
        roundNumber
      );
    }

    // 4) Extract bye player if any
    const byeMatch = swissMatches.find(m => m.player2 === null);
    let byePlayer: Competitor | undefined;
    if (byeMatch) {
      byePlayer = players.find(p => p.user_id === (byeMatch.player1 as number));
    }

    // 5) Map matches to Pairing[], filtering out bye
    const pairings: Pairing[] = swissMatches
      .filter(m => m.player2 !== null)
      .map(m => ({
        speler1_id: m.player1 as number,
        speler2_id: m.player2 as number,
        color1: 'W',
        color2: 'B',
      }));

    return byePlayer ? { pairings, byePlayer } : { pairings };
  }
}

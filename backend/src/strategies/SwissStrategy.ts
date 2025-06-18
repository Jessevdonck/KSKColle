import { IPairingStrategy, Pairing, Competitor } from "../types/Types";

export class SwissStrategy implements IPairingStrategy {
  async generatePairings(
    players: Competitor[],
    roundNumber: number,
    previousRounds: Pairing[][]
  ): Promise<{ pairings: Pairing[]; byePlayer?: Competitor }> {
    // Dynamisch importeren van ES-module
    const { Swiss } = await import("tournament-pairings");

    // 1) Build history maps
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
        if (b === null) {
          byeMap.set(a, true);
          continue;
        }
        avoidMap.get(a)!.push(b);
        avoidMap.get(b)!.push(a);
        seatingMap.get(a)!.push(game.color1 === "W" ? 1 : -1);
        seatingMap.get(b)!.push(game.color2 === "W" ? 1 : -1);
      }
    }

    // 2) Map naar Swiss-spelerformaat
    const swissPlayers = players.map(p => ({
      id: p.user_id,
      score: p.score ?? 0,
      rating: p.schaakrating_elo,
      avoid: avoidMap.get(p.user_id) ?? [],
      seating: seatingMap.get(p.user_id) ?? [],
      receivedBye: byeMap.get(p.user_id) ?? false,
    }));

    // 3) Genereer pairings via Swiss-algoritme
    let swissMatches;
    try {
      swissMatches = Swiss(swissPlayers, roundNumber);
    } catch (err) {
      swissMatches = Swiss(
        players.map(p => ({ id: p.user_id, score: p.score ?? 0, rating: p.schaakrating_elo })),
        roundNumber
      );
    }

    // 4) Extract bye-player indien aanwezig
    const byeMatch = swissMatches.find(m => m.player2 === null);
    let byePlayer: Competitor | undefined;
    if (byeMatch) {
      byePlayer = players.find(p => p.user_id === (byeMatch.player1 as number));
    }

    // 5) Zet om naar Pairing[]
    const pairings: Pairing[] = swissMatches
      .filter(m => m.player2 !== null)
      .map(m => ({
        speler1_id: m.player1 as number,
        speler2_id: m.player2 as number,
        color1: "W",
        color2: "B",
      }));

    return byePlayer ? { pairings, byePlayer } : { pairings };
  }
}

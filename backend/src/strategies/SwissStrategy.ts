import { IPairingStrategy, Pairing, Competitor } from "../types/Types";

export class SwissStrategy implements IPairingStrategy {
  async generatePairings(
    players: Competitor[],
    _roundNumber: number,
    previousRounds: Pairing[][]
  ): Promise<{ pairings: Pairing[]; byePlayer?: Competitor }> {
    // 1. Vermijd herhaling door opponent-history
    const historyMap = new Map<number, Set<number>>();
    players.forEach(p => historyMap.set(p.user_id, new Set()));

    for (const round of previousRounds) {
      for (const game of round) {
        if (game.speler2_id !== null) {
          historyMap.get(game.speler1_id)?.add(game.speler2_id);
          historyMap.get(game.speler2_id)?.add(game.speler1_id);
        }
      }
    }

    // 2. Sorteer op score, dan rating
    const sortedPlayers = [...players].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.schaakrating_elo - a.schaakrating_elo;
    });

    // 3. Bye bij oneven aantal
    let byePlayer: Competitor | undefined;
    if (sortedPlayers.length % 2 === 1) {
      byePlayer = sortedPlayers.pop();
    }

    // 4. Pairings maken
    const pairings: Pairing[] = [];
    const used = new Set<number>();

    for (let i = 0; i < sortedPlayers.length; i++) {
      const p1 = sortedPlayers[i];
      if (used.has(p1!.user_id)) continue;

      // Zoek p2 die nog niet gepaired is en niet al tegen p1 heeft gespeeld
      let p2: Competitor | undefined;
      for (let j = i + 1; j < sortedPlayers.length; j++) {
        const candidate = sortedPlayers[j];
        if (used.has(candidate!.user_id)) continue;
        if (!historyMap.get(p1!.user_id)?.has(candidate!.user_id)) {
          p2 = candidate;
          break;
        }
      }

      // Geen unieke tegenstander gevonden → neem eerste ongebruikte
      if (!p2) {
        for (let j = i + 1; j < sortedPlayers.length; j++) {
          const candidate = sortedPlayers[j];
          if (!used.has(candidate!.user_id)) {
            p2 = candidate;
            break;
          }
        }
      }

      if (p2) {
        pairings.push({
          speler1_id: p1!.user_id,
          speler2_id: p2.user_id,
          color1: "W",
          color2: "B",
        });
        used.add(p1!.user_id);
        used.add(p2.user_id);
      }
    }

    return byePlayer ? { pairings, byePlayer } : { pairings };
  }
}

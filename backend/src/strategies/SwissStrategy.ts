// src/strategies/SwissStrategy.ts

import { IPairingStrategy, Player, Pairing } from "../types/Types";

export class SwissStrategy implements IPairingStrategy {
  generatePairings(
    players: Player[],
    roundNumber: number,
    previousRounds: Pairing[][]
  ): { pairings: Pairing[]; byePlayer?: Player } {
    if (roundNumber === 1) {
      return this.firstRound(players);
    }
    return this.subsequentRound(players, previousRounds);
  }

  private firstRound(
    players: Player[]
  ): { pairings: Pairing[]; byePlayer?: Player } {
    // 1) Shuffle
    const shuffled = [...players].sort(() => Math.random() - 0.5);

    // 2) Bye als odd
    let byePlayer: Player | undefined;
    if (shuffled.length % 2 !== 0) {
      byePlayer = shuffled.pop();
    }

    // 3) Split in twee helften
    const half = shuffled.length / 2;
    const top = shuffled.slice(0, half);
    const bottom = shuffled.slice(half);

    // 4) Maak paringen
    const pairings: Pairing[] = top.map((p1, i) => {
      const opponent = bottom[i];
      if (!opponent) {
        throw new Error(`No opponent found for player with user_id ${p1.user_id}`);
      }
      return {
        speler1_id: p1.user_id,
        speler2_id: opponent.user_id,
        color1: "W",
        color2: "B",
      };
    });

    return byePlayer
      ? { pairings, byePlayer }
      : { pairings };
  }

  private subsequentRound(
    players: Player[],
    previousRounds: Pairing[][]
  ): { pairings: Pairing[]; byePlayer?: Player } {
    // hier kun je je bestaande “sorteer op score/buchholz etc.” logica
    // en daarna dezelfde slice-methode toepassen binnen score-groepen.
    // Voor nu: fallback op de “oude” pairList voor latere rondes:
    return this.pairList(players, previousRounds);
  }

  private pairList(
    list: Player[],
    previousRounds: Pairing[][]
  ): { pairings: Pairing[]; byePlayer?: Player } {
    const pairings: Pairing[] = [];
    const used = new Set<number>();
    let byePlayer: Player | undefined;

    if (list.length % 2 !== 0) {
      byePlayer = list.pop();
    }

    for (const p1 of list) {
      if (used.has(p1.user_id)) continue;
      const opponent = list.find(
        (p2) =>
          !used.has(p2.user_id) &&
          p2.user_id !== p1.user_id &&
          !this.alreadyPlayed(p1.user_id, p2.user_id, previousRounds)
      );
      if (!opponent) {
        // fallback: pak eerste vrije
        const fallback = list.find(
          (p2) => !used.has(p2.user_id) && p2.user_id !== p1.user_id
        );
        if (!fallback) throw new Error("Geen tegenstander gevonden");
        used.add(p1.user_id);
        used.add(fallback.user_id);
        pairings.push({
          speler1_id: p1.user_id,
          speler2_id: fallback.user_id,
          color1: "W",
          color2: "B",
        });
      } else {
        used.add(p1.user_id);
        used.add(opponent.user_id);
        pairings.push({
          speler1_id: p1.user_id,
          speler2_id: opponent.user_id,
          color1: "W",
          color2: "B",
        });
      }
    }

    return byePlayer
      ? { pairings, byePlayer }
      : { pairings };
  }

  private alreadyPlayed(
    a: number,
    b: number,
    rounds: Pairing[][]
  ): boolean {
    return rounds.some((r) =>
      r.some(
        (p) =>
          (p.speler1_id === a && p.speler2_id === b) ||
          (p.speler1_id === b && p.speler2_id === a)
      )
    );
  }
}

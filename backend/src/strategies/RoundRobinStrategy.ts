// src/strategies/RoundRobinStrategy.ts

import { IPairingStrategy, Player, Pairing } from "../types/Types";

export class RoundRobinStrategy implements IPairingStrategy {
  generatePairings(
    players: Player[],
    roundNumber: number,
    _previousRounds: Pairing[][]
  ): { pairings: Pairing[]; byePlayer?: Player } {
    // 1) Maak een kopie en voeg een dummy BYE (null) toe als odd
    const rr: (Player | null)[] = [...players];
    if (rr.length % 2 !== 0) {
      rr.push(null);
    }

    const n = rr.length;             // nu altijd even
    const rounds = n - 1;            // aantal ronden in round robin
    const half = n / 2;

    // 2) Bereken hoeveel te roteren (roundNumber-1 mod rounds)
    const rot = ((roundNumber - 1) % rounds + rounds) % rounds;

    // 3) Split vaste speler + “others”
    const fixed = rr[0];
    const others = rr.slice(1);

    // 4) Roteer de “others” naar rechts met rot stappen
    const shift = rot % others.length;
    const rotated = shift === 0
      ? others
      : [
          ...others.slice(others.length - shift),
          ...others.slice(0, others.length - shift),
        ];

    // 5) Maak de ronde-array
    const roundArr = [fixed, ...rotated];

    // 6) Genereer paren + detecteer BYE
    const pairings: Pairing[] = [];
    let byePlayer: Player | undefined;

    for (let i = 0; i < half; i++) {
      const p1 = roundArr[i];
      const p2 = roundArr[n - 1 - i];
      if (p1 && p2) {
        // echte match
        pairings.push({
          speler1_id: p1.user_id,
          speler2_id: p2.user_id,
          color1: "W",
          color2: "B",
        });
      } else if (p1 && !p2) {
        // p1 krijgt BYE
        byePlayer = p1;
      } else if (!p1 && p2) {
        // p2 krijgt BYE
        byePlayer = p2;
      }
    }

    return byePlayer
      ? { pairings, byePlayer }
      : { pairings };
  }
}

import { IPairingStrategy, Pairing, Competitor } from "../types/Types";

export class RoundRobinStrategy implements IPairingStrategy {
  async generatePairings(
    players: Competitor[],
    roundNumber: number
  ): Promise<{ pairings: Pairing[]; byePlayer?: Competitor }> {
    const all = this.generateAllRounds(players);
    const round = all[roundNumber - 1] ?? [];
    const bye = round.find(p => p.speler2_id === null)?.speler1_id;
    const byePlayer = players.find(p => p.user_id === bye);
    return byePlayer
      ? { pairings: round, byePlayer }
      : { pairings: round };
  }

  generateAllRounds(players: Competitor[]): Pairing[][] {
    if (!players?.length) return [];
    const order = [...players].sort((a,b) => a.user_id - b.user_id);
    const list: Competitor[] = [...order];
    const hasOdd = list.length % 2 === 1;
    if (hasOdd) list.push({ user_id: -1, score: 0, schaakrating_elo: 0 } as Competitor);

    const n = list.length;
    const rounds = n - 1;
    const indices = Array.from({length:n}, (_,i)=>i);
    const schedule: Pairing[][] = [];

    const colorHistory = new Map<number, ("W"|"B"|"N")[]>(list.map(p => [p.user_id, []]));

    for (let r = 0; r < rounds; r++) {
      const pairs: Pairing[] = [];

      for (let i = 0; i < n/2; i++) {
        const A = list[indices[i]!]!;
        const B = list[indices[n - 1 - i]!]!;

        if (A.user_id === -1 && B.user_id === -1) continue;

        if (A.user_id === -1 || B.user_id === -1) {
          const real = A.user_id === -1 ? B : A;
          pairs.push({ speler1_id: real.user_id, speler2_id: null, color1: "N", color2: "N" });
          colorHistory.get(real.user_id)!.push("N");
        } else {
          const histA = colorHistory.get(A.user_id)!;
          const histB = colorHistory.get(B.user_id)!;
          const wA = histA.filter(c => c === "W").length;
          const bA = histA.filter(c => c === "B").length;
          const wB = histB.filter(c => c === "W").length;
          const bB = histB.filter(c => c === "B").length;

          let color1: "W"|"B" = "W", color2: "W"|"B" = "B";

          if (wA - bA > bB - wB) {
            color1 = "B"; color2 = "W";
          } else if (bA - wA > wB - bB) {
            color1 = "W"; color2 = "B";
          } else {
            const lastA = histA[histA.length-1];
            const lastB = histB[histB.length-1];
            if (lastA === lastB) {
              color1 = lastA === "W" ? "B" : "W";
              color2 = color1 === "W" ? "B" : "W";
            } else {
              color1 = lastA === "W" ? "B" : "W";
              color2 = lastB === "W" ? "B" : "W";
            }
          }

          pairs.push({
            speler1_id: A.user_id,
            speler2_id: B.user_id,
            color1,
            color2
          });

          colorHistory.get(A.user_id)!.push(color1);
          colorHistory.get(B.user_id)!.push(color2);
        }
      }

      schedule.push(pairs);

      const fixed = indices[0];
      const rotated = [fixed, indices[n-1], ...indices.slice(1, n-1)];
      for (let i = 0; i < n; i++) indices[i] = rotated[i]!;
    }

    return schedule;
  }
}

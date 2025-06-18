// src/strategies/SwissStrategy.ts
import { IPairingStrategy, Pairing, Competitor } from "../types/Types";
const blossom = require("edmonds-blossom");

interface GameHistory {
  round: number;
  home: { id: number; points: number };
  away: { id: number | null; points: number };
}

export class SwissStrategy implements IPairingStrategy {
  private opts = {
    maxPerRound: 1,
    rematchWeight: 100,
    standingPower: 2,
    seedMultiplier: 6781,
    colorBalanceWeight: 20,
  };

  async generatePairings(
    players: Competitor[],
    _roundNumber: number,
    previousRounds: Pairing[][]
  ): Promise<{ pairings: Pairing[]; byePlayer?: Competitor }> {
    // --- 1) Flatten game history ---
    const allGames: GameHistory[] = [];
    previousRounds.forEach((prs, rIdx) =>
      prs.forEach((p) => {
        let homePts = 0, awayPts = 0;
        if (p.color1 === "W" && p.speler2_id != null) homePts = 1;
        else if (p.color2 === "W") awayPts = 1;
        else if (p.color1 === "N" || p.color2 === "N") homePts = 1;
        else homePts = awayPts = 0.5;

        allGames.push({
          round: rIdx + 1,
          home:  { id: p.speler1_id, points: homePts },
          away:  { id: p.speler2_id, points: awayPts },
        });
      })
    );

    // --- 2) Build mappings (id, points, opponents, seed) ---
    type MapRec = { id: number; points: number; opponents: number[]; seed: number };
    const mappings: MapRec[] = players.map(p => ({
      id:        p.user_id,
      points:    0,
      opponents: [],
      seed:      p.schaakrating_elo
    }));

    allGames.forEach(g => {
      const mH = mappings.find(m => m.id === g.home.id)!;
      mH.points += g.home.points;
      if (g.away.id != null) mH.opponents.push(g.away.id);

      if (g.away.id != null) {
        const mA = mappings.find(m => m.id === g.away.id)!;
        mA.points += g.away.points;
        mA.opponents.push(g.home.id);
      }
    });

    // --- 3) Build color history map ---
    const colorHistoryMap: Record<number, Array<"W" | "B">> = {};
    previousRounds.forEach(prs =>
      prs.forEach(p => {
        colorHistoryMap[p.speler1_id] ||= [];
        if (p.color1 === "W" || p.color1 === "B") {
          colorHistoryMap[p.speler1_id]!.push(p.color1);
        }
        if (p.speler2_id != null) {
          colorHistoryMap[p.speler2_id] ||= [];
          if (p.color2 === "W" || p.color2 === "B") {
            colorHistoryMap[p.speler2_id]!.push(p.color2);
          }
        }
      })
    );

    // --- 4) Determine who already had a bye ---
    const hadBye = new Set<number>();
    previousRounds.forEach(prs =>
      prs.forEach(p => {
        if (p.speler2_id === null) {
          hadBye.add(p.speler1_id);
        }
      })
    );

    // --- 5) Assign bye (odd count) to lowest standing who hasn't yet had one ---
    let byePlayer: Competitor|undefined;
    if (mappings.length % 2 === 1) {
      // sort ascending on points, then seed
      const sortedAsc = [...mappings].sort((a,b) =>
        a.points === b.points ? a.seed - b.seed : a.points - b.points
      );
      // first pick lowest who hasn't had bye
      let pick = sortedAsc.find(m => !hadBye.has(m.id));
      // if everyone had bye once, pick absolute lowest
      if (!pick) pick = sortedAsc[0];
      // remove from mappings and record Competitor
      const idx = mappings.findIndex(m => m.id === pick!.id);
      mappings.splice(idx, 1);
      byePlayer = players.find(p => p.user_id === pick!.id);
    }

    // --- 6) Build blossom edges with score/rematch/color penalties ---
    const edges: [number,number,number][] = [];
    for (let i = 0; i < mappings.length; i++) {
      for (let j = i+1; j < mappings.length; j++) {
        const a = mappings[i]!, b = mappings[j]!;
        const diff    = Math.pow(a.points - b.points, this.opts.standingPower);
        const rematch = a.opponents.filter(o => o === b.id).length;
        const netA    = (colorHistoryMap[a.id]||[]).filter(c=>"W"===c).length
                      - (colorHistoryMap[a.id]||[]).filter(c=>"B"===c).length;
        const netB    = (colorHistoryMap[b.id]||[]).filter(c=>"W"===c).length
                      - (colorHistoryMap[b.id]||[]).filter(c=>"B"===c).length;
        const colorDiff = Math.abs(netA - netB);

        const weight = -1 * (
          diff
          + this.opts.rematchWeight        * rematch
          + this.opts.colorBalanceWeight   * colorDiff
        );
        edges.push([a.id, b.id, weight]);
      }
    }

    // --- 7) Edmonds-Blossom matching (maximize) ---
    const mate: Record<number,number> = blossom(edges, true);

    // --- 8) Build raw pairings (W/B default) in descending standing order ---
    const used = new Set<number>();
    const raw: Pairing[] = [];
    mappings
      .sort((a,b) => b.points - a.points || b.seed - a.seed)
      .forEach(m => {
        const o = mate[m.id]!;
        if (o !== -1 && !used.has(m.id) && !used.has(o)) {
          raw.push({
            speler1_id: m.id,
            speler2_id: o,
            color1:     "W" as "W" | "B" | "N",
            color2:     "B" as "W" | "B" | "N"
          });
          used.add(m.id);
          used.add(o);
        }
      });

    // --- 9) Final color‐balance swap if needed (players with too many W get B) ---
    const balanced = raw.map(p => {
      const hist = colorHistoryMap[p.speler1_id] || [];
      const whites = hist.filter(c => c==="W").length;
      const blacks = hist.filter(c => c==="B").length;
      if (whites > blacks) {
        return { ...p, color1: "B" as "W" | "B" | "N", color2: "W" as "W" | "B" | "N" };
      }
      return p;
    });

    return byePlayer
      ? { pairings: balanced, byePlayer }
      : { pairings: balanced };
  }
}

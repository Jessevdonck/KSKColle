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
    colorBalanceWeight: 20, // Straffactor voor kleur‐onevenwicht
  };

  async generatePairings(
    players: Competitor[],
    _roundNumber: number,
    previousRounds: Pairing[][]
  ): Promise<{ pairings: Pairing[]; byePlayer?: Competitor }> {
    // --- 1) Bouw flat GameHistory uit alle voorgaande Pairings ---
    const allGames: GameHistory[] = [];
    previousRounds.forEach((prs, rIdx) => {
      prs.forEach((p) => {
        let homePts = 0, awayPts = 0;
        if (p.color1 === "W" && p.speler2_id != null) {
          homePts = 1;
        } else if (p.color2 === "W") {
          awayPts = 1;
        } else if (p.color1 === "N" || p.color2 === "N") {
          homePts = 1; // bye telt als winst
        } else {
          homePts = awayPts = 0.5;
        }
        allGames.push({
          round: rIdx + 1,
          home:  { id: p.speler1_id, points: homePts },
          away:  { id: p.speler2_id, points: awayPts },
        });
      });
    });

    // --- 2) Maak mutable mappings (id, punten, opponents, elo‐seed) ---
    type MapRec = { id: number; points: number; opponents: number[]; seed: number };
    const mappings: MapRec[] = players.map(p => ({
      id:        p.user_id,
      points:    0,
      opponents: [],
      seed:      p.schaakrating_elo
    }));

    // Vul punten & opponent‐lijsten vanuit allGames
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

    // --- 3) Bouw colorHistoryMap uit previousRounds zodat we later kunnen balanceren ---
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

    // --- 4) Indien oneven aantal, kies bye-speler (laagste standing) ---
    let byePlayer: Competitor|undefined;
    if (mappings.length % 2 === 1) {
      const sortedAsc = [...mappings].sort((a,b) =>
        a.points === b.points ? a.seed - b.seed : a.points - b.points
      );
      const loserId = sortedAsc[0]!.id;
      const idx = mappings.findIndex(m => m.id === loserId);
      byePlayer = players.find(p => p.user_id === loserId);
      mappings.splice(idx, 1);
    }

    // --- 5) Bouw Blossom‐edges met score-/rematch-/kleur‐penalty ---
    const edges: [number,number,number][] = [];
    for (let i = 0; i < mappings.length; i++) {
      for (let j = i+1; j < mappings.length; j++) {
        const a = mappings[i]!, b = mappings[j]!;
        const diff    = Math.pow(a.points - b.points, this.opts.standingPower);
        const rematch = a.opponents.filter(o => o===b.id).length;
        // kleur‐onevenwicht = |(#W - #B)_a - (#W - #B)_b|
        const netA    = (colorHistoryMap[a.id]||[]).filter(c=>"W"===c).length
                      - (colorHistoryMap[a.id]||[]).filter(c=>"B"===c).length;
        const netB    = (colorHistoryMap[b.id]||[]).filter(c=>"W"===c).length
                      - (colorHistoryMap[b.id]||[]).filter(c=>"B"===c).length;
        const colorDiff = Math.abs(netA - netB);

        const weight = -1 * (
          diff +
          this.opts.rematchWeight  * rematch +
          this.opts.colorBalanceWeight * colorDiff
        );
        edges.push([a.id, b.id, weight]);
      }
    }

    // --- 6) Run Edmonds‐Blossom (maximize=true kiest match met hoogste som van weights) ---
    const mate: Record<number,number> = blossom(edges, true);

    // --- 7) Maak ruwe pairings in standings‐volgorde, standaard W/B toewijzen ---
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
            color1:     "W" as "W",
            color2:     "B" as "B"
          });
          used.add(m.id);
          used.add(o);
        }
      });

    // --- 8) Kleur‐balancering nà de matching: swap W/B voor wie veel wit had ---
    const balanced = raw.map(p => {
      const hist = colorHistoryMap[p.speler1_id] || [];
      const whites = hist.filter(c => c==="W").length;
      const blacks = hist.filter(c => c==="B").length;
      if (whites > blacks) {
        return { ...p, color1: "B" as "B", color2: "W" as "W" };
      } else {
        // als blacks>whites of gelijk, laat W/B zoals ze zijn
        return p;
      }
    });

    return byePlayer
      ? { pairings: balanced, byePlayer }
      : { pairings: balanced };
  }
}

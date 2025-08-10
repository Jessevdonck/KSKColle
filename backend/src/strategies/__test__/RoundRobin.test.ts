import { RoundRobinStrategy } from "../RoundRobinStrategy";
import { Competitor } from "../../types/Types";

function absColorDiffMax2(colors: ("W"|"B"|"N")[]): boolean {
  const w = colors.filter(c => c === "W").length;
  const b = colors.filter(c => c === "B").length;
  return Math.abs(w - b) <= 2;
}

function noThreeSameInRow(colors: ("W"|"B"|"N")[]): boolean {
  let count = 1;
  for (let i = 1; i < colors.length; i++) {
    if (colors[i] !== "N" && colors[i] === colors[i-1]) {
      count++;
      if (count >= 3) return false;
    } else if (colors[i] !== "N") {
      count = 1;
    }
  }
  return true;
}

describe("RoundRobinStrategy - uniqueness & color balance", () => {
  test("Even aantal spelers (8): iedereen speelt 1× tegen iedereen, |W-B| ≤ 2, geen 3× zelfde kleur", () => {
    const players: Competitor[] = Array.from({ length: 8 }, (_, i) => ({
      user_id: i + 1,
      score: 0,
      schaakrating_elo: 1500 + i,
    }));

    const strat = new RoundRobinStrategy();
    const schedule = strat.generateAllRounds(players);

    const opponents = new Map<number, Set<number>>();
    const colors = new Map<number, ("W"|"B"|"N")[]>();

    for (const p of players) {
      opponents.set(p.user_id, new Set());
      colors.set(p.user_id, []);
    }

    for (const round of schedule) {
      for (const g of round) {
        if (g.speler2_id !== null) {
          opponents.get(g.speler1_id)!.add(g.speler2_id);
          opponents.get(g.speler2_id)!.add(g.speler1_id);
          colors.get(g.speler1_id)!.push(g.color1);
          colors.get(g.speler2_id)!.push(g.color2);
        } else {
          colors.get(g.speler1_id)!.push("N");
        }
      }
    }

    for (const p of players) {
      expect(opponents.get(p.user_id)!.size).toBe(players.length - 1);
      expect(absColorDiffMax2(colors.get(p.user_id)!)).toBe(true);
      expect(noThreeSameInRow(colors.get(p.user_id)!)).toBe(true);
    }
  });

  test("Oneven aantal spelers (7): niemand speelt 2× dezelfde, |W-B| ≤ 2, geen 3× zelfde kleur, 1 bye per speler", () => {
    const players: Competitor[] = Array.from({ length: 7 }, (_, i) => ({
      user_id: i + 1,
      score: 0,
      schaakrating_elo: 1500 + i,
    }));

    const strat = new RoundRobinStrategy();
    const schedule = strat.generateAllRounds(players);

    const opponents = new Map<number, Set<number>>();
    const colors = new Map<number, ("W"|"B"|"N")[]>();
    const byes = new Map<number, number>();

    for (const p of players) {
      opponents.set(p.user_id, new Set());
      colors.set(p.user_id, []);
      byes.set(p.user_id, 0);
    }

    for (const round of schedule) {
      for (const g of round) {
        if (g.speler2_id !== null) {
          opponents.get(g.speler1_id)!.add(g.speler2_id);
          opponents.get(g.speler2_id)!.add(g.speler1_id);
          colors.get(g.speler1_id)!.push(g.color1);
          colors.get(g.speler2_id)!.push(g.color2);
        } else {
          colors.get(g.speler1_id)!.push("N");
          byes.set(g.speler1_id, byes.get(g.speler1_id)! + 1);
        }
      }
    }

    for (const p of players) {
      expect(opponents.get(p.user_id)!.size).toBe(players.length - 1);
      expect(absColorDiffMax2(colors.get(p.user_id)!)).toBe(true);
      expect(noThreeSameInRow(colors.get(p.user_id)!)).toBe(true);
      expect(byes.get(p.user_id)).toBe(1);
    }
  });
});

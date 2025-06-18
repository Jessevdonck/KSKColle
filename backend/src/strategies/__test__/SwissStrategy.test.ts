import { SwissStrategy } from "../../strategies/SwissStrategy";
import { Competitor, Pairing } from "../../types/Types";

type CompetitorWithHistory = Competitor & {
  color_history: ("W" | "B")[];
  tiebreak?: number;
};

describe("SwissStrategy — grote simulatie", () => {
  it("verdeelt kleuren goed over 11 rondes voor 48 spelers", async () => {
    const strategy = new SwissStrategy();

    const spelers: CompetitorWithHistory[] = Array.from({ length: 48 }, (_, i) => ({
      user_id: i + 1,
      score: 0,
      schaakrating_elo: 2000 - i * 10,
      color_history: [],
    }));

    const kleurHistoriek = new Map<number, ("W" | "B")[]>();
    spelers.forEach(p => kleurHistoriek.set(p.user_id, []));

    const previousRounds: Pairing[][] = [];

    for (let ronde = 1; ronde <= 11; ronde++) {
      const enrichedPlayers = spelers.map(p => ({
        ...p,
        tiebreak: previousRounds.flat().filter(g => g.speler1_id === p.user_id || g.speler2_id === p.user_id).length,
        color_history: kleurHistoriek.get(p.user_id)!,
      }));

      const { pairings } = await strategy.generatePairings(enrichedPlayers, ronde, previousRounds);

      for (const p of pairings) {
        if (p.color1 !== "N") kleurHistoriek.get(p.speler1_id)!.push(p.color1 as "W" | "B");
        if (p.speler2_id && p.color2 !== "N") kleurHistoriek.get(p.speler2_id)!.push(p.color2 as "W" | "B");
      }

      previousRounds.push(pairings);
    }

    for (const [_id, kleuren] of kleurHistoriek.entries()) {
      const wit = kleuren.filter(k => k === "W").length;
      const zwart = kleuren.filter(k => k === "B").length;
      expect(Math.abs(wit - zwart)).toBeLessThanOrEqual(2);

      for (let i = 0; i <= kleuren.length - 3; i++) {
        const drieOpRij = kleuren.slice(i, i + 3);
        expect(new Set(drieOpRij).size).toBeGreaterThan(1);
      }
    }
  });
});

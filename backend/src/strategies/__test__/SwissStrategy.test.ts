// src/strategies/__tests__/SwissStrategy.test.ts
import { SwissStrategy } from "../SwissStrategy";
import type { Competitor, Pairing } from "../../types/Types";

const mkPlayer = (id: number, rating: number, score = 0): Competitor => ({
  user_id: id,
  score,
  schaakrating_elo: rating,
});

const findPair = (pairs: Pairing[], a: number, b: number) =>
  pairs.find(
    (p) =>
      (p.speler1_id === a && p.speler2_id === b) ||
      (p.speler1_id === b && p.speler2_id === a)
  );

const pushAsPreviousRound = (prev: Pairing[][], roundPairs: Pairing[]) => {
  // sla enkel echte games op; byes tellen voor streak niet (N-kleur)
  prev.push(
    roundPairs.map((p) => ({
      speler1_id: p.speler1_id,
      speler2_id: p.speler2_id,
      color1: p.color1,
      color2: p.color2,
    }))
  );
};

const maxSameColorStreak = (colors: ("W" | "B" | "N")[]) => {
  let best = 0;
  let cur = 0;
  let last: "W" | "B" | "N" | null = null;
  for (const c of colors) {
    if (c === "N") continue; // bye telt niet mee
    if (last === c) {
      cur += 1;
    } else {
      cur = 1;
      last = c;
    }
    if (cur > best) best = cur;
  }
  return best;
};

describe("SwissStrategy", () => {
  test("Round 1: top-half vs bottom-half on rating", async () => {
    const strat = new SwissStrategy();

    // Ratings: 8 > 7 > 6 > 5 > 4 > 3 > 2 > 1
    const players: Competitor[] = [
      mkPlayer(1, 2400),
      mkPlayer(2, 2350),
      mkPlayer(3, 2300),
      mkPlayer(4, 2250),
      mkPlayer(5, 2200),
      mkPlayer(6, 2100),
      mkPlayer(7, 2000),
      mkPlayer(8, 1900),
    ];

    const { pairings } = await strat.generatePairings(players, 1, []);

    // top half: [1,2,3,4], bottom half: [5,6,7,8]
    expect(findPair(pairings, 1, 5)).toBeTruthy();
    expect(findPair(pairings, 2, 6)).toBeTruthy();
    expect(findPair(pairings, 3, 7)).toBeTruthy();
    expect(findPair(pairings, 4, 8)).toBeTruthy();

    // Niemand heeft bye
    expect(pairings.some((p) => p.speler2_id === null)).toBe(false);
  });

  test("Assigns bye to lowest score who has not had a bye yet", async () => {
    const strat = new SwissStrategy();

    // 5 spelers, met scores; speler 5 is laagste maar had al bye in vorige ronde
    const players: Competitor[] = [
      mkPlayer(1, 2400, 2),
      mkPlayer(2, 2300, 1.5),
      mkPlayer(3, 2200, 1),
      mkPlayer(4, 2100, 0.5),
      mkPlayer(5, 2000, 0), // laagste score
    ];

    // Vorige ronde: speler 5 had een bye
    const previousRounds: Pairing[][] = [
      [
        { speler1_id: 5, speler2_id: null, color1: "N", color2: "N" },
        { speler1_id: 1, speler2_id: 2, color1: "W", color2: "B" },
        { speler1_id: 3, speler2_id: 4, color1: "W", color2: "B" },
      ],
    ];

    const { pairings, byePlayer } = await strat.generatePairings(
      players,
      2,
      previousRounds
    );

    // Niet opnieuw speler 5; nu zou speler 4 (volgende laagste) de bye moeten krijgen
    expect(byePlayer?.user_id).toBe(4);

    // Overblijvers moeten allemaal een tegenstander hebben
    const nonBye = new Set([1, 2, 3, 5]);
    for (const id of nonBye) {
      expect(
        pairings.some(
          (p) =>
            (p.speler1_id === id && p.speler2_id !== null) ||
            p.speler2_id === id
        )
      ).toBe(true);
    }
  });

  test("Avoids rematches when possible", async () => {
    const strat = new SwissStrategy();

    const players: Competitor[] = [
      mkPlayer(1, 2400, 1),
      mkPlayer(2, 2350, 1),
      mkPlayer(3, 2300, 1),
      mkPlayer(4, 2250, 1),
    ];

    // Ronde 1: 1-2 en 3-4 speelden al
    const previousRounds: Pairing[][] = [
      [
        { speler1_id: 1, speler2_id: 2, color1: "W", color2: "B" },
        { speler1_id: 3, speler2_id: 4, color1: "W", color2: "B" },
      ],
    ];

    const { pairings } = await strat.generatePairings(
      players,
      2,
      previousRounds
    );

    // Vermijd 1-2 en 3-4 => verwacht: 1-3 en 2-4 (of 1-4 en 2-3)
    const hasRematch12 = !!findPair(pairings, 1, 2);
    const hasRematch34 = !!findPair(pairings, 3, 4);
    expect(hasRematch12 || hasRematch34).toBe(false);
  });

  test("Hard color constraint: nobody can reach 4 identical colors in a row over multiple rounds", async () => {
    const strat = new SwissStrategy();

    // 8 spelers, even aantal => geen bye
    const players: Competitor[] = [
      mkPlayer(1, 2400),
      mkPlayer(2, 2350),
      mkPlayer(3, 2320),
      mkPlayer(4, 2280),
      mkPlayer(5, 2210),
      mkPlayer(6, 2130),
      mkPlayer(7, 2050),
      mkPlayer(8, 1970),
    ];

    const previousRounds: Pairing[][] = [];
    const rounds = 6; // simuleer 6 ronden

    for (let r = 1; r <= rounds; r++) {
      const { pairings, byePlayer } = await strat.generatePairings(
        players,
        r,
        previousRounds
      );
      // geen bye verwacht bij even aantal
      expect(byePlayer).toBeUndefined();
      expect(pairings.every((p) => p.speler2_id !== null)).toBe(true);

      // voeg deze ronde toe aan history
      pushAsPreviousRound(previousRounds, pairings);
    }

    // Controleer per speler: max streak < 4
    const colorMap = new Map<number, ("W" | "B" | "N")[]>();
    for (const r of previousRounds) {
      for (const p of r) {
        // speler1
        if (!colorMap.has(p.speler1_id)) colorMap.set(p.speler1_id, []);
        colorMap.get(p.speler1_id)!.push(p.color1);
        // speler2
        if (p.speler2_id != null) {
          if (!colorMap.has(p.speler2_id)) colorMap.set(p.speler2_id, []);
          colorMap.get(p.speler2_id)!.push(p.color2);
        }
      }
    }

    for (const [, colors] of colorMap.entries()) {
      const streak = maxSameColorStreak(colors);
      expect(streak).toBeLessThan(4);
    }
  });

  test("Color assignment breaks a 3-long streak immediately (forced opposite color)", async () => {
    const strat = new SwissStrategy();

    // 4 spelers om het simpel te houden
    const players: Competitor[] = [
      mkPlayer(1, 2300),
      mkPlayer(2, 2250),
      mkPlayer(3, 2200),
      mkPlayer(4, 2150),
    ];

    // Maak voor speler 1 een historie van 3x Wit op rij
    const previousRounds: Pairing[][] = [
      [{ speler1_id: 1, speler2_id: 3, color1: "W", color2: "B" }],
      [{ speler1_id: 1, speler2_id: 4, color1: "W", color2: "B" }],
      [{ speler1_id: 1, speler2_id: 2, color1: "W", color2: "B" }],
    ];

    const { pairings } = await strat.generatePairings(
      players,
      4,
      previousRounds
    );

    const p = pairings.find(
      (x) => x.speler1_id === 1 || x.speler2_id === 1
    )!;
    expect(p).toBeTruthy();

    // Speler 1 MOET nu zwart hebben
    if (p.speler1_id === 1) {
      expect(p.color1).toBe("B");
    } else {
      expect(p.color2).toBe("B");
    }
  });
});

// helper om per speler W/B te tellen
const countWB = (colors: ("W" | "B" | "N")[]) => {
  let w = 0, b = 0;
  for (const c of colors) {
    if (c === "W") w++;
    else if (c === "B") b++;
  }
  return { w, b };
};

test("Global color balance over a long tournament: |W - B| ≤ 2 after 11 rounds", async () => {
  const strat = new SwissStrategy();

  // 10 spelers (even aantal -> geen bye), willekeurige maar realistische ratings
  const players: Competitor[] = [
    mkPlayer(1, 2420), mkPlayer(2, 2380), mkPlayer(3, 2350), mkPlayer(4, 2310), mkPlayer(5, 2280),
    mkPlayer(6, 2220), mkPlayer(7, 2170), mkPlayer(8, 2100), mkPlayer(9, 2050), mkPlayer(10, 1980),
  ];

  const previousRounds: Pairing[][] = [];
  const ROUNDS = 11;

  for (let r = 1; r <= ROUNDS; r++) {
    const { pairings, byePlayer } = await strat.generatePairings(players, r, previousRounds);
    expect(byePlayer).toBeUndefined(); // geen bye verwacht
    expect(pairings.every(p => p.speler2_id !== null)).toBe(true);
    pushAsPreviousRound(previousRounds, pairings);

    // (optioneel) je kan hier ook fake-scores updaten in `players` zodat standings evolueren.
    // Voor kleurverdeling is dat niet nodig.
  }

  // bouw kleurhistoriek per speler op
  const colorMap = new Map<number, ("W" | "B" | "N")[]>();
  for (const round of previousRounds) {
    for (const p of round) {
      if (!colorMap.has(p.speler1_id)) colorMap.set(p.speler1_id, []);
      colorMap.get(p.speler1_id)!.push(p.color1);
      if (p.speler2_id != null) {
        if (!colorMap.has(p.speler2_id)) colorMap.set(p.speler2_id, []);
        colorMap.get(p.speler2_id)!.push(p.color2);
      }
    }
  }

  // assert: per speler |W - B| ≤ 2
  for (const [, colors] of colorMap.entries()) {
    const { w, b } = countWB(colors);
    const diff = Math.abs(w - b);
    expect(diff).toBeLessThanOrEqual(2);
  }
});


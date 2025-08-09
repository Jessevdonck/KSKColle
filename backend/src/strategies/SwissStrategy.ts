// src/strategies/SwissStrategy.ts
import { IPairingStrategy, Pairing, Competitor } from "../types/Types";

type Color = "W" | "B" | "N";

interface PlayerState {
  id: number;
  seed: number;    // rating
  points: number;  // huidig totaal (Competitor.score)
  opponents: Set<number>;
  colors: Color[]; // historiek uit previousRounds (+ evt. Competitor.color_history)
  hadBye: boolean;

  // afgeleiden t.b.v. kleurkeuze
  netWhiteMinusBlack: number; // W - B
  lastColor?: Color | undefined;          // W/B
  lastStreak: number;         // lengte van laatste identieke kleurreeks
}

export class SwissStrategy implements IPairingStrategy {
  // Harde grens: nooit 4× dezelfde kleur na elkaar
  private P = {
    hardMaxSameColorStreak: 3, // bij 3 op rij is de volgende kleur verplicht de andere
  };

  async generatePairings(
    players: Competitor[],
    roundNumber: number,
    previousRounds: Pairing[][]
  ): Promise<{ pairings: Pairing[]; byePlayer?: Competitor }> {
    if (!players || players.length === 0) return { pairings: [] };

    // --- 1) Start-state
    const byId = new Map<number, PlayerState>();
    for (const p of players) {
      byId.set(p.user_id, {
        id: p.user_id,
        seed: p.schaakrating_elo ?? 0,
        points: p.score ?? 0,
        opponents: new Set<number>(),
        colors: (p.color_history as Color[] | undefined)?.filter(c => c === "W" || c === "B") ?? [],
        hadBye: false,
        netWhiteMinusBlack: 0,
        lastColor: undefined,
        lastStreak: 0,
      });
    }

    // --- 2) History uit previousRounds: opponents, kleuren, bye
    for (const round of previousRounds ?? []) {
      for (const g of round ?? []) {
        const A = byId.get(g.speler1_id);
        if (!A) continue;

        if (g.speler2_id == null) {
          A.hadBye = true;
        } else {
          const B = byId.get(g.speler2_id);
          if (B) {
            A.opponents.add(B.id);
            B.opponents.add(A.id);
          }
          if (g.color1 === "W" || g.color1 === "B") A.colors.push(g.color1);
          if (B && (g.color2 === "W" || g.color2 === "B")) B.colors.push(g.color2);
        }
      }
    }

    // --- 3) Kleur-statistiek helpers
    for (const st of byId.values()) {
      let last: Color | undefined = undefined;
      let streak = 0;
      let net = 0;
      for (const c of st.colors) {
        if (c === "W") net++;
        else if (c === "B") net--;
        if (c === last) streak++;
        else {
          last = c;
          streak = 1;
        }
      }
      st.netWhiteMinusBlack = net;
      st.lastColor = last!;
      st.lastStreak = streak;
    }

    let working: PlayerState[] = Array.from(byId.values());

    // --- 4) Bye (oneven): laagste punten, dan rating; vermijd 2e bye
    let byePlayer: Competitor | undefined;
    if (working.length % 2 === 1) {
      const asc = [...working].sort((a, b) => a.points - b.points || a.seed - b.seed);
      let pick = asc.find(s => !s.hadBye);
      if (!pick) pick = asc[0];
      working = working.filter(s => s.id !== pick!.id);
      byePlayer = players.find(p => p.user_id === pick!.id);
    }

    // --- 5) Ronde 1: top-half vs bottom-half op rating
    const isFirstRound = (previousRounds?.length ?? 0) === 0 || roundNumber === 1;
    if (isFirstRound) {
      const sortedBySeedDesc = [...working].sort((a, b) => b.seed - a.seed);
      const half = Math.floor(sortedBySeedDesc.length / 2);
      const top = sortedBySeedDesc.slice(0, half);
      const bottom = sortedBySeedDesc.slice(half);

      const pairings: Pairing[] = [];
      // Backtracking binnen de twee helften om kleur-constraint te respecteren
      const pairs = this.matchWithHardColorConstraint(
        top,
        bottom,
        (A, B) => !A.opponents.has(B.id) // geen rematch in R1
      );
      for (const [A, B, c1, c2] of pairs) {
        pairings.push({ speler1_id: A.id, speler2_id: B.id, color1: c1, color2: c2 });
      }

      if (byePlayer) {
        pairings.push({ speler1_id: byePlayer.user_id, speler2_id: null, color1: "N", color2: "N" });
        return { pairings, byePlayer };
      }
      return { pairings };
    }

    // --- 6) Volgende rondes: per scoregroep + (kleur-feasibility) floats
    const sorted = [...working].sort((a, b) => b.points - a.points || b.seed - a.seed);

    // groepeer per punten
    const groups = new Map<number, PlayerState[]>();
    for (const s of sorted) {
      const k = s.points;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(s);
    }
    const scoreKeys = Array.from(groups.keys()).sort((a, b) => b - a);

    type ABPair = [PlayerState, PlayerState, Color, Color];
    const finalPairs: ABPair[] = [];
    let carry: PlayerState | undefined;

    for (let gi = 0; gi < scoreKeys.length; gi++) {
      const key = scoreKeys[gi]!;
      let bucket = groups.get(key)!.slice(); // kopie, punten = key

      if (carry) {
        bucket.unshift(carry);
        carry = undefined;
      }

      // oneven: float laagste naar volgende
      if (bucket.length % 2 === 1) {
        carry = bucket.pop();
      }

      // Probeer binnen de groep perfecte matching met harde kleur-constraint en rematch-verbod
      let pairs = this.matchInsideGroup(bucket, (A, B) => !A.opponents.has(B.id));

      // Als mislukt: probeer met minimale kleur-feasibility float naar volgende groep
      if (pairs.length * 2 !== bucket.length && gi < scoreKeys.length - 1) {
        const nextKey = scoreKeys[gi + 1]!;
        let nextBucket = groups.get(nextKey)!.slice();

        // haal 1 (sterkste) uit nextBucket om bucket op te lossen
        nextBucket.sort((a, b) => b.seed - a.seed);
        const pulled = nextBucket.shift();
        if (pulled) {
          // voeg pulled toe, en als bucket nu oneven, duw zwakste uit bucket naar next
          bucket.push(pulled);
          bucket.sort((a, b) => b.seed - a.seed);
          if (bucket.length % 2 === 1) {
            const pushed = bucket.pop()!;
            nextBucket.unshift(pushed);
          }
          // probeer opnieuw
          pairs = this.matchInsideGroup(bucket, (A, B) => !A.opponents.has(B.id));
          // update next group voor latere loop
          groups.set(nextKey, nextBucket);
        }
      }

      // Als nog steeds mislukt, sta rematch toe (maar NOG STEEDS harde kleur-constraint!)
      if (pairs.length * 2 !== bucket.length) {
        pairs = this.matchInsideGroup(bucket, (_A, _B) => true); // rematch toegestaan
      }

      finalPairs.push(...pairs);
    }

    // Als er nog carry is, koppel die aan dichtste overgeblevene (met kleur-feasibility)
    if (carry) {
      const used = new Set<number>(finalPairs.flatMap(p => [p[0].id, p[1].id]));
      const candidate = sorted.find(s => !used.has(s.id) && s.id !== carry!.id);
      if (candidate) {
        const feas = this.chooseColorsHard(carry, candidate);
        if (!feas) {
          // wissel met een bestaand paar om feasible te maken
          let placed = false;
          for (let i = 0; i < finalPairs.length && !placed; i++) {
            const [X, Y] = finalPairs[i]!;
            // Probeer (carry,candidate) + (X,Y) kleur-feasible door ruil
            const alt1 = this.chooseColorsHard(carry, X);
            const alt2 = this.chooseColorsHard(candidate, Y);
            if (alt1 && alt2) {
              finalPairs[i] = [X, Y, alt2.c1, alt2.c2];
              finalPairs.push([carry, candidate, alt1.c1, alt1.c2]);
              placed = true;
              break;
            }
            const alt3 = this.chooseColorsHard(carry, Y);
            const alt4 = this.chooseColorsHard(candidate, X);
            if (alt3 && alt4) {
              finalPairs[i] = [X, Y, alt4.c1, alt4.c2];
              finalPairs.push([carry, candidate, alt3.c1, alt3.c2]);
              placed = true;
              break;
            }
          }
          if (!placed) {
            // laatste redmiddel: pair met candidate en forceer kleuren via hard rule (zou nu mogelijk moeten zijn)
            const forced = this.chooseColorsHard(carry, candidate);
            if (forced) finalPairs.push([carry, candidate, forced.c1, forced.c2]);
          }
        } else {
          finalPairs.push([carry, candidate, feas.c1, feas.c2]);
        }
      } else if (!byePlayer) {
        // ultieme fallback (zou niet mogen bij even aantal)
        byePlayer = players.find(p => p.user_id === carry.id);
      }
    }

    // --- 7) Output
    const out: Pairing[] = finalPairs.map(([A, B, c1, c2]) => ({
      speler1_id: A.id,
      speler2_id: B.id,
      color1: c1,
      color2: c2,
    }));

    if (byePlayer) {
      out.push({ speler1_id: byePlayer.user_id, speler2_id: null, color1: "N", color2: "N" });
      return { pairings: out, byePlayer };
    }
    return { pairings: out };
  }

  // ---------- Matching helpers met harde kleur-constraint ----------

  // Match top- en bottumhelft (R1) met backtracking en harde kleur-constraint
  private matchWithHardColorConstraint(
    top: PlayerState[],
    bottom: PlayerState[],
    canPair: (A: PlayerState, B: PlayerState) => boolean
  ): Array<[PlayerState, PlayerState, Color, Color]> {
    const result: Array<[PlayerState, PlayerState, Color, Color]> = [];
    const used = new Array(bottom.length).fill(false);

    const dfs = (i: number): boolean => {
      if (i === top.length) return true;
      const A = top[i]!;
      for (let j = 0; j < bottom.length; j++) {
        if (used[j]) continue;
        const B = bottom[j]!;
        if (!canPair(A, B)) continue;
        const colors = this.chooseColorsHard(A, B);
        if (!colors) continue; // niet kleur-feasible
        used[j] = true;
        result.push([A, B, colors.c1, colors.c2]);
        if (dfs(i + 1)) return true;
        result.pop();
        used[j] = false;
      }
      return false;
    };

    dfs(0);
    return result;
  }

  // Match binnen een scoregroep met backtracking; predicate kan rematches verbieden/toestaan
  private matchInsideGroup(
    group: PlayerState[],
    canPair: (A: PlayerState, B: PlayerState) => boolean
  ): Array<[PlayerState, PlayerState, Color, Color]> {
    const arr = [...group].sort((a, b) => b.seed - a.seed); // sterk -> zwak
    const n = arr.length;
    const used = new Array(n).fill(false);
    const result: Array<[PlayerState, PlayerState, Color, Color]> = [];

    const dfs = (): boolean => {
      // zoek eerste vrije index
      let i = 0;
      while (i < n && used[i]) i++;
      if (i >= n) return true;

      used[i] = true;
      const A = arr[i]!;

      for (let j = i + 1; j < n; j++) {
        if (used[j]) continue;
        const B = arr[j]!;
        if (!canPair(A, B)) continue;

        const colors = this.chooseColorsHard(A, B);
        if (!colors) continue; // harde kleur-constraint

        used[j] = true;
        result.push([A, B, colors.c1, colors.c2]);

        if (dfs()) return true;

        result.pop();
        used[j] = false;
      }

      used[i] = false;
      return false;
    };

    if (dfs()) return result;
    return result; // leeg of gedeeltelijk (caller behandelt fallback)
  }

  // Harde kleurkeuze: respecteert "nooit 4× dezelfde kleur"
  private chooseColorsHard(
    A: PlayerState,
    B: PlayerState
  ): { c1: Color; c2: Color } | null {
    const mustA = this.mustOpposite(A);
    const mustB = this.mustOpposite(B);

    // Beide hebben verplicht tegengestelde kleur nodig
    if (mustA && mustB) {
      // Als ze dezelfde kleur "moeten", is het onmogelijk
      if (mustA === mustB) return null;
      // Ze willen tegengesteld -> respecteer dat
      return { c1: mustA, c2: mustB };
    }

    // Eén speler heeft een verplichting
    if (mustA && !mustB) {
      // Geef A wat moet, B krijgt de andere
      return { c1: mustA, c2: mustA === "W" ? "B" : "W" };
    }
    if (!mustA && mustB) {
      return { c1: mustB === "W" ? "B" : "W", c2: mustB };
    }

    // Geen harde verplichtingen -> normale balans
    return this.assignBalancedColors(A, B);
  }

  // True “must color” als streak >= hardMaxSameColorStreak
  private mustOpposite(S: PlayerState): Color | null {
    if (S.lastColor && S.lastStreak >= this.P.hardMaxSameColorStreak) {
      return S.lastColor === "W" ? "B" : "W";
    }
    return null;
  }

  // Zachte balans (alleen gebruikt als er geen musts zijn)
  private assignBalancedColors(A: PlayerState, B: PlayerState): { c1: Color; c2: Color } {
    // balanceer netto W-B
    if (A.netWhiteMinusBlack < B.netWhiteMinusBlack) return { c1: "W", c2: "B" };
    if (B.netWhiteMinusBlack < A.netWhiteMinusBlack) return { c1: "B", c2: "W" };

    // breek langere streak
    const aSt = A.lastStreak || 0;
    const bSt = B.lastStreak || 0;
    if (aSt > bSt && A.lastColor) {
      return { c1: A.lastColor === "W" ? "B" : "W", c2: A.lastColor === "W" ? "W" : "B" };
    }
    if (bSt > aSt && B.lastColor) {
      return { c1: B.lastColor === "W" ? "W" : "B", c2: B.lastColor === "W" ? "B" : "W" };
    }

    // volledig gelijk -> geef hoger gerate speler zwart (mini-nadeel)
    if (A.seed >= B.seed) return { c1: "B", c2: "W" };
    return { c1: "W", c2: "B" };
  }
}

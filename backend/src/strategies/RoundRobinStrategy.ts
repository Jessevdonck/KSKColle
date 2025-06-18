import { IPairingStrategy, Pairing, Competitor } from "../types/Types";

export class RoundRobinStrategy implements IPairingStrategy {
  async generatePairings(
    players: Competitor[],
    roundNumber: number,
    previousRounds?: Pairing[][]
  ): Promise<{ pairings: Pairing[]; byePlayer?: Competitor }> {
    console.log(`🔄 RoundRobin: Generating pairings for round ${roundNumber}`);

    const list = [...players];
    let byePlayer: Competitor | undefined;
    if (list.length % 2 === 1) {
      byePlayer = list.pop();
    }

    const P = list.length;
    if (P < 2) {
      return byePlayer !== undefined
        ? { pairings: [], byePlayer }
        : { pairings: [] };
    }

    const roundsPerCycle = P - 1;
    const cycleNumber = Math.floor((roundNumber - 1) / roundsPerCycle);
    const roundInCycle = ((roundNumber - 1) % roundsPerCycle) + 1;

    console.log(`📊 Cycle ${cycleNumber + 1}, Round ${roundInCycle} in cycle`);

    const opponentHistory = this.buildOpponentHistory(list, previousRounds || []);

    let pairings: Pairing[];

    if (cycleNumber === 0) {
      pairings = this.generateFirstCyclePairings(list, roundInCycle, opponentHistory);
    } else {
      pairings = this.generateRepeatCyclePairings(
        list,
        roundInCycle,
        previousRounds || []
      );
    }

    return byePlayer
      ? { pairings, byePlayer }
      : { pairings };
  }

  private buildOpponentHistory(
    players: Competitor[],
    previousRounds: Pairing[][]
  ): Map<number, Set<number>> {
    const history = new Map<number, Set<number>>();

    players.forEach(player => {
      history.set(player.user_id, new Set<number>());
    });

    previousRounds.forEach(round => {
      round.forEach(pairing => {
        if (pairing.speler2_id !== null) {
          history.get(pairing.speler1_id)?.add(pairing.speler2_id);
          history.get(pairing.speler2_id)?.add(pairing.speler1_id);
        }
      });
    });

    return history;
  }

  private generateFirstCyclePairings(
    players: Competitor[],
    roundInCycle: number,
    opponentHistory: Map<number, Set<number>>
  ): Pairing[] {
    const pairings: Pairing[] = [];
    const availablePlayers = [...players];

    this.shuffleArray(availablePlayers);

    const paired = new Set<number>();

    while (availablePlayers.length > 1 && paired.size < players.length) {
      let player1: Competitor | undefined;
      let player2: Competitor | undefined;

      for (let i = 0; i < availablePlayers.length; i++) {
        if (!paired.has(availablePlayers[i]!.user_id)) {
          player1 = availablePlayers[i];
          break;
        }
      }

      if (!player1) break;

      const player1Opponents = opponentHistory.get(player1.user_id) || new Set();

      for (let i = 0; i < availablePlayers.length; i++) {
        const candidate = availablePlayers[i];
        if (
          candidate!.user_id !== player1.user_id &&
          !paired.has(candidate!.user_id) &&
          !player1Opponents.has(candidate!.user_id)
        ) {
          player2 = candidate;
          break;
        }
      }

      if (!player2) {
        for (let i = 0; i < availablePlayers.length; i++) {
          const candidate = availablePlayers[i];
          if (
            candidate!.user_id !== player1.user_id &&
            !paired.has(candidate!.user_id)
          ) {
            player2 = candidate;
            break;
          }
        }
      }

      if (player1 && player2) {
        const player1GetsWhite = roundInCycle % 2 === 1;

        pairings.push({
          speler1_id: player1.user_id,
          speler2_id: player2.user_id,
          color1: player1GetsWhite ? "W" : "B",
          color2: player1GetsWhite ? "B" : "W",
        });

        paired.add(player1.user_id);
        paired.add(player2.user_id);
      } else {
        break;
      }
    }

    console.log(`✅ Generated ${pairings.length} pairings for first cycle`);
    return pairings;
  }

  private generateRepeatCyclePairings(
    players: Competitor[],
    roundInCycle: number,
    previousRounds: Pairing[][]
  ): Pairing[] {
    const roundsPerCycle = players.length - 1;
    const firstCycle = previousRounds.slice(0, roundsPerCycle);
    const originalRound = firstCycle[roundInCycle - 1];

    if (!originalRound) {
      console.warn(
        `⚠️ Kan originele ronde ${roundInCycle} uit eerste cyclus niet vinden, val terug op random-first-cycle logic`
      );
      const opponentHistory = this.buildOpponentHistory(players, previousRounds);
      return this.generateFirstCyclePairings(players, roundInCycle, opponentHistory);
    }

    const newPairings: Pairing[] = originalRound
      .filter((p) => p.speler2_id !== null)
      .map((orig) => ({
        speler1_id: orig.speler2_id!,
        speler2_id: orig.speler1_id,
        color1: "W",
        color2: "B",
      }));

    console.log(
      `🔄 Repeating ${newPairings.length} pairings from first cycle round ${roundInCycle}, colors swapped`
    );
    return newPairings;
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i]!, array[j]!] = [array[j]!, array[i]!];
    }
  }
}

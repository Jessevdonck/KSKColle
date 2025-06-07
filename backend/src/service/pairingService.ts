// src/service/pairingService.ts

import { prisma } from "../data";
import { SwissStrategy } from "../strategies/SwissStrategy";
import { RoundRobinStrategy } from "../strategies/RoundRobinStrategy";
import { IPairingStrategy, Pairing } from "../types/Types";
import handleDBError from "./handleDBError";

export async function createAndSavePairings(
  tournament_id: number,
  round_number: number
): Promise<void> {
  console.log("🔔 createAndSavePairings gestart", { tournament_id, round_number });

  try {
    // 1) Haal toernooi, participations en eerdere rondes op
    const tour = await prisma.tournament.findUnique({
      where: { tournament_id },
      include: {
        participations: { include: { user: true } },
        rounds: true,
      },
    });
    if (!tour) throw new Error("Toernooi niet gevonden");

    // 2) Kies de juiste pairing-strategie
    const strategy: IPairingStrategy =
      tour.type === "SWISS"
        ? new SwissStrategy()
        : new RoundRobinStrategy();

    // 3) Geef lijst van spelers en dummy-history van voorgaande rondes
    const players = tour.participations.map((p) => p.user);
    const previousRounds: Pairing[][] = (
      await Promise.all(
        tour.rounds
          .filter((r) => r.ronde_nummer < round_number)
          .sort((a, b) => a.ronde_nummer - b.ronde_nummer)
          .map((r) => prisma.game.findMany({ where: { round_id: r.round_id } }))
      )
    ).map((games) =>
      games.map< Pairing >((g) => ({
        speler1_id: g.speler1_id,
        speler2_id: g.speler2_id,
        color1: "N", // dummy voor “alreadyPlayed” check
        color2: "N",
      }))
    );

    // 4) Genereer nieuwe pairings + byePlayer (als odd)
    const { pairings, byePlayer } = strategy.generatePairings(
      players,
      round_number,
      previousRounds
    );
    console.log(
      `📝 Ronde ${round_number}: pairings=${pairings.length}, byePlayer=${byePlayer?.user_id ?? "none"}`
    );

    // 5) Maak de nieuwe ronde aan
    const round = await prisma.round.create({
      data: {
        tournament_id,
        ronde_nummer: round_number,
        ronde_datum: new Date(),
      },
    });

    // 6) Bouw één array met élke game (gewone + bye)
    type GameData = {
      round_id: number;
      speler1_id: number;
      speler2_id: number | null;
      winnaar_id?: number;
      result?: string;
    };

    const gamesData: GameData[] = pairings.map((p) => ({
      round_id: round.round_id,
      speler1_id: p.speler1_id,
      speler2_id: p.speler2_id,
    }));

    if (byePlayer) {
      console.log("⚠️ Bye-game toegevoegd voor user_id=", byePlayer.user_id);
      gamesData.push({
        round_id: round.round_id,
        speler1_id: byePlayer.user_id,
        speler2_id: null,
        winnaar_id: byePlayer.user_id,
        result: "1-0",
      });
    }

    // 7) Sla alle games in één keer op
    await prisma.game.createMany({ data: gamesData });

    // 8) Update opponents/color_history voor alle match-games
    for (const p of pairings) {
      await updateParticipation(
        tournament_id,
        p.speler1_id,
        p.speler2_id,
        p.color1,
        round_number
      );
      if (p.speler2_id !== null) {
        await updateParticipation(
          tournament_id,
          p.speler2_id,
          p.speler1_id,
          p.color2,
          round_number
        );
      }
    }

    // 9) Bij byePlayer: ken 1 punt toe en sla bye_round op
    if (byePlayer) {
      await prisma.participation.update({
        where: {
          user_id_tournament_id: {
            user_id: byePlayer.user_id,
            tournament_id,
          },
        },
        data: {
          score: { increment: 1 },
          bye_round: round_number,
        },
      });
    }
  } catch (error) {
    console.error("❌ createAndSavePairings error:", error);
    throw handleDBError(error);
  }
}

/**
 * Helper om voor één speler opponents en kleur-history bij te werken.
 */
async function updateParticipation(
  tournament_id: number,
  user_id: number,
  opponentId: number | null,
  color: "W" | "B" | "N",
  roundNumber: number
) {
  const part = await prisma.participation.findUnique({
    where: { user_id_tournament_id: { user_id, tournament_id } },
  });
  if (!part) return;

  const opponents = JSON.parse(part.opponents || "[]") as (number | null)[];
  const colors = JSON.parse(part.color_history || "[]") as ("W" | "B" | "N")[];

  await prisma.participation.update({
    where: { user_id_tournament_id: { user_id, tournament_id } },
    data: {
      opponents: JSON.stringify([...opponents, opponentId]),
      color_history: JSON.stringify([...colors, color]),
    },
  });
}

// src/service/pairingService.ts
import { prisma } from "../data";
import { SwissStrategy } from "../strategies/SwissStrategy";
import { RoundRobinStrategy } from "../strategies/RoundRobinStrategy";
import { Pairing } from "../types/Types";
import handleDBError from "./handleDBError";

type GameData = {
  round_id: number;
  speler1_id: number;
  speler2_id: number | null;
  winnaar_id?: number | null;
  result?: string | null;
};

export async function createAndSavePairings(
  tournament_id: number,
  round_number: number
): Promise<void> {
  try {
    const tour = await prisma.tournament.findUnique({
      where: { tournament_id },
      include: { participations: { include: { user: true } }, rounds: true },
    });
    if (!tour) throw new Error("Toernooi niet gevonden");

    const players = tour.participations.map((p) => ({
      user_id: p.user.user_id,
      score: p.score ?? 0,
      schaakrating_elo: p.user.schaakrating_elo,
    }));

    if (tour.type === "ROUND_ROBIN") {
      // voorkom dubbele generatie
      if (tour.rounds.length > 0) return;

      const strat = new RoundRobinStrategy();
      const schedule = strat.generateAllRounds(players);

      for (let r = 0; r < schedule.length; r++) {
        const round = await prisma.round.create({
          data: {
            tournament_id,
            ronde_nummer: r + 1,
            ronde_datum: new Date(),
          },
        });

        const gamesData: GameData[] = schedule[r]!.map((p) => {
          if (p.speler2_id === null) {
            return {
              round_id: round.round_id,
              speler1_id: p.speler1_id,
              speler2_id: null,
              winnaar_id: p.speler1_id,
              result: "1-0",
            };
          }
          const whiteId = p.color1 === "W" ? p.speler1_id : p.speler2_id!;
          const blackId = p.color1 === "W" ? p.speler2_id! : p.speler1_id;
          return {
            round_id: round.round_id,
            speler1_id: whiteId,
            speler2_id: blackId,
          };
        });

        await prisma.game.createMany({ data: gamesData });

        for (const p of schedule[r]!) {
          await updateParticipation(
            tournament_id,
            p.speler1_id,
            p.speler2_id,
            p.color1
          );
          if (p.speler2_id !== null) {
            await updateParticipation(
              tournament_id,
              p.speler2_id,
              p.speler1_id,
              p.color2
            );
          } else {
            await prisma.participation.update({
              where: {
                user_id_tournament_id: { user_id: p.speler1_id, tournament_id },
              },
              data: { score: { increment: 1 }, bye_round: r + 1 },
            });
          }
        }
      }
      return;
    }

    // --- SWISS ---
    const strategy = new SwissStrategy();
    const previousRounds: Pairing[][] = (
      await Promise.all(
        tour.rounds
          .filter((r) => r.ronde_nummer < round_number)
          .sort((a, b) => a.ronde_nummer - b.ronde_nummer)
          .map((r) => prisma.game.findMany({ where: { round_id: r.round_id } }))
      )
    ).map((games) =>
      games.map<Pairing>((g) => ({
        speler1_id: g.speler1_id,
        speler2_id: g.speler2_id,
        color1: g.speler2_id == null ? "N" : "W",
        color2: g.speler2_id == null ? "N" : "B",
      }))
    );

    let { pairings, byePlayer } = await strategy.generatePairings(
      players,
      round_number,
      previousRounds
    );

    if (round_number % 2 === 0) {
      pairings = pairings.map((p) => ({
        ...p,
        color1: p.color2,
        color2: p.color1,
      }));
    }

    const round = await prisma.round.create({
      data: {
        tournament_id,
        ronde_nummer: round_number,
        ronde_datum: new Date(),
      },
    });

    const gamesData: GameData[] = [];

    // normale partijen
    for (const p of pairings) {
      if (p.speler2_id === null) continue;
      const whiteId = p.color1 === "W" ? p.speler1_id : p.speler2_id!;
      const blackId = p.color1 === "W" ? p.speler2_id! : p.speler1_id;
      gamesData.push({
        round_id: round.round_id,
        speler1_id: whiteId,
        speler2_id: blackId,
      });
    }

    // bye apart
    if (byePlayer) {
      gamesData.push({
        round_id: round.round_id,
        speler1_id: byePlayer.user_id,
        speler2_id: null,
        winnaar_id: byePlayer.user_id,
        result: "1-0",
      });
    }

    await prisma.game.createMany({ data: gamesData });

    // participation bijwerken
    for (const p of pairings) {
      await updateParticipation(
        tournament_id,
        p.speler1_id,
        p.speler2_id,
        p.color1
      );
      if (p.speler2_id !== null) {
        await updateParticipation(
          tournament_id,
          p.speler2_id,
          p.speler1_id,
          p.color2
        );
      }
    }

    if (byePlayer) {
      await prisma.participation.update({
        where: {
          user_id_tournament_id: {
            user_id: byePlayer.user_id,
            tournament_id,
          },
        },
        data: { score: { increment: 1 }, bye_round: round_number },
      });
    }
  } catch (error) {
    console.error("❌ createAndSavePairings error:", error);
    throw handleDBError(error);
  }
}

async function updateParticipation(
  tournament_id: number,
  user_id: number,
  opponentId: number | null,
  color: "W" | "B" | "N"
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

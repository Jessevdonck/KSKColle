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
        participations: {
          include: {
            user: true,
          },
        },
        rounds: true,
      },
    });
    if (!tour) throw new Error("Toernooi niet gevonden");

    // 2) Kies juiste strategie
    const strategy: IPairingStrategy =
      tour.type === "SWISS"
        ? new SwissStrategy()
        : new RoundRobinStrategy();

    // 3) Bouw kleur-history map
    const colorHistoryMap: Record<number, Array<"W" | "B" | "N">> = {};
    for (const part of tour.participations) {
      const hist = JSON.parse(part.color_history || "[]") as Array<"W" | "B" | "N">;
      colorHistoryMap[part.user.user_id] = hist;
    }

    // 4) Dummy-history voor opponents (zonder kleurinfo)
    const previousRounds: Pairing[][] = (
      await Promise.all(
        tour.rounds
          .filter((r) => r.ronde_nummer < round_number)
          .sort((a, b) => a.ronde_nummer - b.ronde_nummer)
          .map((r) =>
            prisma.game.findMany({
              where: { round_id: r.round_id },
            })
          )
      )
    ).map((games) =>
      games.map< Pairing >((g) => ({
        speler1_id: g.speler1_id,
        speler2_id: g.speler2_id,
        color1: "N",
        color2: "N",
      }))
    );

    // 5) Maak spelers-array met actuele scores
    const players = tour.participations.map((part) => ({
      user_id: part.user.user_id,
      score: part.score ?? 0,
      voornaam: part.user.voornaam,
      achternaam: part.user.achternaam,
      email: part.user.email,
      schaakrating_elo: part.user.schaakrating_elo,
    }));

    // 6) Vraag pairings aan de strategie op
    let { pairings, byePlayer } = strategy.generatePairings(
      players,
      round_number,
      previousRounds
    );

    // 7) Kleur-balancing: draai om indien speler1 al vaak wit speelde
    pairings = pairings.map((p) => {
      const hist = colorHistoryMap[p.speler1_id] || [];
      const whites = hist.filter((c) => c === "W").length;
      const blacks = hist.filter((c) => c === "B").length;
      if (whites > blacks) {
        return { ...p, color1: "B", color2: "W" };
      }
      return { ...p, color1: "W", color2: "B" };
    });

    // 8) Maak de nieuwe ronde aan
    const round = await prisma.round.create({
      data: {
        tournament_id,
        ronde_nummer: round_number,
        ronde_datum: new Date(),
      },
    });

    // 9) Zet alle games klaar (inclusief bye)
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
      gamesData.push({
        round_id: round.round_id,
        speler1_id: byePlayer.user_id,
        speler2_id: null,
        winnaar_id: byePlayer.user_id,
        result: "1-0",
      });
    }

    // 10) Sla ze in batch op
    await prisma.game.createMany({ data: gamesData });

    // 11) Update opponents én kleur-history
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

    // 12) Geef de bye speler zijn punt
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

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

    // 2) Kies juiste strategie
    const strategy: IPairingStrategy =
      tour.type === "SWISS"
        ? new SwissStrategy()
        : new RoundRobinStrategy();

    // 3) Dummy-history voor eerdere ronden (kleurinfo uit result)
    const previousRounds: Pairing[][] = (
      await Promise.all(
        tour.rounds
          .filter((r) => r.ronde_nummer < round_number)
          .sort((a, b) => a.ronde_nummer - b.ronde_nummer)
          .map((r) =>
            prisma.game.findMany({ where: { round_id: r.round_id } })
          )
      )
    ).map((games) =>
      games.map< Pairing >((g) => ({
        speler1_id: g.speler1_id,
        speler2_id: g.speler2_id,
        color1: g.result?.startsWith("1-0") ? "W" : g.result?.startsWith("0-1") ? "B" : "N",
        color2: g.result?.startsWith("0-1") ? "B" : g.result?.startsWith("1-0") ? "W" : "N",
      }))
    );

    // 4) Maak spelers-array met actuele scores
    const players = tour.participations.map((part) => ({
      user_id: part.user.user_id,
      score: part.score ?? 0,
      voornaam: part.user.voornaam,
      achternaam: part.user.achternaam,
      email: part.user.email,
      schaakrating_elo: part.user.schaakrating_elo,
    }));

    // 5) Vraag paringen aan strategie
    let { pairings, byePlayer } = strategy.generatePairings(
      players,
      round_number,
      previousRounds
    );

    // 6) Vrije kleur-alternatie: draai om in even ronden
    if (strategy instanceof SwissStrategy && round_number % 2 === 0) {
      pairings = pairings.map((p) => ({
        speler1_id: p.speler1_id,
        speler2_id: p.speler2_id,
        color1: p.color2,
        color2: p.color1,
      }));
    }

    // 7) Maak nieuwe ronde
    const round = await prisma.round.create({
      data: {
        tournament_id,
        ronde_nummer: round_number,
        ronde_datum: new Date(),
      },
    });

    // 8) Bereid gamesData (incl. bye)
    type GameData = {
      round_id: number;
      speler1_id: number; // wit
      speler2_id: number | null; // zwart
      winnaar_id?: number;
      result?: string;
    };
    const gamesData: GameData[] = pairings.map((p) => {
      const whiteId = p.color1 === "W" ? p.speler1_id : p.speler2_id!;
      const blackId = p.color1 === "W" ? p.speler2_id! : p.speler1_id;
      return {
        round_id: round.round_id,
        speler1_id: whiteId,
        speler2_id: blackId,
      };
    });
    if (byePlayer) {
      gamesData.push({
        round_id: round.round_id,
        speler1_id: byePlayer.user_id,
        speler2_id: null,
        winnaar_id: byePlayer.user_id,
        result: "1-0",
      });
    }

    // 9) Sla games in batch op
    await prisma.game.createMany({ data: gamesData });

    // 10) Update participation én kleur-history
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

    // 11) Verleen bye-punt
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

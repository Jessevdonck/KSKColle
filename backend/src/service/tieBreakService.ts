// src/service/tieBreakService.ts
import { prisma } from "../data";
import ServiceError from "../core/serviceError";

export async function updateTieBreakAndWins(tournament_id: number): Promise<void> {
  // 1) Haal alle deelnemers
  const parts = await prisma.participation.findMany({
    where: { tournament_id },
    select: { user_id: true },
  });
  if (parts.length === 0) {
    throw ServiceError.notFound("Geen deelnemers voor dit toernooi");
  }

  // 2) Haal alle games van dit toernooi
  const games = await prisma.game.findMany({
    where: { round: { tournament_id } },
    select: {
      speler1_id: true,
      speler2_id: true,
      result: true,
    },
  });

  // 3) Initialiseer maps
  const scoreMap: Record<number, number> = {};
  const winCount: Record<number, number> = {};
  const sbMap: Record<number, number> = {};
  const buchholzList: Record<number, number[]> = {}; // lijst van opponent-scores

  for (const { user_id } of parts) {
    scoreMap[user_id] = 0;
    winCount[user_id] = 0;
    sbMap[user_id] = 0;
    buchholzList[user_id] = [];
  }

  // 4) Bereken totaalpunten (scoreMap) en winCount
  for (const { speler1_id: p1, speler2_id: p2, result } of games) {
    switch (result) {
      case "1-0":
        scoreMap[p1]! += 1;
        winCount[p1]! += 1;
        break;
      case "0-1":
        if (p2 != null) {
          scoreMap[p2]! += 1;
          winCount[p2]! += 1;
        }
        break;
      case "½-½":
      case "1/2-1/2":
        scoreMap[p1]! += 0.5;
        if (p2 != null) scoreMap[p2]! += 0.5;
        break;
    }
  }

  // 5) Bouw Buchholz-lijsten en SB-scores
  for (const { speler1_id: p1, speler2_id: p2, result } of games) {
    // Buchholz: voeg volledige score van de tegenstander toe
    if (p2 != null) {
      buchholzList[p1]!.push(scoreMap[p2]!);
      buchholzList[p2]!.push(scoreMap[p1]!);
    }
    // SB (Sonneborn–Berger): gewogen by win/halve
    if (result === "1-0") {
      sbMap[p1]! += scoreMap[p2!] ?? 0;
    } else if (result === "0-1" && p2 != null) {
      sbMap[p2]! += scoreMap[p1] ?? 0;
    } else if (result === "½-½" || result === "1/2-1/2") {
      sbMap[p1]! += (scoreMap[p2!] ?? 0) * 0.5;
      sbMap[p2!]! += (scoreMap[p1] ?? 0) * 0.5;
    }
  }

  // 6) Haal het toernooitype op (SWISS of ROUND_ROBIN)
  const tour = await prisma.tournament.findUnique({
    where: { tournament_id },
    select: { type: true },
  });
  if (!tour) {
    throw ServiceError.notFound("Toernooi niet gevonden");
  }

  // 7) Update alle deelnames in één transaction
  await prisma.$transaction(
    parts.map(({ user_id }) => {
      let tieValue: number;
      if (tour.type === "SWISS") {
        // Buchholz minus de laagste opponent-score
        const opps = buchholzList[user_id];
        const sumBuch = opps!.reduce((a, b) => a + b, 0);
        const worstOpp = opps!.length > 0 ? Math.min(...opps!) : 0;
        tieValue = sumBuch - worstOpp;
      } else {
        // Round Robin: SB²
        tieValue = Math.pow(sbMap[user_id] ?? 0, 2);
      }

      return prisma.participation.update({
        where: {
          user_id_tournament_id: { user_id, tournament_id },
        },
        data: {
          score: scoreMap[user_id] ?? 0,
          wins: winCount[user_id] ?? 0,
          tie_break: tieValue,
        },
      });
    })
  );
}

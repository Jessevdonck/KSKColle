// src/service/tieBreakService.ts
import { prisma } from "../data";
import ServiceError from "../core/serviceError";
import {
  isDecidedGameWithOpponentResult,
  isDrawResult,
  normalizeResultFlat,
} from "../core/countsAsSpeeldagPartij";

export async function updateTieBreakAndWins(tournament_id: number): Promise<void> {
  // 1) Haal alle deelnemers MET hun huidige scores en tie_break (voor Buchholz berekening)
  const parts = await prisma.participation.findMany({
    where: { tournament_id },
    select: { user_id: true, score: true, tie_break: true },
  });
  if (parts.length === 0) {
    throw ServiceError.notFound("Geen deelnemers voor dit toernooi");
  }

  // 2) Haal alle games (normaal + inhaaldag); dubbele koppelingen worden later gefilterd
  const gamesRaw = await prisma.game.findMany({
    where: {
      round: {
        tournament_id,
        type: { in: ["REGULAR", "MAKEUP"] },
      },
    },
    select: {
      game_id: true,
      original_game_id: true,
      speler1_id: true,
      speler2_id: true,
      result: true,
      round: { select: { type: true } },
    },
  });

  // 2.5) Haal het toernooitype op (SWISS of ROUND_ROBIN) en naam
  const tour = await prisma.tournament.findUnique({
    where: { tournament_id },
    select: { type: true, naam: true, class_name: true },
  });
  if (!tour) {
    throw ServiceError.notFound("Toernooi niet gevonden");
  }

  const nLower = tour.naam.toLowerCase();
  const isLentecompetitie =
    nLower.includes("lentecompetitie") ||
    nLower.includes("lente competitie") ||
    (nLower.includes("lente") && (tour.class_name ?? "").trim().length > 0);

  // 3) Initialiseer maps
  // Gebruik de scores uit de participation tabel (zoals Sevilla ze berekent)
  const scoreMap: Record<number, number> = {};
  const winCount: Record<number, number> = {};
  const sbMap: Record<number, number> = {};
  /** Lentecompetitie (Sevilla SB²): Σ(win: PT_opp²) + 0,5×Σ(remise: PT_opp²) */
  const sbSqMap: Record<number, number> = {};
  const buchholzList: Record<number, number[]> = {}; // lijst van opponent-scores

  for (const { user_id, score } of parts) {
    // Gebruik de score uit de participation tabel (Sevilla score) als basis
    scoreMap[user_id] = score ?? 0;
    winCount[user_id] = 0;
    sbMap[user_id] = 0;
    sbSqMap[user_id] = 0;
    buchholzList[user_id] = [];
  }

  const isPlayedGame = isDecidedGameWithOpponentResult;

  /** Eén partij per spelerskoppel: bij uitstel staat het resultaat op de inhaaldag; die wint bij dubbel. */
  function dedupeGamesByPair(
    rows: typeof gamesRaw
  ): Array<{ p1: number; p2: number; result: string }> {
    const played = rows.filter(
      (g) => g.speler2_id != null && isPlayedGame(g.result)
    );
    played.sort((a, b) => {
      const aM = a.round.type === "MAKEUP" ? 1 : 0;
      const bM = b.round.type === "MAKEUP" ? 1 : 0;
      if (bM !== aM) return bM - aM;
      const aO = a.original_game_id != null ? 1 : 0;
      const bO = b.original_game_id != null ? 1 : 0;
      if (bO !== aO) return bO - aO;
      return b.game_id - a.game_id;
    });
    const seen = new Set<string>();
    const out: Array<{ p1: number; p2: number; result: string }> = [];
    for (const g of played) {
      const p1 = g.speler1_id;
      const p2 = g.speler2_id!;
      const key = p1 < p2 ? `${p1}-${p2}` : `${p2}-${p1}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ p1, p2, result: g.result! });
    }
    return out;
  }

  const games = dedupeGamesByPair(gamesRaw);

  // 4) Bereken winCount (scoreMap wordt al gevuld met scores uit participation tabel)
  // Note: Forfeits count as played games, only absences don't
  for (const { p1, p2, result } of games) {
    // Count wins for played games
    const flat = normalizeResultFlat(result);
    if (flat.startsWith("1-0")) {
      winCount[p1]! += 1;
    } else if (flat.startsWith("0-1")) {
      winCount[p2]! += 1;
    }
    // Draws don't count as wins, so no need to increment winCount
  }

  // 5) Bouw Buchholz-lijsten en SB-scores
  // IMPORTANT: Forfeits count as played games for score, and for Buchholz
  // But for Buchholz-worst calculation, forfeits are excluded
  // BYE games (p2 == null) should NOT count for Buchholz, even if they have a result
  // CRITICAL: Use scores from participation table (Sevilla scores) for Buchholz calculation
  const buchholzListForWorst: Record<number, number[]> = {}; // For worst calculation (excludes forfeits)
  for (const { user_id } of parts) {
    buchholzListForWorst[user_id] = [];
  }

  for (const { p1, p2, result } of games) {
    // Buchholz: INCLUDE forfeit games in Buchholz calculation (matches Sevilla Bhlz)
    // Use the score from participation table which matches Sevilla's calculation
    buchholzList[p1]!.push(scoreMap[p2]!);
    buchholzList[p2]!.push(scoreMap[p1]!);
    
    // For Buchholz-worst: Use ALL games (including forfeits) for worst calculation
    // Buchholz-worst = Buchholz (includes forfeits) minus laagste opponent-score (from ALL games)
    // Standard definition: subtract the lowest opponent score from total Buchholz
    buchholzListForWorst[p1]!.push(scoreMap[p2]!);
    buchholzListForWorst[p2]!.push(scoreMap[p1]!);
    // SB (Sonneborn–Berger): gewogen by win/halve
    // Include forfeits in SB calculation
    // Sonneborn–Berger (klassiek): win = PT_tegenstander, remise = ½ PT, verlies = 0
    const o1 = scoreMap[p2] ?? 0;
    const o2 = scoreMap[p1] ?? 0;
    const flat = normalizeResultFlat(result);
    if (flat.startsWith("1-0")) {
      sbMap[p1]! += o1;
      if (isLentecompetitie) sbSqMap[p1]! += o1 * o1;
    } else if (flat.startsWith("0-1")) {
      sbMap[p2]! += o2;
      if (isLentecompetitie) sbSqMap[p2]! += o2 * o2;
    } else if (isDrawResult(result)) {
      sbMap[p1]! += o1 * 0.5;
      sbMap[p2]! += o2 * 0.5;
      if (isLentecompetitie) {
        sbSqMap[p1]! += 0.5 * (o1 * o1);
        sbSqMap[p2]! += 0.5 * (o2 * o2);
      }
    }
  }

  // 6) Update alle deelnames in één transaction
  await prisma.$transaction(
    parts.map(({ user_id, tie_break }) => {
      // If tie_break is already set (from Sevilla import with ModifiedMedian), don't recalculate
      // Only calculate if tie_break is null or 0 (not imported from Sevilla)
      let tieValue: number | null = tie_break;
      
      // Always calculate tie_break (don't use ModifiedMedian from Sevilla)
      if (isLentecompetitie) {
        // Lentecompetitie (Sevilla SB²): Σ PT_opp² bij winst, ½×PT_opp² bij remise
        tieValue = sbSqMap[user_id] ?? 0;
      } else if (tour.type === "SWISS") {
        // Buchholz-worst: Buchholz (includes forfeits) minus de laagste opponent-score (from ALL games)
        // Standard definition: subtract the lowest opponent score from total Buchholz
        const opps = buchholzList[user_id]; // Full Buchholz (includes forfeits)
        const sumBuch = opps!.reduce((a, b) => a + b, 0);
        if (opps!.length > 0) {
          // Find the worst opponent from ALL games (including forfeits)
          const worstOpp = Math.min(...opps!);
          tieValue = sumBuch - worstOpp;
        } else {
          tieValue = 0;
        }
      } else {
        // Round Robin: Sonneborn–Berger
        tieValue = sbMap[user_id] ?? 0;
      }

      return prisma.participation.update({
        where: {
          user_id_tournament_id: { user_id, tournament_id },
        },
        data: {
          // Don't update score - it's already set by Sevilla import
          // score: scoreMap[user_id] ?? 0,
          wins: winCount[user_id] ?? 0,
          tie_break: tieValue,
        },
      });
    })
  );
}

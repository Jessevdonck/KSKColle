// src/service/tieBreakService.ts
import { prisma } from "../data";
import ServiceError from "../core/serviceError";

export async function updateTieBreakAndWins(tournament_id: number): Promise<void> {
  // 1) Haal alle deelnemers MET hun huidige scores en tie_break (voor Buchholz berekening)
  const parts = await prisma.participation.findMany({
    where: { tournament_id },
    select: { user_id: true, score: true, tie_break: true },
  });
  if (parts.length === 0) {
    throw ServiceError.notFound("Geen deelnemers voor dit toernooi");
  }

  // 2) Haal alle games van dit toernooi (exclusief inhaaldagen)
  const games = await prisma.game.findMany({
    where: { 
      round: { 
        tournament_id,
        type: 'REGULAR' // Alleen normale rondes, geen inhaaldagen
      } 
    },
    select: {
      speler1_id: true,
      speler2_id: true,
      result: true,
    },
  });

  // 2.5) Haal het toernooitype op (SWISS of ROUND_ROBIN) en naam
  const tour = await prisma.tournament.findUnique({
    where: { tournament_id },
    select: { type: true, naam: true },
  });
  if (!tour) {
    throw ServiceError.notFound("Toernooi niet gevonden");
  }

  // Check if this is a Lentecompetitie tournament
  const isLentecompetitie = tour.naam.toLowerCase().includes('lentecompetitie');

  // 3) Initialiseer maps
  // Gebruik de scores uit de participation tabel (zoals Sevilla ze berekent)
  const scoreMap: Record<number, number> = {};
  const winCount: Record<number, number> = {};
  const sbMap: Record<number, number> = {};
  const sbSquaredMap: Record<number, number> = {}; // Voor Lentecompetitie: ∑(resultaat)×(eindscore tegenstander)²
  const buchholzList: Record<number, number[]> = {}; // lijst van opponent-scores

  for (const { user_id, score } of parts) {
    // Gebruik de score uit de participation tabel (Sevilla score) als basis
    scoreMap[user_id] = score ?? 0;
    winCount[user_id] = 0;
    sbMap[user_id] = 0;
    sbSquaredMap[user_id] = 0;
    buchholzList[user_id] = [];
  }

  // Helper function: check if result represents a game that should count as played
  // Excludes: null, "not_played", "...", "uitgesteld", absences ("ABS-", "0.5-0"), and invalid results ("0-0")
  // Includes: regular games ("1-0", "0-1", "½-½", "1/2-1/2", "-"), forfeits ("1-0R", "0-1R")
  const isPlayedGame = (result: string | null): boolean => {
    if (!result || result === "not_played" || result === "..." || result === "uitgesteld") return false;
    // Exclude absences with message (results starting with 'ABS-')
    if (result.startsWith("ABS-")) return false;
    // Exclude "0.5-0" which is an absence with message
    if (result === "0.5-0") return false;
    // Exclude "0-0" which is an invalid/unplayed result
    if (result === "0-0") return false;
    // Only count valid game results: wins, losses, draws, and forfeits
    return result === "1-0" || result === "0-1" || result === "1-0R" || result === "0-1R" ||
           result === "½-½" || result === "1/2-1/2" || result === "-";
  };

  // 4) Bereken winCount (scoreMap wordt al gevuld met scores uit participation tabel)
  // Note: Forfeits count as played games, only absences don't
  for (const { speler1_id: p1, speler2_id: p2, result } of games) {
    if (!isPlayedGame(result)) continue;

    // Count wins for played games
    if (result === "1-0" || result === "1-0R") {
      winCount[p1]! += 1;
    } else if (result === "0-1" || result === "0-1R") {
      if (p2 != null) {
        winCount[p2]! += 1;
      }
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

  for (const { speler1_id: p1, speler2_id: p2, result } of games) {
    // Skip games that are not played (absences, postponed, etc.)
    if (!isPlayedGame(result)) continue;
    
    // Skip BYE games (no opponent) - they should not count in Buchholz
    if (p2 == null) continue;

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
    if (result === "1-0" || result === "1-0R") {
      sbMap[p1]! += scoreMap[p2!] ?? 0;
      // Voor Lentecompetitie: resultaat × (eindscore tegenstander)²
      // Win = 1 × (eindscore tegenstander)²
      if (isLentecompetitie) {
        const opponentScore = scoreMap[p2!] ?? 0;
        sbSquaredMap[p1]! += 1 * Math.pow(opponentScore, 2);
        // Verliezer krijgt 0 × (eindscore tegenstander)² = 0
        sbSquaredMap[p2!]! += 0;
      }
    } else if ((result === "0-1" || result === "0-1R") && p2 != null) {
      sbMap[p2]! += scoreMap[p1] ?? 0;
      // Voor Lentecompetitie: resultaat × (eindscore tegenstander)²
      // Win = 1 × (eindscore tegenstander)²
      if (isLentecompetitie) {
        const opponentScore = scoreMap[p1] ?? 0;
        sbSquaredMap[p2]! += 1 * Math.pow(opponentScore, 2);
        // Verliezer krijgt 0 × (eindscore tegenstander)² = 0
        sbSquaredMap[p1]! += 0;
      }
    } else if (result === "½-½" || result === "1/2-1/2" || result === "-") {
      sbMap[p1]! += (scoreMap[p2!] ?? 0) * 0.5;
      sbMap[p2!]! += (scoreMap[p1] ?? 0) * 0.5;
      // Voor Lentecompetitie: resultaat × (eindscore tegenstander)²
      // Remise = 0.5 × (eindscore tegenstander)²
      if (isLentecompetitie) {
        const opponentScore1 = scoreMap[p2!] ?? 0;
        const opponentScore2 = scoreMap[p1] ?? 0;
        sbSquaredMap[p1]! += 0.5 * Math.pow(opponentScore1, 2);
        sbSquaredMap[p2!]! += 0.5 * Math.pow(opponentScore2, 2);
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
        // Lentecompetitie: ∑(resultaat)×(eindscore tegenstander)²
        tieValue = sbSquaredMap[user_id] ?? 0;
      } else if (tour.type === "SWISS") {
        // Buchholz-worst: Buchholz (includes forfeits) minus de laagste opponent-score (from ALL games)
        // Standard definition: subtract the lowest opponent score from total Buchholz
        const opps = buchholzList[user_id]; // Full Buchholz (includes forfeits)
        const sumBuch = opps!.reduce((a, b) => a + b, 0);
        if (opps!.length > 0) {
          // Find the worst opponent from ALL games (including forfeits)
          const worstOpp = Math.min(...opps!);
          tieValue = sumBuch - worstOpp;
          
          // Debug logging for specific players (remove after debugging)
          if (user_id === 50 || user_id === 51) { // Heidi Daelman or Dirk Heymans
            console.log(`[DEBUG] User ${user_id}: sumBuch=${sumBuch}, opps=${JSON.stringify(opps)}, worstOpp=${worstOpp}, tieValue=${tieValue}`);
          }
        } else {
          tieValue = 0;
        }
      } else {
        // Round Robin: SB²
        tieValue = Math.pow(sbMap[user_id] ?? 0, 2);
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

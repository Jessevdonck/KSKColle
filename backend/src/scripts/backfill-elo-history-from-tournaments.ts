/* scripts/backfill-elo-history-from-tournaments.ts
 * Run: npx tsx src/scripts/backfill-elo-history-from-tournaments.ts
 *
 * Vult EloHistory aan met punten voor herfst- en lentecompetities die al vóór deze
 * feature werden afgesloten (participations met een sevilla_final_rating).
 * Periode = maand van de laatste ronde van dat toernooi (geen exacte afsluitdatum
 * beschikbaar, dit is de beste benadering).
 *
 * Overschrijft NOOIT een bestaand punt (noch uit de Excel-import, noch uit een
 * eerdere run van dit script) - vult alleen ontbrekende (user_id, period) aan.
 * Idempotent: veilig om opnieuw te draaien.
 */

import { PrismaClient } from "@prisma/client";
import { countsForElio } from "../core/ratedCompetitions";

const prisma = new PrismaClient();

function periodFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function main() {
  console.log("=== Backfill ELIO Historiek vanuit afgesloten toernooien ===\n");

  const tournaments = await prisma.tournament.findMany({
    where: { finished: true },
    select: {
      tournament_id: true,
      naam: true,
      class_name: true,
      rounds: {
        select: { ronde_datum: true },
        orderBy: { ronde_datum: "desc" },
        take: 1,
      },
      participations: {
        select: {
          user_id: true,
          sevilla_final_rating: true,
          sevilla_rating_change: true,
        },
      },
    },
  });
  console.log(`Afgesloten toernooien gevonden: ${tournaments.length}`);

  const existing = await prisma.eloHistory.findMany({ select: { user_id: true, period: true } });
  const existingKeys = new Set(existing.map((e) => `${e.user_id}:${e.period}`));
  console.log(`Reeds bestaande ELIO-punten: ${existingKeys.size}\n`);

  const toCreate: Array<{ user_id: number; period: string; rating: number }> = [];
  let skippedNoRating = 0;
  let skippedNoDate = 0;

  for (const t of tournaments) {
    // Enkel herfst- en lentecompetitie tellen voor de ELIO-historiek
    if (!countsForElio(t.naam, t.class_name)) continue;
    const lastRound = t.rounds[0];
    if (!lastRound) {
      skippedNoDate++;
      continue;
    }
    const period = periodFromDate(new Date(lastRound.ronde_datum));

    const rated = t.participations.filter(
      (p) => p.sevilla_final_rating != null && p.sevilla_rating_change != null,
    );
    if (rated.length === 0) {
      skippedNoRating++;
      continue;
    }

    let addedForThisTournament = 0;
    for (const p of rated) {
      const key = `${p.user_id}:${period}`;
      if (existingKeys.has(key)) continue;
      existingKeys.add(key); // voorkomt dubbele toevoeging als 2 toernooien dezelfde maand delen
      toCreate.push({ user_id: p.user_id, period, rating: p.sevilla_final_rating! });
      addedForThisTournament++;
    }
    console.log(
      `✓ ${t.naam} (periode ${period}): ${rated.length} gerate spelers, ${addedForThisTournament} nieuw`,
    );
  }

  console.log(`\n=== Samenvatting ===`);
  console.log(`Toernooien zonder rondes (geen datum): ${skippedNoDate}`);
  console.log(`Toernooien zonder Elo-rating-data: ${skippedNoRating}`);
  console.log(`Nieuwe ELIO-punten om toe te voegen: ${toCreate.length}`);

  if (toCreate.length > 0) {
    const result = await prisma.eloHistory.createMany({ data: toCreate, skipDuplicates: true });
    console.log(`✓ ${result.count} ELIO-punten aangemaakt.`);
  } else {
    console.log("Niets om toe te voegen.");
  }
}

main()
  .then(() => {
    console.log("\n✓ Script succesvol afgerond!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Script gefaald:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

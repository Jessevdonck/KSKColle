/* scripts/recalculate-max-elio.ts
 * Run (proef):  npx tsx --env-file .env src/scripts/recalculate-max-elio.ts
 * Run (echt):   npx tsx --env-file .env src/scripts/recalculate-max-elio.ts --apply
 *
 * Zet schaakrating_max ("Hoogste ELIO") voor elke speler op het hoogste van:
 *  - alle punten in de ELIO-historiek (profielgrafiek)
 *  - de huidige ELIO
 * Oudere maxima van vóór de ELIO-historiek tellen bewust niet mee.
 * Spelers zonder ELIO en zonder historiek krijgen geen maximum (null).
 * Idempotent: veilig om opnieuw te draaien.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

async function main() {
  const [users, historyMax] = await Promise.all([
    prisma.user.findMany({
      select: { user_id: true, voornaam: true, achternaam: true, schaakrating_elo: true, schaakrating_max: true },
    }),
    prisma.eloHistory.groupBy({ by: ["user_id"], _max: { rating: true } }),
  ]);
  const maxFromHistory = new Map(historyMax.map((h) => [h.user_id, h._max.rating ?? 0]));

  const changes: { user_id: number; naam: string; oud: number | null; nieuw: number | null }[] = [];
  for (const u of users) {
    const best = Math.max(maxFromHistory.get(u.user_id) ?? 0, u.schaakrating_elo ?? 0);
    const nieuw = best > 0 ? best : null;
    if ((u.schaakrating_max ?? null) !== nieuw) {
      changes.push({ user_id: u.user_id, naam: `${u.voornaam} ${u.achternaam}`, oud: u.schaakrating_max ?? null, nieuw });
    }
  }

  const hoger = changes.filter((c) => c.nieuw != null && (c.oud == null || c.nieuw > c.oud)).length;
  const lager = changes.filter((c) => c.oud != null && (c.nieuw == null || c.nieuw < c.oud)).length;
  console.log(`Spelers: ${users.length} | te wijzigen: ${changes.length} (hoger/ingevuld: ${hoger}, lager/leeg: ${lager})`);
  for (const c of changes) console.log(`  ${c.naam}: ${c.oud ?? "-"} -> ${c.nieuw ?? "-"}`);

  if (!apply) {
    console.log("\nProef: niets aangepast. Gebruik --apply om te schrijven.");
    return;
  }

  await prisma.$transaction(
    changes.map((c) =>
      prisma.user.update({ where: { user_id: c.user_id }, data: { schaakrating_max: c.nieuw } }),
    ),
  );
  console.log(`\n✓ ${changes.length} spelers bijgewerkt.`);
}

main()
  .catch((error) => {
    console.error("✗ Script gefaald:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/* scripts/import-elo-history.ts
 * Run: npx tsx src/scripts/import-elo-history.ts [pad-naar-excel]
 *
 * Importeert historische ELIO-ratings uit een Excel bestand naar de EloHistory
 * tabel, om de rating-historiekgrafiek op het spelersprofiel te voeden met data
 * die verder teruggaat dan de eigen toernooigegevens.
 *
 * Verwachte structuur van het Excel bestand:
 * - Kolom A ("Speler"): volledige naam van de speler, bv. "Bart Schittekat"
 * - Rij 1 vanaf kolom B: headers "ELIO <jaar>-<maand>", bv. "ELIO 2025-01"
 *   (jaren aflopend, meest recente periode eerst - volgorde maakt niet uit voor import)
 * - Overige cellen: rating op dat moment, of leeg als er nog geen data was
 */

import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import * as path from "path";

const prisma = new PrismaClient();

const EXCEL_PATH = path.resolve(
  process.argv[2] ?? path.join(process.cwd(), "src", "data", "Elio.xlsx"),
);

interface EloRow {
  naam: string;
  periods: Array<{ period: string; rating: number }>;
}

/** Haalt "YYYY-MM" uit een headercel als "ELIO 2025-01" of "ELIO2014-01" (spatie niet gegarandeerd). */
function parsePeriodHeader(header: string): string | null {
  const match = String(header).match(/(\d{4})[-\s]?(\d{2})/);
  if (!match) return null;
  const [, year, month] = match;
  return `${year}-${month}`;
}

function readExcelRows(): EloRow[] {
  console.log(`Lezen van Excel bestand: ${EXCEL_PATH}`);

  const wb = XLSX.readFile(EXCEL_PATH, { cellDates: false, raw: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("Geen sheet gevonden in Excel bestand");

  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw new Error(`Sheet "${sheetName}" niet gevonden`);

  const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: null, header: 1 });
  if (rows.length === 0) throw new Error("Excel bestand is leeg");

  const header = rows[0] as any[];
  const periodColumns: Array<{ colIndex: number; period: string }> = [];
  for (let col = 1; col < header.length; col++) {
    const period = parsePeriodHeader(String(header[col] ?? ""));
    if (period) periodColumns.push({ colIndex: col, period });
  }
  console.log(`Periodekolommen gevonden: ${periodColumns.map((p) => p.period).join(", ")}`);

  const result: EloRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as any[];
    if (!row || row.length === 0) continue;

    const naamRaw = row[0];
    if (!naamRaw || String(naamRaw).trim() === "") continue;
    const naam = String(naamRaw).trim();

    const periods: Array<{ period: string; rating: number }> = [];
    for (const { colIndex, period } of periodColumns) {
      const value = row[colIndex];
      if (value == null || value === "") continue;
      const rating = Math.round(Number(value));
      if (!Number.isFinite(rating) || rating <= 0) continue;
      periods.push({ period, rating });
    }

    if (periods.length > 0) {
      result.push({ naam, periods });
    }
  }

  console.log(`Aantal spelers met minstens 1 geldige periode: ${result.length}`);
  return result;
}

/** Matcht "Voornaam Achternaam" (mogelijk meerdelig) tegen alle gebruikers. */
function findUserByFullName(
  fullName: string,
  users: Array<{ user_id: number; voornaam: string; achternaam: string }>,
): { user_id: number; voornaam: string; achternaam: string } | null {
  const normalized = fullName.trim().toLowerCase().replace(/\s+/g, " ");
  if (!normalized) return null;

  // Exact match op "voornaam achternaam" (achternaam mag meerdere woorden zijn)
  const exact = users.filter(
    (u) => `${u.voornaam} ${u.achternaam}`.trim().toLowerCase() === normalized,
  );
  if (exact.length === 1) return exact[0]!;
  if (exact.length > 1) {
    console.warn(`  ⚠️  Meerdere exacte matches voor "${fullName}", eerste gebruikt.`);
    return exact[0]!;
  }

  // Fallback: voornaam = eerste woord, achternaam = de rest
  const parts = normalized.split(" ");
  if (parts.length >= 2) {
    const voornaam = parts[0]!;
    const achternaam = parts.slice(1).join(" ");
    const loose = users.filter(
      (u) =>
        u.voornaam.trim().toLowerCase() === voornaam &&
        u.achternaam.trim().toLowerCase() === achternaam,
    );
    if (loose.length >= 1) return loose[0]!;
  }

  return null;
}

async function main() {
  console.log("=== Import ELIO Historiek ===\n");

  const excelData = readExcelRows();
  if (excelData.length === 0) {
    console.log("Geen data gevonden in Excel bestand!");
    return;
  }

  const users = await prisma.user.findMany({
    select: { user_id: true, voornaam: true, achternaam: true },
  });
  console.log(`Aantal gebruikers in database: ${users.length}\n`);

  const notFound: string[] = [];
  const writes: Array<{ op: "upsert"; user_id: number; period: string; rating: number }> = [];
  let matchedPlayers = 0;

  for (const { naam, periods } of excelData) {
    const user = findUserByFullName(naam, users);
    if (!user) {
      notFound.push(naam);
      console.warn(`⚠️  Speler niet gevonden: "${naam}"`);
      continue;
    }

    matchedPlayers++;
    console.log(`✓ ${naam} -> ${user.voornaam} ${user.achternaam} (ID: ${user.user_id}), ${periods.length} periodes`);
    for (const { period, rating } of periods) {
      writes.push({ op: "upsert", user_id: user.user_id, period, rating });
    }
  }

  console.log(`\n=== Samenvatting ===`);
  console.log(`Spelers in Excel: ${excelData.length}`);
  console.log(`Gematcht: ${matchedPlayers}`);
  console.log(`Niet gevonden: ${notFound.length}`);
  if (notFound.length > 0) {
    console.log(`\nNiet gevonden spelers (controleer spelling/naamvolgorde):`);
    notFound.forEach((naam) => console.log(`  - ${naam}`));
  }

  console.log(`\nWegschrijven van ${writes.length} rating-punten...`);
  let written = 0;
  for (const w of writes) {
    await prisma.eloHistory.upsert({
      where: { user_id_period: { user_id: w.user_id, period: w.period } },
      create: { user_id: w.user_id, period: w.period, rating: w.rating },
      update: { rating: w.rating },
    });
    written++;
    if (written % 100 === 0) console.log(`  ...${written}/${writes.length}`);
  }

  console.log(`✓ ${written} rating-punten opgeslagen.`);
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

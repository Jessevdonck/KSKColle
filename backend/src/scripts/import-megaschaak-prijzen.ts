/* scripts/import-megaschaak-prijzen.ts
 * Run: npx tsx src/scripts/import-megaschaak-prijzen.ts
 * 
 * Dit script leest het Excel bestand "Megaschaak 2026.xls" en update de megaschaak prijzen per speler.
 * - Kolom B bevat de volledige naam van de speler
 * - Kolom L bevat de megaschaak prijs
 * - Rij 1 is een header
 */

import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import * as path from "path";

const prisma = new PrismaClient();

/** === CONFIGURATIE === */
const EXCEL_PATH = path.resolve(process.cwd(), "src", "data", "Megaschaak 2026.xls");
const SHEET_NAME: string | undefined = undefined; // undefined = 1e sheet

// Kolom indices (0-based, maar XLSX gebruikt letter-based kolommen)
// Kolom B = index 1, Kolom L = index 11
const COL_NAAM = 1; // Kolom B
const COL_PRIJS = 11; // Kolom L

/**
 * Parse prijs uit Excel cel
 */
function parsePrijs(value: any): number | null {
  if (value == null || value === "") return null;
  
  // Probeer als nummer
  const num = Number(value);
  if (Number.isFinite(num) && num >= 0) {
    return Math.round(num);
  }
  
  // Probeer string te parsen (verwijder eventuele tekst)
  const str = String(value).replace(/[^\d.,]/g, '').replace(',', '.');
  const parsed = Number(str);
  if (Number.isFinite(parsed) && parsed >= 0) {
    return Math.round(parsed);
  }
  
  return null;
}

/**
 * Lees Excel bestand en haal rijen op
 */
function readExcelRows(): Array<{ naam: string; prijs: number }> {
  console.log(`Lezen van Excel bestand: ${EXCEL_PATH}`);
  
  const wb = XLSX.readFile(EXCEL_PATH, { cellDates: true, raw: false });
  const sheetName = SHEET_NAME ?? wb.SheetNames[0];
  
  if (!sheetName) {
    throw new Error("Geen sheet gevonden in Excel bestand");
  }
  
  const sheet = wb.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" niet gevonden`);
  }
  
  // Converteer naar JSON met array format (header op rij 1, data vanaf rij 2)
  const rows = XLSX.utils.sheet_to_json<any>(sheet, { 
    defval: null,
    header: 1 // Array format: [[col1, col2, ...], [col1, col2, ...], ...]
  });
  
  console.log(`Totaal aantal rijen gevonden: ${rows.length}`);
  
  const result: Array<{ naam: string; prijs: number }> = [];
  
  // Skip eerste rij (header), start vanaf rij 2 (index 1)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as any[];
    
    if (!row || row.length === 0) continue;
    
    // Haal naam uit kolom B (index 1)
    const naamRaw = row[COL_NAAM];
    if (!naamRaw || String(naamRaw).trim() === '') continue;
    
    // Haal prijs uit kolom L (index 11)
    const prijsRaw = row[COL_PRIJS];
    const prijs = parsePrijs(prijsRaw);
    
    if (prijs === null) {
      console.warn(`⚠️  Geen geldige prijs gevonden voor "${naamRaw}" op rij ${i + 1}, overslaan...`);
      continue;
    }
    
    result.push({
      naam: String(naamRaw).trim(),
      prijs
    });
  }
  
  console.log(`Aantal geldige rijen met naam en prijs: ${result.length}`);
  return result;
}

/**
 * Match speler naam met database gebruiker
 * Gebruikt alle deelnemers van het toernooi voor betere matching
 */
async function findUserByFullName(
  fullName: string, 
  tournamentParticipants: Array<{ user_id: number; voornaam: string; achternaam: string }>
): Promise<{ user_id: number; voornaam: string; achternaam: string } | null> {
  const trimmedName = fullName.trim();
  if (!trimmedName) return null;
  
  // Normaliseer de naam (verwijder extra spaties, etc.)
  const normalizedSearch = trimmedName.toLowerCase().replace(/\s+/g, ' ').trim();
  const nameParts = normalizedSearch.split(/\s+/).filter(p => p.length > 0);
  
  if (nameParts.length === 0) return null;
  
  // Als er maar 1 deel is, zoek alleen op achternaam
  if (nameParts.length === 1) {
    const searchTerm = nameParts[0]?.toLowerCase();
    if (!searchTerm) return null;
    const matches = tournamentParticipants.filter(u => 
      u.achternaam.toLowerCase() === searchTerm
    );
    return matches[0] ?? null;
  }
  
  // Probeer "Voornaam Achternaam" formaat (meest waarschijnlijk in Excel)
  const voornaamFirst = nameParts[0];
  if (!voornaamFirst) return null;
  const achternaamRest = nameParts.slice(1).join(' ');
  const voornaamFirstLower = voornaamFirst.toLowerCase();
  const achternaamRestLower = achternaamRest.toLowerCase();
  
  // Exact match: voornaam = eerste deel, achternaam = rest
  let matches = tournamentParticipants.filter(u => 
    u.voornaam.toLowerCase() === voornaamFirstLower &&
    u.achternaam.toLowerCase() === achternaamRestLower
  );
  
  if (matches.length > 0) return matches[0] ?? null;
  
  // Probeer "Achternaam Voornaam" formaat (Belgisch formaat)
  const achternaamFirst = nameParts[0];
  if (!achternaamFirst) return null;
  const voornaamRest = nameParts.slice(1).join(' ');
  const achternaamFirstLower = achternaamFirst.toLowerCase();
  const voornaamRestLower = voornaamRest.toLowerCase();
  
  matches = tournamentParticipants.filter(u => 
    u.achternaam.toLowerCase() === achternaamFirstLower &&
    u.voornaam.toLowerCase() === voornaamRestLower
  );
  
  if (matches.length > 0) return matches[0] ?? null;
  
  // Probeer met laatste deel als achternaam (voor namen met meerdere delen)
  const achternaamLast = nameParts[nameParts.length - 1];
  if (!achternaamLast) return null;
  const voornaamAllButLast = nameParts.slice(0, -1).join(' ');
  const achternaamLastLower = achternaamLast.toLowerCase();
  const voornaamAllButLastLower = voornaamAllButLast.toLowerCase();
  
  matches = tournamentParticipants.filter(u => 
    u.achternaam.toLowerCase() === achternaamLastLower &&
    u.voornaam.toLowerCase() === voornaamAllButLastLower
  );
  
  if (matches.length > 0) return matches[0] ?? null;
  
  // Minder strikte matching: contains (voor namen met speciale karakters of kleine verschillen)
  matches = tournamentParticipants.filter(u => {
    const uVoornaam = u.voornaam.toLowerCase();
    const uAchternaam = u.achternaam.toLowerCase();
    const uFullName = `${uVoornaam} ${uAchternaam}`;
    const searchFullName = normalizedSearch;
    
    // Check of de volledige naam (in beide richtingen) ongeveer overeenkomt
    const matchesForward = uFullName.includes(searchFullName) || searchFullName.includes(uFullName);
    const matchesReverse = `${uAchternaam} ${uVoornaam}`.includes(searchFullName) || 
                          searchFullName.includes(`${uAchternaam} ${uVoornaam}`);
    
    if (matchesForward || matchesReverse) return true;
    
    // Check of alle naamdelen voorkomen
    const allPartsMatch = nameParts.every(part => 
      uVoornaam.includes(part) || uAchternaam.includes(part)
    );
    
    if (!allPartsMatch) return false;
    
    // Check of voornaam en achternaam beide matchen (in beide richtingen)
    return (
      (uVoornaam.includes(voornaamFirstLower) && uAchternaam.includes(achternaamRestLower)) ||
      (uAchternaam.includes(achternaamFirstLower) && uVoornaam.includes(voornaamRestLower)) ||
      (uAchternaam.includes(achternaamLastLower) && uVoornaam.includes(voornaamAllButLastLower)) ||
      (uVoornaam.includes(achternaamLastLower) && uAchternaam.includes(voornaamAllButLastLower))
    );
  });
  
  if (matches.length > 0) return matches[0] ?? null;
  
  return null;
}

/**
 * Update megaschaak config met player costs
 */
async function updateMegaschaakConfigWithPlayerCosts(
  tournamentId: number,
  playerCosts: Record<number, number>
): Promise<void> {
  // Haal huidige config op
  const tournament = await prisma.tournament.findUnique({
    where: { tournament_id: tournamentId },
    select: { megaschaak_config: true, naam: true }
  });
  
  if (!tournament) {
    throw new Error(`Toernooi met ID ${tournamentId} niet gevonden`);
  }
  
  // Parse huidige config of gebruik default
  let config: any = tournament.megaschaak_config || {};
  
  // Zet playerCosts om naar object met string keys (JSON vereist string keys)
  // Maar behoud de oorspronkelijke structuur voor compatibiliteit
  const playerCostsWithStringKeys: Record<string, number> = {};
  for (const [userId, cost] of Object.entries(playerCosts)) {
    playerCostsWithStringKeys[String(userId)] = cost;
  }
  
  // Voeg playerCosts toe aan config (merge met bestaande als die er zijn)
  config.playerCosts = {
    ...(config.playerCosts || {}),
    ...playerCostsWithStringKeys
  };
  
  // Update alle toernooien met dezelfde naam (alle klasses)
  const allTournaments = await prisma.tournament.findMany({
    where: { naam: tournament.naam },
    select: { tournament_id: true }
  });
  
  await prisma.tournament.updateMany({
    where: {
      tournament_id: { in: allTournaments.map(t => t.tournament_id) }
    },
    data: {
      megaschaak_config: config as any
    }
  });
  
  console.log(`Config geüpdatet voor ${allTournaments.length} toernooi(en) met naam "${tournament.naam}"`);
}

/**
 * Hoofdfunctie
 */
async function main() {
  try {
    console.log("=== Import Megaschaak Prijzen ===\n");
    
    // Lees Excel bestand
    const excelData = readExcelRows();
    
    if (excelData.length === 0) {
      console.log("Geen data gevonden in Excel bestand!");
      return;
    }
    
    console.log(`\nVerwerken van ${excelData.length} spelers...\n`);
    
    // Vind actief megaschaak toernooi
    const activeTournament = await prisma.tournament.findFirst({
      where: {
        megaschaak_enabled: true,
        finished: false
      },
      select: {
        tournament_id: true,
        naam: true
      }
    });
    
    if (!activeTournament) {
      throw new Error("Geen actief megaschaak toernooi gevonden. Zorg ervoor dat er een toernooi is met megaschaak_enabled = true");
    }
    
    console.log(`Actief toernooi gevonden: "${activeTournament.naam}" (ID: ${activeTournament.tournament_id})\n`);
    
    // Haal alle deelnemers van het toernooi op (inclusief alle klasses met dezelfde naam)
    const allTournaments = await prisma.tournament.findMany({
      where: { naam: activeTournament.naam },
      select: { tournament_id: true }
    });
    
    const tournamentIds = allTournaments.map(t => t.tournament_id);
    
    const participations = await prisma.participation.findMany({
      where: { tournament_id: { in: tournamentIds } },
      include: {
        user: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true
          }
        }
      }
    });
    
    const tournamentParticipants = participations.map(p => ({
      user_id: p.user.user_id,
      voornaam: p.user.voornaam,
      achternaam: p.user.achternaam
    }));
    
    console.log(`Aantal deelnemers in toernooi: ${tournamentParticipants.length}\n`);
    
    // Match spelers en verzamel prijzen
    const playerCosts: Record<number, number> = {};
    const notFound: string[] = [];
    const matched: Array<{ naam: string; user_id: number; prijs: number }> = [];
    
    for (const { naam, prijs } of excelData) {
      const user = await findUserByFullName(naam, tournamentParticipants);
      
      if (!user) {
        notFound.push(naam);
        console.warn(`⚠️  Speler niet gevonden: "${naam}"`);
        continue;
      }
      
      playerCosts[user.user_id] = prijs;
      matched.push({
        naam: `${user.voornaam} ${user.achternaam}`,
        user_id: user.user_id,
        prijs
      });
      
      console.log(`✓ ${user.voornaam} ${user.achternaam} (ID: ${user.user_id}) -> Prijs: ${prijs}`);
    }
    
    console.log(`\n=== Samenvatting ===`);
    console.log(`Totaal verwerkt: ${excelData.length}`);
    console.log(`Gevonden: ${matched.length}`);
    console.log(`Niet gevonden: ${notFound.length}`);
    
    if (notFound.length > 0) {
      console.log(`\nNiet gevonden spelers:`);
      notFound.forEach(naam => console.log(`  - ${naam}`));
    }
    
    // Update megaschaak config
    if (matched.length > 0) {
      console.log(`\nUpdaten van megaschaak config...`);
      await updateMegaschaakConfigWithPlayerCosts(activeTournament.tournament_id, playerCosts);
      console.log(`✓ Config succesvol geüpdatet met ${matched.length} spelers!`);
      
      // Verifieer dat de config correct is opgeslagen
      const verifyTournament = await prisma.tournament.findUnique({
        where: { tournament_id: activeTournament.tournament_id },
        select: { megaschaak_config: true }
      });
      
      if (verifyTournament?.megaschaak_config) {
        const savedConfig = verifyTournament.megaschaak_config as any;
        const savedPlayerCosts = savedConfig.playerCosts || {};
        const savedCount = Object.keys(savedPlayerCosts).length;
        console.log(`✓ Verificatie: ${savedCount} prijzen opgeslagen in database`);
        
        // Toon eerste paar voorbeelden
        const examples = Object.entries(savedPlayerCosts).slice(0, 3);
        if (examples.length > 0) {
          console.log(`  Voorbeelden:`);
          examples.forEach(([userId, cost]) => {
            console.log(`    - User ID ${userId}: ${cost}`);
          });
        }
      }
    } else {
      console.log(`\n⚠️  Geen spelers gevonden om te updaten.`);
    }
    
  } catch (error) {
    console.error("Fout tijdens import:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run script
main()
  .then(() => {
    console.log("\n✓ Script succesvol afgerond!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Script gefaald:", error);
    process.exit(1);
  });


import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);
const prisma = new PrismaClient();

/** === 1) BESTAND & SHEET === */
const EXCEL_PATH = path.resolve(process.cwd(), "src", "data", "leden.xls");
const SHEET_NAME: string | undefined = undefined;

/** === 2) KOLOM-MAPPING === */
const COLS = {
  naam: "Naam",
  adres: "Adres",
  postcode: "Post",
  gemeente: "Gemeente",
  tel: "Telefoon",
  gsm: "GSM",
  geboortedatum: "Geb.Dat",
  geboortjaar: "Geb. Jaar",
  email: "E-mail",
  lid_sinds_jaar: "Start",
  rating: "ELIO",
} as const;

/** Staat "Naam" als "Achternaam Voornaam"? */
const NAME_IS_LASTNAME_THEN_FIRSTNAME = true;

/** Date input formats */
const DATE_INPUT_FORMATS = [
  "DD/MM/YYYY","D/M/YYYY","YYYY-MM-DD","DD-MM-YYYY","D-M-YYYY",
  "DD/MM/YYYY HH:mm","DD/MM/YYYY HH:mm:ss",
  "YYYY-MM-DD HH:mm","YYYY-MM-DD HH:mm:ss",
  "M/D/YYYY","MM/DD/YYYY","M/D/YYYY HH:mm:ss"
];

/** Helpers */
function parseIntSafe(v: any): number | null {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/[^\d-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseDateExcelOrString(v: any): Date | null {
  if (v == null || v === "") return null;
  
  if (typeof v === "number") {
    const excelEpoch = new Date(1900, 0, 1);
    const days = v - 2;
    return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
  }
  
  const s = String(v).trim();
  if (!s) return null;
  
  for (const fmt of DATE_INPUT_FORMATS) {
    const parsed = dayjs(s, fmt, true);
    if (parsed.isValid()) return parsed.toDate();
  }
  
  return null;
}

function splitName(fullName: any): { voornaam: string; achternaam: string } {
  const name = String(fullName ?? "").trim();
  if (!name) return { voornaam: "Unknown", achternaam: "Unknown" };
  
  const parts = name.split(/\s+/);
  if (parts.length === 1) return { voornaam: parts[0] || "", achternaam: "" };
  
  if (NAME_IS_LASTNAME_THEN_FIRSTNAME) {
    // Als er maar 2 delen zijn, neem het tweede deel als voornaam
    if (parts.length === 2) {
      return { voornaam: parts[1] || "", achternaam: parts[0] || "" };
    }
    // Als er meer delen zijn, neem het laatste deel als voornaam en de rest als achternaam
    return { voornaam: parts[parts.length - 1] || "", achternaam: parts.slice(0, -1).join(" ") || "" };
  } else {
    return { voornaam: parts[0] || "", achternaam: parts.slice(1).join(" ") || "" };
  }
}

function parseAddress(addr: any): { straat: string; nummer: string; bus: string } {
  const s = String(addr ?? "").trim();
  if (!s) return { straat: "", nummer: "", bus: "" };
  
  const match = s.match(/^(.+?)\s+(\d+[a-zA-Z]?)(?:\s*,\s*(.+))?$/);
  if (match) {
    return {
      straat: match[1]?.trim() || "",
      nummer: match[2]?.trim() || "",
      bus: match[3]?.trim() || ""
    };
  }
  
  return { straat: s, nummer: "", bus: "" };
}

/** Excel → raw rows */
function readRows(): any[] {
  const wb = XLSX.readFile(EXCEL_PATH, { cellDates: true, raw: false });
  const sheetName = SHEET_NAME ?? wb.SheetNames[0];
  if (!sheetName) throw new Error("Geen sheet gevonden");
  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw new Error("Sheet niet gevonden");
  return XLSX.utils.sheet_to_json<any>(sheet, { defval: null });
}

/** Excel raw → ValidRow */
function mapRaw(raw: any, rowIndex: number): any | null {
  // Parse name into first and last name
  const { voornaam, achternaam } = splitName(raw[COLS.naam]);

  const email = String(raw[COLS.email] ?? "").trim();
  if (!email) {
    console.warn(`Rij ${rowIndex + 2}: geen e-mail → overgeslagen.`);
    return null;
  }

  const gsm = String(raw[COLS.gsm] ?? "").trim();
  const tel = String(raw[COLS.tel] ?? "").trim();
  const tel_nummer = gsm || tel || "0000000000";
  const vast_nummer = tel || undefined;

  const dGeb = parseDateExcelOrString(raw[COLS.geboortedatum]);
  let geboortedatum = dGeb;
  if (!geboortedatum) {
    const jaar = parseIntSafe(raw[COLS.geboortjaar]);
    if (jaar) geboortedatum = new Date(Date.UTC(jaar, 0, 1));
  }
  if (!geboortedatum) geboortedatum = new Date(Date.UTC(1970, 0, 1));

  const sindsJaar = parseIntSafe(raw[COLS.lid_sinds_jaar]);
  const lid_sinds = sindsJaar ? new Date(Date.UTC(sindsJaar, 0, 1)) : new Date();

  const { straat, nummer, bus } = parseAddress(raw[COLS.adres]);
  const adres_postcode = String(raw[COLS.postcode] ?? "").trim() || undefined;
  const adres_gemeente = String(raw[COLS.gemeente] ?? "").trim() || undefined;

  const rating = parseIntSafe(raw[COLS.rating]);
  
  // Debug: toon rating parsing
  if (rating) {
    console.log(`📊 Rating gevonden voor ${email}: ${rating}`);
  }

  return {
    voornaam,
    achternaam,
    email,
    tel_nummer,
    vast_nummer,
    geboortedatum,
    lid_sinds,
    adres_straat: straat,
    adres_nummer: nummer,
    adres_bus: bus,
    adres_postcode,
    adres_gemeente,
    rating,
  };
}

/** Update existing user - only update fields that are different */
async function updateUser(row: any): Promise<{ updated: boolean; user: any }> {
  const existingUser = await prisma.user.findUnique({
    where: { email: row.email }
  });

  if (!existingUser) {
    console.log(`❌ Gebruiker niet gevonden: ${row.email} - overgeslagen`);
    return { updated: false, user: null };
  }

  const updates: any = {};
  let hasChanges = false;

  if (row.voornaam !== existingUser.voornaam) {
    updates.voornaam = row.voornaam;
    hasChanges = true;
  }
  
  if (row.achternaam !== existingUser.achternaam) {
    updates.achternaam = row.achternaam;
    hasChanges = true;
  }
  
  if (row.tel_nummer !== existingUser.tel_nummer) {
    updates.tel_nummer = row.tel_nummer;
    hasChanges = true;
  }
  
  if (row.vast_nummer !== existingUser.vast_nummer) {
    updates.vast_nummer = row.vast_nummer;
    hasChanges = true;
  }
  
  if (row.geboortedatum.getTime() !== existingUser.geboortedatum.getTime()) {
    updates.geboortedatum = row.geboortedatum;
    hasChanges = true;
  }
  
  if (row.lid_sinds.getTime() !== existingUser.lid_sinds.getTime()) {
    updates.lid_sinds = row.lid_sinds;
    hasChanges = true;
  }
  
  if (row.adres_straat !== existingUser.adres_straat) {
    updates.adres_straat = row.adres_straat;
    hasChanges = true;
  }
  
  if (row.adres_nummer !== existingUser.adres_nummer) {
    updates.adres_nummer = row.adres_nummer;
    hasChanges = true;
  }
  
  if (row.adres_bus !== existingUser.adres_bus) {
    updates.adres_bus = row.adres_bus;
    hasChanges = true;
  }
  
  if (row.adres_postcode !== existingUser.adres_postcode) {
    updates.adres_postcode = row.adres_postcode;
    hasChanges = true;
  }
  
  if (row.adres_gemeente !== existingUser.adres_gemeente) {
    updates.adres_gemeente = row.adres_gemeente;
    hasChanges = true;
  }
  
  if (row.rating && row.rating !== existingUser.schaakrating_elo) {
    console.log(`♟️  Rating update voor ${row.email}: ${existingUser.schaakrating_elo} → ${row.rating}`);
    updates.schaakrating_elo = row.rating;
    hasChanges = true;
  }

  if (!hasChanges) {
    console.log(`⏭️  Geen wijzigingen voor ${row.email} - overgeslagen`);
    return { updated: false, user: existingUser };
  }

  const updatedUser = await prisma.user.update({
    where: { user_id: existingUser.user_id },
    data: updates
  });

  console.log(`✅ Bijgewerkt: ${row.email} - ${Object.keys(updates).join(', ')}`);
  return { updated: true, user: updatedUser };
}

/** Main update function */
async function main() {
  console.log("🚀 Leden update gestart...");
  console.log(`📁 Lezen: ${EXCEL_PATH}`);
  
  try {
    const rows = readRows();
    let updated = 0, skipped = 0, notFound = 0, errors = 0;

    console.log(`📊 ${rows.length} rijen gevonden in Excel bestand`);

    for (let i = 0; i < rows.length; i++) {
      try {
        const mapped = mapRaw(rows[i], i);
        if (!mapped) { 
          skipped++; 
          continue; 
        }
        
        const result = await updateUser(mapped);
        if (result.updated) {
          updated++;
        } else if (result.user === null) {
          notFound++;
        } else {
          skipped++;
        }
        
        if (i % 25 === 0) console.log(`... rij ${i + 1} verwerkt`);
      } catch (e: any) {
        errors++;
        console.error(`❌ FOUT op rij ${i + 2}:`, e.message);
      }
    }

    console.log("\n🎉 Leden update voltooid:");
    console.log(`📊 Totaal verwerkt: ${rows.length}`);
    console.log(`✅ Bijgewerkt: ${updated}`);
    console.log(`⏭️  Geen wijzigingen: ${skipped}`);
    console.log(`❌ Niet gevonden: ${notFound}`);
    console.log(`💥 Fouten: ${errors}`);

  } catch (error) {
    console.error("💥 Fout bij het lezen van Excel bestand:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => { 
    console.error("💥 Onverwachte fout:", e); 
    process.exit(1); 
  });

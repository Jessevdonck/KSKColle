/* scripts/update-leden.ts
 * Run: npx ts-node scripts/update-leden.ts
 * 
 * Update bestaande leden uit leden.xls zonder wachtwoorden te wijzigen
 * 
 * Rollen mapping (vanuit Excel kolom "Rol"):
 * - "oud-lid" → rol: "exlid"
 * - "lid" → rol: "user" 
 * - "bestuurslid" → rollen: ["user", "bestuurslid"]
 * - "admin" → rollen: ["user", "admin"]
 * 
 * Speciale regels:
 * - jvaerendonck@gmail.com krijgt altijd admin rol (ook al staat er "lid")
 * - Jeugdleden (< 18 jaar) krijgen altijd rol "user" en is_youth = true
 * 
 * Update alleen velden die verschillen van de database
 */
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
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
  rol: "Rol",
} as const;

/** Staat "Naam" als "Achternaam Voornaam"? */
const NAME_IS_LASTNAME_THEN_FIRSTNAME = true;

/** Functie om rollen te bepalen op basis van Excel kolom "Rol" */
function determineRoles(rolRaw: any, email: string | undefined): string[] {
  const rol = String(rolRaw ?? "").trim().toLowerCase();
  
  // Specifieke admin uitzondering voor jvaerendonck@gmail.com
  if (email && email.toLowerCase() === "jvaerendonck@gmail.com") {
    return ["user", "admin"];
  }
  
  // Bepaal basis rol op basis van Excel kolom "Rol"
  let baseRole: string;
  switch (rol) {
    case "oud-lid":
      baseRole = "exlid";
      break;
    case "lid":
      baseRole = "user";
      break;
    case "bestuurslid":
      baseRole = "bestuurslid";
      break;
    case "admin":
      baseRole = "admin";
      break;
    case "jeugdlid":
      baseRole = "user"; // Jeugdleden krijgen altijd user rol
      break;
    default:
      // Default rol als kolom leeg is of onbekende waarde
      baseRole = "user";
  }
  
  // Voor admin en bestuurslid: voeg user rol toe
  if (baseRole === "admin") {
    return ["user", "admin"];
  } else if (baseRole === "bestuurslid") {
    return ["user", "bestuurslid"];
  } else {
    return [baseRole];
  }
}

/** Date input formats - DD-MM-YYYY is het hoofdfomat */
const DATE_INPUT_FORMATS = [
  "DD-MM-YYYY","D-M-YYYY","DD/MM/YYYY","D/M/YYYY","YYYY-MM-DD",
  "DD-MM-YYYY HH:mm","DD-MM-YYYY HH:mm:ss",
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

  // 1) Als het al een Date is (door cellDates:true) -> direct gebruiken
  if (v instanceof Date && !isNaN(v.getTime())) {
    return v;
  }

  // 2) Excel-serieel getal
  if (typeof v === "number") {
    // Excel 1900-system
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const ms = Math.round(v * 86400000);
    const d = new Date(excelEpoch.getTime() + ms);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }

  // 3) Strings (met en zonder tijd)
  const s = String(v).trim().replace(/\s+/g, " ");
  
  for (const fmt of DATE_INPUT_FORMATS) {
    const m = dayjs.utc(s, fmt, true);
    if (m.isValid()) {
      return m.toDate();
    }
  }

  // 4) Laatste poging: native parse
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d;
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

  // Email: nu optioneel, maar moet uniek zijn als aanwezig
  const email = String(raw[COLS.email] ?? "").trim() || undefined;

  const gsm = String(raw[COLS.gsm] ?? "").trim();
  const tel = String(raw[COLS.tel] ?? "").trim();
  const tel_nummer = gsm || tel || "0000000000";
  const vast_nummer = tel || undefined;

  // Geboortedatum uit "Geb.Dat" kolom (DD-MM-YYYY formaat)
  let geboortedatum: Date | null = null;
  
  if (raw[COLS.geboortedatum]) {
    geboortedatum = parseDateExcelOrString(raw[COLS.geboortedatum]);
  }
  
  // Fallback naar een realistische datum als parsing mislukt
  if (!geboortedatum) {
    geboortedatum = new Date(Date.UTC(1980, 5, 15)); // 15 juni 1980 als fallback
    console.warn(`Rij ${rowIndex + 2}: Geen geldige geboortedatum gevonden voor ${voornaam} ${achternaam} (${raw[COLS.geboortedatum]}) - gebruikt fallback datum`);
  }

  const sindsJaar = parseIntSafe(raw[COLS.lid_sinds_jaar]);
  const lid_sinds = sindsJaar ? new Date(Date.UTC(sindsJaar, 0, 1)) : new Date();

  const { straat, nummer, bus } = parseAddress(raw[COLS.adres]);
  const adres_postcode = String(raw[COLS.postcode] ?? "").trim() || undefined;
  const adres_gemeente = String(raw[COLS.gemeente] ?? "").trim() || undefined;

  const rating = parseIntSafe(raw[COLS.rating]);
  
  // Bepaal of jeugdlid op basis van Excel kolom "Rol"
  const rol = String(raw[COLS.rol] ?? "").trim().toLowerCase();
  const isYouth = rol === "jeugdlid";

  // Bepaal rollen op basis van Excel kolom "Rol"
  const roles = determineRoles(raw[COLS.rol], email);
  
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
    is_youth: isYouth,
    roles,
  };
}

/** Update existing user - only update fields that are different */
async function updateUser(row: any): Promise<{ updated: boolean; user: any }> {
  let existingUser;
  
  if (row.email) {
    // Gebruiker heeft email - zoek op email
    existingUser = await prisma.user.findUnique({
      where: { email: row.email }
    });
  } else {
    // Gebruiker heeft geen email - zoek op naam en geboortedatum
    existingUser = await prisma.user.findFirst({
      where: {
        voornaam: row.voornaam,
        achternaam: row.achternaam,
        geboortedatum: row.geboortedatum,
        email: null,
      },
    });
  }

  if (!existingUser) {
    const identifier = row.email || `${row.voornaam} ${row.achternaam}`;
    console.log(`❌ Gebruiker niet gevonden: ${identifier} - overgeslagen`);
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
  
  if (row.geboortedatum && existingUser.geboortedatum && row.geboortedatum.getTime() !== existingUser.geboortedatum.getTime()) {
    updates.geboortedatum = row.geboortedatum;
    hasChanges = true;
  } else if (row.geboortedatum && !existingUser.geboortedatum) {
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

  // Check roles update
  const currentRoles = existingUser.roles ? 
    (typeof existingUser.roles === 'string' ? JSON.parse(existingUser.roles) : existingUser.roles) : [];
  const rolesEqual = JSON.stringify(currentRoles.sort()) === JSON.stringify(row.roles.sort());
  if (!rolesEqual) {
    console.log(`👤 Rollen update voor ${row.email}: [${currentRoles.join(', ')}] → [${row.roles.join(', ')}]`);
    updates.roles = JSON.stringify(row.roles);
    hasChanges = true;
  }

  // Check is_youth update
  if (row.is_youth !== existingUser.is_youth) {
    console.log(`🧒 Jeugdlid status update voor ${row.email}: ${existingUser.is_youth} → ${row.is_youth}`);
    updates.is_youth = row.is_youth;
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
    let rolesUpdated = 0, youthStatusUpdated = 0;

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
          
          // Tel specifieke updates
          if (result.user && result.user.roles !== JSON.stringify(mapped.roles)) {
            rolesUpdated++;
          }
          if (result.user && result.user.is_youth !== mapped.is_youth) {
            youthStatusUpdated++;
          }
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
    console.log(`👤 Rollen updates: ${rolesUpdated}`);
    console.log(`🧒 Jeugdlid status updates: ${youthStatusUpdated}`);

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

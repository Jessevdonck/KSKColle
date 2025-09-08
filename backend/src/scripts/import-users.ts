/* scripts/import-users.ts
 * Run: npx ts-node scripts/import-users.ts
 */
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { z } from "zod";
import { hashPassword } from "../core/password";
import * as fs from "fs";
import * as path from "path";

dayjs.extend(utc);
dayjs.extend(customParseFormat);
const prisma = new PrismaClient();

/** === 1) BESTAND & SHEET === */
const EXCEL_PATH = path.resolve(process.cwd(), "src", "data", "leden.xls"); // of .xlsx
const SHEET_NAME: string | undefined = undefined; // undefined = 1e sheet

/** === 2) KOLOM-MAPPING (pas aan jouw headers) ===
 *  (volgens jouw screenshot)
 */
const COLS = {
  naam: "Naam",
  adres: "Adres",
  postcode: "Post",
  gemeente: "Gemeente",
  tel: "Telefoon",     // vast nummer
  gsm: "GSM",          // mobiel
  geboortedatum: "Geb.Dat",
  geboortjaar: "Geb. Jaar",  // fallback als Geb.-Dt leeg is
  email: "E-mail",
  lid_sinds_jaar: "Start",      // "Sinds": jaar
  // niet nodig: "Nr", "Opmerkingen", ...
} as const;

/** Staat “Naam” als "Achternaam Voornaam"? In jouw screenshot: ja. */
const NAME_IS_LASTNAME_THEN_FIRSTNAME = true;

/** Defaults */
const DEFAULT_ROLE_ARRAY = ["USER"];
const TEMP_PASSWORD_LENGTH = 10;
const DATE_INPUT_FORMATS = [
  "DD/MM/YYYY","D/M/YYYY","YYYY-MM-DD","DD-MM-YYYY","D-M-YYYY",
  "DD/MM/YYYY HH:mm","DD/MM/YYYY HH:mm:ss",
  "YYYY-MM-DD HH:mm","YYYY-MM-DD HH:mm:ss",
  "M/D/YYYY","MM/DD/YYYY","M/D/YYYY HH:mm:ss"
];


/** Helpers */
// function parseBool(v: any): boolean | null {
//   if (typeof v === "boolean") return v;
//   const s = String(v ?? "").trim().toLowerCase();
//   if (!s) return null;
//   if (["ja","yes","true","waar","1"].includes(s)) return true;
//   if (["nee","no","false","onwaar","0"].includes(s)) return false;
//   return null;
// }
function parseIntSafe(v: any): number | null {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/[^\d-]/g, ""));
  return Number.isFinite(n) ? n : null;
}
function parseDateExcelOrString(v: any): Date | null {
  if (v == null || v === "") return null;

  // 1) Als het al een Date is (door cellDates:true) -> direct gebruiken
  if (v instanceof Date && !isNaN(v.getTime())) return v;

  // 2) Excel-serieel getal
  if (typeof v === "number") {
    // Excel 1900-system
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const ms = Math.round(v * 86400000);
    const d = new Date(excelEpoch.getTime() + ms);
    return isNaN(d.getTime()) ? null : d;
  }

  // 3) Strings (met en zonder tijd)
  const s = String(v).trim().replace(/\s+/g, " ");
  for (const fmt of DATE_INPUT_FORMATS) {
    const m = dayjs.utc(s, fmt, true);
    if (m.isValid()) return m.toDate();
  }

  // 4) Laatste poging: native parse
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function randomPassword(len = TEMP_PASSWORD_LENGTH): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@$%?&";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random()*chars.length)]).join("");
}

/** Naam parsers */
function splitName(fullRaw: any): { voornaam: string; achternaam: string } {
  const full = String(fullRaw ?? "").trim().replace(/\s+/g, " ");
  if (!full) return { voornaam: "Onbekend", achternaam: "Onbekend" };

  if (full.includes(",")) {
    const [a, v] = full.split(",", 2).map(s => s.trim());
    return { voornaam: v || "Onbekend", achternaam: a || "Onbekend" };
  }

  const parts: string[] = full.split(" ").filter(Boolean);

  if (NAME_IS_LASTNAME_THEN_FIRSTNAME) {
    // "Achternaam Voornaam" -> laatste woord = voornaam
    if (parts.length === 1) return { voornaam: parts[0]!, achternaam: parts[0]! };
    const voornaam = parts.pop()!;                    // non-null assertion
    const achternaam = parts.join(" ").trim();
    return { voornaam, achternaam };
  } else {
    // "Voornaam Achternaam"
    if (parts.length === 1) return { voornaam: parts[0]!, achternaam: parts[0]! };
    const achternaam = parts.slice(1).join(" ").trim();
    const voornaam = parts[0]!;                       // non-null assertion
    return { voornaam, achternaam };
  }
}


/** Adres parser (straat + nummer + bus) */
function parseAddress(adresRaw: any): { straat?: string; nummer?: string; bus?: string } {
  const s = String(adresRaw ?? "").trim();
  if (!s) return {};

  const re = /^(.+?)\s+(\d+[A-Za-z]?)(?:\s*(?:bus|b|B|\/)\s*([A-Za-z0-9\-]+))?$/;
  const m = s.match(re);
  if (!m) return { straat: s };

  const straat = m[1]?.trim();
  const nummer = m[2]?.trim();
  const bus    = m[3]?.trim();

  // Belangrijk: voeg 'bus' alleen toe als er effectief een waarde is
  return {
    ...(straat ? { straat } : {}),
    ...(nummer ? { nummer } : {}),
    ...(bus ? { bus } : {}),
  };
}


/** Validatie van de gemapte rij (alleen wat we nodig hebben) */
const RowSchema = z.object({
  voornaam: z.string().min(1),
  achternaam: z.string().min(1),
  email: z.string().email(),
  tel_nummer: z.string().min(1),       // verplicht in jouw schema
  vast_nummer: z.string().optional(),
  geboortedatum: z.date().optional(),  // optional
  lid_sinds: z.date(),                 // required
  // Optioneel/extra
  adres_straat: z.string().optional(),
  adres_nummer: z.string().optional(),
  adres_bus: z.string().optional(),
  adres_postcode: z.string().optional(),
  adres_gemeente: z.string().optional(),
});
type ValidRow = z.infer<typeof RowSchema>;

/** Excel → raw rows */
function readRows(): any[] {
  const wb = XLSX.readFile(EXCEL_PATH, { cellDates: true, raw: false }); // <= belangrijk
  const sheetName = SHEET_NAME ?? wb.SheetNames[0];
  if (!sheetName) throw new Error("Geen sheet gevonden");
  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw new Error(`Sheet "${sheetName}" niet gevonden`);
  return XLSX.utils.sheet_to_json<any>(sheet, { defval: null });
}


/** Excel raw → ValidRow (map + schoonmaken) */
function mapRaw(raw: any, rowIndex: number): ValidRow | null {
  // Naam
  const { voornaam, achternaam } = splitName(raw[COLS.naam]);

  // Email: als ontbreekt of ongeldig → skip
  const email = String(raw[COLS.email] ?? "").trim();
  if (!email) {
    console.warn(`Rij ${rowIndex + 2}: geen e-mail → overgeslagen.`);
    return null;
  }

  // Telefoons
  const gsm = String(raw[COLS.gsm] ?? "").trim();
  const tel = String(raw[COLS.tel] ?? "").trim();
  const tel_nummer = gsm || tel || "0000000000"; // fallback zodat schema niet faalt
  const vast_nummer = tel || undefined;

  // Geboortedatum
  const dGeb = parseDateExcelOrString(raw[COLS.geboortedatum]);
  let geboortedatum = dGeb;
  if (!geboortedatum) {
    const jaar = parseIntSafe(raw[COLS.geboortjaar]);
    if (jaar) geboortedatum = new Date(Date.UTC(jaar, 0, 1)); // 1 jan
  }
  if (!geboortedatum) geboortedatum = new Date(Date.UTC(1970, 0, 1)); // last-resort default

  // Lid sinds (uit kolom "St" = jaar)
  const sindsJaar = parseIntSafe(raw[COLS.lid_sinds_jaar]);
  const lid_sinds = sindsJaar ? new Date(Date.UTC(sindsJaar, 0, 1)) : new Date();

  // Adres
  const { straat, nummer, bus } = parseAddress(raw[COLS.adres]);
  const adres_postcode = String(raw[COLS.postcode] ?? "").trim() || undefined;
  const adres_gemeente = String(raw[COLS.gemeente] ?? "").trim() || undefined;

  // Valideer + return
  const candidate = {
    voornaam,
    achternaam,
    email,
    tel_nummer,
    vast_nummer,
    geboortedatum: geboortedatum!,
    lid_sinds,
    adres_straat: straat,
    adres_nummer: nummer,
    adres_bus: bus,
    adres_postcode,
    adres_gemeente,
  };

  const parsed = RowSchema.safeParse(candidate);
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Rij ${rowIndex + 2}: ${msg}`);
  }
  return parsed.data;
}

/** Prisma upsert — let op: we "pushen" enkel velden die we nodig hebben */
async function upsertUser(row: ValidRow) {
  const plainPassword = randomPassword();
  const password_hash = await hashPassword(plainPassword);

  // Alleen velden toevoegen die (1) verplicht zijn of (2) effectief een waarde hebben.
  const data = {
    voornaam: row.voornaam,
    achternaam: row.achternaam,
    email: row.email,
    tel_nummer: row.tel_nummer,                 // verplicht
    ...(row.geboortedatum ? { geboortedatum: row.geboortedatum } : {}),
    lid_sinds: row.lid_sinds,                   // verplicht
    password_hash,                              // verplicht
    roles: DEFAULT_ROLE_ARRAY,                  // default
    // prisma default: schaakrating_elo = 0, adres_land = "Belgium"
    ...(row.vast_nummer ? { vast_nummer: row.vast_nummer } : {}),
    ...(row.adres_straat ? { adres_straat: row.adres_straat } : {}),
    ...(row.adres_nummer ? { adres_nummer: row.adres_nummer } : {}),
    ...(row.adres_bus ? { adres_bus: row.adres_bus } : {}),
    ...(row.adres_postcode ? { adres_postcode: row.adres_postcode } : {}),
    ...(row.adres_gemeente ? { adres_gemeente: row.adres_gemeente } : {}),
  } as const;

  const user = await prisma.user.upsert({
    where: { email: row.email },
    create: data,
    update: data, // als je enkel *nieuwe* users wil maken: zet update: {} en catch je prisma error
  });

  return { user, plainPassword };
}

/** Main */
async function main() {
  console.log("Lezen:", EXCEL_PATH);
  const rows = readRows();

  const creds: Array<{ email: string; password: string }> = [];
  let ok = 0, skip = 0, fail = 0;

  for (let i = 0; i < rows.length; i++) {
    try {
      const mapped = mapRaw(rows[i], i);
      if (!mapped) { skip++; continue; }
      const { user, plainPassword } = await upsertUser(mapped);
      creds.push({ email: user.email, password: plainPassword });
      ok++;
      if (i % 25 === 0) console.log(`... rij ${i + 1} verwerkt`);
    } catch (e: any) {
      fail++;
      console.error(`FOUT op rij ${i + 2}:`, e.message);
    }
  }

  // Tijdelijke wachtwoorden opslaan
  const out = path.resolve(process.cwd(), "data", "imported_user_passwords.csv");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, ["email,password", ...creds.map(c => `${c.email},${c.password}`)].join("\n"), "utf8");

  console.log(`Klaar. OK=${ok}, SKIP=${skip}, FAIL=${fail}`);
  console.log(`Tijdelijke wachtwoorden: ${out}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

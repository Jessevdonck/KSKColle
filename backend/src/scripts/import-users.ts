/* scripts/import-users.ts
 * Draai met: npx ts-node scripts/import-users.ts
 */
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { z } from "zod";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

dayjs.extend(utc);

const prisma = new PrismaClient();

/**
 * 1) PAS HIER JE BESTAND EN SHEETNAAM AAN
 */
const EXCEL_PATH = path.resolve(process.cwd(), "data/leden.xls");   // of leden.xlsx
const SHEET_NAME: string | undefined = undefined; // laat undefined als je de *eerste* sheet wil

/**
 * 2) KOPPEL HIER JE KOLONNEN
 * Zet hier exact de headers zoals ze in jouw Excel staan.
 * Voorbeeldnamen — pas ze aan jouw bestand aan.
 */
const COLS = {
  voornaam: "Voornaam",
  achternaam: "Achternaam",
  email: "E-mail",
  tel_nummer: "Telefoon",
  geboortedatum: "Geboortedatum",         // bv. "12/03/1998" of Excel datum
  schaakrating_elo: "ELO",
  schaakrating_difference: "ELO Δ",       // optioneel
  schaakrating_max: "ELO max",            // optioneel
  is_admin: "Is admin",                   // bv. "ja"/"nee" of TRUE/FALSE
  fide_id: "FIDE ID",                     // optioneel
  lid_sinds: "Lid sinds",                 // datum
  // Als je in Excel al een wachtwoordkolom hebt, zet die hieronder.
  // Anders genereren we een tijdelijk wachtwoord voor elke gebruiker.
  plain_password: undefined as string | undefined,
  // Als je rollen in Excel staan als JSON of komma-lijst, vul dat veld in:
  roles: undefined as string | undefined,
};

/**
 * 3) ALGEMENE DEFAULTS
 */
const DEFAULT_ROLE_ARRAY = ["USER"];
const TEMP_PASSWORD_LENGTH = 10;
const DATE_INPUT_FORMATS = [
  "DD/MM/YYYY",
  "D/M/YYYY",
  "YYYY-MM-DD",
  "DD-MM-YYYY",
  "D-M-YYYY",
];

/**
 * Helpers
 */
function parseBool(v: any): boolean | null {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["ja", "yes", "true", "waar", "1"].includes(s)) return true;
    if (["nee", "no", "false", "onwaar", "0", ""].includes(s)) return false;
  }
  return null;
}

function parseIntSafe(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^\d-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseDateExcelOrString(v: any): Date | null {
  if (v == null || v === "") return null;

  // 1) Excel serial numbers
  if (typeof v === "number") {
    // Excel's epoch: days since 1899-12-30
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const ms = v * 24 * 60 * 60 * 1000;
    const d = new Date(excelEpoch.getTime() + ms);
    return isNaN(d.getTime()) ? null : d;
  }

  // 2) Try known string formats
  if (typeof v === "string") {
    const s = v.trim();
    for (const fmt of DATE_INPUT_FORMATS) {
      const m = dayjs.utc(s, fmt, true);
      if (m.isValid()) return m.toDate();
    }
    // fallback: Date.parse
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

function randomPassword(len = TEMP_PASSWORD_LENGTH): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@$%?&";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

/**
 * 4) Validatie met Zod
 */
const UserRowSchema = z.object({
  voornaam: z.string().min(1),
  achternaam: z.string().min(1),
  email: z.string().email(),
  tel_nummer: z.string().min(3),
  geboortedatum: z.date(),
  schaakrating_elo: z.number().int().nonnegative().default(0),
  schaakrating_difference: z.number().int().nullable().optional(),
  schaakrating_max: z.number().int().nullable().optional(),
  is_admin: z.boolean().nullable().optional(),
  fide_id: z.number().int().nullable().optional(),
  lid_sinds: z.date(),
  // Als Excel geen wachtwoorden bevat, vullen we later een random in:
  plain_password: z.string().optional(),
  roles: z.array(z.string()).optional(), // als Excel rollen heeft
});

type UserRow = z.infer<typeof UserRowSchema>;

/**
 * 5) Lezen van Excel + mappen naar UserRow
 */
function readRowsFromExcel(): any[] {
  if (!fs.existsSync(EXCEL_PATH)) {
    throw new Error(`Bestand niet gevonden op: ${EXCEL_PATH}`);
  }
  const workbook = XLSX.readFile(EXCEL_PATH, { cellDates: false });
  const sheetName =
    SHEET_NAME ?? workbook.SheetNames[0] ?? (() => { throw new Error("Geen sheet gevonden"); })();

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Sheet "${sheetName}" niet gevonden`);

  // raw rows as objects (key: header)
  const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: null });
  return rows;
}

function mapRawToUserRow(raw: any, rowIndex: number): UserRow {
  const geboortedatum = parseDateExcelOrString(
    raw[COLS.geboortedatum as string]
  );
  const lid_sinds = parseDateExcelOrString(raw[COLS.lid_sinds as string]);

  const rolesInput = COLS.roles ? raw[COLS.roles] : undefined;
  let roles: string[] | undefined = undefined;
  if (rolesInput) {
    // probeer JSON, anders split op komma
    try {
      const parsed = JSON.parse(String(rolesInput));
      if (Array.isArray(parsed)) roles = parsed.map(String);
    } catch {
      roles = String(rolesInput)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  const obj = {
    voornaam: String(raw[COLS.voornaam]).trim(),
    achternaam: String(raw[COLS.achternaam]).trim(),
    email: String(raw[COLS.email]).trim(),
    tel_nummer: String(raw[COLS.tel_nummer]).trim(),
    geboortedatum: geboortedatum ?? new Date("1970-01-01"),
    schaakrating_elo: parseIntSafe(raw[COLS.schaakrating_elo]) ?? 0,
    schaakrating_difference: parseIntSafe(
      COLS.schaakrating_difference ? raw[COLS.schaakrating_difference] : null
    ),
    schaakrating_max: parseIntSafe(
      COLS.schaakrating_max ? raw[COLS.schaakrating_max] : null
    ),
    is_admin:
      COLS.is_admin != null
        ? parseBool(raw[COLS.is_admin]) ?? undefined
        : undefined,
    fide_id: parseIntSafe(COLS.fide_id ? raw[COLS.fide_id] : null),
    lid_sinds: lid_sinds ?? new Date("1970-01-01"),
    plain_password: COLS.plain_password
      ? (raw[COLS.plain_password] ? String(raw[COLS.plain_password]) : undefined)
      : undefined,
    roles,
  };

  const parsed = UserRowSchema.safeParse(obj);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Rij ${rowIndex + 2}: ${msg}`); // +2 omdat header = rij 1
  }
  return parsed.data;
}

/**
 * 6) Upsert naar DB (unique op email)
 * - password_hash wordt altijd gezet (van plain of random)
 * - roles: Excel → anders DEFAULT_ROLE_ARRAY
 */
async function upsertUser(row: UserRow) {
  const plainPassword = row.plain_password ?? randomPassword();
  const password_hash = await bcrypt.hash(plainPassword, 10);
  const rolesJson = JSON.stringify(row.roles ?? DEFAULT_ROLE_ARRAY);

  // Prisma modelvelden:
  // user_id (autoinc), voornaam, achternaam, email(unique), tel_nummer,
  // geboortedatum(DateTime), schaakrating_elo(Int), schaakrating_difference(Int?),
  // schaakrating_max(Int?), is_admin(Boolean?), fide_id(Int? unique),
  // lid_sinds(DateTime), password_hash(String), roles(Json)
  const data = {
    voornaam: row.voornaam,
    achternaam: row.achternaam,
    email: row.email,
    tel_nummer: row.tel_nummer,
    geboortedatum: row.geboortedatum,
    schaakrating_elo: row.schaakrating_elo,
    schaakrating_difference: row.schaakrating_difference ?? null,
    schaakrating_max: row.schaakrating_max ?? null,
    is_admin: row.is_admin ?? null,
    fide_id: row.fide_id ?? null,
    lid_sinds: row.lid_sinds,
    password_hash,
    roles: JSON.parse(rolesJson),
  } as const;

  const user = await prisma.user.upsert({
    where: { email: row.email },
    create: data,
    update: data,
  });

  return { user, plainPassword }; // we houden het plain pw bij om later een CSV te schrijven
}

/**
 * 7) Main flow
 */
async function main() {
  console.log("Excel lezen:", EXCEL_PATH);
  const rawRows = readRowsFromExcel();
  console.log(`Gevonden rijen (excl. header): ${rawRows.length}`);

  const tempCreds: Array<{ email: string; password: string }> = [];
  let ok = 0;
  let fails = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    try {
      const row = mapRawToUserRow(raw, i);
      const { user, plainPassword } = await upsertUser(row);
      tempCreds.push({ email: user.email, password: plainPassword });
      ok++;
      if (i % 25 === 0) console.log(`... verwerkt tot rij ${i + 1}`);
    } catch (e: any) {
      fails++;
      console.error(`FOUT bij rij ${i + 2}:`, e.message);
    }
  }

  // Exporteer tijdelijke wachtwoorden (alleen voor admin ogen!)
  const outPath = path.resolve(process.cwd(), "data", "imported_user_passwords.csv");
  const csv = ["email,password", ...tempCreds.map((c) => `${c.email},${c.password}`)].join("\n");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, csv, "utf8");

  console.log("Klaar.");
  console.log(`Succesvol: ${ok}, Fouten: ${fails}`);
  console.log(`Tijdelijke wachtwoorden: ${outPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

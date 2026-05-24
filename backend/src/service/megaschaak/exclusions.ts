import { prisma } from "../data";

/** Spelers die volledig afwezig zijn in megaschaak (buiten competitie, bv. Lode Van Landeghem) */
export function isExcludedFromMegaschaak(
  voornaam: string,
  achternaam: string,
): boolean {
  const v = (voornaam || "").trim().toLowerCase();
  const a = (achternaam || "").trim().toLowerCase();
  if (v === "piet" && a === "vermeiren") return true; // bestaande uitsluiting lentecompetitie
  if (isLodeVanLandeghem(voornaam, achternaam)) return true;
  return false;
}

/** Hardcoded: Lode Van Landeghem (lentecompetitie megaschaak-teamdetail). */
export function isLodeVanLandeghem(
  voornaam: string | null | undefined,
  achternaam: string | null | undefined,
): boolean {
  const v = (voornaam || "").trim().toLowerCase();
  const a = (achternaam || "").trim().toLowerCase();
  return v === "lode" && (a.includes("landeghem") || a.includes("van landeghem"));
}

export function isMegaschaakLentecompetitieNaam(
  naam: string,
  class_name?: string | null,
): boolean {
  const n = naam.toLowerCase();
  if (n.includes("lentecompetitie") || n.includes("lente competitie")) {
    return true;
  }
  return n.includes("lente") && (class_name ?? "").trim().length > 0;
}

export async function getLodeVanLandeghemUserId(): Promise<number | null> {
  const candidates = await prisma.user.findMany({
    where: {
      voornaam: { in: ["Lode", "LODE", "lode"] },
      OR: [
        { achternaam: { contains: "Landeghem" } },
        { achternaam: { contains: "landeghem" } },
      ],
    },
    select: { user_id: true, voornaam: true, achternaam: true },
  });
  for (const u of candidates) {
    if (isLodeVanLandeghem(u.voornaam, u.achternaam)) return u.user_id;
  }
  return null;
}

/**
 * Vaste user_id's die nooit in megaschaak-partijen mogen meetellen (naast DB-lookup op naam).
 * Vul aan met Lode Van Landeghem zodat het ook zonder brede user-query werkt.
 */
const MEGASCHAAT_EXCLUDED_FIXED_USER_IDS: readonly number[] = [];

let megaschaakExcludedUserIdsPromise: Promise<Set<number>> | null = null;

export async function getMegaschaakExcludedUserIds(): Promise<Set<number>> {
  if (!megaschaakExcludedUserIdsPromise) {
    megaschaakExcludedUserIdsPromise = (async () => {
      const ids = new Set<number>([...MEGASCHAAT_EXCLUDED_FIXED_USER_IDS]);
      const candidates = await prisma.user.findMany({
        where: {
          OR: [
            { voornaam: { in: ["Lode", "LODE", "lode", "Piet", "piet"] } },
            { achternaam: { contains: "Landeghem" } },
            { achternaam: { contains: "landeghem" } },
            { achternaam: { contains: "Vermeiren" } },
          ],
        },
        select: { user_id: true, voornaam: true, achternaam: true },
      });
      for (const u of candidates) {
        if (isExcludedFromMegaschaak(u.voornaam || "", u.achternaam || "")) {
          ids.add(u.user_id);
        }
      }
      return ids;
    })();
  }
  return megaschaakExcludedUserIdsPromise;
}

export function gameInvolvesMegaschaakExcludedPlayer(
  game: { speler1_id?: number | null; speler2_id?: number | null },
  excludedIds: Set<number>,
): boolean {
  const p1 = game.speler1_id;
  const p2 = game.speler2_id;
  if (p1 != null && excludedIds.has(p1)) return true;
  if (p2 != null && excludedIds.has(p2)) return true;
  return false;
}
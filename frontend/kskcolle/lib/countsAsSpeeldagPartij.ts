/**
 * Normaliseert uitslagen voor vergelijking (spaties, unicode-streepjes, hoofdletters).
 */
export function normalizeResultFlat(result: string | null | undefined): string {
  if (typeof result !== "string") return "";
  return result
    .trim()
    .replace(/\s+/g, "")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .toUpperCase();
}

/** Dubbel forfait / scheidsrechterlijke 0-0 (o.a. voor weergave). */
export function isDoubleForfeitOrRefereeResult(
  result: string | null | undefined,
): boolean {
  const flat = normalizeResultFlat(result);
  return flat === "0-0" || flat === "0-0R" || flat === "0-0FF";
}

/**
 * Uitslag met tegenstander die meetelt voor partijen én tie-break (SB, SB², Buchholz).
 * Wel: normale partijen, forfait (1-0R, 0-1FF, …) en 0-0. Niet: bye, absentie.
 */
export function isDecidedGameWithOpponentResult(
  result: string | null | undefined,
): boolean {
  const flat = normalizeResultFlat(result);
  if (!flat || flat === "NOT_PLAYED" || flat === "..." || flat === "UITGESTELD") {
    return false;
  }
  if (flat.startsWith("ABS") || flat === "0.5-0") return false;
  if (isDoubleForfeitOrRefereeResult(result)) return true;

  if (flat.startsWith("1-0") || flat.startsWith("0-1")) return true;
  return isDrawResult(result);
}

export function isDrawResult(result: string | null | undefined): boolean {
  const flat = normalizeResultFlat(result);
  return flat === "½-½" || flat === "1/2-1/2" || flat === "-";
}

/**
 * Kolom Partijen, megaschaak, profiel: besliste partij met tegenstander (incl. forfait).
 */
export function countsAsSpeeldagPartij(
  result: string | null | undefined,
  speler2_id: number | null | undefined,
): boolean {
  if (speler2_id == null) return false;
  return isDecidedGameWithOpponentResult(result);
}

export function isForfeitResult(result: string | null | undefined): boolean {
  if (isDoubleForfeitOrRefereeResult(result)) return true;
  const flat = normalizeResultFlat(result);
  if (!flat) return false;
  return flat.endsWith("R") || flat.includes("FF");
}

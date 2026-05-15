/**
 * Bepaalt of een partij meetelt als "gespeelde partij" (kolom Partijen, megaschaak, profiel).
 * Met tegenstander: normale partijen en forfait (winst/verlies) tellen mee; geen bye, absentie of 0-0.
 */
export function countsAsSpeeldagPartij(
  result: string | null | undefined,
  speler2_id: number | null | undefined,
): boolean {
  if (speler2_id == null) return false;

  const r = typeof result === "string" ? result.trim() : "";
  if (!r || r === "not_played" || r === "..." || r === "uitgesteld") return false;
  if (r.startsWith("ABS-")) return false;
  if (r === "0.5-0") return false;

  const flat = r.replace(/\s+/g, "").toUpperCase();
  if (flat === "0-0" || flat === "0-0R" || flat === "0-0FF") return false;

  if (r.startsWith("1-0") || r.startsWith("0-1")) return true;
  return r === "½-½" || r === "1/2-1/2" || r === "-";
}

export function isForfeitResult(result: string | null | undefined): boolean {
  const r = typeof result === "string" ? result.trim() : "";
  if (!r) return false;
  const flat = r.replace(/\s+/g, "").toUpperCase();
  if (flat === "0-0" || flat === "0-0R" || flat === "0-0FF") return true;
  return flat.endsWith("R") || flat.includes("FF");
}

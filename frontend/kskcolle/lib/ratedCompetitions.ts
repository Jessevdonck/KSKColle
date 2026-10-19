/**
 * Enkel de herfst- en lentecompetitie tellen voor de clubrating (ELIO).
 * Zelfde regel als in de backend (backend/src/core/ratedCompetitions.ts).
 */
export function countsForElio(naam: string, className?: string | null): boolean {
  const n = naam.toLowerCase()
  if (n.includes("herfst")) return true
  if (n.includes("lentecompetitie") || n.includes("lente competitie")) return true
  if (n.includes("lente") && (className ?? "").trim().length > 0) return true
  return false
}

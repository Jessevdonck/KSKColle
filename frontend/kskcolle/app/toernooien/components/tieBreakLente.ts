/**
 * Lentecompetitie (Sevilla): scheiding = SB² (som van PT_tegenstander² per gewonnen partij, enz.)
 * Toernooien worden vaak als type SWISS geïmporteerd maar horen deze tie-break.
 *
 * Detectie: naam bevat "lentecompetitie", of "lente" + een afdeling (class_name), zoals "Eerste klasse".
 */
export function isLentecompetitieTieBreak(tournament: {
  naam: string
  class_name?: string | null
}): boolean {
  const n = tournament.naam.toLowerCase()
  if (n.includes("lentecompetitie") || n.includes("lente competitie")) return true
  if (n.includes("lente") && (tournament.class_name ?? "").trim().length > 0) return true
  return false
}

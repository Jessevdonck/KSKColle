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

/**
 * Blitz/snelschaak: round robin met klassieke SB, niet Buchholz.
 * Vaak als SWISS geïmporteerd; DB tie_break kan dan nog Bh-W zijn.
 */
export function isBlitzkampioenschapTieBreak(tournament: { naam: string }): boolean {
  const n = tournament.naam.toLowerCase()
  return (
    n.includes("blitz") ||
    n.includes("snel") ||
    n.includes("snelschaak") ||
    n.includes("blitzkampioenschap")
  )
}

export function usesBuchholzWorstTieBreak(tournament: {
  naam: string
  class_name?: string | null
  type: "SWISS" | "ROUND_ROBIN"
}): boolean {
  return (
    tournament.type === "SWISS" &&
    !isLentecompetitieTieBreak(tournament) &&
    !isBlitzkampioenschapTieBreak(tournament)
  )
}

export function getTieBreakColumnLabel(tournament: {
  naam: string
  class_name?: string | null
  type: "SWISS" | "ROUND_ROBIN"
}): string {
  if (isLentecompetitieTieBreak(tournament)) return "SB²"
  if (usesBuchholzWorstTieBreak(tournament)) return "Bhlz-W"
  return "SB"
}

/** Dubbel round robin: SB telt elke partij tegen hetzelfde koppel (niet één keer per koppel). */
export function countsEveryPairMeetingForTieBreak(tournament: {
  naam: string
  class_name?: string | null
  type: "SWISS" | "ROUND_ROBIN"
}): boolean {
  return (
    tournament.type === "ROUND_ROBIN" ||
    isLentecompetitieTieBreak(tournament) ||
    isBlitzkampioenschapTieBreak(tournament)
  )
}

/** Lode Van Landeghem: uitslagen tellen niet mee (alleen lentecompetitie seizoen 2026). */
export function isLodeVanLandeghem(voornaam: string, achternaam: string): boolean {
  const v = (voornaam || "").trim().toLowerCase()
  const a = (achternaam || "").trim().toLowerCase()
  return v === "lode" && (a.includes("landeghem") || a.includes("van landeghem"))
}

/**
 * Regel "buiten competitie" voor Lode: enkel lentecompetitie 2026 (niet blitz/herfst/archief).
 */
export function isLodeBuitenCompetitieLente2026(tournament: {
  naam: string
  class_name?: string | null
}): boolean {
  if (!isLentecompetitieTieBreak(tournament)) return false
  const n = tournament.naam.toLowerCase()
  const yearMatch = n.match(/\b(20\d{2})\b/)
  if (yearMatch) return yearMatch[1] === "2026"
  return true
}

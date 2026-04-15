/**
 * Actieve uitstel-status: er is een geldige uitgestelde_datum (API kan string/Date leveren).
 * Ruimte-only strings en ongeldige datums tellen niet mee (voorkomt spook-"Uitgesteld").
 */
export function hasActivePostpone(uitgestelde_datum: unknown): boolean {
  if (uitgestelde_datum == null || uitgestelde_datum === "") return false
  if (typeof uitgestelde_datum === "string") {
    const t = uitgestelde_datum.trim()
    if (!t) return false
    const d = new Date(t)
    if (Number.isNaN(d.getTime())) return false
    return true
  }
  if (uitgestelde_datum instanceof Date) {
    if (Number.isNaN(uitgestelde_datum.getTime())) return false
    return true
  }
  // Geen geldige datum — geen "actief uitstel" (voorkomt truthy JSON-ruis: [], {}, nummers, …)
  return false
}

/**
 * Zonder actieve uitsteldatum is `result: "uitgesteld"` een achtergebleven waarde en geen echte uitslag.
 * Dan behandelen we het als "nog geen resultaat" (zelfde als open partij / ...).
 */
export function normalizedResultForDisplay(
  result: string | null | undefined,
  uitgestelde_datum: unknown,
): string | null {
  if (hasActivePostpone(uitgestelde_datum)) {
    return result ?? null
  }
  if (!result || result === "uitgesteld") return null
  return result
}

function isPlaceholderUitslag(r: string): boolean {
  const t = r.trim().toLowerCase()
  return t === "uitgesteld" || t === "not_played" || t === "..."
}

/** Echte uitslag voor styling (groen) — geen open partij en geen statuswoord "uitgesteld". */
export function hasConcretePairingResult(
  result: string | null | undefined,
  uitgestelde_datum: unknown,
): boolean {
  const r = normalizedResultForDisplay(result, uitgestelde_datum)
  if (!r || isPlaceholderUitslag(r)) return false
  return true
}

const BADGE_PLAYED =
  "bg-green-100 text-green-800 border border-green-200"
const BADGE_POSTPONED =
  "bg-amber-100 text-amber-800 border border-amber-200"
const BADGE_OPEN = "bg-gray-100 text-gray-600 border border-gray-200"

/** Badge: eerst echte uitslag (groen), dan pas uitgesteld (amber). */
export function pairingResultBadgeClass(
  result: string | null | undefined,
  uitgestelde_datum: unknown,
): string {
  if (hasConcretePairingResult(result, uitgestelde_datum)) return BADGE_PLAYED
  if (hasActivePostpone(uitgestelde_datum)) return BADGE_POSTPONED
  return BADGE_OPEN
}

/**
 * Celtekst: eerst echte uitslag tonen ook als uitgestelde_datum per ongeluk nog staat.
 * @param emptyLabel bijv. "..." of "Nog te spelen"
 */
export function pairingResultBadgeText(
  result: string | null | undefined,
  uitgestelde_datum: unknown,
  emptyLabel: string = "...",
): string {
  if (hasConcretePairingResult(result, uitgestelde_datum)) {
    return normalizedResultForDisplay(result, uitgestelde_datum) ?? emptyLabel
  }
  if (hasActivePostpone(uitgestelde_datum)) return "Uitgesteld"
  return normalizedResultForDisplay(result, uitgestelde_datum) ?? emptyLabel
}

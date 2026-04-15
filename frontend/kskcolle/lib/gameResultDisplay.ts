/**
 * Actieve uitstel-status: er is een uitgestelde_datum (API kan string/Date leveren).
 */
export function hasActivePostpone(uitgestelde_datum: unknown): boolean {
  if (uitgestelde_datum == null || uitgestelde_datum === "") return false
  return true
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

/** Echte uitslag voor styling (groen) — sluit open/not_played/.../legacy uitgesteld uit. */
export function hasConcretePairingResult(
  result: string | null | undefined,
  uitgestelde_datum: unknown,
): boolean {
  const r = normalizedResultForDisplay(result, uitgestelde_datum)
  if (!r || r === "not_played" || r === "...") return false
  return true
}

// Regels om Sevilla-exports van het jeugdkampioenschap te herkennen.
//
// Het jeugdkampioenschap bestaat uit meerdere reeksen ("Stap 1", "Stap 2", "Stap 3+")
// die in aparte Sevilla-bestanden kunnen zitten, elk met een eigen paringssysteem
// (Stap 1 en 2 round robin, Stap 3+ Zwitsers) en soms een iets andere toernooinaam
// ("Jeugdcompetitie 2026-2027 Stap 1 en 2" vs. "Jeugdkampioenschap 2026-2027").
// Op de website horen ze samen als tabbladen van één toernooi.

export type SevillaTournamentType = 'SWISS' | 'ROUND_ROBIN'

const SEASON_PATTERN = /(\d{4})\s*-\s*(\d{4})/

export const isYouthTournamentName = (name: string): boolean => name.toLowerCase().includes('jeugd')

/** Is dit de naam van een jeugdreeks, bv. "Stap 3+", "Stap 1", "stap 1 & 2"? */
export const isYouthClassName = (groupName: string | null | undefined): boolean =>
  !!groupName && /\bstap\b/i.test(groupName)

/** Seizoen in vaste vorm ("2026-2027"), of null als de naam geen seizoen bevat. */
export const seasonOf = (name: string): string | null => {
  const match = name.match(SEASON_PATTERN)
  return match ? `${match[1]}-${match[2]}` : null
}

/** Toernooinaam zonder reeksaanduiding: "Jeugdcompetitie 2026-2027 Stap 1 en 2" -> "Jeugdcompetitie 2026-2027". */
export const stripYouthClassSuffix = (name: string): string =>
  name.replace(/[\s\-–(]*\bstap\b.*$/i, '').trim() || name.trim()

/**
 * Naam waaronder een jeugdbestand wordt opgeslagen. Bestaat er al een actief
 * jeugdtoernooi uit hetzelfde seizoen, dan wordt diens naam gebruikt, zodat alle
 * reeksen bij hetzelfde toernooi (dezelfde tabbladen) horen.
 */
export const resolveYouthTournamentName = (fileName: string, activeYouthNames: string[]): string => {
  const season = seasonOf(fileName)
  if (season) {
    const sameSeason = activeYouthNames.find((name) => seasonOf(name) === season)
    if (sameSeason) return sameSeason
  }
  return stripYouthClassSuffix(fileName)
}

/** Paringssysteem uit de Sevilla-export; zonder vermelding is het Zwitsers. */
export const tournamentTypeFromSevilla = (data: { CompData?: { PairingSyst?: string } }): SevillaTournamentType =>
  /round\s*robin/i.test(data.CompData?.PairingSyst ?? '') ? 'ROUND_ROBIN' : 'SWISS'

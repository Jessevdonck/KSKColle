import { isDrawResult, isForfeitResult, normalizeResultFlat } from "./countsAsSpeeldagPartij"

/** Verwachte score van een speler met rating `rating` tegen `opponentRating` (Elo-formule). */
export const expectedScore = (rating: number, opponentRating: number): number =>
  1 / (1 + Math.pow(10, (opponentRating - rating) / 400))

/** Beide spelers hebben een rating, anders is een voorspelling zinloos. */
export const hasRatings = (a: number | null | undefined, b: number | null | undefined): a is number =>
  (a ?? 0) > 0 && (b ?? 0) > 0

/**
 * Score van wit uit een effectief gespeelde partij (1, ½ of 0).
 * Forfaits, niet-gespeelde remises (…R), byes en nog niet gespeelde partijen: null,
 * want die tellen niet voor de rating.
 */
export const whiteScoreOfPlayedGame = (result: string | null | undefined): number | null => {
  if (!result || isForfeitResult(result)) return null
  const flat = normalizeResultFlat(result)
  if (flat.startsWith("1-0")) return 1
  if (flat.startsWith("0-1")) return 0
  if (isDrawResult(result)) return 0.5
  return null
}

// FIDE-tabel: scorepercentage (afgerond op 0,01) → ratingverschil dp
const DP_TABLE: Record<number, number> = {
  100: 800, 99: 677, 98: 589, 97: 538, 96: 501, 95: 470, 94: 444, 93: 422, 92: 401, 91: 383,
  90: 366, 89: 351, 88: 336, 87: 322, 86: 309, 85: 296, 84: 284, 83: 273, 82: 262, 81: 251,
  80: 240, 79: 230, 78: 220, 77: 211, 76: 202, 75: 193, 74: 184, 73: 175, 72: 166, 71: 158,
  70: 149, 69: 141, 68: 133, 67: 125, 66: 117, 65: 110, 64: 102, 63: 95, 62: 87, 61: 80,
  60: 72, 59: 65, 58: 57, 57: 50, 56: 43, 55: 36, 54: 29, 53: 21, 52: 14, 51: 7, 50: 0,
}

/**
 * Prestatierating (FIDE): gemiddelde rating van de tegenstanders + dp(scorepercentage).
 * Null zonder partijen tegen gerate tegenstanders.
 */
export const performanceRating = (opponentRatings: number[], score: number): number | null => {
  if (opponentRatings.length === 0) return null
  const average = opponentRatings.reduce((sum, r) => sum + r, 0) / opponentRatings.length
  const pct = Math.round((score / opponentRatings.length) * 100)
  const dp = pct >= 50 ? DP_TABLE[pct] : -DP_TABLE[100 - pct]
  return Math.round(average + (dp ?? 0))
}

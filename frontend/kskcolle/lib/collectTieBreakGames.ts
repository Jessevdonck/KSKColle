import { normalizedResultForDisplay } from "@/lib/gameResultDisplay"

type TieBreakGameRow = {
  p1: number
  p2: number
  result: string
  isMakeup: boolean
  gameId: number
  hasOriginalLink: boolean
}

function pairKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`
}

function sortTieBreakRows(a: TieBreakGameRow, b: TieBreakGameRow): number {
  if (a.isMakeup !== b.isMakeup) return a.isMakeup ? -1 : 1
  if (a.hasOriginalLink !== b.hasOriginalLink) return a.hasOriginalLink ? -1 : 1
  return b.gameId - a.gameId
}

export type TieBreakRoundInput = {
  type: "REGULAR" | "MAKEUP"
  games: Array<{
    game_id: number
    original_game_id?: number | null
    speler1: { user_id: number }
    speler2: { user_id: number } | null
    result: string | null
    uitgestelde_datum?: string | null
  }>
}

/**
 * Partijen voor tie-break (SB, SB², Buchholz).
 * - Swiss: één partij per koppel (inhaaldag vervangt uitgestelde).
 * - Dubbel round robin (blitz/lente/RR): elke ontmoeting telt, behalve uitstel-dubbel.
 */
export function collectTieBreakGames(
  rounds: TieBreakRoundInput[],
  isPlayedGame: (r: string | null) => boolean,
  countEveryPairMeeting: boolean,
): Array<{ p1: number; p2: number; result: string }> {
  const rows: TieBreakGameRow[] = []
  for (const round of rounds) {
    const isMakeup = round.type === "MAKEUP"
    for (const g of round.games) {
      const p2 = g.speler2?.user_id
      if (p2 == null) continue
      const res = normalizedResultForDisplay(g.result, g.uitgestelde_datum)
      if (!isPlayedGame(res)) continue
      rows.push({
        p1: g.speler1.user_id,
        p2,
        result: res!,
        isMakeup,
        gameId: g.game_id,
        hasOriginalLink: g.original_game_id != null && g.original_game_id > 0,
      })
    }
  }

  if (!countEveryPairMeeting) {
    rows.sort(sortTieBreakRows)
    const seen = new Set<string>()
    const out: Array<{ p1: number; p2: number; result: string }> = []
    for (const r of rows) {
      const k = pairKey(r.p1, r.p2)
      if (seen.has(k)) continue
      seen.add(k)
      out.push({ p1: r.p1, p2: r.p2, result: r.result })
    }
    return out
  }

  const byPair = new Map<string, TieBreakGameRow[]>()
  for (const r of rows) {
    const k = pairKey(r.p1, r.p2)
    const list = byPair.get(k) ?? []
    list.push(r)
    byPair.set(k, list)
  }

  const out: Array<{ p1: number; p2: number; result: string }> = []
  for (const group of byPair.values()) {
    const isPostponedDuplicate =
      group.length > 1 &&
      group.some((r) => r.isMakeup || r.hasOriginalLink)
    if (isPostponedDuplicate) {
      const sorted = [...group].sort(sortTieBreakRows)
      out.push({
        p1: sorted[0].p1,
        p2: sorted[0].p2,
        result: sorted[0].result,
      })
    } else {
      for (const r of group) {
        out.push({ p1: r.p1, p2: r.p2, result: r.result })
      }
    }
  }
  return out
}

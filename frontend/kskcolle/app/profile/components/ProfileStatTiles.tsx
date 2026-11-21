"use client"

import { useMemo } from "react"
import type { GameWithRoundAndTournament } from "@/data/types"
import { normalizedResultForDisplay } from "@/lib/gameResultDisplay"
import { countsAsSpeeldagPartij, isDrawResult, normalizeResultFlat } from "@/lib/countsAsSpeeldagPartij"
import PlayerHighlights from "./PlayerHighlights"

/**
 * Statistieken als tegels onder elkaar (zijkolom op het profiel): partijen, winsten,
 * verliezen, winstpercentage en de hoogtepunten (wit/zwart, prestatierating, …).
 */
export default function ProfileStatTiles({ games, playerId }: { games: GameWithRoundAndTournament[]; playerId: number }) {
  const s = useMemo(() => {
    let wins = 0, losses = 0, draws = 0
    for (const g of games) {
      const result = normalizedResultForDisplay(g.result ?? null, g.uitgestelde_datum)
      if (!countsAsSpeeldagPartij(result, g.speler2_id)) continue
      const flat = normalizeResultFlat(result)
      const isWhite = g.speler1_id === playerId
      if (isDrawResult(result)) draws++
      else if (flat.startsWith("1-0") || flat.startsWith("0-1")) {
        const whiteWon = flat.startsWith("1-0")
        if (whiteWon === isWhite) wins++
        else losses++
      }
    }
    const total = wins + losses + draws
    return { wins, losses, draws, total, winPct: total ? Math.round((wins / total) * 100) : 0 }
  }, [games, playerId])

  if (s.total === 0) {
    return (
      <div className="rounded border border-border/50 bg-white px-3 py-2 text-sm text-muted-foreground">
        Geen gespeelde partijen in deze periode.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
        <Kpi label="Partijen" value={s.total} />
        <Kpi label="Winsten" value={s.wins} className="text-green-600" />
        <Kpi label="Verliezen" value={s.losses} className="text-red-600" />
        <Kpi label="Winst %" value={`${s.winPct}%`} className="text-mainAccent" />
      </div>
      <PlayerHighlights games={games} playerId={playerId} stacked />
    </div>
  )
}

function Kpi({ label, value, className = "text-textColor" }: { label: string; value: number | string; className?: string }) {
  return (
    <div className="rounded border border-border/50 bg-muted/20 px-2.5 py-1.5">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold tabular-nums ${className}`}>{value}</div>
    </div>
  )
}

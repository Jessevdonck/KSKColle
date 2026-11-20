"use client"

import { useMemo, useState } from "react"
import { Swords } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { GameWithRoundAndTournament } from "@/data/types"
import { normalizedResultForDisplay } from "@/lib/gameResultDisplay"
import { countsAsSpeeldagPartij, isDrawResult, normalizeResultFlat } from "@/lib/countsAsSpeeldagPartij"
import { GameCard } from "./GameCard"
import { ListPager, usePaged } from "./ListPager"

type Opponent = { id: number; name: string; games: GameWithRoundAndTournament[] }

/** Score van de profielspeler in een beslist resultaat (forfait inbegrepen), anders null. */
const scoreFor = (game: GameWithRoundAndTournament, playerId: number): number | null => {
  const result = normalizedResultForDisplay(game.result ?? null, game.uitgestelde_datum)
  if (!countsAsSpeeldagPartij(result, game.speler2_id)) return null
  const flat = normalizeResultFlat(result)
  const isWhite = game.speler1_id === playerId
  if (flat.startsWith("1-0")) return isWhite ? 1 : 0
  if (flat.startsWith("0-1")) return isWhite ? 0 : 1
  if (isDrawResult(result)) return 0.5
  return 0 // dubbel forfait
}

/** Onderlinge resultaten van de profielspeler tegen een gekozen tegenstander. */
export default function HeadToHead({ games, playerId }: { games: GameWithRoundAndTournament[]; playerId: number }) {
  const opponents = useMemo(() => {
    const byId = new Map<number, Opponent>()
    for (const game of games) {
      if (game.speler2_id == null || scoreFor(game, playerId) === null) continue
      const isWhite = game.speler1_id === playerId
      const id = isWhite ? game.speler2_id : game.speler1_id
      const name = (isWhite ? game.speler2_naam : game.speler1_naam) ?? "Onbekend"
      const entry = byId.get(id) ?? { id, name, games: [] }
      entry.games.push(game)
      byId.set(id, entry)
    }
    // Vaakst gespeelde tegenstanders eerst, dan alfabetisch
    return [...byId.values()].sort((a, b) => b.games.length - a.games.length || a.name.localeCompare(b.name, "nl"))
  }, [games, playerId])

  const [selectedId, setSelectedId] = useState<string>("")
  const selected = opponents.find((o) => String(o.id) === selectedId) ?? opponents[0]

  const summary = useMemo(() => {
    if (!selected) return null
    let wins = 0, draws = 0, losses = 0
    for (const game of selected.games) {
      const s = scoreFor(game, playerId)
      if (s === 1) wins++
      else if (s === 0.5) draws++
      else if (s === 0) losses++
    }
    const sortedGames = [...selected.games].sort(
      (a, b) => new Date(b.round?.ronde_datum ?? 0).getTime() - new Date(a.round?.ronde_datum ?? 0).getTime(),
    )
    return { wins, draws, losses, score: wins + draws / 2, total: wins + draws + losses, sortedGames }
  }, [selected, playerId])

  // 5 partijen per pagina; terug naar pagina 1 bij een andere tegenstander
  const paged = usePaged(summary?.sortedGames ?? [], undefined, selected?.id)

  if (opponents.length === 0 || !selected || !summary) return null

  return (
    <Card className="w-full border border-border/50">
      <CardHeader className="py-3 px-4">
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
          <Swords className="h-4 w-4 text-mainAccent" />
          Onderlinge resultaten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 pt-0">
        <Select value={String(selected.id)} onValueChange={setSelectedId}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {opponents.map((o) => (
              <SelectItem key={o.id} value={String(o.id)}>
                {o.name} ({o.games.length})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-4 gap-2 text-center">
          <Stat label="Winst" value={summary.wins} className="text-green-600" />
          <Stat label="Remise" value={summary.draws} className="text-purple-600" />
          <Stat label="Verlies" value={summary.losses} className="text-red-600" />
          <Stat
            label="Score"
            value={`${Number.isInteger(summary.score) ? summary.score : summary.score.toFixed(1).replace(".", ",")}/${summary.total}`}
            className="text-mainAccent"
          />
        </div>

        <div className="space-y-1">
          {paged.pageCount > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{summary.sortedGames.length} partijen</span>
              <ListPager page={paged.page} pageCount={paged.pageCount} setPage={paged.setPage} />
            </div>
          )}
          {paged.visible.map((game) => (
            <GameCard key={game.game_id} game={game} playerId={playerId} compact />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({ label, value, className }: { label: string; value: number | string; className: string }) {
  return (
    <div className="rounded border border-border/50 bg-muted/20 px-1 py-1.5">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold tabular-nums ${className}`}>{value}</div>
    </div>
  )
}

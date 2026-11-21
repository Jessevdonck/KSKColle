"use client"

import { useMemo } from "react"
import { Award, Flame, Gauge, CircleDot } from "lucide-react"
import type { GameWithRoundAndTournament } from "@/data/types"
import { normalizedResultForDisplay } from "@/lib/gameResultDisplay"
import { performanceRating, whiteScoreOfPlayedGame } from "@/lib/elio"

type PlayedGame = {
  game: GameWithRoundAndTournament
  score: number
  isWhite: boolean
  opponentName: string
  opponentRating: number | null
  date: number
}

/** Enkel effectief gespeelde partijen (geen forfait of niet-gespeelde remise), chronologisch. */
const playedGames = (games: GameWithRoundAndTournament[], playerId: number): PlayedGame[] =>
  games
    .map((game) => {
      const result = normalizedResultForDisplay(game.result ?? null, game.uitgestelde_datum)
      const whiteScore = whiteScoreOfPlayedGame(result)
      if (whiteScore === null || game.speler2_id == null) return null
      const isWhite = game.speler1_id === playerId
      const opponentRating = isWhite
        ? game.speler2_rating_at_time ?? game.speler2_rating ?? null
        : game.speler1_rating_at_time ?? game.speler1_rating ?? null
      return {
        game,
        score: isWhite ? whiteScore : 1 - whiteScore,
        isWhite,
        opponentName: (isWhite ? game.speler2_naam : game.speler1_naam) ?? "Onbekend",
        opponentRating: opponentRating && opponentRating > 0 ? opponentRating : null,
        date: new Date(game.round?.ronde_datum ?? 0).getTime(),
      }
    })
    .filter((g): g is PlayedGame => g !== null)
    .sort((a, b) => a.date - b.date)

const formatScore = (score: number) => (Number.isInteger(score) ? String(score) : score.toFixed(1).replace(".", ","))

/**
 * Hoogtepunten van een speler in de gekozen periode: prestatierating, beste overwinning,
 * langste reeks zonder verlies en score met wit/zwart.
 */
export default function PlayerHighlights({
  games,
  playerId,
  stacked = false,
}: {
  games: GameWithRoundAndTournament[]
  playerId: number
  /** Tegels onder elkaar (zijkolom op het profiel) i.p.v. naast elkaar */
  stacked?: boolean
}) {
  const h = useMemo(() => {
    const played = playedGames(games, playerId)

    const rated = played.filter((g) => g.opponentRating !== null)
    const tpr = performanceRating(
      rated.map((g) => g.opponentRating as number),
      rated.reduce((sum, g) => sum + g.score, 0),
    )

    const bestWin = played
      .filter((g) => g.score === 1 && g.opponentRating !== null)
      .sort((a, b) => (b.opponentRating as number) - (a.opponentRating as number))[0]

    let longest = 0
    let current = 0
    for (const g of played) {
      current = g.score > 0 ? current + 1 : 0
      longest = Math.max(longest, current)
    }

    const colorStats = (isWhite: boolean) => {
      const list = played.filter((g) => g.isWhite === isWhite)
      const score = list.reduce((sum, g) => sum + g.score, 0)
      return { games: list.length, score, pct: list.length ? Math.round((score / list.length) * 100) : null }
    }

    return { tpr, ratedCount: rated.length, bestWin, longest, white: colorStats(true), black: colorStats(false) }
  }, [games, playerId])

  if (h.white.games + h.black.games === 0) return null

  return (
    <div className={stacked ? "grid grid-cols-2 lg:grid-cols-1 gap-2" : "grid grid-cols-2 sm:grid-cols-4 gap-2"}>
      <Tile icon={<Gauge className="h-3.5 w-3.5 text-mainAccent" />} label="Prestatierating">
        <div className="text-lg font-bold text-textColor">{h.tpr ?? "–"}</div>
        <div className="text-[11px] text-muted-foreground">{h.ratedCount} gerate partijen</div>
      </Tile>

      <Tile icon={<Award className="h-3.5 w-3.5 text-yellow-500" />} label="Beste overwinning">
        {h.bestWin ? (
          <>
            <div className="truncate text-sm font-semibold text-textColor" title={h.bestWin.opponentName}>
              {h.bestWin.opponentName}
            </div>
            <div className="text-[11px] text-muted-foreground">ELIO {h.bestWin.opponentRating}</div>
          </>
        ) : (
          <div className="text-lg font-bold text-textColor">–</div>
        )}
      </Tile>

      <Tile icon={<Flame className="h-3.5 w-3.5 text-orange-500" />} label="Ongeslagen reeks">
        <div className="text-lg font-bold text-textColor">{h.longest}</div>
        <div className="text-[11px] text-muted-foreground">partijen op rij</div>
      </Tile>

      <Tile icon={<CircleDot className="h-3.5 w-3.5 text-gray-500" />} label="Wit / Zwart">
        <div className="text-sm font-semibold text-textColor tabular-nums">
          {formatScore(h.white.score)}/{h.white.games}
          <span className="text-muted-foreground font-normal"> · </span>
          {formatScore(h.black.score)}/{h.black.games}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {h.white.pct ?? "–"}% wit · {h.black.pct ?? "–"}% zwart
        </div>
      </Tile>
    </div>
  )
}

function Tile({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded border border-border/50 bg-muted/20 px-2.5 py-2">
      <div className="mb-0.5 flex items-center gap-1 text-[10px] uppercase text-muted-foreground">
        {icon}
        {label}
      </div>
      {children}
    </div>
  )
}

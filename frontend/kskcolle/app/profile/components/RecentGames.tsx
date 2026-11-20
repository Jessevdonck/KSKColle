"use client"

import React, { useMemo } from 'react'
import { GameWithRoundAndTournament } from "@/data/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GameCard } from './GameCard'
import { ListPager, usePaged } from './ListPager'

interface RecentGamesProps {
  games: { items: GameWithRoundAndTournament[] } | GameWithRoundAndTournament[]
  playerId: number
  compact?: boolean
}

export default function RecentGames({ games, playerId, compact }: RecentGamesProps) {
  const sortedGamesArray = useMemo(() => {
    const gamesArray = Array.isArray(games) ? games : games?.items || []
    return [...gamesArray].sort(
      (a, b) => new Date(b.round.ronde_datum).getTime() - new Date(a.round.ronde_datum).getTime(),
    )
  }, [games])

  const { page, pageCount, setPage, visible } = usePaged(sortedGamesArray, undefined, playerId)

  if (sortedGamesArray.length === 0) {
    return (
      <Card className="w-full border border-border/50">
        <CardHeader className={compact ? "py-3 px-4" : undefined}>
          <CardTitle className={compact ? "text-sm font-semibold" : undefined}>Recente partijen</CardTitle>
        </CardHeader>
        <CardContent className={compact ? "pt-0 px-4 pb-4" : undefined}>
          <p className="text-muted-foreground text-sm">Geen recente partijen.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full border border-border/50">
      <CardHeader className={compact ? "py-3 px-4" : undefined}>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className={compact ? "text-sm font-semibold" : undefined}>Recente partijen</CardTitle>
          <ListPager page={page} pageCount={pageCount} setPage={setPage} />
        </div>
      </CardHeader>
      <CardContent className={compact ? "pt-0 px-4 pb-4" : undefined}>
        <div className="space-y-1">
          {visible.map((game, index) => (
            <GameCard key={game.game_id || index} game={game} playerId={playerId} compact={compact} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

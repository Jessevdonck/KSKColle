import React from 'react'
import { GameWithRoundAndTournament } from "@/data/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GameCard } from './GameCard'

interface RecentGamesProps {
  games: { items: GameWithRoundAndTournament[] } | GameWithRoundAndTournament[]
  playerId: number
  compact?: boolean
}

export default function RecentGames({ games, playerId, compact }: RecentGamesProps) {
  const gamesArray = Array.isArray(games) ? games : games.items || []

  const sortedGamesArray = gamesArray.sort((a,b) => new Date(b.round.ronde_datum).getTime() - new Date(a.round.ronde_datum).getTime())

  if (!games || gamesArray.length === 0) {
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
        <CardTitle className={compact ? "text-sm font-semibold" : undefined}>Recente partijen</CardTitle>
      </CardHeader>
      <CardContent className={compact ? "pt-0 px-4 pb-4" : undefined}>
        <div className={compact ? "space-y-1" : "space-y-1"}>
          {sortedGamesArray.slice(0, compact ? 12 : undefined).map((game, index) => (
            <GameCard key={game.game_id || index} game={game} playerId={playerId} compact={compact} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}





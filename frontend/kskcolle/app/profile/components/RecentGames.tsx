import React from 'react'
import { GameWithRoundAndTournament } from "@/data/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { GameCard } from './GameCard'

interface RecentGamesProps {
  games: { items: GameWithRoundAndTournament[] } | GameWithRoundAndTournament[]
  playerId: number
}

export default function RecentGames({ games, playerId }: RecentGamesProps) {
  const gamesArray = Array.isArray(games) ? games : games.items || []

  const sortedGamesArray = gamesArray.sort((a,b) => new Date(b.round.ronde_datum).getTime() - new Date(a.round.ronde_datum).getTime())

  if (!games || gamesArray.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recente Partijen</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Geen recente partijen gevonden.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Recente Partijen</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedGamesArray.slice(0, 5).map((game) => (
            <GameCard key={game.game_id} game={game} playerId={playerId} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}





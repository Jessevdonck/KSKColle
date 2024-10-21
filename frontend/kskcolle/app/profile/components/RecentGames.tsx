import React from 'react'
import { GameWithRoundAndTournament } from "@/data/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, UserIcon, CircleIcon } from "lucide-react"

interface RecentGamesProps {
  games: { items: GameWithRoundAndTournament[] } | GameWithRoundAndTournament[]
  playerId: number
}

export default function RecentGames({ games, playerId }: RecentGamesProps) {
  console.log('RecentGames received games:', games)

  const gamesArray = Array.isArray(games) ? games : games.items || []

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
          {gamesArray.slice(0, 5).map((game) => (
            <GameCard key={game.game_id} game={game} playerId={playerId} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface GameCardProps {
  game: GameWithRoundAndTournament
  playerId: number
}

function GameCard({ game, playerId }: GameCardProps) {
  const isPlayer1 = game.speler1_id === playerId
  const result = getGameResult(game, playerId)
  const playerColor = isPlayer1 ? 'wit' : 'zwart'
  const opponentColor = isPlayer1 ? 'zwart' : 'wit'
  const whitePlayerName = isPlayer1 ? game.speler1_naam : game.speler2_naam
  const blackPlayerName = isPlayer1 ? game.speler2_naam : game.speler1_naam

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              <span className="flex items-center">
                <CircleIcon className="h-3 w-3 mr-1 text-gray-300" />
                {whitePlayerName}
              </span>
              <span className="mx-1">vs</span>
              <span className="flex items-center">
                <CircleIcon className="h-3 w-3 mr-1 text-gray-700" />
                {blackPlayerName}
              </span>
            </span>
          </div>
          <span className={`text-sm font-bold ${getResultColor(result)}`}>
            {result}
          </span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Je speelde met {playerColor}
        </div>
        {game.round && (
          <>
            <div className="mt-2 flex items-center space-x-2 text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>{new Date(game.round.ronde_datum).toLocaleDateString()}</span>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {game.round.tournament?.naam || 'Onbekend toernooi'}, Ronde {game.round.ronde_nummer}
            </div>
          </>
        )}
        {!game.round && (
          <div className="mt-2 text-sm text-muted-foreground">
            Geen ronde-informatie beschikbaar
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getGameResult(game: GameWithRoundAndTournament, playerId: number): string {
  if (!game.result) return 'N/A'
  if (game.result === '½-½') return '½-½'
  if (
    (game.result === '1-0' && game.speler1_id === playerId) ||
    (game.result === '0-1' && game.speler2_id === playerId)
  ) {
    return 'Gewonnen'
  }
  return 'Verloren'
}

function getResultColor(result: string): string {
  switch (result) {
    case 'Gewonnen':
      return 'text-green-600'
    case 'Verloren':
      return 'text-red-600'
    case '½-½':
      return 'text-yellow-600'
    default:
      return 'text-muted-foreground'
  }
}
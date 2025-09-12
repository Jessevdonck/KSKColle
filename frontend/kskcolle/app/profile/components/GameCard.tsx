import { GameWithRoundAndTournament } from "@/data/types"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarIcon, UserIcon } from "lucide-react"

interface GameCardProps {
  game: GameWithRoundAndTournament
  playerId: number
}

export function GameCard({ game, playerId }: GameCardProps) {
  const whitePlayerName = game.speler1_naam
  const blackPlayerName = game.speler2_naam
  const result = getGameResult(game, playerId)
  const isProfilePlayerWhite = game.speler1_id === playerId

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <span className="flex flex-row text-sm font-medium items-center space-x-6">
              <span className="flex items-center">
                <div className="h-3 w-3 mx-2 bg-gray-300 rounded-full" />
                {isProfilePlayerWhite ? (
                  <span className="font-semibold text-textColor">{whitePlayerName}</span>
                ) : (
                  whitePlayerName
                )}
              </span>
              <span className="flex-grow text-center">-</span>
              <span className="flex items-center">
                <div className="h-3 w-3 mr-2 bg-gray-700 rounded-full" />
                {isProfilePlayerWhite ? (
                  blackPlayerName
                ) : (
                  <span className="font-semibold text-textColor">{blackPlayerName}</span>
                )}
              </span>
            </span>
          </div>
          <span className={`text-sm font-bold ${getResultColor(result)}`}>
            {result}
          </span>
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
  if (!game.result || game.result === '...') return 'Nog te spelen'
  if (game.result === 'uitgesteld') return 'Uitgesteld'
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
    case 'Nog te spelen':
      return 'text-blue-600'
    case 'Uitgesteld':
      return 'text-orange-600'
    default:
      return 'text-muted-foreground'
  }
}

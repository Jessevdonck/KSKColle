import useSWR from 'swr'
import { GameWithRoundAndTournament } from "@/data/types"
import { getPlayerById } from "../../api/users"

interface Player {
  user_id: number;
  voornaam: string;
  achternaam: string;
}

export function GameCard({ game, playerId }: { game: GameWithRoundAndTournament; playerId: number }) {
  const { data: player1, error: error1 } = useSWR<Player>(`player-${game.speler1_id}`, () => getPlayerById(game.speler1_id))
  const { data: player2, error: error2 } = useSWR<Player>(`player-${game.speler2_id}`, () => getPlayerById(game.speler2_id))

  const isLoading = !player1 || !player2
  const isError = error1 || error2

  return (
    <div className="bg-white p-4 rounded-md shadow">
      <div className="flex items-center">
        <div className="flex-grow">
          <p className="font-semibold text-textColor mb-2">
            {isLoading ? (
              'Loading players...'
            ) : isError ? (
              'Error loading players'
            ) : (
              `${player1.voornaam} ${player1.achternaam} vs ${player2.voornaam} ${player2.achternaam}`
            )}
          </p>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-semibold">Toernooi:</span> {game.round.tournament.naam || 'Onbekend'}
            </p>
            <p>
              <span className="font-semibold">Ronde:</span> {game.round.ronde_nummer}
            </p>
            <p>
              <span className="font-semibold">Datum:</span> {new Date(game.round.ronde_datum).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 ml-4">
          <span className={`font-bold ${getResultColor(game, playerId)}`}>
            {game.result || 'N/A'}
          </span>
        </div>
      </div>
    </div>
  )
}

function getResultColor(game: GameWithRoundAndTournament, playerId: number): string {
  if (!game.result) return 'text-gray-600'
  if (game.result === '½-½') return 'text-yellow-400'
  if (
    (game.result === '1-0' && game.speler1_id === playerId) ||
    (game.result === '0-1' && game.speler2_id === playerId)
  ) {
    return 'text-emerald-800'
  }
  return 'text-red-700'
}
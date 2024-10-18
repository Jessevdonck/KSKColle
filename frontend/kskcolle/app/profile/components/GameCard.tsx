import { Game, GameWithRoundAndTournament } from "@/data/types"


export function GameCard({ game, playerId }: { game: GameWithRoundAndTournament, playerId: number }) {
    return (
      <div className="bg-white p-4 rounded-md shadow">
        <div className="flex items-center">
          <div className="flex-grow">
            <p className="font-semibold text-textColor mb-2">
              {game.speler1.voornaam + ' ' + game.speler1.achternaam} vs {game.speler2.voornaam + ' ' + game.speler2.achternaam}
            </p>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-semibold">Toernooi:</span> {game.round.tournament?.naam || 'Onbekend'}
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

  function getResultColor(game: Game, playerId: number): string {
    if (!game.result) return 'text-gray-600'
    if (game.result === '½-½') return 'text-yellow-400'
    if (
      (game.result === '1-0' && game.speler1.user_id === playerId) ||
      (game.result === '0-1' && game.speler2.user_id === playerId)
    ) {
      return 'text-emerald-800'
    }
    return 'text-red-700'
  }
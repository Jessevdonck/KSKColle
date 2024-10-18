import { GameWithRoundAndTournament } from "@/data/types"
import { GameCard } from './GameCard'



export default function RecentGames({ games, playerId }: { games: GameWithRoundAndTournament[], playerId: number }) {
  return (
    <div className="px-8 py-6">
      <h2 className="text-2xl font-bold text-textColor mb-4">Recente Partijen</h2>
      {games.length > 0 ? (
        <div className="space-y-4">
          {games.slice(0, 5).map(game => (
            <GameCard key={game.game_id} game={game} playerId={playerId} />
          ))}
        </div>
      ) : (
        <p className="text-gray-600">Geen recente partijen gevonden.</p>
      )}
    </div>
  )
}




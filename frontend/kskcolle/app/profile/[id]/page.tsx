'use client'

import { notFound } from 'next/navigation'
import Image from 'next/image'
import { playersData, games, Player, Game } from '../../../data/mock_data'

export default function PlayerProfile({ params }: { params: { id: string } }) {
  const playerId = parseInt(params.id, 10)
  const player = playersData.find(p => p.id === playerId)

  if (!player) {
    notFound()
  }

  const playerGames = games.filter(game => 
    game.whitePlayer.id === playerId || game.blackPlayer.id === playerId
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:flex-shrink-0">
            <Image
              src={player.photoUrl || '/images/default-avatar.jpg'}
              alt={player.name}
              width={300}
              height={300}
              className="h-48 w-full object-cover md:h-full md:w-48"
            />
          </div>
          <div className="p-8">
            <div className="uppercase tracking-wide text-sm text-emerald-800 font-semibold">Speler Profiel</div>
            <h1 className="mt-1 text-4xl font-bold text-gray-900">{player.name}</h1>
            <p className="mt-2 text-gray-600">Rating: {player.elio_07_24}</p>
            <p className="mt-1 text-gray-600">Hoogste rating: {player.max}</p>
          </div>
        </div>
        
        <div className="px-8 py-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recente Partijen</h2>
          {playerGames.length > 0 ? (
            <div className="space-y-4">
              {playerGames.map(game => (
                <div key={game.id} className="bg-gray-100 p-4 rounded-md">
                  <p className="font-semibold">
                    {game.whitePlayer.name} (Wit) vs {game.blackPlayer.name} (Zwart)
                  </p>
                  <p className="text-sm text-gray-600">
                    Resultaat: <span className={`font-bold ${getResultColor(game, player)}`}>
                      {getResultText(game, player)}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">Geen recente partijen gevonden.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function getResultColor(game: Game, player: Player): string {
  if (!game.result) return 'text-gray-600'
  if (game.result === '½-½') return 'text-yellow-600'
  if (
    (game.result === '1-0' && game.whitePlayer.id === player.id) ||
    (game.result === '0-1' && game.blackPlayer.id === player.id)
  ) {
    return 'text-green-600'
  }
  return 'text-red-600'
}

function getResultText(game: Game, player: Player): string {
  if (!game.result) return 'Nog niet gespeeld'
  if (game.result === '½-½') return 'Remise'
  if (
    (game.result === '1-0' && game.whitePlayer.id === player.id) ||
    (game.result === '0-1' && game.blackPlayer.id === player.id)
  ) {
    return 'Gewonnen'
  }
  return 'Verloren'
}
import React from 'react'
import Link from 'next/link'

interface RoundPairingsProps {
  round: {
    round_id: number
    ronde_nummer: number
    games?: Array<{
      game_id: number
      speler1: { user_id: number, voornaam: string, achternaam: string }
      speler2: { user_id: number, voornaam: string, achternaam: string } | null
      result: string | null
    }>
  }
}

export default function RoundPairings({ round }: RoundPairingsProps) {
  if (!round.games || round.games.length === 0) {
    return (
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-[#4A4947] mb-2">Ronde {round.ronde_nummer}</h3>
        <p className="text-gray-500 italic">Geen partijen gevonden voor deze ronde.</p>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold text-[#4A4947] mb-2">Ronde {round.ronde_nummer}</h3>
      <table className="w-full">
        <thead>
          <tr className="bg-mainAccent text-white">
            <th className="p-2 pl-4 text-left">Wit</th>
            <th className="p-2 text-left">Zwart</th>
            <th className="p-2 text-left">Uitslag</th>
          </tr>
        </thead>
        <tbody>
          {round.games.map((game, index) => (
            <tr key={game.game_id} className={`border-b ${index % 2 === 0 ? 'bg-neutral-50' : 'bg-neutral-100'}`}>
              <td className="p-2 pl-4">
                <Link href={`/profile/${game.speler1.user_id}`}>
                  {`${game.speler1.voornaam} ${game.speler1.achternaam}`}
                </Link>
              </td>
              <td className="p-2">
                {game.speler2 ? (
                  <Link href={`/profile/${game.speler2.user_id}`}>
                    {`${game.speler2.voornaam} ${game.speler2.achternaam}`}
                  </Link>
                ) : (
                  <span className="text-gray-500 italic">Bye</span>
                )}
              </td>
              <td className="p-2">{game.result || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
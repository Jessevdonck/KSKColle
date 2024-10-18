import React from 'react'
import { Round } from '../../../data/mock_data'
import Link from 'next/link'

interface RoundPairingsProps {
  round: Round
}

export default function RoundPairings({ round }: RoundPairingsProps) {
  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold text-[#4A4947] mb-2">Ronde {round.number}</h3>
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
            <tr key={game.id} className={`border-b ${index % 2 === 0 ? 'bg-neutral-50' : 'bg-neutral-100'}`}>

              <td className="p-2 pl-4"><Link href={`/profile/${game.whitePlayer.id}`}>{game.whitePlayer.name}</Link></td>
              <td className="p-2"><Link href={`/profile/${game.blackPlayer.id}`}>{game.blackPlayer.name}</Link></td>
              <td className="p-2">{game.result || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
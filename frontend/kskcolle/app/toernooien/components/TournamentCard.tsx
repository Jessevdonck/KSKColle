import React from 'react'
import Link from 'next/link'

interface TournamentCardProps {
  tournament: {
    tournament_id: number
    naam: string
    rondes: number
    participations: Array<{
      user_id: number
      voornaam: string
      achternaam: string
    }>
  }
}

export default function TournamentCard({ tournament }: TournamentCardProps) {
  return (
    <Link href={`/toernooien/${tournament.tournament_id}`} className="block">
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ">
        <h2 className="text-xl font-semibold text-textColor mb-2">{tournament.naam}</h2>
        <p className="text-gray-600 "> <span className='font-semibold'>Rondes</span>: {tournament.rondes}</p>
        <p className="text-gray-600 "> <span className='font-semibold'>Deelnemers</span>: {tournament.participations.length}</p>
      </div>
    </Link>
  )
}
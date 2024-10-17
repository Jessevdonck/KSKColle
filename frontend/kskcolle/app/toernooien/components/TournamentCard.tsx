import React from 'react'
import { Tournament } from '../../../data/mock_data'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import Link from 'next/link'

interface TournamentCardProps {
  tournament: Tournament
}

export default function TournamentCard({ tournament }: TournamentCardProps) {
  return (
    <Link href={`/toernooien/${tournament.id}`} className="block">
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ">
        <h2 className="text-xl font-semibold text-[#4A4947] mb-2">{tournament.name}</h2>
        <p className="text-emerald-800 mb-2">
          {format(tournament.startDate, 'd MMMM yyyy', { locale: nl })} - {format(tournament.endDate, 'd MMMM yyyy', { locale: nl })}
        </p>
        <p className="text-gray-600">Aantal rondes: {tournament.rounds.length}</p>
      </div>
    </Link>
  )
}
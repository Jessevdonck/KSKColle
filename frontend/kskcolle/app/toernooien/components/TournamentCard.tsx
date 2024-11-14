import React from 'react'
import Link from 'next/link'
import { Users, Calendar } from 'lucide-react'

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
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-200">
        <h2 className="text-2xl font-semibold text-[#2e2c2c] mb-4">{tournament.naam}</h2>
        <div className="flex items-center text-[#2e2c2c] mb-2">
          <Calendar className="h-5 w-5 mr-2 text-[#B17457]" />
          <span className="font-semibold">Rondes:</span>
          <span className="ml-2">{tournament.rondes}</span>
        </div>
        <div className="flex items-center text-[#2e2c2c]">
          <Users className="h-5 w-5 mr-2 text-[#B17457]" />
          <span className="font-semibold">Deelnemers:</span>
          <span className="ml-2">{tournament.participations.length}</span>
        </div>
        <div className="mt-4 text-[#B17457] font-semibold hover:text-[#8f5d46] transition-colors duration-300">
          Bekijk details →
        </div>
      </div>
    </Link>
  )
}
import React from 'react'
import { tournaments } from '../../../data/mock_data'
import TournamentCard from './TournamentCard'

export default function TournamentList() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#4A4947] mb-6">KSK Colle Toernooien</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map(tournament => (
          <TournamentCard key={tournament.id} tournament={tournament} />
        ))}
      </div>
    </div>
  )
}
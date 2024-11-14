"use client"

import React from 'react'
import useSWR from 'swr'
import TournamentCard from './TournamentCard'
import { getAll } from '../../api/index'
import { Trophy } from 'lucide-react'

export default function TournamentList() {
  const { data: tournaments, error } = useSWR('toernooien', getAll)

  if (error) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center text-red-500 bg-red-100 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-2">Error</h2>
        <p>Er is een fout opgetreden bij het laden van de toernooien</p>
      </div>
    </div>
  )

  if (!tournaments) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#B17457]"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#2e2c2c] mb-4 flex items-center justify-center">
            <Trophy className="mr-2 h-10 w-10 text-[#B17457]" />
            KSK Colle Toernooien
          </h1>
          <p className="text-xl text-[#2e2c2c]">Ontdek en neem deel aan onze spannende schaaktoernooien</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tournaments.map(tournament => (
            <TournamentCard key={tournament.tournament_id} tournament={tournament} />
          ))}
        </div>
        
        {tournaments.length === 0 && (
          <div className="text-center text-[#2e2c2c] mt-12">
            <p className="text-2xl font-semibold">Geen toernooien gevonden</p>
            <p className="mt-2">Er zijn momenteel geen actieve toernooien. Kom later terug voor updates!</p>
          </div>
        )}
      </div>
    </div>
  )
}
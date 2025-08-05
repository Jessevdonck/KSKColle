"use client"

import React, { useState, useEffect } from 'react'
import useSWR from 'swr'
import TournamentCard from './TournamentCard'
import { getAll } from '../../api/index'
import { Trophy } from 'lucide-react'

export default function TournamentList() {
  const [isLoading, setIsLoading] = useState(true)
  const { data: tournaments, error } = useSWR('tournament?active=true', getAll)

  useEffect(() => {
    if (tournaments || error) {
      setIsLoading(false)
    }
  }, [tournaments, error])

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#2e2c2c] mb-4 flex items-center justify-center">
            <Trophy className="mr-2 h-10 w-10 text-mainAccent" />
            KSK Colle Toernooien
          </h1>
          <p className="text-xl text-[#2e2c2c]">Ontdek en neem deel aan onze spannende schaaktoernooien</p>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#B17457]" data-cy="is_loading"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center">
            <div className="text-center text-red-500 bg-red-100 p-6 rounded-lg shadow-md" data-cy="axios_error_message">
              <h2 className="text-2xl font-bold mb-2">Error</h2>
              <p>Er is een fout opgetreden bij het laden van de toernooien</p>
            </div>
          </div>
        ) : tournaments && tournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tournaments.map(tournament => (
              <TournamentCard key={tournament.tournament_id} tournament={tournament} />
            ))}
          </div>
        ) : (
          <div className="text-center text-[#2e2c2c] mt-12" data-cy="no_tournaments_message">
            <p className="text-2xl font-semibold">Geen toernooien gevonden</p>
            <p className="mt-2">Er zijn momenteel geen actieve toernooien. Kom later terug voor updates!</p>
          </div>
        )}
      </div>
    </div>
  )
}


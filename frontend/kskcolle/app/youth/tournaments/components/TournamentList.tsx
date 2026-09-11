"use client"

import React, { useState, useEffect } from 'react'
import useSWR from 'swr'
import TournamentCard from './TournamentCard'
import { getAll } from '../../../api/index'
import { Trophy } from 'lucide-react'

export default function TournamentList() {
  const [isLoading, setIsLoading] = useState(true)
  const { data: tournaments, error } = useSWR('tournament?active=true&is_youth=true', getAll)

  useEffect(() => {
    if (tournaments || error) {
      setIsLoading(false)
    }
  }, [tournaments, error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-textColor mb-3 flex items-center justify-center">
            <Trophy className="mr-2 h-6 w-6 text-mainAccent" />
            Jeugdtoernooien
          </h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-mainAccent" data-cy="is_loading"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center">
            <div className="text-center text-red-600 bg-red-50 border border-red-200 p-4 rounded-lg shadow-sm" data-cy="axios_error_message">
              <h2 className="text-lg font-bold mb-1.5">Error</h2>
              <p className="text-sm">Er is een fout opgetreden bij het laden van de toernooien</p>
            </div>
          </div>
        ) : tournaments && tournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map(tournament => (
              <TournamentCard key={tournament.tournament_id} tournament={tournament} />
            ))}
          </div>
        ) : (
          <div className="text-center text-textColor mt-6" data-cy="no_tournaments_message">
            <p className="text-lg font-semibold">Geen toernooien gevonden</p>
            <p className="mt-1 text-sm text-gray-600">Er zijn momenteel geen actieve toernooien. Kom later terug voor updates!</p>
          </div>
        )}
      </div>
    </div>
  )
}


"use client"

import React, { useState } from 'react'
import useSWR from 'swr'
import TournamentCard from './TournamentCard'
import { getAll } from '../../../api/index'
import { Trophy, Archive } from 'lucide-react'
import { sortYouthClasses } from './youthClasses'

interface Tournament {
  tournament_id: number
  naam: string
  rondes: number
  participations: Array<{
    user_id: number
    voornaam: string
    achternaam: string
  }>
  class_name?: string | null
}

/** Eén kaart per toernooinaam: reeksen (bv. "Stap 3+" en "Stap 1+2") worden samengevoegd. */
const toGroupedTournamentCards = (tournaments: Tournament[]) => {
  const groups = new Map<string, Tournament[]>()
  tournaments.forEach((tournament) => {
    groups.set(tournament.naam, [...(groups.get(tournament.naam) ?? []), tournament])
  })

  return Array.from(groups.values()).map((group) => {
    const classes = sortYouthClasses(group)
    const totalPlayers = classes.reduce((sum, t) => sum + t.participations.length, 0)
    return {
      ...classes[0],
      participations: Array.from({ length: totalPlayers }, (_, i) => ({
        user_id: i,
        voornaam: `Player ${i + 1}`,
        achternaam: '',
      })),
      rondes: Math.max(...classes.map((t) => t.rondes)),
      _classNames: classes.length > 1 ? classes.map((t) => t.class_name).filter(Boolean) as string[] : [],
    }
  })
}

export default function TournamentList() {
  const [showArchive, setShowArchive] = useState(false)
  const { data: tournaments, error } = useSWR<Tournament[]>('tournament?active=true&is_youth=true', getAll)
  const { data: archiveTournaments, error: archiveError } = useSWR<Tournament[]>(
    showArchive ? 'tournament?active=false&is_youth=true' : null,
    getAll,
  )
  const isLoading = (!tournaments && !error) || (showArchive && !archiveTournaments && !archiveError)
  const shown = showArchive ? archiveTournaments : tournaments

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-textColor mb-3 flex items-center justify-center">
            <Trophy className="mr-2 h-6 w-6 text-mainAccent" />
            Jeugdtoernooien
          </h1>

          {/* Archive Toggle */}
          <div className="flex justify-center items-center space-x-3">
            <button
              onClick={() => setShowArchive(!showArchive)}
              aria-pressed={showArchive}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-mainAccent focus:ring-offset-2 ${
                showArchive ? 'bg-mainAccent' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showArchive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700">Archief toernooien</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-mainAccent" data-cy="is_loading"></div>
          </div>
        ) : error || archiveError ? (
          <div className="flex items-center justify-center">
            <div className="text-center text-red-600 bg-red-50 border border-red-200 p-4 rounded-lg shadow-sm" data-cy="axios_error_message">
              <h2 className="text-lg font-bold mb-1.5">Error</h2>
              <p className="text-sm">Er is een fout opgetreden bij het laden van de toernooien</p>
            </div>
          </div>
        ) : shown && shown.length > 0 ? (
          <>
            {showArchive && (
              <h2 className="text-xl font-bold text-textColor mb-3 border-b-2 border-mainAccent pb-1.5 flex items-center">
                <Archive className="mr-2 h-5 w-5 text-mainAccent" />
                Archief Toernooien
              </h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {toGroupedTournamentCards(shown).map(tournament => (
                <TournamentCard key={tournament.tournament_id} tournament={tournament} />
              ))}
            </div>
          </>
        ) : showArchive ? (
          <div className="text-center text-textColor mt-6" data-cy="no_archive_tournaments_message">
            <Archive className="mx-auto h-10 w-10 text-gray-400 mb-2" />
            <p className="text-lg font-semibold">Geen archief toernooien gevonden</p>
            <p className="mt-1 text-sm text-gray-600">Er zijn momenteel geen afgelopen toernooien in het archief.</p>
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

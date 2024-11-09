"use client"

import React from 'react'
import useSWR from 'swr'
import TournamentCard from './TournamentCard'
import { getAll } from '../../api/index'

export default function TournamentList() {
  const { data: tournaments, error } = useSWR('toernooien', getAll)

  if (error) return <div className="text-center text-red-500">Er is een fout opgetreden bij het laden van de toernooien</div>
  if (!tournaments) return <div className="text-center">Laden...</div>

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen"> 
      <h1 className="text-3xl font-bold text-[#4A4947] mb-6">KSK Colle Toernooien</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map(tournament => (
          <TournamentCard key={tournament.tournament_id} tournament={tournament} />
        ))}
      </div>
    </div>
  )
}
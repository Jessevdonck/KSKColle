'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { tournaments } from '../../../data/mock_data'
import RoundPairings from './RoundPairings'
import Standings from './Standings'

export default function TournamentDetails() {
  const { id } = useParams()
  const tournament = tournaments.find(t => t.id === id)

  if (!tournament) {
    return <div className="flex justify-center mx-auto px-4 text-4xl py-8 font-extrabold text-gray-700">Toernooi niet gevonden</div>
  }

  return (
    <div className="flex justify-start items-start flex-col w-full px-4 py-8 bg-neutral-50 min-h-screen">
      <h1 className="text-3xl font-bold text-textColor mb-6 w-full text-center">{tournament.name}</h1>
      
      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl mx-auto">
        <div className="lg:flex-1 w-full bg-white rounded-lg shadow-md p-6 self-start">
          <h2 className="text-2xl font-bold text-textColor mb-4">Rondes</h2>
          <div className="space-y-6">
            {tournament.rounds.map(round => (
              <RoundPairings key={round.id} round={round} />
            ))}
          </div>
        </div>
        
        <div className="lg:flex-1 w-full bg-white rounded-lg shadow-md p-6 self-start">
          <h2 className="text-2xl font-bold text-textColor mb-4">Stand</h2>
          <Standings tournament={tournament} />
        </div>
      </div>
    </div>
  )
}
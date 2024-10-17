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
    <div className="flex justify-center items-center flex-col w-screen  px-4 py-8 bg-neutral-50">
      <h1 className="text-3xl font-bold text-[#4A4947] mb-6">{tournament.name}</h1>
      
      <div className="flex flex-col lg:flex-row gap-8 w-11/12">
        <div className="flex-1 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-[#4A4947] mb-4">Rondes</h2>
          <div className="space-y-6">
            {tournament.rounds.map(round => (
              <RoundPairings key={round.id} round={round} />
            ))}
          </div>
        </div>
        
        <div className="flex-1 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-[#4A4947] mb-4">Stand</h2>
          <Standings tournament={tournament} />
        </div>
      </div>
    </div>
  )
}

{/*bg-[#FAF7F0]*/ }
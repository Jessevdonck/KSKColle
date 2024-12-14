"use client"

import React from 'react'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import RoundPairings from './RoundPairings'
import Standings from './Standings'
import { getById } from '../../api/index'

export default function TournamentDetails() {
  const { id } = useParams()
  const tournamentId = Number(id)
  const { data: tournament, error: tournamentError } = useSWR(`tournament/${tournamentId}`, () => getById(`tournament/${tournamentId}`))
  const { data: roundsData, error: roundsError } = useSWR(`rondes/${tournamentId}/rondes`, () => getById(`rondes/${tournamentId}/rondes`))

  if (tournamentError || roundsError) {
    return <div className="flex justify-center mx-auto px-4 text-4xl py-8 font-extrabold text-gray-700">Er is een fout opgetreden bij het laden van het toernooi</div>
  }

  if (!tournament || !roundsData) {
    return <div className="flex justify-center mx-auto px-4 text-4xl py-8 font-extrabold text-gray-700">Laden...</div>
  }

  const rounds = Array.isArray(roundsData) ? roundsData : roundsData.items || []

  return (
    <div className="flex justify-start items-start flex-col w-full px-4 py-8 bg-neutral-50 min-h-screen">
      <h1 className="text-3xl font-bold text-textColor mb-6 w-full text-center">{tournament.naam}</h1>
      
      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl mx-auto">
        <div className="lg:flex-1 w-full bg-white rounded-lg shadow-md p-6 self-start">
          <h2 className="text-2xl font-bold text-textColor mb-4">Rondes</h2>
          <div className="space-y-6">
            {rounds.length > 0 ? (
              rounds.map((round) => (
                <RoundPairings key={round.round_id} round={round} />
              ))
            ) : (
              <p>Geen rondes gevonden.</p>
            )}
          </div>
        </div>
        
        <div className="lg:flex-1 w-full bg-white rounded-lg shadow-md p-6 self-start">
          <h2 className="text-2xl font-bold text-textColor mb-4">Stand</h2>
          <Standings tournament={tournament} rounds={rounds} />
        </div>
      </div>
    </div>
  )
}


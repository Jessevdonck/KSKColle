"use client"

import React, { useState } from 'react'
import TournamentForm from './components/forms/TournamentForm'
import TournamentList from './TournamentList'
import RoundManagement from './rounds/RoundManagement'
import { Toernooi } from '@/data/types'

export default function TournamentManagement() {
  const [selectedTournament, setSelectedTournament] = useState<Toernooi | null>(null)

  return (
    <div className="space-y-8 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold my-10">Toernooien Beheren</h1>
      
      <TournamentForm />
      
      <TournamentList onSelectTournament={setSelectedTournament} />
      
      {selectedTournament && (
        <RoundManagement tournament={selectedTournament} />
      )}
    </div>
  )
}
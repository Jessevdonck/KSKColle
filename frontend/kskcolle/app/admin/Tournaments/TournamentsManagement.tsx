"use client"

import React, { useState } from 'react'
import TournamentForm from './components/forms/TournamentForm'
import TournamentList from './components/TournamentList'
import RoundManagement from './components/RoundManagement'
import { Toernooi } from '@/data/types'

export default function TournamentManagement() {
  const [selectedTournament, setSelectedTournament] = useState<Toernooi | null>(null)

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Toernooien Beheren</h1>
      
      <TournamentForm />
      
      <TournamentList onSelectTournament={setSelectedTournament} />
      
      {selectedTournament && (
        <RoundManagement tournament={selectedTournament} />
      )}
    </div>
  )
}
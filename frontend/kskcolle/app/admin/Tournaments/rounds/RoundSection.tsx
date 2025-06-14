// src/app/admin/Tournaments/rounds/RoundSection.tsx
'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import type { Round, MakeupDay } from '@/data/types'
import RoundGames from './RoundGames'

interface Props {
  roundNumber: number
  roundData?: Round
  tournamentId: number
  makeupDays: MakeupDay[]
  onGenerate(): void
  canGenerate: boolean
  onUpdate(): void
}

export default function RoundSection({
  roundNumber,
  roundData,
  tournamentId,
  makeupDays,
  onGenerate,
  canGenerate,
  onUpdate
}: Props) {
  // alleen de games zonder uitgestelde datum
  const games = roundData?.games.filter(g => !g.uitgestelde_datum) ?? []

  return (
    <div className="p-4 border rounded bg-white">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-semibold">Ronde {roundNumber}</h3>
        {canGenerate && <Button onClick={onGenerate}>Genereer paringen</Button>}
      </div>

      {/* Vóór: <RoundGames round={roundData} … /> */}
      {/* Ná: */}
      <RoundGames
        games={games}
        tournamentId={tournamentId}
        makeupDays={makeupDays}
        onUpdateGame={onUpdate}
      />
    </div>
  )
}

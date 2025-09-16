// src/app/admin/Tournaments/rounds/RoundList.tsx
'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import useSWRMutation from 'swr/mutation'
import { postMakeupDay } from '../../../api/index'
import { format } from 'date-fns'
import RoundGames from './RoundGames'
import type { Round, MakeupDay, Game } from '@/data/types'
import { sortGamesByPairingOrder } from '@/lib/gameSorting'

interface RoundListProps {
  rounds: Round[]
  totalRounds: number
  tournament_id: number
  onGeneratePairings: (roundNumber: number) => void
  canGeneratePairings: (roundNumber: number) => boolean
  nextRoundForPairings: number | null
  onUpdateGame: () => void
  makeupRounds?: Array<{
    round_id: number
    ronde_datum: string
    startuur: string
    label: string | null
  }>
}

export default function RoundList({
  rounds,
  totalRounds,
  tournament_id,
  onGeneratePairings,
  canGeneratePairings,
  nextRoundForPairings,
  onUpdateGame,
  makeupRounds = [],
}: RoundListProps) {
  const [addingForRound, setAddingForRound] = useState<number | null>(null)
  const [date, setDate] = useState<string>('')

  const { trigger: createMakeupDay } = useSWRMutation(
    'makeupDay',
    postMakeupDay,
    {
      onSuccess: () => {
        setAddingForRound(null)
        setDate('')
        onUpdateGame()
      }
    }
  )

  const handleAddClick = (roundNumber: number) => {
    setAddingForRound(roundNumber)
    setDate(format(new Date(), 'yyyy-MM-dd'))
  }

  const handleSubmitMakeup = async () => {

  if (addingForRound === null || !date) {
    return;
  }

  const payload = {
    tournament_id,
    round_after: addingForRound,
    date,
  };

  await createMakeupDay({ arg: payload });
};


  return (
    <>
      {Array.from({ length: totalRounds }, (_, i) => i + 1).map((roundNumber) => {
        // vind de ronde-data
        const roundData = rounds.find(r => r.ronde_nummer === roundNumber)
        // pak alle games (inclusief uitgestelde games)
        const games: Game[] = roundData?.games ?? []

        return (
          <div key={roundNumber} className="mb-4 w-full max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Ronde {roundNumber}</h3>

              {nextRoundForPairings === roundNumber &&
                canGeneratePairings(roundNumber) && (
                  <Button onClick={() => onGeneratePairings(roundNumber)}>
                    Genereer paringen
                  </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddClick(roundNumber)}
              >
                +
              </Button>
            </div>

            {addingForRound === roundNumber && (
              <div className="mt-2 p-4 bg-gray-50 border rounded">
                <div className="grid grid-cols-2 gap-4 items-end">
                  <div>
                    <Label>Datum</Label>
                    <Input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleSubmitMakeup} className="bg-green-500">
                      Opslaan
                    </Button>
                    <Button onClick={() => setAddingForRound(null)} variant="outline">
                      Annuleren
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* toon bestaande inhaaldagen onder deze ronde */}
            {makeupRounds
              .filter(round => (round.round_id - 1000) === roundNumber)
              .map(round => (
                <div key={round.round_id} className="mt-2 text-sm text-gray-600">
                  Inhaaldag: {round.label ?? ''} — {format(new Date(round.ronde_datum), 'yyyy-MM-dd')}
                </div>
              ))}

            {/* Render de games voor deze ronde */}
            <RoundGames
              games={sortGamesByPairingOrder(games, roundData?.is_sevilla_imported)}
              tournamentId={tournament_id}
              makeupRounds={makeupRounds}
              onUpdateGame={onUpdateGame}
            />
          </div>
        )
      })}
    </>
  )
}

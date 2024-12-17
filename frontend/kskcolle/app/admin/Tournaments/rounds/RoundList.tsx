import React from 'react'
import { Button } from "@/components/ui/button"
import { Round } from '@/data/types'
import RoundGames from './RoundGames'

interface RoundListProps {
  rounds: Round[]
  totalRounds: number
  tournamentId: number
  onGeneratePairings: (roundNumber: number) => Promise<void>
  canGeneratePairings: (roundNumber: number) => boolean
  nextRoundForPairings: number | null
  onUpdateGame: () => void
}

export default function RoundList({ 
  rounds, 
  totalRounds, 
  tournamentId, 
  onGeneratePairings, 
  canGeneratePairings, 
  nextRoundForPairings,
  onUpdateGame 
}: RoundListProps) {
  return (
    <>
      {Array.from({ length: totalRounds }, (_, i) => i + 1).map((roundNumber) => (
        <div key={roundNumber} className="flex flex-col items-start w-full max-w-2xl mx-auto mb-6">
          <h3 className="text-xl font-semibold mb-2">Ronde {roundNumber}</h3>
          {nextRoundForPairings === roundNumber && canGeneratePairings(roundNumber) && (
            <Button 
              onClick={() => onGeneratePairings(roundNumber)} 
              className="mb-2 bg-mainAccent hover:bg-mainAccentDark"
              data-cy='generate_pairings_button'
            >
              Genereer paringen
            </Button>
          )}
          <RoundGames 
            round={rounds.find(r => r.ronde_nummer === roundNumber)} 
            tournamentId={tournamentId}
            onUpdateGame={onUpdateGame}
          />
        </div>
      ))}
    </>
  )
}
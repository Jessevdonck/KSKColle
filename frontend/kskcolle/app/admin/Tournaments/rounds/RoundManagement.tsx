"use client"

import React from 'react'
import { useToast } from "@/hooks/use-toast"
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import * as tournamentsApi from '../../../api/tournaments'
import { Toernooi } from '@/data/types'
import RoundList from './RoundList'

interface RoundManagementProps {
  tournament: Toernooi
}

export default function RoundManagement({ tournament }: RoundManagementProps) {
  const { toast } = useToast()
  const { data: updatedTournament, mutate } = useSWR<Toernooi>(
    `toernooien/${tournament.tournament_id}`,
    () => tournamentsApi.getTournamentById(tournament.tournament_id)
  )
  const { trigger: generatePairings } = useSWRMutation(
    [`toernooien/${tournament.tournament_id}/pairings`, tournament.tournament_id],
    ([_, tournamentId], { arg }: { arg: { roundNumber: number } }) =>
      tournamentsApi.createPairings(tournamentId, arg.roundNumber)
  )

  if (!updatedTournament) return <div>Loading...</div>

  const handleGeneratePairings = async (roundNumber: number) => {
    try {
      await generatePairings({ roundNumber })
      await mutate()
      toast({ title: "Success", description: `Paringen voor ronde ${roundNumber} succesvol gegenereerd.` })
    } catch (error) {
      console.error('Fout met paringen genereren:', error)
      toast({ title: "Error", description: "Kon geen paringen aanmaken", variant: "destructive" })
    }
  }

  const canGeneratePairings = (roundNumber: number) => {
    if (roundNumber === 1) return true
    const previousRound = updatedTournament.rounds.find(r => r.ronde_nummer === roundNumber - 1)
    return previousRound && previousRound.games.every(game => game.result && game.result !== "not_played")
  }

  const getNextRoundForPairings = () => {
    for (let i = 1; i <= updatedTournament.rondes; i++) {
      const round = updatedTournament.rounds.find(r => r.ronde_nummer === i)
      if (!round || round.games.length === 0) {
        return i
      }
    }
    return null
  }

  const nextRoundForPairings = getNextRoundForPairings()

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Rondes</h2>
      <RoundList
        rounds={updatedTournament.rounds}
        totalRounds={updatedTournament.rondes}
        tournamentId={tournament.tournament_id}
        onGeneratePairings={handleGeneratePairings}
        canGeneratePairings={canGeneratePairings}
        nextRoundForPairings={nextRoundForPairings}
        onUpdateGame={mutate}
      />
    </div>
  )
}
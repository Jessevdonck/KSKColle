'use client'

import React from "react"
import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { getById, generatePairings, endTournament } from "../../../api/index"
import { Toernooi } from "@/data/types"
import RoundList from "./RoundList"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface RoundManagementProps {
  tournament: Toernooi
}

export default function RoundManagement({ tournament }: RoundManagementProps) {
  const { toast } = useToast()

  // 1) Fetch het meest recente toernooi inclusief rounds
  const { data: updatedTournament, mutate } = useSWR<Toernooi>(
    `tournament/${tournament.tournament_id}`,
    () => getById(`tournament/${tournament.tournament_id}`)
  )

  // 2) Mutation voor paringen genereren
  const { trigger: generatePairingsTrigger } = useSWRMutation(
    "tournament",
    generatePairings
  )

  // 3) Mutation om toernooi te beëindigen (en ratings af te handelen)
  const { trigger: endTournamentTrigger, isMutating: isEnding } = useSWRMutation(
    "tournament",
    endTournament
  )

  if (!updatedTournament) {
    return <div>Loading...</div>
  }

  // Bepaal welke ronde als volgende gepaird moet worden
  const nextRoundForPairings = (() => {
    for (let i = 1; i <= updatedTournament.rondes; i++) {
      const ronde = updatedTournament.rounds.find(r => r.ronde_nummer === i)
      if (!ronde || ronde.games.length === 0) return i
    }
    return null
  })()

  // Controleren of alle rondes gespeeld zijn
  const allRoundsDone =
    updatedTournament.rounds.length === updatedTournament.rondes &&
    updatedTournament.rounds.every(r =>
      r.games.every(g => g.result && g.result !== "not_played")
    )

  const handleGeneratePairings = async (roundNumber: number) => {
    try {
      await generatePairingsTrigger({
        tournamentId: updatedTournament.tournament_id,
        roundNumber,
      })
      await mutate()
      toast({
        title: "Success",
        description: `Paringen voor ronde ${roundNumber} succesvol gegenereerd.`,
      })
    } catch {
      toast({
        title: "Error",
        description: "Kon geen paringen aanmaken",
        variant: "destructive",
      })
    }
  }

  const handleEndTournament = async () => {
    try {
      await endTournamentTrigger(updatedTournament.tournament_id)
      toast({ title: "Success", description: "Toernooi beëindigd." })
      await mutate()
    } catch {
      toast({
        title: "Error",
        description: "Kon toernooi niet beëindigen",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-mainAccent">Rondes</h2>

      <RoundList
        rounds={updatedTournament.rounds}
        totalRounds={updatedTournament.rondes}
        tournamentId={updatedTournament.tournament_id}
        onGeneratePairings={handleGeneratePairings}
        canGeneratePairings={(roundNumber) => {
          if (roundNumber === 1) return true
          const prev = updatedTournament.rounds.find(
            (r) => r.ronde_nummer === roundNumber - 1
          )
          return (
            !!prev &&
            prev.games.every((g) => g.result && g.result !== "not_played")
          )
        }}
        nextRoundForPairings={nextRoundForPairings}
        onUpdateGame={() => mutate()}
      />

      {allRoundsDone && !updatedTournament.finished && (
        <Button
          onClick={handleEndTournament}
          disabled={isEnding}
          className="mt-6 bg-green-600 hover:bg-green-700"
          data-cy="end_tournament_button"
        >
          {isEnding ? "Even geduld…" : "Eindig Toernooi"}
        </Button>
      )}
    </div>
  )
}

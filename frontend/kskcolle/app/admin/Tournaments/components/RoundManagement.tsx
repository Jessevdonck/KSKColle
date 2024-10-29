"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import * as tournamentsApi from '../../../api/tournaments'
import { Toernooi, Round, Game } from '@/data/types'

interface RoundManagementProps {
  tournament: Toernooi
}

export default function RoundManagement({ tournament }: RoundManagementProps) {
  const { toast } = useToast()
  const { data: updatedTournament, mutate } = useSWR<Toernooi>(`toernooien/${tournament.tournament_id}`, () => tournamentsApi.getTournamentById(tournament.tournament_id))
  const { trigger: generatePairings } = useSWRMutation(
    [`toernooien/${tournament.tournament_id}/pairings`, tournament.tournament_id],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ([_, tournamentId], { arg }: { arg: { roundNumber: number } }) =>
      tournamentsApi.createPairings(tournamentId, arg.roundNumber)
  )

  if (!updatedTournament) return <div>Loading...</div>

  const handleGeneratePairings = async (roundNumber: number) => {
    try {
      await generatePairings({ roundNumber })
      mutate()
      toast({ title: "Success", description: `Pairings for round ${roundNumber} generated successfully` })
    } catch (error) {
      console.error('Error generating pairings:', error)
      toast({ title: "Error", description: "Failed to generate pairings", variant: "destructive" })
    }
  }

  const canGeneratePairings = (roundNumber: number) => {
    if (roundNumber === 1) return true
    const previousRound = updatedTournament.rounds.find(r => r.ronde_nummer === roundNumber - 1)
    return previousRound && previousRound.games.every(game => game.winnaar_id !== null)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Rounds</h2>
      {Array.from({ length: tournament.rondes }, (_, i) => i + 1).map((roundNumber) => (
        <div key={roundNumber} className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Round {roundNumber}</h3>
          {canGeneratePairings(roundNumber) && (
            <Button onClick={() => handleGeneratePairings(roundNumber)} className="mb-2">
              Generate Pairings
            </Button>
          )}
          <RoundGames round={updatedTournament.rounds.find(r => r.ronde_nummer === roundNumber)} />
        </div>
      ))}
    </div>
  )
}

interface RoundGamesProps {
  round?: Round
}

function RoundGames({ round }: RoundGamesProps) {
  if (!round || round.games.length === 0) {
    return <p>No games for this round yet.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>White</TableHead>
          <TableHead>Black</TableHead>
          <TableHead>Result</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {round.games.map((game: Game) => (
          <TableRow key={game.game_id}>
            <TableCell>{game.speler1.voornaam} {game.speler1.achternaam}</TableCell>
            <TableCell>{game.speler2.voornaam} {game.speler2.achternaam}</TableCell>
            <TableCell>{game.result || 'Not played'}</TableCell>
          </TableRow>
        
        ))}
      </TableBody>
    </Table>
  )
}
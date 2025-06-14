"use client"

import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { getAll, deleteById } from '../../api/index'
import { Toernooi } from '@/data/types'

interface TournamentListProps {
  onSelectTournament: (tournament: Toernooi) => void
}

export default function TournamentList({ onSelectTournament }: TournamentListProps) {
  const { toast } = useToast()
  const { data: tournaments, error, mutate } = useSWR<Toernooi[]>('tournament?active=true', getAll)
  const { trigger: deleteTournament } = useSWRMutation('tournament', deleteById)

  if (error) return <div>Failed to load tournaments</div>
  if (!tournaments) return <div>Loading...</div>

  const handleDelete = async (tournamentId: number) => {
    const previousTournaments = tournaments
    const updatedTournaments = tournaments.filter(t => t.tournament_id !== tournamentId)

    mutate(updatedTournaments, false)

    try {
      await deleteTournament(tournamentId)
      
      toast({ title: "Success", description: "Toernooi succesvol verwijderd!" })
      
      mutate()
    } catch (error) {
      console.error('Fout met toernooi te verwijderen:', error)
      
      mutate(previousTournaments, false)
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Naam</TableHead>
          <TableHead>Rondes</TableHead>
          <TableHead>Deelnemers</TableHead>
          <TableHead className='flex justify-end items-center pr-32'>Acties</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody data-cy="tournament">
        {tournaments.map((tournament) => (
          <TableRow key={tournament.tournament_id} className='w-full'>
            <TableCell className='flex-1' ><span data-cy='tournament_name'>{tournament.naam}</span ></TableCell>
            <TableCell className='flex-1' ><span data-cy='tournament_round'>{tournament.rondes}</span></TableCell>
            <TableCell className='flex-1' ><span data-cy='tournament_participation'>{tournament.participations.length}</span></TableCell>
            <TableCell className='flex-1 flex justify-end pr-3'>
              <Button onClick={() => onSelectTournament(tournament)} className="mr-2 bg-mainAccent hover:bg-mainAccentDark" data-cy='tournament_manage_button'>Bekijk</Button>
              <Button onClick={() => handleDelete(tournament.tournament_id)} className='bg-red-600 hover:bg-red-700' data-cy='tournament_delete_button'>Verwijder</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
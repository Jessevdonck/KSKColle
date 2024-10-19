import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { getAll, deleteById } from '../../api/index'
import * as tournamentsApi from '../../api/tournaments'
import { Tournament, User } from '@/data/types'

interface NewTournament {
  naam: string;
  rondes: number;
  start_date: string;
  end_date: string;
}

const TournamentsManagement = () => {
  const [newTournament, setNewTournament] = useState<NewTournament>({
    naam: '',
    rondes: 0,
    start_date: '',
    end_date: ''
  })
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const { toast } = useToast()

  const { data: tournaments, error: tournamentsError, mutate: mutateTournaments } = useSWR<Tournament[]>('toernooien', getAll)
  const { data: users, error: usersError } = useSWR<User[]>('spelers', getAll)
  const { trigger: deleteTournament } = useSWRMutation('toernooien', deleteById)

  const handleAddTournament = async () => {
    try {
      await tournamentsApi.addTournament(newTournament)
      setNewTournament({
        naam: '',
        rondes: 0,
        start_date: '',
        end_date: ''
      })
      mutateTournaments()
      toast({ title: "Success", description: "Tournament added successfully" })
    } catch (error) {
      console.error('Error adding tournament:', error)
      toast({ title: "Error", description: "Failed to add tournament", variant: "destructive" })
    }
  }

  const handleUpdateTournament = async () => {
    if (!selectedTournament) return
    try {
      await tournamentsApi.updateTournament(selectedTournament.tournament_id, selectedTournament)
      mutateTournaments()
      setSelectedTournament(null)
      toast({ title: "Success", description: "Tournament updated successfully" })
    } catch (error) {
      console.error('Error updating tournament:', error)
      toast({ title: "Error", description: "Failed to update tournament", variant: "destructive" })
    }
  }

  const handleDeleteTournament = async (tournamentId: string) => {
    try {
      await deleteTournament(tournamentId)
      mutateTournaments()
      toast({ title: "Success", description: "Tournament deleted successfully" })
    } catch (error) {
      console.error('Error deleting tournament:', error)
      toast({ title: "Error", description: "Failed to delete tournament", variant: "destructive" })
    }
  }

  const handleCreatePairings = async (tournamentId: string, roundNumber: number) => {
    try {
      await tournamentsApi.createPairings(tournamentId, roundNumber)
      mutateTournaments()
      toast({ title: "Success", description: "Pairings created successfully" })
    } catch (error) {
      console.error('Error creating pairings:', error)
      toast({ title: "Error", description: "Failed to create pairings", variant: "destructive" })
    }
  }

  const handleUpdateRatings = async (tournamentId: string) => {
    try {
      await tournamentsApi.updateRatings(tournamentId)
      mutateTournaments()
      toast({ title: "Success", description: "Ratings updated successfully" })
    } catch (error) {
      console.error('Error updating ratings:', error)
      toast({ title: "Error", description: "Failed to update ratings", variant: "destructive" })
    }
  }

  const handleRegisterPlayer = async (tournamentId: string, userId: number) => {
    try {
      await tournamentsApi.registerPlayer(tournamentId, userId)
      mutateTournaments()
      toast({ title: "Success", description: "Player registered successfully" })
    } catch (error) {
      console.error('Error registering player:', error)
      toast({ title: "Error", description: "Failed to register player", variant: "destructive" })
    }
  }

  if (tournamentsError || usersError) return <div>Failed to load data</div>
  if (!tournaments || !users) return <div>Loading...</div>

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Add Tournament</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Input
          placeholder="Tournament Name"
          value={newTournament.naam}
          onChange={(e) => setNewTournament({ ...newTournament, naam: e.target.value })}
        />
        <Input
          type="number"
          placeholder="Number of Rounds"
          value={newTournament.rondes}
          onChange={(e) => setNewTournament({ ...newTournament, rondes: parseInt(e.target.value) })}
        />
        <Input
          type="date"
          placeholder="Start Date"
          value={newTournament.start_date}
          onChange={(e) => setNewTournament({ ...newTournament, start_date: e.target.value })}
        />
        <Input
          type="date"
          placeholder="End Date"
          value={newTournament.end_date}
          onChange={(e) => setNewTournament({ ...newTournament, end_date: e.target.value })}
        />
      </div>
      <Button onClick={handleAddTournament} className="bg-mainAccent text-white hover:bg-mainAccentDark">Add Tournament</Button>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Tournaments List</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Rounds</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tournaments.map((tournament) => (
            <TableRow key={tournament.tournament_id}>
              <TableCell>{tournament.naam}</TableCell>
              <TableCell>{tournament.rondes}</TableCell>
              <TableCell>
                <Button onClick={() => setSelectedTournament(tournament)} className="mr-2 bg-mainAccent text-white hover:bg-mainAccentDark">Edit</Button>
                <Button onClick={() => handleDeleteTournament(tournament.tournament_id)} variant="destructive" className="mr-2">Delete</Button>
                <Select onValueChange={(value) => handleCreatePairings(tournament.tournament_id, parseInt(value))}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Create Pairings" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: tournament.rondes }, (_, i) => (
                      <SelectItem key={i} value={(i + 1).toString()}>Round {i + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => handleUpdateRatings(tournament.tournament_id)} className="ml-2 bg-mainAccent text-white hover:bg-mainAccentDark">Update Ratings</Button>
                <Select onValueChange={(value) => handleRegisterPlayer(tournament.tournament_id, parseInt(value))}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Register Player" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id.toString()}>{user.voornaam} {user.achternaam}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedTournament && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Edit Tournament</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input
              placeholder="Tournament Name"
              value={selectedTournament.naam}
              onChange={(e) => 
                setSelectedTournament({ ...selectedTournament, naam: e.target.value })
              }
            />
            <Input
              type="number"
              placeholder="Number of Rounds"
              value={selectedTournament.rondes}
              onChange={(e) =>
                setSelectedTournament({
                  ...selectedTournament,
                  rondes: parseInt(e.target.value),
                })
              }
            />
          </div>
          <Button onClick={handleUpdateTournament} className="bg-mainAccent text-white hover:bg-mainAccentDark">Update Tournament</Button>
        </div>
      )}
    </div>
  )
}

export default TournamentsManagement
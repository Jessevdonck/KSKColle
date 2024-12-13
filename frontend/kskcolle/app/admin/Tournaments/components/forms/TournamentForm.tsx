'use client'

import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { getAll } from '../../../../api/index'
import { addTournament as addTournamentAPI } from '../../../../api/tournaments'
import { User, Toernooi } from '@/data/types'
import { Search } from 'lucide-react'

interface TournamentFormData {
  naam: string;
  rondes: number;
  participations: number[];
}

export default function TournamentForm() {
  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<TournamentFormData>()
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const { toast } = useToast()

  const { data: users, error: usersError } = useSWR<User[]>('spelers', getAll)
  const { data: tournaments, error: tournamentsError, mutate: mutateTournaments } = useSWR<Toernooi[]>('toernooien', getAll)
  const { trigger: addTournament } = useSWRMutation('toernooien', (_, { arg }: { arg: TournamentFormData }) => addTournamentAPI(arg))

  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const usersPerPage = 10

  useEffect(() => {
    if (users) {
      const filtered = users.filter(user => 
        `${user.voornaam} ${user.achternaam}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
      setCurrentPage(1)
    }
  }, [searchTerm, users])

  if (usersError || tournamentsError) return <div>Failed to load data</div>
  if (!users || !tournaments) return <div>Loading...</div>

  const onSubmit = async (data: TournamentFormData) => {
    try {
      const tournamentData = {
        naam: data.naam,
        rondes: Number(data.rondes), 
        participations: selectedParticipants,
      };

      await addTournament(tournamentData);

      mutateTournaments();
      reset();
      setSelectedParticipants([]);
      toast({ title: "Success", description: "Tournament created successfully" });
    } catch (error) {
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
      toast({ title: "Error", description: "Failed to create tournament.", variant: "destructive" });
    }
};


  const handleParticipantToggle = (userId: number) => {
    setSelectedParticipants(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const pageCount = Math.ceil(filteredUsers.length / usersPerPage)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  )

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Maak nieuw toernooi aan</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="naam">Toernooi Naam</Label>
            <Input id="naam" {...register("naam", { required: "Toernooi naam is vereist." })} />
            {errors.naam && <p className="text-red-500">{errors.naam.message}</p>}
          </div>

          <div>
            <Label htmlFor="rondes">Aantal Rondes</Label>
            <Controller
              name="rondes"
              control={control}
              rules={{ required: "Aantal rondes is vereist", min: 1 }}
              render={({ field }) => (
                <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer aantal rondes" />
                  </SelectTrigger> 
                  <SelectContent>
                    {Array.from({ length: 99 }, (_, i) => i + 1).map(num => ( 
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.rondes && <p className="text-red-500">{errors.rondes.message}</p>}
          </div>

          <div>
            <Label>Deelnemers</Label>
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Zoek spelers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 max-h-60 overflow-y-auto">
              {paginatedUsers.map(user => (
                <Button
                  key={user.user_id}
                  type="button"
                  variant={selectedParticipants.includes(user.user_id) ? "default" : "outline"}
                  onClick={() => handleParticipantToggle(user.user_id)}
                  className={`justify-start hover:bg-mainAccent hover:text-white ${
                    selectedParticipants.includes(user.user_id) ? 'bg-mainAccent' : ''
                  }`}
                >
                  {user.voornaam} {user.achternaam}
                </Button>
              ))}
            </div>
            {pageCount > 1 && (
              <div className="flex justify-center mt-4 space-x-2">
                <Button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                >
                  Vorige
                </Button>
                <span className="self-center">
                  Pagina {currentPage} van {pageCount}
                </span>
                <Button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
                  disabled={currentPage === pageCount}
                  variant="outline"
                >
                  Volgende
                </Button>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full bg-mainAccent hover:bg-mainAccentDark">Maak Aan</Button>
        </form>
      </CardContent>
    </Card>
  )
}
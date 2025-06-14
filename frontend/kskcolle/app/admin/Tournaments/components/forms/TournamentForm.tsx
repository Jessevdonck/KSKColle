'use client'

import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card"
import { useToast } from "@/hooks/use-toast"
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { getAll, post } from '../../../../api/index'
import { User, Toernooi, TournamentType } from '@/data/types'
import { Search } from 'lucide-react'

interface TournamentFormData {
  naam: string;
  rondes: number;
  type: TournamentType;
  rating_enabled: boolean; 
  participations: number[];
}

export default function TournamentForm() {
  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<TournamentFormData>()
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const { toast } = useToast()

  const { data: users, error: usersError } = useSWR<User[]>('users', getAll)
  const { data: tournaments, error: tournamentsError, mutate: mutateTournaments } = useSWR<Toernooi[]>('tournament', getAll)
  const { trigger: createTournament } = useSWRMutation('tournament', post)

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
        type: data.type, 
        participations: selectedParticipants,
      };

      await createTournament(tournamentData);

      mutateTournaments();
      reset();
      setSelectedParticipants([]);
      toast({ title: "Success", description: "Tournament created successfully" });
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || "Failed to create tournament.", 
        variant: "destructive" 
      });
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
          <div data-cy='name_input'>
            <Label htmlFor="naam">Toernooi Naam</Label>
            <Input id="naam" {...register("naam", { required: "Toernooi naam is vereist." })} />
            {errors.naam && <p className="text-red-500" data-cy="error_naam">{errors.naam.message}</p>}
          </div>

          <div>
            <Label htmlFor="rondes">Aantal Rondes</Label>
            <Controller
              name="rondes"
              control={control}
              rules={{ required: "Aantal rondes is vereist", min: 1 }}
              render={({ field }) => (
                <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()} >
                  <SelectTrigger data-cy="round_input">
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
            {errors.rondes && <p className="text-red-500" data-cy="error_rondes">{errors.rondes.message}</p>}
          </div>

          {/* Type Toernooi */}
          <div>
            <Label htmlFor="type">Type Toernooi</Label>
            <Controller
              name="type"
              control={control}
              rules={{ required: "Type toernooi is vereist" }}
              render={({ field }) => (
                <Select onValueChange={val => field.onChange(val as TournamentType)} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kies type toernooi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TournamentType.SWISS}>Swiss</SelectItem>
                    <SelectItem value={TournamentType.ROUND_ROBIN}>Round Robin</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && <p className="text-red-500">{errors.type.message}</p>}
          </div>
            <div>
            <Label htmlFor="type">Gebruik ELO</Label>
            <Controller
              name="rating_enabled"
              control={control}
              defaultValue={true}
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={val => field.onChange(val as boolean)}
                    className='text-red-500'
                  />
                  <Label>Gebruik ELO</Label>
                </div>
              )}
            />
          </div>

          <div data-cy='participant_input'>
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

          <Button type="submit" className="w-full bg-mainAccent hover:bg-mainAccentDark" data-cy='submit_tournament'>Maak Aan</Button>
        </form>
      </CardContent>
    </Card>
  )
}


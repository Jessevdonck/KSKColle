"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { getAll, post } from "../../../../api/index"
import { User, Toernooi, TournamentType } from "@/data/types"
import { Search, Plus, Users, Trophy, Settings } from "lucide-react"

interface TournamentFormData {
  naam: string
  rondes: number
  type: TournamentType
  rating_enabled: boolean
  participations: number[]
}

export default function TournamentForm() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<TournamentFormData>()
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const { toast } = useToast()

  const { data: users, error: usersError } = useSWR<User[]>("users", getAll)
  const {
    data: tournaments,
    error: tournamentsError,
    mutate: mutateTournaments,
  } = useSWR<Toernooi[]>("tournament", getAll)
  const { trigger: createTournament, isMutating } = useSWRMutation("tournament", post)

  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const usersPerPage = 10

  useEffect(() => {
    if (users) {
      const filtered = users.filter((user) =>
        `${user.voornaam} ${user.achternaam}`.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredUsers(filtered)
      setCurrentPage(1)
    }
  }, [searchTerm, users])

  if (usersError || tournamentsError) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-red-700 mb-1">Fout bij laden van gegevens</h3>
        <p className="text-red-600">Probeer de pagina opnieuw te laden.</p>
      </div>
    )
  }

  if (!users || !tournaments) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mainAccent mx-auto mb-4"></div>
        <p className="text-gray-600">Gegevens worden geladen...</p>
      </div>
    )
  }

  const onSubmit = async (data: TournamentFormData) => {
    try {
      const tournamentData = {
        naam: data.naam,
        rondes: Number(data.rondes),
        type: data.type,
        participations: selectedParticipants,
      }

      await createTournament(tournamentData)

      mutateTournaments()
      reset()
      setSelectedParticipants([])
      toast({ title: "Success", description: "Toernooi succesvol aangemaakt!" })
    } catch (error) {
      console.error("Error creating tournament:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Kon toernooi niet aanmaken.",
        variant: "destructive",
      })
    }
  }

  const handleParticipantToggle = (userId: number) => {
    setSelectedParticipants((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const pageCount = Math.ceil(filteredUsers.length / usersPerPage)
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage)

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Plus className="h-6 w-6" />
          Nieuw Toernooi Aanmaken
        </h2>
      </div>

      <div className="p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Tournament Name */}
          <div data-cy="name_input">
            <Label htmlFor="naam" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Toernooi Naam
            </Label>
            <Input
              id="naam"
              {...register("naam", { required: "Toernooi naam is vereist." })}
              className="mt-1"
              placeholder="Voer toernooi naam in..."
            />
            {errors.naam && (
              <p className="text-red-500 text-sm mt-1" data-cy="error_naam">
                {errors.naam.message}
              </p>
            )}
          </div>

          {/* Number of Rounds */}
          <div>
            <Label htmlFor="rondes" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Aantal Rondes
            </Label>
            <Controller
              name="rondes"
              control={control}
              rules={{ required: "Aantal rondes is vereist", min: 1 }}
              render={({ field }) => (
                <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                  <SelectTrigger data-cy="round_input" className="mt-1">
                    <SelectValue placeholder="Selecteer aantal rondes" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 99 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.rondes && (
              <p className="text-red-500 text-sm mt-1" data-cy="error_rondes">
                {errors.rondes.message}
              </p>
            )}
          </div>

          {/* Tournament Type */}
          <div>
            <Label htmlFor="type" className="text-sm font-medium text-gray-700">
              Type Toernooi
            </Label>
            <Controller
              name="type"
              control={control}
              rules={{ required: "Type toernooi is vereist" }}
              render={({ field }) => (
                <Select onValueChange={(val) => field.onChange(val as TournamentType)} value={field.value}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Kies type toernooi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TournamentType.SWISS}>Swiss</SelectItem>
                    <SelectItem value={TournamentType.ROUND_ROBIN}>Round Robin</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
          </div>

          {/* ELO Rating */}
          <div className="flex items-center space-x-3">
            <Label htmlFor="rating" className="text-sm font-medium text-gray-700">
              Gebruik ELO Rating
            </Label>
            <Controller
              name="rating_enabled"
              control={control}
              defaultValue={true}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(val) => field.onChange(val as boolean)}
                  className="data-[state=checked]:bg-mainAccent data-[state=checked]:border-mainAccent"
                />
              )}
            />
          </div>

          {/* Participants */}
          <div data-cy="participant_input">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
              <Users className="h-4 w-4" />
              Deelnemers ({selectedParticipants.length} geselecteerd)
            </Label>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Zoek spelers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Selected participants summary */}
            {selectedParticipants.length > 0 && (
              <div className="mb-4 p-3 bg-mainAccent/5 rounded-lg border border-mainAccent/20">
                <p className="text-sm text-mainAccent font-medium mb-2">Geselecteerde spelers:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedParticipants.slice(0, 5).map((id) => {
                    const user = users.find((u) => u.user_id === id)
                    return (
                      <span key={id} className="px-2 py-1 bg-mainAccent text-white text-xs rounded-full">
                        {user?.voornaam} {user?.achternaam}
                      </span>
                    )
                  })}
                  {selectedParticipants.length > 5 && (
                    <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                      +{selectedParticipants.length - 5} meer
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Participants grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {paginatedUsers.map((user) => (
                <Button
                  key={user.user_id}
                  type="button"
                  variant={selectedParticipants.includes(user.user_id) ? "default" : "outline"}
                  onClick={() => handleParticipantToggle(user.user_id)}
                  className={`justify-start text-left h-auto py-2 ${
                    selectedParticipants.includes(user.user_id)
                      ? "bg-mainAccent hover:bg-mainAccentDark"
                      : "hover:bg-mainAccent/10 hover:border-mainAccent/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-mainAccent/10 rounded-full flex items-center justify-center">
                      <Users className="h-3 w-3 text-mainAccent" />
                    </div>
                    <span>
                      {user.voornaam} {user.achternaam}
                    </span>
                  </div>
                </Button>
              ))}
            </div>

            {/* Pagination */}
            {pageCount > 1 && (
              <div className="flex justify-center items-center mt-4 space-x-4">
                <Button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Vorige
                </Button>
                <span className="text-sm text-gray-600">
                  Pagina {currentPage} van {pageCount}
                </span>
                <Button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pageCount))}
                  disabled={currentPage === pageCount}
                  variant="outline"
                  size="sm"
                >
                  Volgende
                </Button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isMutating}
            className="w-full bg-mainAccent hover:bg-mainAccentDark py-3"
            data-cy="submit_tournament"
          >
            {isMutating ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Toernooi wordt aangemaakt...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Toernooi Aanmaken
              </div>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
